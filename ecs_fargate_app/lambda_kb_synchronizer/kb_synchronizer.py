import csv
import json
import os
from datetime import datetime
from io import StringIO

import boto3
import requests
from botocore.exceptions import ClientError


def download_file(url):
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    return response.content


def create_metadata_json(lens_name, lens_arn, pillar_name=None, lens_author="AWS"):
    """
    Creates metadata JSON content for a lens
    """
    metadata = {
        "metadataAttributes": {
            "lens_name": lens_name,
            "lens_arn": lens_arn,
            "lens_author": lens_author,
        }
    }

    # Add pillar information for Well-Architected Framework
    if lens_name == "Well-Architected Framework" and pillar_name:
        metadata["metadataAttributes"]["pillar"] = pillar_name

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


def upload_metadata_file(
    bucket_name,
    pdf_file_name,
    lens_name,
    lens_arn,
    pillar_name=None,
    prefix="",
    lens_author="AWS",
):
    """
    Create and upload a metadata JSON file for a PDF
    """
    metadata_content = create_metadata_json(
        lens_name, lens_arn, pillar_name, lens_author
    )
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
    lens_alias, pdf_url, lens_name, lens_description, pillar_mapping, lens_author="AWS"
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
                "lensAuthor": lens_author,
            }
        )
        print(f"Stored metadata for lens {lens_alias} in DynamoDB")
        return True
    except Exception as e:
        print(f"Error storing metadata for lens {lens_alias} in DynamoDB: {e}")
        return False


def get_custom_lenses_from_ssm():
    """Retrieve custom lenses configuration from SSM Parameter Store"""
    ssm_client = boto3.client("ssm")
    param_name = os.environ.get("CUSTOM_LENSES_SSM_PARAMETER", "")

    if not param_name:
        print(
            "No CUSTOM_LENSES_SSM_PARAMETER environment variable set. Skipping custom lenses."
        )
        return []

    try:
        response = ssm_client.get_parameter(Name=param_name)
        param_value = response["Parameter"]["Value"]

        # Handle empty parameter
        if not param_value or param_value.strip() == "" or param_value.strip() == "[]":
            print("Custom lenses SSM parameter is empty. No custom lenses to process.")
            return []

        custom_lenses = json.loads(param_value)

        if not isinstance(custom_lenses, list):
            print(
                f"Custom lenses SSM parameter is not a list. Got: {type(custom_lenses)}"
            )
            return []

        # Validate each entry
        validated_lenses = []
        for lens in custom_lenses:
            if not isinstance(lens, dict):
                print(f"Skipping invalid custom lens entry (not a dict): {lens}")
                continue

            required_keys = ["lensName", "lensArn", "lensDescription"]
            missing_keys = [k for k in required_keys if k not in lens or not lens[k]]
            if missing_keys:
                print(
                    f"Skipping custom lens entry with missing keys {missing_keys}: {lens}"
                )
                continue

            # Generate s3Prefix from lensName if not provided
            if "s3Prefix" not in lens or not lens["s3Prefix"]:
                lens["s3Prefix"] = normalize_lens_name_to_prefix(lens["lensName"])

            # Warn if fileNameWithExtension is not provided
            if "fileNameWithExtension" not in lens or not lens["fileNameWithExtension"]:
                print(
                    f"Warning: 'fileNameWithExtension' not provided for custom lens '{lens['lensName']}'. "
                    f"Metadata JSON for the PDF will not be created."
                )

            validated_lenses.append(lens)

        print(f"Found {len(validated_lenses)} valid custom lens(es) in SSM parameter.")
        return validated_lenses

    except ssm_client.exceptions.ParameterNotFound:
        print(f"SSM parameter {param_name} not found. No custom lenses to process.")
        return []
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON from SSM parameter {param_name}: {e}")
        return []
    except ClientError as e:
        print(f"Error reading SSM parameter {param_name}: {e}")
        return []


def normalize_lens_name_to_prefix(lens_name):
    """
    Normalize a lens name to a valid S3 prefix.
    Removes spaces, converts to lowercase, removes non-alphanumeric characters.
    """
    return "".join(c for c in lens_name.lower() if c.isalnum())


