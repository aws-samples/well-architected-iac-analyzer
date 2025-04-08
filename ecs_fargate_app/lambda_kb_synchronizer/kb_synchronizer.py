import csv
import json
import os
import time
from datetime import datetime
from io import StringIO

import boto3
import requests
from botocore.exceptions import ClientError


def download_file(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.content


def create_metadata_json(lens_name, lens_arn):
    """
    Creates metadata JSON content for a lens
    """
    metadata = {
        "metadataAttributes": {
            "lens_name": lens_name,
            "lens_arn": lens_arn,
            "lens_author": "AWS",
        }
    }
    return json.dumps(metadata, indent=4)


def upload_to_s3(bucket_name, file_name, file_content, prefix=""):
    s3_client = boto3.client("s3")
    key = f"{prefix}/{file_name}" if prefix else file_name
    try:
        s3_client.put_object(Bucket=bucket_name, Key=key, Body=file_content)
        print(f"File {key} uploaded successfully")
        return True
    except ClientError as e:
        print(f"Error uploading file {key}: {e}")
        return False


def upload_metadata_file(bucket_name, pdf_file_name, lens_name, lens_arn, prefix=""):
    """
    Create and upload a metadata JSON file for a PDF
    """
    metadata_content = create_metadata_json(lens_name, lens_arn)
    metadata_file_name = f"{pdf_file_name}.metadata.json"
    return upload_to_s3(bucket_name, metadata_file_name, metadata_content, prefix)


def get_lens_review(workload_id, lens_alias):
    client = boto3.client("wellarchitected")
    response = client.get_lens_review(WorkloadId=workload_id, LensAlias=lens_alias)
    return response["LensReview"]


def upgrade_lens_review(workload_id, lens_alias):
    client = boto3.client("wellarchitected")
    try:
        client.upgrade_lens_review(
            WorkloadId=workload_id,
            LensAlias=lens_alias,
            MilestoneName="string",
            ClientRequestToken="string",
        )
        print(f"Upgraded lens review for {lens_alias}")
        return True
    except ClientError as e:
        print(f"Error upgrading lens review for {lens_alias}: {e}")
        return False


def associate_lens(workload_id, lens_alias):
    client = boto3.client("wellarchitected")
    try:
        client.associate_lenses(
            WorkloadId=workload_id,
            LensAliases=[lens_alias],
        )
        print(f"Associated lens {lens_alias} with workload {workload_id}")
        return True
    except ClientError as e:
        print(f"Error associating lens {lens_alias} with workload {workload_id}: {e}")
        return False


def disassociate_lens(workload_id, lens_alias):
    client = boto3.client("wellarchitected")
    try:
        client.disassociate_lenses(
            WorkloadId=workload_id,
            LensAliases=[lens_alias],
        )
        print(f"Disassociated lens {lens_alias} from workload {workload_id}")
        return True
    except ClientError as e:
        print(
            f"Error disassociating lens {lens_alias} from workload {workload_id}: {e}"
        )
        return False


def list_answers(workload_id, lens_alias):
    client = boto3.client("wellarchitected")
    answers = []
    next_token = None

    while True:
        if next_token:
            response = client.list_answers(
                WorkloadId=workload_id, LensAlias=lens_alias, NextToken=next_token
            )
        else:
            response = client.list_answers(WorkloadId=workload_id, LensAlias=lens_alias)

        answers.extend(response.get("AnswerSummaries", []))

        if "NextToken" in response:
            next_token = response["NextToken"]
        else:
            break

    return answers


def process_answers(answers, pillar_mapping):
    result = []
    for answer in answers:
        pillar_id = answer.get("PillarId", "")
        pillar_name = pillar_mapping.get(pillar_id, pillar_id)
        question = answer.get("QuestionTitle", "")
        for choice in answer.get("Choices", []):
            if choice.get("Title") != "None of these":
                result.append(
                    {
                        "Pillar": pillar_name,
                        "Question": question,
                        "Best Practice": choice.get("Title", ""),
                    }
                )
    return result


def create_json(data):
    return json.dumps(data, indent=2)


def create_csv(data):
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=["Pillar", "Question", "Best Practice"])
    writer.writeheader()
    for row in data:
        writer.writerow(row)
    return output.getvalue()


def store_lens_metadata(
    lens_alias, pdf_url, lens_name, lens_description, pillar_mapping
):
    """Store metadata about processed lens in DynamoDB"""
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(os.environ["LENS_METADATA_TABLE"])

    try:
        table.put_item(
            Item={
                "lensAlias": lens_alias,
                "pdfUrl": pdf_url,
                "lensName": lens_name,
                "uploadDate": datetime.utcnow().isoformat(),
                "lensDescription": lens_description,
                "lensPillars": pillar_mapping,
            }
        )
        print(f"Stored metadata for lens {lens_alias} in DynamoDB")
        return True
    except Exception as e:
        print(f"Error storing metadata for lens {lens_alias} in DynamoDB: {e}")
        return False


