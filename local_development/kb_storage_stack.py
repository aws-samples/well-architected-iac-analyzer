"""CDK stack for deploying only Knowledge Base and Storage resources"""

import time
import uuid

import aws_cdk as cdk
from aws_cdk import CfnOutput, CfnParameter, Duration, RemovalPolicy, Stack
from aws_cdk import aws_bedrock as aws_bedrock
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as s3deploy
from aws_cdk import aws_s3vectors as s3vectors
from aws_cdk import aws_ssm as ssm
from aws_cdk import custom_resources as cr
from cdklabs.generative_ai_cdk_constructs import bedrock
from constructs import Construct


class KBStorageStack(Stack):
    """CDK Stack for deploying only Knowledge Base and Storage resources"""

    def create_knowledge_base_with_opensearch(self, wafrReferenceDocsBucket: s3.Bucket):
        """
        Create Knowledge Base with OpenSearch Serverless vector store (default option)
        Returns: tuple of (kb, kbDataSource, KB_ID)
        """
        # Creates Bedrock KB using the generative_ai_cdk_constructs
        kb = bedrock.VectorKnowledgeBase(
            self,
            "WAFR-KnowledgeBase",
            embeddings_model=bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024,
            instruction="Use this knowledge base to answer questions about AWS Well Architected Framework Review (WAFR).",
            description="This knowledge base contains AWS Well Architected Framework Review (WAFR) reference documents",
            name=f"DEV-WA-IaC-Analyzer-WAFR-KB-OSS-{self.region}",
        )

        KB_ID = kb.knowledge_base_id

        # Adds the created S3 bucket [wafrReferenceDocsBucket] as a Data Source for Bedrock KB
        kbDataSource = bedrock.S3DataSource(
            self,
            "DataSource",
            bucket=wafrReferenceDocsBucket,
            knowledge_base=kb,
            data_source_name="dev-wafr-reference-docs",
            chunking_strategy=bedrock.ChunkingStrategy.hierarchical(
                overlap_tokens=60, max_parent_token_size=2000, max_child_token_size=800
            ),
        )

        # Data Ingestion Params
        dataSourceIngestionParams = {
            "dataSourceId": kbDataSource.data_source_id,
            "knowledgeBaseId": KB_ID,
        }

        # Define a custom resource to make an AwsSdk startIngestionJob call
        ingestion_job_cr = cr.AwsCustomResource(
            self,
            "IngestionCustomResource",
            on_create=cr.AwsSdkCall(
                service="bedrock-agent",
                action="startIngestionJob",
                parameters=dataSourceIngestionParams,
                physical_resource_id=cr.PhysicalResourceId.of("Parameter.ARN"),
            ),
            policy=cr.AwsCustomResourcePolicy.from_sdk_calls(
                resources=cr.AwsCustomResourcePolicy.ANY_RESOURCE
            ),
        )

        # Node dependencies
        kbDataSource.node.add_dependency(wafrReferenceDocsBucket)
        ingestion_job_cr.node.add_dependency(kb)

        return kb, kbDataSource, KB_ID

    def create_knowledge_base_with_s3_vectors(self, wafrReferenceDocsBucket: s3.Bucket):
        """
        Create Knowledge Base with S3 Vectors store
        Returns: tuple of (kb_id, data_source_id, vector_bucket, vector_index, cfn_kb, cfn_data_source)
        """
        # Create S3 Vector Bucket
        vector_bucket = s3vectors.CfnVectorBucket(
            self,
            "WAFRVectorBucket",
            vector_bucket_name=f"dev-wafr-kb-vectors-{self.account}-{self.region}",
        )

        # Create Vector Index
        vector_index = s3vectors.CfnIndex(
            self,
            "WAFRVectorIndex",
            data_type="float32",
            dimension=1024,
            distance_metric="euclidean",
            vector_bucket_name=vector_bucket.vector_bucket_name,
            index_name="wafr-kb-index",
            metadata_configuration=s3vectors.CfnIndex.MetadataConfigurationProperty(
                non_filterable_metadata_keys=[
                    "AMAZON_BEDROCK_TEXT",
                    "AMAZON_BEDROCK_METADATA",
                ]
            ),
        )

        # Ensure vector index is created after vector bucket
        vector_index.add_dependency(vector_bucket)

        # Create IAM Role for Knowledge Base
        kb_role = iam.Role(
            self,
            "KnowledgeBaseS3VectorsRole",
            assumed_by=iam.ServicePrincipal(
                "bedrock.amazonaws.com",
                conditions={
                    "StringEquals": {"aws:SourceAccount": self.account},
                    "ArnLike": {
                        "aws:SourceArn": f"arn:aws:bedrock:{self.region}:{self.account}:knowledge-base/*"
                    },
                },
            ),
            description="IAM role for Bedrock Knowledge Base with S3 Vectors",
        )

        # Policy 1: Foundation Model permissions
        kb_role.add_to_policy(
            iam.PolicyStatement(
                sid="BedrockInvokeModelStatement",
                actions=["bedrock:InvokeModel"],
                resources=[
                    f"arn:aws:bedrock:{self.region}::foundation-model/amazon.titan-embed-text-v2:0"
                ],
            )
        )

        # Policy 2: S3 permissions for data source bucket
        kb_role.add_to_policy(
            iam.PolicyStatement(
                sid="S3ListBucketStatement",
                actions=["s3:ListBucket"],
                resources=[wafrReferenceDocsBucket.bucket_arn],
                conditions={"StringEquals": {"aws:ResourceAccount": self.account}},
            )
        )

        kb_role.add_to_policy(
            iam.PolicyStatement(
                sid="S3GetObjectStatement",
                actions=["s3:GetObject"],
                resources=[f"{wafrReferenceDocsBucket.bucket_arn}/*"],
                conditions={"StringEquals": {"aws:ResourceAccount": self.account}},
            )
        )

        # Policy 3: S3 Vectors permissions
        kb_role.add_to_policy(
            iam.PolicyStatement(
                sid="S3VectorsPermissions",
                actions=[
                    "s3vectors:GetIndex",
                    "s3vectors:QueryVectors",
                    "s3vectors:PutVectors",
                    "s3vectors:GetVectors",
                    "s3vectors:DeleteVectors",
                ],
                resources=[vector_index.attr_index_arn],
                conditions={"StringEquals": {"aws:ResourceAccount": self.account}},
            )
        )

        # Create Knowledge Base using CfnKnowledgeBase
        cfn_kb = aws_bedrock.CfnKnowledgeBase(
            self,
            "WAFR-KnowledgeBase-S3Vectors",
            knowledge_base_configuration=aws_bedrock.CfnKnowledgeBase.KnowledgeBaseConfigurationProperty(
                type="VECTOR",
                vector_knowledge_base_configuration=aws_bedrock.CfnKnowledgeBase.VectorKnowledgeBaseConfigurationProperty(
                    embedding_model_arn=f"arn:aws:bedrock:{self.region}::foundation-model/amazon.titan-embed-text-v2:0"
                ),
            ),
            name=f"DEV-WA-IaC-Analyzer-WAFR-KB-S3Vector-{self.region}",
            role_arn=kb_role.role_arn,
            description="This knowledge base contains AWS Well Architected Framework Review (WAFR) reference documents",
            storage_configuration=aws_bedrock.CfnKnowledgeBase.StorageConfigurationProperty(
                type="S3_VECTORS",
                s3_vectors_configuration=aws_bedrock.CfnKnowledgeBase.S3VectorsConfigurationProperty(
                    index_arn=vector_index.attr_index_arn,
                    vector_bucket_arn=vector_bucket.attr_vector_bucket_arn,
                ),
            ),
        )

        # Ensure KB is created after vector index and role
        cfn_kb.add_dependency(vector_index)
        cfn_kb.node.add_dependency(kb_role)

        # Create Data Source using CfnDataSource
        cfn_data_source = aws_bedrock.CfnDataSource(
            self,
            "DataSource-S3Vectors",
            data_source_configuration=aws_bedrock.CfnDataSource.DataSourceConfigurationProperty(
                type="S3",
                s3_configuration=aws_bedrock.CfnDataSource.S3DataSourceConfigurationProperty(
                    bucket_arn=wafrReferenceDocsBucket.bucket_arn
                ),
            ),
            knowledge_base_id=cfn_kb.attr_knowledge_base_id,
            name="dev-wafr-reference-docs",
            vector_ingestion_configuration=aws_bedrock.CfnDataSource.VectorIngestionConfigurationProperty(
                chunking_configuration=aws_bedrock.CfnDataSource.ChunkingConfigurationProperty(
                    chunking_strategy="HIERARCHICAL",
                    hierarchical_chunking_configuration=aws_bedrock.CfnDataSource.HierarchicalChunkingConfigurationProperty(
                        level_configurations=[
                            aws_bedrock.CfnDataSource.HierarchicalChunkingLevelConfigurationProperty(
                                max_tokens=2000  # Parent chunk
                            ),
                            aws_bedrock.CfnDataSource.HierarchicalChunkingLevelConfigurationProperty(
                                max_tokens=800  # Child chunk
                            ),
                        ],
                        overlap_tokens=60,
                    ),
                )
            ),
        )

        # Ensure data source is created after KB
        cfn_data_source.add_dependency(cfn_kb)

        # Data Ingestion Params
        dataSourceIngestionParams = {
            "dataSourceId": cfn_data_source.attr_data_source_id,
            "knowledgeBaseId": cfn_kb.attr_knowledge_base_id,
        }

        # Define a custom resource to make an AwsSdk startIngestionJob call
        ingestion_job_cr = cr.AwsCustomResource(
            self,
            "IngestionCustomResource",
            on_create=cr.AwsSdkCall(
                service="bedrock-agent",
                action="startIngestionJob",
                parameters=dataSourceIngestionParams,
                physical_resource_id=cr.PhysicalResourceId.of("Parameter.ARN"),
            ),
            policy=cr.AwsCustomResourcePolicy.from_sdk_calls(
                resources=cr.AwsCustomResourcePolicy.ANY_RESOURCE
            ),
        )

        ingestion_job_cr.node.add_dependency(cfn_data_source)

        return (
            cfn_kb.attr_knowledge_base_id,
            cfn_data_source.attr_data_source_id,
            vector_bucket,
            vector_index,
            cfn_kb,
            cfn_data_source,
        )

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Context parameters
        deploy_storage = self.node.try_get_context("deploy_storage")
        if deploy_storage is None:  # Default to true if not specified
            deploy_storage = True

        # Get vector store type from context, default to s3_vectors
        vector_store_type = self.node.try_get_context("vector_store_type")
        if vector_store_type is None:
            vector_store_type = "s3_vectors"

        random_id = str(uuid.uuid4())[:8]  # First 8 characters of a UUID

        # Create DynamoDB table for lens metadata
        lens_metadata_table = dynamodb.Table(
            self,
            "LensMetadataTable",
            partition_key=dynamodb.Attribute(
                name="lensAlias", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True,
        )

        # Create S3 bucket where well architected reference docs are stored
        wafrReferenceDocsBucket = s3.Bucket(
            self,
            "wafr-accelerator-kb-docs",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
        )

        # Uploading WAFR docs to the corresponding S3 bucket [wafrReferenceDocsBucket]
        wafrReferenceDeploy = s3deploy.BucketDeployment(
            self,
            "uploadwellarchitecteddocs",
            sources=[s3deploy.Source.asset("../ecs_fargate_app/well_architected_docs")],
            destination_bucket=wafrReferenceDocsBucket,
            destination_key_prefix="wellarchitected",
        )

        WA_DOCS_BUCKET_NAME = wafrReferenceDocsBucket.bucket_name

        # Create Knowledge Base based on vector store type configuration
        if vector_store_type == "s3_vectors":
            # Use S3 Vectors as the vector store
            (
                KB_ID,
                data_source_id,
                vector_bucket,
                vector_index,
                cfn_kb,
                cfn_data_source,
            ) = self.create_knowledge_base_with_s3_vectors(wafrReferenceDocsBucket)

        else:
            # Default: Use OpenSearch Serverless as the vector store
            kb, kbDataSource, KB_ID = self.create_knowledge_base_with_opensearch(
                wafrReferenceDocsBucket
            )
            data_source_id = kbDataSource.data_source_id

        # Params for the test Well-Architected Workload
        test_workload_region = Stack.of(self).region
        waToolWorkloadParams = {
            "WorkloadName": f"DO-NOT-DELETE_WAIaCAnalyzerAppKB_{test_workload_region}_{random_id}",
            "Description": f"DO-NOT-DELETE_WAIaCAnalyzerAppKB_{test_workload_region} TestWorkload for WA IaC Analyzer App KB",
            "ReviewOwner": "WA IoC Analyzer App KB",
            "Environment": "PREPRODUCTION",
            "AwsRegions": [test_workload_region],
            "Lenses": ["wellarchitected"],
            "ClientRequestToken": random_id,
        }
        # Create a test Well-Architected Workload
        workload_cr = cr.AwsCustomResource(
            self,
            "TestWorkload",
            on_create=cr.AwsSdkCall(
                service="wellarchitected",
                action="createWorkload",
                parameters=waToolWorkloadParams,
                physical_resource_id=cr.PhysicalResourceId.from_response("WorkloadId"),
                output_paths=["WorkloadId"],
            ),
            on_update=cr.AwsSdkCall(
                service="wellarchitected",
                action="listLensReviews",
                parameters={
                    "WorkloadId": cr.PhysicalResourceIdReference(),
                },
                physical_resource_id=cr.PhysicalResourceId.from_response("WorkloadId"),
                output_paths=["WorkloadId"],
            ),
            on_delete=cr.AwsSdkCall(
                service="wellarchitected",
                action="deleteWorkload",
                parameters={
                    "WorkloadId": cr.PhysicalResourceIdReference(),
                    "ClientRequestToken": random_id,
                },
            ),
            policy=cr.AwsCustomResourcePolicy.from_sdk_calls(
                resources=cr.AwsCustomResourcePolicy.ANY_RESOURCE
            ),
        )

        # Create SSM Parameter Store for custom lenses configuration
        custom_lenses_parameter = ssm.StringParameter(
            self,
            "CustomLensesParameter",
            parameter_name=f"/wa-iac-analyzer/{self.region}/custom-lenses",
            string_value="[]",
            description="JSON array of custom lens configurations for the WA IaC Analyzer.",
            tier=ssm.ParameterTier.ADVANCED,
        )

        # Lambda function to refresh and sync Knowledge Base with data source
        kb_lambda_synchronizer = lambda_.Function(
            self,
            "KbLambdaSynchronizer",
            runtime=lambda_.Runtime.determine_latest_python_runtime(self),
            handler="kb_synchronizer.handler",
            code=lambda_.Code.from_asset(
                "../ecs_fargate_app/lambda_kb_synchronizer",
                bundling=cdk.BundlingOptions(
                    image=lambda_.Runtime.determine_latest_python_runtime(
                        self
                    ).bundling_image,
                    command=[
                        "bash",
                        "-c",
                        "pip install --no-cache -r requirements.txt -t /asset-output && cp -au . /asset-output",
                    ],
                ),
            ),
            environment={
                "KNOWLEDGE_BASE_ID": KB_ID,
                "DATA_SOURCE_ID": data_source_id,
                "WA_DOCS_BUCKET_NAME": wafrReferenceDocsBucket.bucket_name,
                "WORKLOAD_ID": workload_cr.get_response_field("WorkloadId"),
                "LENS_METADATA_TABLE": lens_metadata_table.table_name,
                "CUSTOM_LENSES_SSM_PARAMETER": custom_lenses_parameter.parameter_name,
            },
            timeout=Duration.minutes(15),
        )

        # Grant permissions to the KB synchronizer Lambda
        kb_lambda_synchronizer.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock:StartIngestionJob"],
                resources=[
                    f"arn:aws:bedrock:{self.region}:{self.account}:knowledge-base/{KB_ID}"
                ],
            )
        )
        kb_lambda_synchronizer.add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "wellarchitected:GetLensReview",
                    "wellarchitected:ListAnswers",
                    "wellarchitected:UpgradeLensReview",
                    "wellarchitected:AssociateLenses",
                    "wellarchitected:DisassociateLenses",
                ],
                resources=["*"],
            )
        )

        # Grant Lambda access to the lens metadata table
        lens_metadata_table.grant_read_write_data(kb_lambda_synchronizer)

        # Grant Lambda access to the WA docs bucket
        wafrReferenceDocsBucket.grant_put(kb_lambda_synchronizer)

        # Grant Lambda read access to the custom lenses SSM parameter
        custom_lenses_parameter.grant_read(kb_lambda_synchronizer)

        # Create EventBridge rule to trigger KbLambdaSynchronizer weekly on Mondays
        events.Rule(
            self,
            "WeeklyIngestionRule",
            schedule=events.Schedule.cron(
                minute="0", hour="0", month="*", week_day="2", year="*"
            ),
            targets=[targets.LambdaFunction(kb_lambda_synchronizer)],
        )

        deployment_timestamp = int(time.time())

        # Custom resource to trigger the KB Lambda synchronizer during deployment
        kb_lambda_trigger_cr = cr.AwsCustomResource(
            self,
            "KbLambdaTrigger",
            on_create=cr.AwsSdkCall(
                service="Lambda",
                action="invoke",
                parameters={
                    "FunctionName": kb_lambda_synchronizer.function_name,
                    "InvocationType": "Event",
                },
                physical_resource_id=cr.PhysicalResourceId.of(
                    f"KbLambdaSynchronizerTrigger-{deployment_timestamp}"
                ),
            ),
            on_update=cr.AwsSdkCall(
                service="Lambda",
                action="invoke",
                parameters={
                    "FunctionName": kb_lambda_synchronizer.function_name,
                    "InvocationType": "Event",
                },
                physical_resource_id=cr.PhysicalResourceId.of(
                    f"KbLambdaSynchronizerTrigger-{deployment_timestamp}"
                ),
            ),
            # Use explicit IAM policy statement instead of from_sdk_calls
            policy=cr.AwsCustomResourcePolicy.from_statements(
                [
                    iam.PolicyStatement(
                        actions=["lambda:InvokeFunction"],
                        resources=[kb_lambda_synchronizer.function_arn],
                    )
                ]
            ),
        )

        # Define storage resources if deploy_storage is true
        analysis_storage_bucket = None
        analysis_metadata_table = None

        if deploy_storage:
            # Create S3 bucket for storing analysis results
            analysis_storage_bucket = s3.Bucket(
                self,
                "AnalysisStorageBucket",
                removal_policy=RemovalPolicy.DESTROY,
                auto_delete_objects=True,
                enforce_ssl=True,
            )

            # Create DynamoDB table for metadata
            analysis_metadata_table = dynamodb.Table(
                self,
                "AnalysisMetadataTable",
                partition_key=dynamodb.Attribute(
                    name="userId", type=dynamodb.AttributeType.STRING
                ),
                sort_key=dynamodb.Attribute(
                    name="fileId", type=dynamodb.AttributeType.STRING
                ),
                billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
                removal_policy=RemovalPolicy.DESTROY,
                point_in_time_recovery=True,
            )

        # Output the Knowledge Base ID for .env configuration
        CfnOutput(
            self,
            "KnowledgeBaseID",
            value=KB_ID,
            description="ID of the Bedrock knowledge base",
        )

        # Output the S3 bucket name for .env configuration
        CfnOutput(
            self,
            "WellArchitectedDocsS3Bucket",
            value=WA_DOCS_BUCKET_NAME,
            description="S3 bucket with well-architected documents",
        )

        # Output the lens metadata table name for .env configuration
        CfnOutput(
            self,
            "LensMetadataTableName",
            value=lens_metadata_table.table_name,
            description="DynamoDB table for lens metadata",
        )

        # Output the vector store type used
        CfnOutput(
            self,
            "VectorStoreType",
            value=vector_store_type,
            description="Vector store type used for the Knowledge Base (opensearch_serverless or s3_vectors)",
        )

        CfnOutput(
            self,
            "CustomLensesSSMParameter",
            value=custom_lenses_parameter.parameter_name,
            description="SSM Parameter Store name for custom lenses configuration",
        )

        # Output storage resource information if deployed
        if deploy_storage and analysis_storage_bucket and analysis_metadata_table:
            CfnOutput(
                self,
                "AnalysisStorageBucketName",
                value=analysis_storage_bucket.bucket_name,
                description="S3 bucket for storing analysis results",
            )

            CfnOutput(
                self,
                "AnalysisMetadataTableName",
                value=analysis_metadata_table.table_name,
                description="DynamoDB table for analysis metadata",
            )

        # Node dependencies based on vector store type
        if vector_store_type == "s3_vectors":
            kb_lambda_synchronizer.node.add_dependency(cfn_kb)
            kb_lambda_synchronizer.node.add_dependency(cfn_data_source)
            kb_lambda_synchronizer.node.add_dependency(wafrReferenceDocsBucket)
            kb_lambda_synchronizer.node.add_dependency(workload_cr)
            kb_lambda_trigger_cr.node.add_dependency(kb_lambda_synchronizer)
        else:
            kbDataSource.node.add_dependency(wafrReferenceDocsBucket)
            kb_lambda_synchronizer.node.add_dependency(kb)
            kb_lambda_synchronizer.node.add_dependency(kbDataSource)
            kb_lambda_synchronizer.node.add_dependency(wafrReferenceDocsBucket)
            kb_lambda_synchronizer.node.add_dependency(workload_cr)
            kb_lambda_trigger_cr.node.add_dependency(kb_lambda_synchronizer)
