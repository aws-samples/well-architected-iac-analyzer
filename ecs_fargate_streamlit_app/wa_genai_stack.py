"""Frontend stack for hosting Streamlit with ECS and Fargate"""

import configparser
import platform
import uuid

import aws_cdk as cdk
from aws_cdk import Duration, RemovalPolicy, Stack
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_ecs as ecs
from aws_cdk import aws_ecs_patterns as ecs_patterns
from aws_cdk import aws_elasticloadbalancingv2 as elasticloadbalancingv2
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as s3deploy
from aws_cdk import custom_resources as cr
from aws_cdk.aws_ecr_assets import DockerImageAsset
from cdklabs.generative_ai_cdk_constructs import bedrock
from constructs import Construct


class WAGenAIStack(Stack):
    """Frontend stack for hosting Streamlit with ECS and Fargate"""

    def __init__(self, scope: Construct, construct_id: str, **kwarg) -> None:
        super().__init__(scope, construct_id, **kwarg)

        # Read config.ini
        config = configparser.ConfigParser()
        config.read("config.ini")
        model_id = config["settings"]["model_id"]
        if config["settings"]["public_load_balancer"] == "False":
            public_lb = False
        else:
            public_lb = True
        allowed_ips = config["settings"]["allowed_ips"]
        if allowed_ips:
            allowed_ips = allowed_ips.split(",")
        else:
            allowed_ips = ["0.0.0.0/0"]

        random_id = str(uuid.uuid4())[:8]  # First 8 characters of a UUID

        platform_mapping = {
            "x86_64": ecs.CpuArchitecture.X86_64,
            "arm64": ecs.CpuArchitecture.ARM64,
        }
        # Get architecture from platform (depending the machine that runs CDK)
        architecture = platform_mapping[platform.machine()]

        # Creates Bedrock KB using the generative_ai_cdk_constructs
        kb = bedrock.KnowledgeBase(
            self,
            "WAFR-KnowledgeBase",
            embeddings_model=bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024,
            instruction="Use this knowledge base to answer questions about AWS Well Architected Framework Review (WAFR).",
            description="This knowledge base contains AWS Well Architected Framework Review (WAFR) reference documents",
        )

        KB_ID = kb.knowledge_base_id

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
            sources=[
                s3deploy.Source.asset(
                    "ecs_fargate_streamlit_app/wa_genai_iac_analyzer/static/well_architected_docs"
                )
            ],
            destination_bucket=wafrReferenceDocsBucket,
        )

        # S3 Bucket where customer design is stored
        userUploadBucket = s3.Bucket(
            self,
            "wafr-accelerator-upload",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
            server_access_logs_prefix="access-logs/",
        )

        UPLOAD_BUCKET_NAME = userUploadBucket.bucket_name
        WA_DOCS_BUCKET_NAME = wafrReferenceDocsBucket.bucket_name

        # Adds the created S3 bucket [docBucket] as a Data Source for Bedrock KB
        kbDataSource = bedrock.S3DataSource(
            self,
            "DataSource",
            bucket=wafrReferenceDocsBucket,
            knowledge_base=kb,
            data_source_name="wafr-reference-docs",
            chunking_strategy=bedrock.ChunkingStrategy.FIXED_SIZE,
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

        # Params for the test Well-Architected Workload
        test_workload_region = Stack.of(self).region
        waToolWorkloadParams = {
            "WorkloadName": f"DO-NOT-DELETE_WAIaCAnalyzerApp_{test_workload_region}_{random_id}",
            "Description": f"DO-NOT-DELETE_WAIaCAnalyzerApp_{test_workload_region} TestWorkload for WA IoC Analyzer App",
            "ReviewOwner": "WA IoC Analyzer App",
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

        # Lambda function to refresh and sync Knowledge Base with data source
        kb_lambda_synchronizer = lambda_.Function(
            self,
            "KbLambdaSynchronizer",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="kb_synchronizer.handler",
            code=lambda_.Code.from_asset(
                "ecs_fargate_streamlit_app/lambda_kb_synchronizer",
                bundling=cdk.BundlingOptions(
                    image=lambda_.Runtime.PYTHON_3_12.bundling_image,
                    command=[
                        "bash",
                        "-c",
                        "pip install --no-cache -r requirements.txt -t /asset-output && cp -au . /asset-output",
                    ],
                ),
            ),
            environment={
                "KNOWLEDGE_BASE_ID": KB_ID,
                "DATA_SOURCE_ID": kbDataSource.data_source_id,
                "WA_DOCS_BUCKET_NAME": wafrReferenceDocsBucket.bucket_name,
                "WORKLOAD_ID": workload_cr.get_response_field("WorkloadId"),
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
                ],
                resources=["*"],
            )
        )
        wafrReferenceDocsBucket.grant_put(kb_lambda_synchronizer)

        # Create EventBridge rule to trigger KbLambdaSynchronizer weekly on Mondays
        events.Rule(
            self,
            "WeeklyIngestionRule",
            schedule=events.Schedule.cron(
                minute="0", hour="0", month="*", week_day="2", year="*"
            ),
            targets=[targets.LambdaFunction(kb_lambda_synchronizer)],
        )

        # Build Docker image
        imageAsset = DockerImageAsset(
            self,
            "FrontendStreamlitImage",
            directory=("ecs_fargate_streamlit_app/wa_genai_iac_analyzer/"),
        )

        # create app execute role
        app_execute_role = iam.Role(
            self,
            "AppExecuteRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        )
        app_execute_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "ecr:GetAuthorizationToken",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=["*"],
            )
        )

        # Add policy statements to the IAM role
        app_execute_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "wellarchitected:GetLensReview",
                    "wellarchitected:ListAnswers",
                    "wellarchitected:GetWorkload",
                    "wellarchitected:UpdateAnswer",
                    "wellarchitected:CreateMilestone",
                    "wellarchitected:GetLensReviewReport",
                ],
                resources=["*"],
            )
        )
        app_execute_role.add_to_policy(
            iam.PolicyStatement(actions=["bedrock:InvokeModel"], resources=["*"])
        )
        app_execute_role.add_to_policy(
            iam.PolicyStatement(
                actions=["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
                resources=[
                    f"arn:aws:s3:::{UPLOAD_BUCKET_NAME}",
                    f"arn:aws:s3:::{UPLOAD_BUCKET_NAME}/*",
                    f"arn:aws:s3:::{WA_DOCS_BUCKET_NAME}",
                    f"arn:aws:s3:::{WA_DOCS_BUCKET_NAME}/*",
                ],
            )
        )
        app_execute_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonBedrockFullAccess")
        )

        # Create VPC to host the ECS cluster
        vpc = ec2.Vpc(
            self,
            "StreamlitECSVpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public", subnet_type=ec2.SubnetType.PUBLIC
                ),
                ec2.SubnetConfiguration(
                    name="private", subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ),
            ],
        )

        # Capture the public subnets
        public_subnets = vpc.select_subnets(subnet_type=ec2.SubnetType.PUBLIC)

        # Create ECS Cluster
        ecs_cluster = ecs.Cluster(
            self, "StreamlitAppCluster", vpc=vpc, container_insights=True
        )

        # Create Security Group for ALB
        ecs_security_group = ec2.SecurityGroup(
            self,
            "StreamlitAppSecurityGroup",
            vpc=vpc,
            description="Allow traffic to Fargate service from allowed ips",
            allow_all_outbound=False,
        )

        # Create ALB
        ecs_loadbalancer = elasticloadbalancingv2.ApplicationLoadBalancer(
            self,
            "StreamlitAppLoadBalancer",
            security_group=ecs_security_group,
            vpc=vpc,
            internet_facing=public_lb,
        )

        # Create Fargate Service with private ALB
        fargate_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self,
            "StreamlitAppService",
            cluster=ecs_cluster,
            runtime_platform=ecs.RuntimePlatform(
                operating_system_family=ecs.OperatingSystemFamily.LINUX,
                cpu_architecture=architecture,
            ),
            task_image_options=ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
                image=ecs.ContainerImage.from_docker_image_asset(imageAsset),
                container_port=8501,
                task_role=app_execute_role,
                environment={
                    "IAC_TEMPLATE_S3_BUCKET": UPLOAD_BUCKET_NAME,
                    "WA_DOCS_S3_BUCKET": WA_DOCS_BUCKET_NAME,
                    "KNOWLEDGE_BASE_ID": KB_ID,
                    "MODEL_ID": model_id,
                },
            ),
            task_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            load_balancer=ecs_loadbalancer,
        )

        # Escape hatch for allowed ip addresses
        if allowed_ips != ["0.0.0.0/0"]:
            for i, allowed_ip in enumerate(allowed_ips):
                ecs_security_group.node.default_child.add_override(
                    f"Properties.SecurityGroupIngress.{i}.CidrIp", allowed_ip
                )
                ecs_security_group.node.default_child.add_override(
                    f"Properties.SecurityGroupIngress.{i}.Description",
                    "Allow HTTP traffic from specified ip",
                )
                ecs_security_group.node.default_child.add_override(
                    f"Properties.SecurityGroupIngress.{i}.FromPort",
                    "80",
                )
                ecs_security_group.node.default_child.add_override(
                    f"Properties.SecurityGroupIngress.{i}.IpProtocol",
                    "tcp",
                )
                ecs_security_group.node.default_child.add_override(
                    f"Properties.SecurityGroupIngress.{i}.ToPort",
                    "80",
                )

        # Configure health check for ALB
        fargate_service.target_group.configure_health_check(path="/healthz")

        # Output the ALB DNS name
        cdk.CfnOutput(
            self,
            "StreamlitAppPrivateALB",
            value=fargate_service.load_balancer.load_balancer_dns_name,
            description="DNS name of the ALB",
        )

        # Output the VPC ID
        cdk.CfnOutput(
            self,
            "VpcId",
            value=vpc.vpc_id,
            description="ID of the VPC where the private ALB is created",
        )

        # Output the ID of the first public subnet
        cdk.CfnOutput(
            self,
            "PublicSubnetId",
            value=public_subnets.subnet_ids[0],
            description="ID of the public subnet created in the VPC",
        )

        # Node dependencies
        kbDataSource.node.add_dependency(wafrReferenceDocsBucket)
        ingestion_job_cr.node.add_dependency(kb)
        kb_lambda_synchronizer.node.add_dependency(kb)
        kb_lambda_synchronizer.node.add_dependency(kbDataSource)
        kb_lambda_synchronizer.node.add_dependency(wafrReferenceDocsBucket)
        kb_lambda_synchronizer.node.add_dependency(workload_cr)