def process_lens(bucket_name, workload_id, lens_data, is_primary_lens=False):
    """Process a specific lens - upload PDF, get answers, generate metadata, etc."""
    lens_alias = lens_data.get("lensArn", "")
    s3_prefix = lens_data.get("lensArn", "").split("/")[-1]
    lens_name = lens_data.get("lensName", "")
    lens_description = lens_data.get("lensDescription", "")
    lens_url = lens_data.get("url", "")
    lens_filename = lens_data.get("pdfName", "")

    print(f"Processing lens: {lens_name} (alias: {lens_alias})")

    # Step 1: Upload PDF to S3 with appropriate prefix (only for non primary WA lenses)
    try:
        if not is_primary_lens:
            pdf_content = download_file(lens_url)
            if not upload_to_s3(
                bucket_name, lens_filename, pdf_content, prefix=s3_prefix
            ):
                print(
                    f"Failed to upload PDF for lens {lens_alias}. Skipping further processing."
                )
                return False

            # Upload metadata file alongside the PDF
            upload_metadata_file(
                bucket_name, lens_filename, lens_name, lens_alias, prefix=s3_prefix
            )
    except Exception as e:
        print(f"Error downloading/uploading PDF for lens {lens_alias}: {e}")
        return False

    # Step 2: Process Well-Architected best practices
    try:
        if not is_primary_lens:
            # For non-primary lenses, associate the lens first
            if not associate_lens(workload_id, lens_alias):
                print(
                    f"Failed to associate lens {lens_alias}. Skipping further processing."
                )
                return False
        else:
            # For wellarchitected lens, upgrade the lens review
            if not upgrade_lens_review(workload_id, lens_alias):
                print(
                    f"Failed to upgrade review for lens {lens_alias}. Continuing anyway."
                )

        # Get lens review
        try:
            lens_review = get_lens_review(workload_id, lens_alias)

            # Create pillar mapping
            pillar_mapping = {
                pillar.get("PillarId", ""): pillar.get("PillarName", "")
                for pillar in lens_review.get("PillarReviewSummaries", [])
            }

            # Get answers
            answers = list_answers(workload_id, lens_alias)

            # Process answers
            processed_data = process_answers(answers, pillar_mapping)

            # Create JSON and CSV content
            json_data = create_json(processed_data)
            csv_data = create_csv(processed_data)

            # Upload JSON and CSV to S3 with appropriate prefix
            best_practices_prefix = f"{s3_prefix}/best_practices_list"
            json_upload_success = upload_to_s3(
                bucket_name,
                s3_prefix + "_best_practices.json",
                json_data,
                prefix=best_practices_prefix,
            )
            csv_upload_success = upload_to_s3(
                bucket_name,
                s3_prefix + "_best_practices.csv",
                csv_data,
                prefix=best_practices_prefix,
            )

            if not json_upload_success or not csv_upload_success:
                print(f"Failed to upload best practices data for lens {lens_alias}")

            # Store lens metadata in DynamoDB
            store_lens_metadata(
                lens_alias, lens_url, lens_name, lens_description, pillar_mapping
            )

        except Exception as e:
            print(f"Error processing lens review for {lens_alias}: {e}")

        finally:
            # For non-primary lenses, disassociate the lens when done
            if not is_primary_lens:
                disassociate_lens(workload_id, lens_alias)

        return True

    except Exception as e:
        print(f"Error processing lens {lens_alias}: {e}")
        # Ensure we disassociate lens in case of error (for non-primary lenses)
        if not is_primary_lens:
            try:
                disassociate_lens(workload_id, lens_alias)
            except Exception:
                pass
        return False