def process_lens(bucket_name, workload_id, lens_data, is_primary_lens=False):
    """Process a specific lens - upload PDF, get answers, generate metadata, etc."""
    lens_alias = lens_data.get("lensArn", "")
    s3_prefix = lens_data.get("lensArn", "").split("/")[-1]
    lens_name = lens_data.get("lensName", "")
    lens_description = lens_data.get("lensDescription", "")
    lens_url = lens_data.get("url", "")
    lens_filename = lens_data.get("pdfName", "")
    pillar_name = lens_data.get("pillarName")

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
                bucket_name,
                lens_filename,
                lens_name,
                lens_alias,
                pillar_name=pillar_name,
                prefix=s3_prefix,
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
            except Exception as disassociate_error:
                print(
                    f"Failed to disassociate lens {lens_alias} during cleanup: {disassociate_error}"
                )
        return False


def process_custom_lens(bucket_name, workload_id, custom_lens_data):
    """
    Process a custom lens.
    Unlike additional (AWS official) lenses, the PDF is NOT downloaded (admin user uploads it manually).
    This function associates the custom lens, extracts best practices, generates metadata,
    creates the metadata JSON for the PDF specified via fileNameWithExtension in the SSM
    parameter, and disassociates the lens.
    """
    lens_arn = custom_lens_data.get("lensArn", "")
    lens_name = custom_lens_data.get("lensName", "")
    lens_description = custom_lens_data.get("lensDescription", "")
    file_name_with_extension = custom_lens_data.get("fileNameWithExtension", "")

    # Extract the lens ID from the ARN (the part after the last '/')
    s3_prefix = lens_arn.split("/")[-1] if "/" in lens_arn else lens_arn

    print(
        f"Processing custom lens: {lens_name} (ARN: {lens_arn}, S3 prefix: {s3_prefix})"
    )

    # Step 1: Associate the custom lens with the workload
    try:
        if not associate_lens(workload_id, lens_arn):
            print(
                f"Failed to associate custom lens {lens_arn}. Skipping further processing."
            )
            return False
    except Exception as e:
        print(f"Error associating custom lens {lens_arn}: {e}")
        return False

    try:
        # Step 2: Get lens review and extract best practices
        try:
            lens_review = get_lens_review(workload_id, lens_arn)

            # Create pillar mapping
            pillar_mapping = {
                pillar.get("PillarId", ""): pillar.get("PillarName", "")
                for pillar in lens_review.get("PillarReviewSummaries", [])
            }

            # Get answers
            answers = list_answers(workload_id, lens_arn)

            # Process answers
            processed_data = process_answers(answers, pillar_mapping)

            # Create JSON and CSV content
            json_data = create_json(processed_data)
            csv_data = create_csv(processed_data)

            # Store best practices using the lens ID from ARN as the primary prefix
            lens_id_best_practices_prefix = f"{s3_prefix}/best_practices_list"

            json_upload_success = upload_to_s3(
                bucket_name,
                s3_prefix + "_best_practices.json",
                json_data,
                prefix=lens_id_best_practices_prefix,
            )
            csv_upload_success = upload_to_s3(
                bucket_name,
                s3_prefix + "_best_practices.csv",
                csv_data,
                prefix=lens_id_best_practices_prefix,
            )

            if not json_upload_success or not csv_upload_success:
                print(
                    f"Failed to upload best practices data for custom lens {lens_arn}"
                )

            # Step 3: Create metadata JSON file for the PDF specified in SSM parameter
            if file_name_with_extension:
                print(
                    f"Creating metadata for custom lens PDF: {file_name_with_extension}"
                )
                upload_metadata_file(
                    bucket_name,
                    file_name_with_extension,
                    lens_name,
                    lens_arn,
                    prefix=s3_prefix,
                    lens_author="custom",
                )
            else:
                print(
                    f"No fileNameWithExtension provided for custom lens '{lens_name}'. "
                    f"Skipping metadata JSON creation for PDF."
                )

            # Step 4: Store lens metadata in DynamoDB (with lens_author = "custom")
            store_lens_metadata(
                lens_arn,
                "",  # No PDF URL for custom lenses
                lens_name,
                lens_description,
                pillar_mapping,
                lens_author="custom",
            )

            print(f"Successfully processed custom lens: {lens_name}")

        except Exception as e:
            print(f"Error processing custom lens review for {lens_arn}: {e}")

    finally:
        # Always disassociate the custom lens when done
        disassociate_lens(workload_id, lens_arn)

    return True


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
            "pillarName": "Cost Optimization",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/operational-excellence-pillar/wellarchitected-operational-excellence-pillar.pdf",
            "pdfName": "wellarchitected-operational-excellence-pillar.pdf",
            "lensName": "Well-Architected Framework",
            "lensArn": "arn:aws:wellarchitected::aws:lens/wellarchitected",
            "lensDescription": "AWS Well-Architected helps cloud architects build secure, high-performing, resilient, and efficient infrastructure for a variety of applications and workloads.",
            "pillarName": "Operational Excellence",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/performance-efficiency-pillar/wellarchitected-performance-efficiency-pillar.pdf",
            "pdfName": "wellarchitected-performance-efficiency-pillar.pdf",
            "lensName": "Well-Architected Framework",
            "lensArn": "arn:aws:wellarchitected::aws:lens/wellarchitected",
            "lensDescription": "AWS Well-Architected helps cloud architects build secure, high-performing, resilient, and efficient infrastructure for a variety of applications and workloads.",
            "pillarName": "Performance Efficiency",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/reliability-pillar/wellarchitected-reliability-pillar.pdf",
            "pdfName": "wellarchitected-reliability-pillar.pdf",
            "lensName": "Well-Architected Framework",
            "lensArn": "arn:aws:wellarchitected::aws:lens/wellarchitected",
            "lensDescription": "AWS Well-Architected helps cloud architects build secure, high-performing, resilient, and efficient infrastructure for a variety of applications and workloads.",
            "pillarName": "Reliability",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/security-pillar/wellarchitected-security-pillar.pdf",
            "pdfName": "wellarchitected-security-pillar.pdf",
            "lensName": "Well-Architected Framework",
            "lensArn": "arn:aws:wellarchitected::aws:lens/wellarchitected",
            "lensDescription": "AWS Well-Architected helps cloud architects build secure, high-performing, resilient, and efficient infrastructure for a variety of applications and workloads.",
            "pillarName": "Security",
        },
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/sustainability-pillar/wellarchitected-sustainability-pillar.pdf",
            "pdfName": "wellarchitected-sustainability-pillar.pdf",
            "lensName": "Well-Architected Framework",
            "lensArn": "arn:aws:wellarchitected::aws:lens/wellarchitected",
            "lensDescription": "AWS Well-Architected helps cloud architects build secure, high-performing, resilient, and efficient infrastructure for a variety of applications and workloads.",
            "pillarName": "Sustainability",
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
        {
            "url": "https://docs.aws.amazon.com/pdfs/wellarchitected/latest/generative-ai-lens/generative-ai-lens.pdf",
            "pdfName": "generative-ai-lens.pdf",
            "lensName": "Generative AI Lens",
            "lensArn": "arn:aws:wellarchitected::aws:lens/genai",
            "lensDescription": "The Generative AI Lens provides comprehensive guidance for designing, deploying, and operating generative AI applications on AWS. It extends the Well-Architected Framework to address unique considerations when using foundation models across all pillars: operational excellence, security, reliability, performance efficiency, cost optimization, and sustainability. The lens emphasizes responsible AI practices throughout the generative AI lifecycle, helping you create secure, reliable, and cost-effective solutions with Amazon Bedrock and SageMaker AI.",
        },
    ]

    # =========================================================================
    # Step 1: Process primary Well-Architected Framework lens
    # =========================================================================
    print("Processing primary Well-Architected Framework lens")

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
            upload_to_s3(
                bucket_name, file_data["pdfName"], pdf_content, prefix="wellarchitected"
            )
            upload_metadata_file(
                bucket_name,
                file_data["pdfName"],
                "Well-Architected Framework",
                "arn:aws:wellarchitected::aws:lens/wellarchitected",
                pillar_name=file_data["pillarName"],
                prefix="wellarchitected",
            )
        except Exception as e:
            print(
                f"Error processing Well-Architected document {file_data['pdfName']}: {e}"
            )

    process_lens(bucket_name, workload_id, wellarchitected_lens, is_primary_lens=True)

    # =========================================================================
    # Step 2: Process additional (AWS official) lenses
    # =========================================================================
    for lens in additional_lenses:
        print(f"Processing additional lens: {lens['lensName']}")
        process_lens(bucket_name, workload_id, lens, is_primary_lens=False)

    # =========================================================================
    # Step 3: Process custom lenses from SSM Parameter Store
    # =========================================================================
    print("Checking for custom lenses in SSM Parameter Store...")
    custom_lenses = get_custom_lenses_from_ssm()

    for custom_lens in custom_lenses:
        print(f"Processing custom lens: {custom_lens['lensName']}")
        process_custom_lens(bucket_name, workload_id, custom_lens)

    # =========================================================================
    # Step 4: Start the ingestion job after all lenses are processed
    # =========================================================================
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
