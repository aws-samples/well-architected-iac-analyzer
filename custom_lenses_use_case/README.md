# Custom Lenses for the Well-Architected IaC Analyzer

This guide explains how to add support for **Custom Lenses** in the Well-Architected IaC Analyzer. Custom Lenses allow you to extend the analysis beyond the standard AWS Well-Architected Framework and AWS Official Lenses to include your organization's specific best practices, security policies, and compliance requirements.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step 1: Prepare Your Best Practices Document (PDF)](#step-1-prepare-your-best-practices-document-pdf)
- [Step 2: Create the Custom Lens JSON](#step-2-create-the-custom-lens-json)
- [Step 3: Create and Publish the Custom Lens in the WA Tool](#step-3-create-and-publish-the-custom-lens-in-the-wa-tool)
- [Step 4: Register the Custom Lens in the SSM Parameter Store](#step-4-register-the-custom-lens-in-the-ssm-parameter-store)
- [Step 5: Trigger the Knowledge Base Synchronizer Lambda](#step-5-trigger-the-knowledge-base-synchronizer-lambda)
- [Step 6: Upload the PDF to the S3 Knowledge Base Bucket](#step-6-upload-the-pdf-to-the-s3-knowledge-base-bucket)
- [Step 7: Sync the Bedrock Knowledge Base Data Source](#step-7-sync-the-bedrock-knowledge-base-data-source)
- [Step 8: Use the Custom Lens in the IaC Analyzer](#step-8-use-the-custom-lens-in-the-iac-analyzer)
- [Architecture Overview](#architecture-overview)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

---

## Overview

The Well-Architected IaC Analyzer supports 16 AWS Official Lenses out of the box. With the Custom Lenses feature, you can:

- Define your own pillars, questions, and best practices
- Analyze IaC templates, architecture diagrams, and PDF documents against your organization's specific policies
- Integrate with the AWS Well-Architected Tool for tracking and reporting
- Leverage Amazon Bedrock's Knowledge Base for AI-powered analysis using your custom documentation

### How It Works

1. You create a Custom Lens JSON following the AWS Well-Architected Tool format specification
2. You publish the Custom Lens in the AWS Well-Architected Tool
3. You register the lens in an SSM Parameter Store used by the IaC Analyzer, including the PDF filename
4. You upload your organization's PDF documentation to the Knowledge Base S3 bucket
5. You trigger the KB Synchronizer Lambda, which extracts the best practice structure from the lens and creates the metadata file for your PDF
6. End-users can then select the Custom Lens in the IaC Analyzer UI

---

## Prerequisites

- The Well-Architected IaC Analyzer must be deployed in your AWS account
- You need access to the AWS Management Console with permissions to:
  - Create and publish Custom Lenses in the AWS Well-Architected Tool
  - Update SSM Parameter Store values
  - Upload files to S3
  - Invoke Lambda functions
  - Sync Bedrock Knowledge Base data sources
- A PDF document containing your organization's best practices, security policies, or compliance requirements

---

## Step 1: Prepare Your Best Practices Document (PDF)

Create a comprehensive PDF document that describes your organization's best practices. This document will be ingested by Amazon Bedrock's Knowledge Base and used as the context for AI-powered analysis.

**Recommendations for the PDF:**

- Organize content by pillars/categories that align with your Custom Lens structure
- Include detailed implementation guidance for each best practice
- Describe risks of non-compliance
- Provide examples of compliant and non-compliant configurations
- Use clear headings and structured formatting for better extraction by the AI

> **Important:** Take note of the exact PDF filename (including extension) you plan to use. You will need it in Step 4 when registering the lens in the SSM parameter.

---

## Step 2: Create the Custom Lens JSON

Create a JSON file following the AWS Well-Architected Tool Custom Lens format. Below is a simplified example:

```json
{
    "schemaVersion": "2021-11-01",
    "name": "AnyCompany Security Policies",
    "description": "Custom Lens for AnyCompany internal security policies and compliance requirements.",
    "pillars": [
        {
            "id": "data_protection",
            "name": "Data Protection",
            "questions": [
                {
                    "id": "dp_q1",
                    "title": "How do you ensure data encryption at rest?",
                    "description": "All data stored in cloud services must be encrypted at rest using approved encryption methods.",
                    "choices": [
                        {
                            "id": "dp_q1_c1",
                            "title": "Use AES-256 encryption for all storage services",
                            "helpfulResource": {
                                "displayText": "AnyCompany requires AES-256 encryption for all data at rest.",
                                "url": "https://example.com/security-policy#encryption"
                            },
                            "improvementPlan": {
                                "displayText": "Enable SSE-S3 or SSE-KMS encryption on all S3 buckets and EBS volumes."
                            }
                        },
                        {
                            "id": "dp_q1_c2",
                            "title": "Use customer-managed KMS keys for sensitive data",
                            "helpfulResource": {
                                "displayText": "Sensitive data must use customer-managed KMS keys with key rotation enabled."
                            },
                            "improvementPlan": {
                                "displayText": "Create and configure customer-managed KMS keys with automatic rotation."
                            }
                        },
                        {
                            "id": "dp_q1_no",
                            "title": "None of these",
                            "helpfulResource": {
                                "displayText": "Select this if none of the above practices are followed."
                            }
                        }
                    ],
                    "riskRules": [
                        {
                            "condition": "dp_q1_c1 && dp_q1_c2",
                            "risk": "NO_RISK"
                        },
                        {
                            "condition": "dp_q1_c1 || dp_q1_c2",
                            "risk": "MEDIUM_RISK"
                        },
                        {
                            "condition": "default",
                            "risk": "HIGH_RISK"
                        }
                    ]
                }
            ]
        }
    ]
}
```

### Format Specification

For the complete Custom Lens JSON format specification, refer to:

- [AWS Documentation: Lens format specification](https://docs.aws.amazon.com/wellarchitected/latest/userguide/lenses-format-specification.html)
- [AWS Documentation: Creating a custom lens](https://docs.aws.amazon.com/wellarchitected/latest/userguide/lenses-create.html)

### Example Custom Lenses

For more examples of Custom Lens JSON files, refer to these AWS sample repositories:

- [Custom Lens Well-Architected Hub](https://github.com/aws-samples/custom-lens-wa-hub): A collection of community-contributed custom lenses
- [Sample Well-Architected Custom Lens](https://github.com/aws-samples/sample-well-architected-custom-lens): Starter template and examples

---

## Step 3: Create and Publish the Custom Lens in the WA Tool

1. Open the [AWS Well-Architected Tool Console](https://console.aws.amazon.com/wellarchitected/home#/lenses). Make sure you are in the same region you have deployed the IaC Analyzer.
2. In the left navigation, select **Custom lenses**
3. Click **Create custom lens**
4. Choose **Upload JSON file** and select the JSON file you created in Step 2
5. Review the lens definition and click **Submit and create lens**
6. After the lens is created, click **Publish lens** to make it available for workloads
   - Provide a version name (e.g., `1.0`)
7. **Note the Custom Lens ARN** — it will look like:
   ```
   arn:aws:wellarchitected:<aws-region>:<account-id>:lens/<unique-lens-id>
   ```

> **Important:** The Custom Lens must be published (not just in draft) for the IaC Analyzer to use it.

---

## Step 4: Register the Custom Lens in the SSM Parameter Store

The IaC Analyzer uses an SSM Parameter Store to track which Custom Lenses should be processed. The parameter was automatically created during stack deployment.

1. Find the SSM Parameter name from the CloudFormation stack outputs:
   - Navigate to the CloudFormation stack **WA-IaC-Analyzer-{region}-GenAIStack**
   - Go to the **Outputs** tab
   - Find the value for **CustomLensesSSMParameter** (e.g., `/wa-iac-analyzer/<region>/custom-lenses`)

2. Open the [AWS Systems Manager Parameter Store Console](https://console.aws.amazon.com/systems-manager/parameters). Make sure you are in the same region you have deployed the IaC Analyzer.

3. Find and edit the parameter (it will initially contain `[]`)

4. Update the parameter value with your Custom Lens configuration:

```json
[
    {
        "lensName": "AnyCompany Security Policies",
        "lensArn": "arn:aws:wellarchitected:<aws-region>:<account-id>:lens/<unique-lens-id>",
        "lensDescription": "Custom Lens for AnyCompany internal security policies and compliance requirements.",
        "fileNameWithExtension": "anycompany-security-policies.pdf"
    }
]
```

### Parameter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `lensName` | Yes | Display name for the lens in the UI |
| `lensArn` | Yes | The ARN of the published Custom Lens from Step 3 |
| `lensDescription` | Yes | Brief description shown in the lens selector |
| `fileNameWithExtension` | Yes | The exact filename (including extension) of the PDF you will upload to S3 (e.g., `anycompany-security-policies.pdf`). The Synchronizer Lambda uses this to create the `.metadata.json` file alongside the PDF. |

> **Important:** The `fileNameWithExtension` value must exactly match the filename of the PDF you upload in Step 6 (case-sensitive). This is what the Lambda uses to generate the corresponding `.metadata.json` file that enables Bedrock Knowledge Base filtering.

### Adding Multiple Custom Lenses

You can add multiple Custom Lenses by adding more entries to the JSON array:

```json
[
    {
        "lensName": "AnyCompany Security Policies",
        "lensArn": "arn:aws:wellarchitected:<region>:<account-id>:lens/<id-1>",
        "lensDescription": "Custom Lens for AnyCompany security policies.",
        "fileNameWithExtension": "anycompany-security-policies.pdf"
    },
    {
        "lensName": "AnyCompany Cost Governance",
        "lensArn": "arn:aws:wellarchitected:<region>:<account-id>:lens/<id-2>",
        "lensDescription": "Custom Lens for AnyCompany cost governance standards.",
        "fileNameWithExtension": "anycompany-cost-governance.pdf"
    }
]
```

---

## Step 5: Trigger the Knowledge Base Synchronizer Lambda

The Synchronizer Lambda processes lenses, extracts the best practice structure, and creates metadata files for your custom lens PDFs. It runs automatically on a weekly schedule, but you need to trigger it manually after adding a new Custom Lens.

1. Find the Lambda function name:
   - Search for a Lambda function containing `KbLambdaSynchronizer` in the name. E.g. `WA-IaC-Analyzer-<aws-region>-KbLambdaSynchronizer<uuid>-<unique-id>`

2. Invoke the Lambda function:

**Using the AWS Console:**
1. Open the [Lambda Console](https://console.aws.amazon.com/lambda). Make sure you are in the same region you have deployed the IaC Analyzer.
2. Find and open the `KbLambdaSynchronizer` function
3. Click on the **Test** tab
4. Click **Test** to invoke

> **What the Lambda does for custom lenses:**
> - Reads the custom lens configuration from the SSM parameter
> - Associates the custom lens with the internal workload
> - Extracts the best practice structure (pillars, questions, choices) and stores it in DynamoDB and S3
> - Creates a `.metadata.json` file for the PDF specified in `fileNameWithExtension`
> - Disassociates the custom lens from the workload
> - Triggers a Bedrock Knowledge Base ingestion job to index all content

---

## Step 6: Upload the PDF to the S3 Knowledge Base Bucket

Upload your organization's PDF document to the S3 bucket used as the Bedrock Knowledge Base data source.

1. Find the S3 bucket name from the CloudFormation stack outputs:
   - Look for **WellArchitectedDocsS3Bucket**

2. Upload the PDF to the correct prefix:

**Using the AWS Console:**
1. Open the [S3 Console](https://console.aws.amazon.com/s3). Make sure you are in the same region you have deployed the IaC Analyzer.
2. Navigate to the WA docs bucket
3. Look for the folder named as `<unique-lens-id>`. This ID is the value at the end of the ARN for the Custom Lens (e.g., `arn:aws:wellarchitected:<aws-region>:<account-id>:lens/<unique-lens-id>`)
4. Upload your PDF file(s) into that folder

> **Important:**
> - The PDF filename must exactly match the `fileNameWithExtension` value you specified in the SSM parameter.

---

## Step 7: Sync the Bedrock Knowledge Base Data Source

After uploading the PDF, you need to trigger a sync of the Bedrock Knowledge Base data source so that the new document is ingested and indexed for AI-powered analysis.

1. Find the Knowledge Base ID from the CloudFormation stack outputs:
   - Navigate to the CloudFormation stack **WA-IaC-Analyzer-{region}-GenAIStack**
   - Go to the **Outputs** tab
   - Find the value for the Bedrock Knowledge Base ID

2. Sync the data source:

**Using the AWS Console:**
1. Open the [Amazon Bedrock Console](https://console.aws.amazon.com/bedrock). Make sure you are in the same region you have deployed the IaC Analyzer.
2. In the left navigation, under **Build**, select **Knowledge Bases**
3. Find and open the Knowledge Base used by the IaC Analyzer
4. Scroll down to the **Data source** section
5. Select the data source
6. Click **Sync** to start the ingestion job

3. Wait for the sync to complete. You can monitor the status in the console under the data source's **Sync history** section. The status should change from **In progress** to **Completed**.

> **Note:** The sync may take a few minutes depending on the size of the PDF. Do not proceed to the next step until the sync status shows **Completed**. If the sync fails, check the sync history for error details and verify that the PDF was uploaded to the correct S3 prefix with the correct filename.

---

## Step 8: Use the Custom Lens in the IaC Analyzer

Once all the above steps are complete:

1. Open the IaC Analyzer web application
2. Upload your IaC document, architecture diagram or PDF
3. In **Optional Settings** → **Lens Selector**, you should see your Custom Lens listed
4. Select the Custom Lens
5. Select the pillars you want to review
6. Click **Start Review**

The analysis will use your custom best practices from the Knowledge Base to evaluate the uploaded infrastructure.

---

## Architecture Overview

### S3 Bucket Structure

After processing, the S3 bucket will contain:

```
<wa-docs-bucket>/
├── wellarchitected/                      # AWS WA Framework (pillars)
│   ├── wellarchitected-security-pillar.pdf
│   ├── wellarchitected-security-pillar.pdf.metadata.json
│   └── best_practices_list/
│       ├── wellarchitected_best_practices.json
│       └── wellarchitected_best_practices.csv
├── serverless/                           # AWS Official Lens
│   ├── wellarchitected-serverless-applications-lens.pdf
│   ├── wellarchitected-serverless-applications-lens.pdf.metadata.json
│   └── best_practices_list/
│       ├── serverless_best_practices.json
│       └── serverless_best_practices.csv
├── <unique-lens-id>/           # Your Custom Lens
│   ├── anycompany-security-policies.pdf                    # Uploaded by you
│   ├── anycompany-security-policies.pdf.metadata.json      # Auto-created by Lambda
│   └── best_practices_list/
│       ├── <unique-lens-id>_best_practices.json  # Auto-created by Lambda
│       └── <unique-lens-id>_best_practices.csv   # Auto-created by Lambda
└── ...
```

---

## Removing a Custom Lens

<details>
<summary><strong>Click to expand: Steps to manually remove a Custom Lens from the IaC Analyzer</strong></summary>

If you no longer need a Custom Lens in the IaC Analyzer, follow these steps to fully remove it from all associated resources.

### Step 1: Delete the Lens Entry from DynamoDB

1. Open the [DynamoDB Console](https://console.aws.amazon.com/dynamodbv2). Make sure you are in the same region where the IaC Analyzer was deployed.
2. In the left navigation, select **Tables**
3. Open the table whose name contains `LensMetadataTable` (e.g., `WA-IaC-Analyzer-<aws-region>-GenAIStack-LensMetadataTable-<unique-id>`)
4. Click **Explore table items** and run a scan to list the lenses in the table
5. Select the item corresponding to the lens you want to remove
6. Click **Actions** → **Delete item** and confirm the deletion

### Step 2: Delete the Lens Files from the S3 Knowledge Base Bucket

1. Find the S3 bucket name from the CloudFormation stack outputs:
   - Navigate to the CloudFormation stack **WA-IaC-Analyzer-{region}-GenAIStack**
   - Go to the **Outputs** tab
   - Look for **WellArchitectedDocsS3Bucket**

2. Open the [S3 Console](https://console.aws.amazon.com/s3). Make sure you are in the same region you have deployed the IaC Analyzer.
3. Navigate to the WA docs bucket
4. Look for the folder named `<unique-lens-id>`. This ID is the value at the end of the ARN for the Custom Lens you are removing (e.g., `arn:aws:wellarchitected:<aws-region>:<account-id>:lens/<unique-lens-id>`)

   > **Tip:** If you don't know the lens ID, you can retrieve it from the [Well-Architected Tool Console](https://console.aws.amazon.com/wellarchitected/home#/lenses) under **Custom lenses**.

5. Select the `<unique-lens-id>` folder and click **Delete**. Confirm the deletion.

### Step 3: Remove the Custom Lens from the SSM Parameter Store

1. Find the SSM Parameter name from the CloudFormation stack outputs:
   - Navigate to the CloudFormation stack **WA-IaC-Analyzer-{region}-GenAIStack**
   - Go to the **Outputs** tab
   - Find the value for **CustomLensesSSMParameter** (e.g., `/wa-iac-analyzer/<region>/custom-lenses`)

2. Open the [AWS Systems Manager Parameter Store Console](https://console.aws.amazon.com/systems-manager/parameters). Make sure you are in the same region you have deployed the IaC Analyzer.

3. Find and edit the parameter. Update the value by removing the JSON object corresponding to the custom lens you want to delete from the array.

   > **Important:** If you are removing the only custom lens, make sure the parameter value is set to an empty array: `[]`

### Step 4: Sync the Bedrock Knowledge Base Data Source

After deleting the files from S3, you need to sync the Bedrock Knowledge Base data source so that the removed documents are de-indexed.

1. Find the Knowledge Base ID from the CloudFormation stack outputs:
   - Navigate to the CloudFormation stack **WA-IaC-Analyzer-{region}-GenAIStack**
   - Go to the **Outputs** tab
   - Find the value for the Bedrock Knowledge Base ID

2. Sync the data source:

   **Using the AWS Console:**
   1. Open the [Amazon Bedrock Console](https://console.aws.amazon.com/bedrock). Make sure you are in the same region you have deployed the IaC Analyzer.
   2. In the left navigation, under **Build**, select **Knowledge Bases**
   3. Find and open the Knowledge Base used by the IaC Analyzer
   4. Scroll down to the **Data source** section
   5. Select the data source
   6. Click **Sync** to start the ingestion job

3. Wait for the sync to complete. You can monitor the status in the console under the data source's **Sync history** section. The status should change from **In progress** to **Completed**.

Once all four steps are complete, the Custom Lens will no longer appear in the IaC Analyzer UI and its associated knowledge will be removed from the analysis context.

</details>

---

## Troubleshooting

### Custom Lens not appearing in the UI

- Verify the SSM parameter contains valid JSON with the correct structure
- Check that the Lambda ran successfully (review CloudWatch Logs)
- Ensure the Custom Lens is **published** (not in draft) in the WA Tool
- Verify the lens ARN in the SSM parameter matches the published lens ARN

### Analysis not using custom knowledge

- Verify the PDF was uploaded to the correct S3 prefix
- Ensure a `.metadata.json` file exists alongside the PDF (check the S3 prefix for the auto-created file)
- Verify the `fileNameWithExtension` in the SSM parameter exactly matches the uploaded PDF filename
- Verify the metadata contains `"lens_author": "custom"` and the correct `lens_name`
- Check that the Bedrock Knowledge Base sync completed successfully
- Review the Bedrock Knowledge Base data source sync status for any errors

### Metadata file not created

- Ensure `fileNameWithExtension` is specified in the SSM parameter for the custom lens
- Verify the value exactly matches the PDF filename (case-sensitive, including the `.pdf` extension)
- Check CloudWatch Logs for the Lambda — you should see a log line like:
  ```
  Creating metadata for custom lens PDF: anycompany-security-policies.pdf
  ```
- If `fileNameWithExtension` is missing, the Lambda will log a warning and skip metadata creation

### Lambda failures

- Check CloudWatch Logs for the `KbLambdaSynchronizer` function
- Ensure the Lambda has permissions to read the SSM parameter
- Verify the Custom Lens ARN is correct and the lens exists in the WA Tool
- Ensure the WA Tool workload used by the Lambda can associate the custom lens

---

## Additional Resources

- [AWS Well-Architected Custom Lenses Documentation](https://docs.aws.amazon.com/wellarchitected/latest/userguide/lenses-create.html)
- [Custom Lens Format Specification](https://docs.aws.amazon.com/wellarchitected/latest/userguide/lenses-format-specification.html)
- [Custom Lens Well-Architected Hub (AWS Samples)](https://github.com/aws-samples/custom-lens-wa-hub)
- [Sample Well-Architected Custom Lens (AWS Samples)](https://github.com/aws-samples/sample-well-architected-custom-lens)