def handler(event, context):
    bucket_name = os.environ["WA_DOCS_BUCKET_NAME"]
    workload_id = os.environ.get("WORKLOAD_ID")

    # Define primary Well-Architected lens files
    wellarchitected_files = [
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/cost-optimization-pillar/wellarchitected-cost-optimization-pillar.pdf",
            "pdfName": "wellarchitected-cost-optimization-pillar.pdf",
            "lensName": "Well-Architected Framework",
            "lensArn": "arn:aws:wellarchitected::aws:lens/wellarchitected",
            "lensDescription": "AWS Well-Architected helps cloud architects build secure, high-performing, resilient, and efficient infrastructure for a variety of applications and workloads.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/operational-excellence-pillar/wellarchitected-operational-excellence-pillar.pdf",
            "pdfName": "wellarchitected-operational-excellence-pillar.pdf",
            "lensName": "Well-Architected Framework",
            "lensArn": "arn:aws:wellarchitected::aws:lens/wellarchitected",
            "lensDescription": "AWS Well-Architected helps cloud architects build secure, high-performing, resilient, and efficient infrastructure for a variety of applications and workloads.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/performance-efficiency-pillar/wellarchitected-performance-efficiency-pillar.pdf",
            "pdfName": "wellarchitected-performance-efficiency-pillar.pdf",
            "lensName": "Well-Architected Framework",
            "lensArn": "arn:aws:wellarchitected::aws:lens/wellarchitected",
            "lensDescription": "AWS Well-Architected helps cloud architects build secure, high-performing, resilient, and efficient infrastructure for a variety of applications and workloads.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/reliability-pillar/wellarchitected-reliability-pillar.pdf",
            "pdfName": "wellarchitected-reliability-pillar.pdf",
            "lensName": "Well-Architected Framework",
            "lensArn": "arn:aws:wellarchitected::aws:lens/wellarchitected",
            "lensDescription": "AWS Well-Architected helps cloud architects build secure, high-performing, resilient, and efficient infrastructure for a variety of applications and workloads.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/security-pillar/wellarchitected-security-pillar.pdf",
            "pdfName": "wellarchitected-security-pillar.pdf",
            "lensName": "Well-Architected Framework",
            "lensArn": "arn:aws:wellarchitected::aws:lens/wellarchitected",
            "lensDescription": "AWS Well-Architected helps cloud architects build secure, high-performing, resilient, and efficient infrastructure for a variety of applications and workloads.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/sustainability-pillar/wellarchitected-sustainability-pillar.pdf",
            "pdfName": "wellarchitected-sustainability-pillar.pdf",
            "lensName": "Well-Architected Framework",
            "lensArn": "arn:aws:wellarchitected::aws:lens/wellarchitected",
            "lensDescription": "AWS Well-Architected helps cloud architects build secure, high-performing, resilient, and efficient infrastructure for a variety of applications and workloads.",
        },
    ]

    # Define additional lenses
    additional_lenses = [
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/serverless-applications-lens/wellarchitected-serverless-applications-lens.pdf",
            "pdfName": "wellarchitected-serverless-applications-lens.pdf",
            "lensName": "Serverless Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/serverless",
            "lensDescription": "The AWS Serverless Application Lens provides a set of additional questions for you to consider for your serverless applications.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/healthcare-industry-lens/healthcare-industry-lens.pdf",
            "pdfName": "healthcare-industry-lens.pdf",
            "lensName": "Healthcare Industry Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/healthcare",
            "lensDescription": "Best practices and guidance for how to design, deploy, and manage your healthcare workloads in the AWS Cloud.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/iot-lens/wellarchitected-iot-lens.pdf",
            "pdfName": "wellarchitected-iot-lens.pdf",
            "lensName": "IoT Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/iot",
            "lensDescription": "Best practices for managing your Internet of Things (IoT) workloads in AWS.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/connected-mobility-lens/connected-mobility-lens.pdf",
            "pdfName": "connected-mobility-lens.pdf",
            "lensName": "Connected Mobility Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/connectedmobility",
            "lensDescription": "Best practices for Connected Mobility workload",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/analytics-lens/analytics-lens.pdf",
            "pdfName": "analytics-lens.pdf",
            "lensName": "Data Analytics Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/dataanalytics",
            "lensDescription": "The Data Analytics Lens contains insights that AWS has gathered from real-world case studies, and helps you learn the key design elements of well-architected analytics workloads along with recommendations for improvement. The document is intended for IT architects, developers, and team members who build and operate analytics systems.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/devops-guidance/devops-guidance.pdf",
            "pdfName": "devops-guidance.pdf",
            "lensName": "DevOps Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/devops",
            "lensDescription": "The DevOps Lens for the AWS Well-Architected Framework follows the AWS DevOps Sagas as featured in the Well-Architected DevOps Guidance whitepaper. This lens provides a focused approach to integrating DevOps principles and practices into your organization and AWS workloads.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/mergers-and-acquisitions-lens/mergers-and-acquisitions-lens.pdf",
            "pdfName": "mergers-and-acquisitions-lens.pdf",
            "lensName": "Mergers and Acquisitions Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/mavaluecreation",
            "lensDescription": "The Mergers and Acquisitions Lens provides a set of additional questions to consider when looking for ways to drive company growth, such as for private equity mergers and acquisitions activity.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/sap-lens/sap-lens.pdf",
            "pdfName": "sap-lens.pdf",
            "lensName": "SAP Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/sap",
            "lensDescription": "The SAP Lens for the AWS Well-Architected Framework is a collection of customer-proven design principles and best practices for ensuring SAP workloads on AWS are well-architected. Use this lens as a supplement to the AWS Well-Architected Framework.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/saas-lens/wellarchitected-saas-lens.pdf",
            "pdfName": "wellarchitected-saas-lens.pdf",
            "lensName": "SaaS Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/softwareasaservice",
            "lensDescription": "The AWS SaaS Lens provides a set of additional questions for you to consider for your Software-as-a-Service (SaaS) applications.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/container-build-lens/container-build-lens.pdf",
            "pdfName": "container-build-lens.pdf",
            "lensName": "Container Build Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/containerbuild",
            "lensDescription": "The Container Build Lens will focus specifically on the container design and build process. Topics such as best practices for container orchestration architecture design principals and general best practices in software development are considered out of scope for this lens. These topics are addressed in other AWS publications. See the Resources sections under Pillars of the Well-Architected Framework for more information.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/financial-services-industry-lens/wellarchitected-financial-services-industry-lens.pdf",
            "pdfName": "wellarchitected-financial-services-industry-lens.pdf",
            "lensName": "Financial Services Industry Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/financialservices",
            "lensDescription": "The Financial Services Industry Lens identifies best practices for security, data privacy, and resiliency that are intended to address the requirements of financial institutions based on our experience working with financial institutions worldwide. It provides guidance on guardrails for technology teams to implement and confidently use AWS to build and deploy applications. This Lens describes the process of building transparency and auditability into your AWS environment. It also offers suggestions for controls to help you expedite adoption of new services into your environment while managing the cost of your IT services.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/government-lens/government-lens.pdf",
            "pdfName": "government-lens.pdf",
            "lensName": "Government Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/government",
            "lensDescription": "The Government Lens helps people understand the special context and requirements of government and how to best deliver meaningful service and policy outcomes on AWS. This lens drives architectural qualities that layer government-specific best practices for progressive enhancement as a service design assurance function. For example, government customers can use the new service outcomes chapter to guide design and operating model considerations, as an indicator of readiness for government service launches, and to inform AWS Enterprise Support event management.",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/machine-learning-lens/wellarchitected-machine-learning-lens.pdf",
            "pdfName": "wellarchitected-machine-learning-lens.pdf",
            "lensName": "Machine Learning Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/machinelearning",
            "lensDescription": "Best practices for managing your Machine Learning resources/workloads in AWS",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/migration-lens/migration-lens.pdf",
            "pdfName": "migration-lens.pdf",
            "lensName": "Migration Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/migration",
            "lensDescription": "The Migration Lens for the Well-Architected Framework is a collection of customer-proven design principles and best practices that you can apply to your migration program across the three migration phases: Assess, Mobilize, and Migrate.",
        },
    ]

    # Process primary Well-Architected lens first
    print("Processing primary Well-Architected Framework lens")

    # Process the main well-architected lens
    wellarchitected_lens = {
        "url": "multiple PDFs",
        "pdfName": "multiple PDFs",
        "lensName": "Well-Architected Framework",
        "lensArn": "arn:aws:wellarchitected::aws:lens/wellarchitected",
        "lensDescription": "AWS Well-Architected helps cloud architects build secure, high-performing, resilient, and efficient infrastructure.",
    }

    # Process primary WA lens PDFs
    for file_data in wellarchitected_files:
        try:
            pdf_content = download_file(file_data["url"])
            # Upload to S3 with wellarchitected prefix
            upload_to_s3(
                bucket_name, file_data["pdfName"], pdf_content, prefix="wellarchitected"
            )
            # Upload corresponding metadata file
            upload_metadata_file(
                bucket_name,
                file_data["pdfName"],
                "Well-Architected Framework",
                "arn:aws:wellarchitected::aws:lens/wellarchitected",
                prefix="wellarchitected",
            )
        except Exception as e:
            print(
                f"Error processing Well-Architected document {file_data['name']}: {e}"
            )

    # Now process the wellarchitected lens as a whole
    process_lens(bucket_name, workload_id, wellarchitected_lens, is_primary_lens=True)

    # Process additional lenses
    for lens in additional_lenses:
        print(f"Processing additional lens: {lens['lensName']}")

        # Allow some time between processing each lens to avoid rate limiting
        time.sleep(1)

        # Process this lens
        process_lens(bucket_name, workload_id, lens, is_primary_lens=False)

    # After all lenses are processed, start the ingestion job
    bedrock_agent = boto3.client("bedrock-agent")
    try:
        response = bedrock_agent.start_ingestion_job(
            knowledgeBaseId=os.environ["KNOWLEDGE_BASE_ID"],
            dataSourceId=os.environ["DATA_SOURCE_ID"],
        )
        print(f"Started ingestion job: {response['ingestionJob']['ingestionJobId']}")
    except Exception as e:
        print(f"Error starting ingestion job: {e}")

    return {"statusCode": 200, "body": "Processing complete"}
