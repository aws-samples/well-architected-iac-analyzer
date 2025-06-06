
# Well-Architected IaC (Infrastructure as Code) Analyzer

![solutions_diagram](/assets/wa_genai_app_diagram.png)

## Description

Well-Architected Infrastructure as Code (IaC) Analyzer is a project that demonstrates how generative AI can be used to evaluate infrastructure code for alignment with best practices.

It features a modern web application built with React and AWS Cloudscape Design System, allowing users to upload IaC documents (e.g., AWS CloudFormation, Terraform, or AWS CDK templates), complete IaC projects (multiple files or zip archives), or architecture diagrams for assessment. The application leverages Amazon Bedrock to analyze the infrastructure against AWS Well-Architected best practices. These best practices are sourced from AWS Well-Architected whitepapers and synchronized with the Amazon Bedrock knowledge base.

This tool provides users with insights into how well their infrastructure code aligns with or deviates from established AWS best practices, offering suggestions for improving cloud architecture designs. Users can also upload supporting documents to provide additional context for more accurate analysis results. For architecture diagrams, it can even generate corresponding IaC templates following AWS best practices.

Additionally, an **interactive Analyzer Assistant chatbot** enables users to ask questions, seek clarification, and receive personalized guidance about analysis results and Well-Architected best practices.

## Features

---
- **NEW** ** Language Localization Support:
  - Select your preferred language from the Output Language in Optional Settings menu 
  - Currently supports English and Japanese
  - Language selection affects analysis results, recommendations, and detailed explanations
  - Consistent localization across all file types (CloudFormation, Terraform, CDK, PDF documents, and architecture diagrams)
---
- **NEW** ** Interactive Analyzer Assistant chatbot:
  - Ask questions about analysis results
  - Get detailed explanations of Well-Architected best practices
  - Receive personalized guidance for implementation
  - View conversation history with markdown support
  - Download or delete chat histories for each analysis
---
- **NEW** ** Multi-lens support:
  - Analyze infrastructure against specialized Well-Architected lenses
  - Support for domain-specific lenses including Serverless, IoT, SaaS, Machine Learning, and more
  - Get tailored recommendations specific to your workload type
  - Switch between different lenses for comprehensive analysis

<details>

<summary>Expand to see the list of supported AWS Official Lenses:</summary>

- **AWS Well-Architected Framework** (core framework)
- **Industry Lenses**:
  - Financial Services Industry
  - Healthcare Industry
  - Government
  - Mergers and Acquisitions
- **Technology Lenses**:
  - Generative AI
  - Serverless Applications
  - Machine Learning
  - IoT (Internet of Things)
  - SaaS (Software as a Service)
  - Data Analytics
  - Container Build
  - DevOps
  - Migration
  - Connected Mobility
  - SAP

</details>

---

- Upload and analyze Infrastructure as Code templates:
  - CloudFormation (YAML/JSON)
  - Terraform (.tf)
  - AWS CDK (in any [supported language](https://docs.aws.amazon.com/cdk/v2/guide/languages.html))
- Upload and analyze architecture diagrams:
  - PNG format
  - JPEG/JPG format
- Analyze complete IaC projects:
  - Multiple files at once
  - ZIP archives containing infrastructure code
- Upload and analyze architectural documentation in PDF format:
  - PDF documents (up to 5 files, max 4.5MB each)
  - Only flowing text will be extracted from the PDF, embedded images will not be included.
    - As of May 2025, Bedrock InvokeModel and Converse APIs does not support extracting embedded images from the PDF. This will be updated once supported.
- Add supporting documents (PDF, TXT, PNG, JPEG) to provide additional context for analysis
- Generate IaC templates from architecture diagrams
- Real-time analysis against Well-Architected best practices
- Integration with AWS Well-Architected Tool
- Export analysis results and recommendations

![wa_aic_analyzer_screenshot_main](/assets/wa_aic_analyzer_screenshot_main.png)

![wa_aic_analyzer_screenshot_results](/assets/wa_aic_analyzer_screenshot_results.png)

![wa_aic_analyzer_screenshot_details](/assets/wa_aic_analyzer_screenshot_chat.png)

![wa_aic_analyzer_screenshot_wa_tool](/assets/wa_aic_analyzer_screenshot_wa_tool.png)

![wa_aic_analyzer_screenshot_template_generation](/assets/wa_aic_analyzer_screenshot_template_generation.png)

## Installation and Deployment

You have three options for deploying this solution:
- Option 1: Using a CloudFormation Deployment Stack (Recommended)
- Option 2: Using a Deployment Script
- Option 3: Manual Deployment

### Option 1: Using a CloudFormation Deployment Stack (Recommended)

This option uses AWS CloudFormation to create a temporary deployment environment to deploy the Well-Architected IaC Analyzer solution. This approach doesn't require any tools to be installed on your local machine.

#### Prerequisites

You must enable **AWS Bedrock Model Access** to the following LLM models in your AWS region:
* **Titan Text Embeddings V2**
* **Claude 3.5 Sonnet v2** (default) or **\*NEW\* Claude 3.7 Sonnet with extended thinking**
* To enable these models, follow the instructions [here](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access-modify.html).

#### Deployment Steps

1. Download the CloudFormation template: [iac-analyzer-deployment-stack.yaml](https://github.com/aws-samples/well-architected-iac-analyzer/blob/main/cfn_deployment_stacks/iac-analyzer-deployment-stack.yaml)

2. Open the [AWS CloudFormation console](https://console.aws.amazon.com/cloudformation/home#/stacks/create?stackName=iac-analyzer-deployment-stack):
   - Make sure you are in the same AWS region where you enabled access to the LLM models

3. On the "Create stack" page:
   - Select "Upload a template file" and upload the `iac-analyzer-deployment-stack.yaml` template
   - Choose "Next"

4. On the "Specify stack details" page. Enter or change the stack name, then:
   - Change the stack parameters as needed. Check the [CloudFormation Configuration Parameters](#cloudFormation-configuration-parameters) section below for details

     - **Security Note:** By default, the stack deploys with a Public Application Load Balancer (internet-facing) without authentication enabled. It's strongly recommended to enable authentication to properly secure your internet-facing application.

     - **Model Selection Note:** The tool currently defaults to Claude 3.5 Sonnet V2. If you want to use Claude 3.7 Sonnet, you'll need to explicitly add the model ID in the stack "Amazon Bedrock Model ID" configuration parameter (e.g., for US regions: `us.anthropic.claude-3-7-sonnet-20250219-v1:0`). Please note that Claude 3.7 Sonnet is not available in all AWS regions, so verify availability in your region before deployment.

   - Choose "Next" until reaching the "Review" page and choose "Submit".

**The deployment process typically takes 15-20 minutes.**

Once complete, you'll find a new CloudFormation stack named **WA-IaC-Analyzer-{region}-GenAIStack** containing all the deployed resources for this solution. Find the application URL in the stack outputs:
   - In the CloudFormation console, navigate to the **Outputs** tab of the stack named **WA-IaC-Analyzer-{region}-GenAIStack**
   - Look for the **FrontendURL** value

#### Post-Deployment Steps

1. If you enabled authentication with a custom domain:
   - Create a DNS record (CNAME or Alias) pointing to the ALB domain name

2. If you created a new Cognito user pool:
   - Navigate to the Amazon Cognito console
   - Find the user pool created by the stack (named "WAAnalyzerUserPool")
   - Add users who should have access to the application

3. Access your deployed application using the URL from the CloudFormation outputs (or your CNAME or Alias pointing to the ALB)

#### Troubleshooting

If you encounter issues during deployment, you can check the deployment logs in CloudWatch:

- Log Group: `iac-deployment-logs-<region>-<unique-id>`
  - This log group contains all deployment steps and actions
  - Log Stream `{instance_id}-user-data`: Contains deployment instance initialization and setup logs
  - Log Stream `{instance_id}-deploy`: Contains the complete Well-Architected IaC Analyzer deployment logs

You can also find a direct link to these logs in the Outputs tab of your CloudFormation deployment stack.

### Option 2: Using a Deployment Script

<details>

<summary>Expand this section for instructions using the deployment script:</summary>

#### Prerequisites

You must enable **AWS Bedrock Model Access** to the following LLM models in your AWS region:
* **Titan Text Embeddings V2**
* **Claude 3.5 Sonnet v2** (default) or **\*NEW\* Claude 3.7 Sonnet with extended thinking**
* To enable these models, follow the instructions [here](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access-modify.html).

Apart from enabling access to the model listed above, the following tools must be installed on your local machine:

* [Node.js](https://nodejs.org/en/download) (v18 or later) and npm
* [Python](https://www.python.org/downloads/) (v3.11 or later) and pip
* [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)
* Either one of these container tools:
  * [Finch](https://github.com/runfinch/finch?tab=readme-ov-file#installing-finch)
  * [Docker](https://docs.docker.com/get-started/get-docker/)
* [AWS CLI](https://docs.aws.amazon.com/cli/v1/userguide/cli-chap-install.html) configured with [appropriate credentials](https://docs.aws.amazon.com/cli/v1/userguide/cli-chap-configure.html)

> **Note:** If you would like to change the default Load Balancer scheme, AI model or authentication options, check the [Configuration Options For Manual Deployments section](#configuration-options-for-manual-deployments) first before deploying.

1. Clone the Repository
```bash
git clone https://github.com/aws-samples/well-architected-iac-analyzer.git
cd well-architected-iac-analyzer
```

2. Make the deployment script executable:
```bash
chmod +x deploy-wa-analyzer.sh
```

3. Deploy with required parameters:
```bash
# Deploy using Docker
./deploy-wa-analyzer.sh -r us-west-2 -c docker

# Or deploy using Finch
./deploy-wa-analyzer.sh -r us-west-2 -c finch
```

The script will automatically:
- Check for prerequisites
- Set up the Python virtual environment
- Install all dependencies
- Deploy the CDK stack
- Provide post-deployment information

After successful deployment, you can find the Application Load Balancer (ALB) DNS name in:
1. The outputs of the `deploy-wa-analyzer.sh` script
2. The outputs section of the CloudFormation stack named `WA-IaC-Analyzer-{region}-GenAIStack` in the AWS Console

</details>

### Option 3: Manual Deployment

<details>

<summary>If you prefer to manually deploy step by step, expand this section for more instructions:</summary>

#### Prerequisites

You must enable **AWS Bedrock Model Access** to the following LLM models in your AWS region:
* **Titan Text Embeddings V2**
* **Claude 3.5 Sonnet v2** (default) or **\*NEW\* Claude 3.7 Sonnet with extended thinking**
* To enable these models, follow the instructions [here](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access-modify.html).

Apart from enabling access to the model listed above, the following tools must be installed on your local machine:

* [Node.js](https://nodejs.org/en/download) (v18 or later) and npm
* [Python](https://www.python.org/downloads/) (v3.11 or later) and pip
* [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)
* Either one of these container tools:
  * [Finch](https://github.com/runfinch/finch?tab=readme-ov-file#installing-finch)
  * [Docker](https://docs.docker.com/get-started/get-docker/)
* [AWS CLI](https://docs.aws.amazon.com/cli/v1/userguide/cli-chap-install.html) configured with [appropriate credentials](https://docs.aws.amazon.com/cli/v1/userguide/cli-chap-configure.html)

> **Note:** If you would like to change the default Load Balancer scheme, AI model or authentication options, check the [Configuration Options For Manual Deployments section](#configuration-options-for-manual-deployments) first before deploying.

1. Clone the Repository
```bash
git clone https://github.com/aws-samples/well-architected-iac-analyzer.git
cd well-architected-iac-analyzer
```

2. Set Up Python Virtual Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Linux/macOS:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Verify you're in the virtual environment
# You should see (.venv) at the beginning of your prompt
```

3. Install Dependencies

Install Python dependencies:
```bash
pip3 install -r requirements.txt
```

Install CDK dependencies:
```bash
npm install
```

Install Frontend dependencies:
```bash
cd ecs_fargate_app/frontend
npm install
cd ../..
```

Install Backend dependencies:
```bash
cd ecs_fargate_app/backend
npm install
cd ../..
```

4. Deploy the Stack

Set the AWS region and ignore ECR credentials storage during CDK deployment:
```bash
export CDK_DEPLOY_REGION=us-west-2
export AWS_ECR_IGNORE_CREDS_STORAGE=true
```

Set the container runtime:
```bash
export CDK_DOCKER=finch  # For Finch

# OR

export CDK_DOCKER=docker # For Docker
```

Bootstrap CDK (if not already done):
```bash
cdk bootstrap
```

Deploy the stack:
```bash
cdk deploy
```

After successful deployment, you can find the Application Load Balancer (ALB) DNS name in:
1. The outputs of the `cdk deploy` command
2. The outputs section of the CloudFormation stack named `WA-IaC-Analyzer-{region}-GenAIStack` in the AWS Console

</details>

## CloudFormation Configuration Parameters

<details>

<summary>The deployment stack template provides a comprehensive set of configuration options organized into parameter groups. Expand this to see more details:</summary>

### Global Settings

- **Deploy with internet-facing Application Load Balancer?** (`PublicLoadBalancer`)
  - `True` (Default): Deploys an internet-facing load balancer accessible from the internet
  - `False`: Deploys an internal load balancer accessible only within your VPC network
  - **Access considerations for internal load balancers**: To access an internal load balancer, you'll need network connectivity to the deployed VPC via:
    * VPC peering
    * VPN connection
    * AWS Direct Connect
    * Other network connectivity solutions
  - ⚠️ **Security Warning**: If you select `True` with authentication disabled, your application will be publicly accessible without authentication. For public-facing deployments, we strongly recommend enabling authentication.

- **Amazon Bedrock Model ID** (`ModelId`)
  - Default: `anthropic.claude-3-5-sonnet-20241022-v2:0` (Claude 3.5 Sonnet v2)
  - You can specify an alternative [Bedrock model ID](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html#model-ids-arns) if needed
  - **Note**: This application has been primarily tested with Claude 3.5 Sonnet v2 and Claude 3.7 Sonnet. While other Bedrock models may work, using different models might lead to unexpected results.

### Authentication Settings

- **Enable Authentication** (`Authentication`)
  - `False` (Default): No authentication required to access the application
  - `True`: Enables authentication via the selected method

- **Authentication Method** (`AuthType`)
  - `none` (Default): No authentication
  - `new-cognito`: Creates a new Amazon Cognito user pool
  - `existing-cognito`: Uses an existing Amazon Cognito user pool
  - `oidc`: Uses an OpenID Connect provider (Auth0, Okta, etc.)

- **SSL Certificate ARN** (`CertificateArn`)
  - Required when `Authentication` is set to `True`
  - Format: `arn:aws:acm:region:account:certificate/certificate-id`
  - **Important**: Before enabling authentication, you must have a valid AWS Certificate Manager (ACM) certificate covering the DNS domain name that you plan to use for accessing the application

### Authentication-Specific Settings

#### New Cognito User Pool Settings
These parameters are required when `AuthType` is set to `new-cognito`:

- **Cognito Domain Prefix** (`CognitoDomainPrefix`)
  - A unique prefix for your Cognito domain (e.g., `wa-analyzer`)
  - The resulting domain will be: `your-prefix.auth.region.amazoncognito.com`

- **Allowed Callback URLs** (`CallbackUrls`)
  - Comma-separated list of URLs where users will be redirected after signing in
  - Must include the URL you'll use to access the application, followed by `/oauth2/idpresponse`
  - Example: `https://wa-analyzer.example.com/oauth2/idpresponse`

- **Logout Redirect URL** (`LogoutUrl`)
  - URL where users will be redirected after signing out
  - Example: `https://wa-analyzer.example.com`

#### Existing Cognito User Pool Settings
These parameters are required when `AuthType` is set to `existing-cognito`:

- **Existing Cognito User Pool ARN** (`ExistingUserPoolArn`)
  - ARN of your existing Cognito user pool
  - Format: `arn:aws:cognito-idp:region:account:userpool/pool-id`

- **Existing Cognito Client ID** (`ExistingUserPoolClientId`)
  - The client ID from your existing Cognito user pool

- **Existing Cognito Domain** (`ExistingUserPoolDomain`)
  - The domain of your existing Cognito user pool
  - Can be a Cognito prefix domain: `your-prefix.auth.region.amazoncognito.com`
  - Or a custom domain: `auth.your-domain.com`

- **Existing Cognito Logout URL** (`ExistingCognitoLogoutUrl`)
  - The URL users are redirected to after signing out
  - Example: `https://wa-analyzer.example.com`

#### OpenID Connect (OIDC) Settings
These parameters are required when `AuthType` is set to `oidc`:

- **OIDC Issuer URL** (`OidcIssuer`)
  - The issuer URL for your OIDC provider
  - Example for Auth0: `https://your-tenant.us.auth0.com/authorize`

- **OIDC Client ID** (`OidcClientId`)
  - The client ID from your OIDC provider

- **OIDC Authorization Endpoint URL** (`OidcAuthorizationEndpoint`)
  - The authorization endpoint of your OIDC provider
  - Example for Auth0: `https://your-tenant.us.auth0.com/authorize`

- **OIDC Token Endpoint URL** (`OidcTokenEndpoint`)
  - The token endpoint of your OIDC provider
  - Example for Auth0: `https://your-tenant.us.auth0.com/oauth/token`

- **OIDC User Info Endpoint URL** (`OidcUserInfoEndpoint`)
  - The user info endpoint of your OIDC provider
  - Example for Auth0: `https://your-tenant.us.auth0.com/userinfo`

- **OIDC Logout URL** (`OidcLogoutUrl`)
  - The URL for logging out users
  - Example for Auth0: `https://your-tenant.us.auth0.com/v2/logout?client_id=your-client-id&returnTo=https://wa-analyzer.example.com`

> **Important OIDC Note**: Before deploying with OIDC authentication, you must create a secret in AWS Secrets Manager named `WAIaCAnalyzerOIDCSecret` containing your OIDC client secret in the same region where you'll deploy the stack:
> ```bash
> # Using AWS CLI
> aws secretsmanager create-secret \
>   --name WAIaCAnalyzerOIDCSecret \
>   --secret-string "your-oidc-client-secret" \
>   --region <aws-region>
> ```

</details>

## Configuration Options For Manual Deployments

<details>

<summary>If you are following either the Option 2 or 3 for deploying the solution, configuration parameters are managed from the `config.ini` file. Expand this section to learn more:</summary>

### Model Selection

If you want to use a different model than "Claude 3.5 Sonnet v2", update the config.ini with the correct [model ID](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html#model-ids-arns):
```ini
[settings]
model_id = anthropic.claude-3-5-sonnet-20241022-v2:0
```

> **Note:** This application has been primarily tested with "Claude 3.5 Sonnet v2". While other Bedrock models may work, using different models might lead to unexpected results. The default model ID is set to `anthropic.claude-3-5-sonnet-20241022-v2:0`.

### Load Balancer Scheme Selection

By default, this project will deploy the Load Balancer scheme as [**internet-facing**](https://docs.aws.amazon.com./elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html#load-balancer-scheme) **(Public load balancer)**, making it accessible from the internet.

If you need to change the load balancer scheme to [**internal**](https://docs.aws.amazon.com./elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html#load-balancer-scheme), you can modify the `public_load_balancer` parameter in the config.ini file:
```ini
[settings]
public_load_balancer = False
```

To access an internal load balancer, you will need to be in the private network connected to the deployed VPC, either via:
* VPC peering
* VPN
* AWS Direct Connect
* Other network connectivity solutions

⚠️ **Security Warning**: Since the load balancer is **internet-facing** by default, it's strongly recommended to enable the Authentication Options as per below. Otherwise, the application and all its functionalities will be accessible directly through the Internet without authentication. Proceed with caution and understand the security implications.

### Authentication Options

> **Note:** Before enabling authentication, make sure you have a valid AWS Certificate Manager (ACM) certificate covering the DNS domain name (CNAME or Alias) that you plan to use to point to this application's ALB.
>
> **For Example:**
> * If you own the domain `*.example.com`
> * And you plan to access the application via `wa-analyzer.example.com` (with a CNAME or Alias pointing to the ALB deployed by this stack)
> * You must first [create or import a certificate in ACM](https://docs.aws.amazon.com/acm/latest/userguide/gs.html) that covers either:
>   * `*.example.com`, or
>   * `wa-analyzer.example.com`
> * Then, you can add the certificate's ARN in the `certificate_arn` parameter below when deploying the stack

The application can be deployed with different authentication configurations managed via the config.ini file.

**A. Default Deployment (No Authentication)**
- HTTP listener only
- Can be deployed as public or private ALB
- Example settings in config.ini:
  ```ini
  authentication = False
  auth_type = none
  ```

**B. New Cognito User Pool**
- HTTPS listener with AWS Cognito authentication
- Creates a new Cognito user pool
- Self-signup disabled by default
- Example settings in config.ini:
  ```ini
  # In below example, "wa-analyzer.example.com" is the DNS alias that you would create pointing to the ALB deployed by this CDK stack
  authentication = True
  auth_type = new-cognito
  certificate_arn = arn:aws:acm:region:account:certificate/certificate-id
  cognito_domain_prefix = your-domain-prefix
  allback_urls = https://wa-analyzer.example.com/oauth2/idpresponse
  logout_url = https://wa-analyzer.example.com
  ```

**C. Existing Cognito User Pool**
- HTTPS listener with existing AWS Cognito authentication
- Uses an existing Cognito user pool
- Example settings in config.ini:
  ```ini
  # In below example, "wa-analyzer.example.com" is the DNS alias that you would create pointing to the ALB deployed by this CDK stack
  authentication = True
  auth_type = existing-cognito
  certificate_arn = arn:aws:acm:region:account:certificate/certificate-id
  existing_user_pool_arn = arn:aws:cognito-idp:<aws-region>:<aws-account-id>:userpool/<user-pool-id>
  existing_user_pool_client_id = <user-pool-client-id>
  existing_user_pool_domain = <your-existing-cognito-domain-prefix>.auth.<aws-region>.amazoncognito.com # Example using Cognito prefix domain: https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-assign-domain-prefix.html
  # Or; existing_user_pool_domain = wa-analyzer-auth.example.com # Example of custom domain (e.g. wa-analyzer-auth.example.com): https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-add-custom-domain.html)
  existing_cognito_logout_url = https://wa-analyzer.example.com
  ```

**D. OpenID Connect (OIDC)**
- HTTPS listener with OIDC authentication
- Compatible with any OIDC-compliant identity provider

If you plan to use OIDC authentication (`auth_type = oidc`), follow these steps:

1. **Before deployment**, create a secret in AWS Secrets Manager named `WAIaCAnalyzerOIDCSecret` containing your OIDC client secret **before** deploying the stack. The secret must be created in the same AWS region where you plan to deploy the stack:
   ```bash
   # Using AWS CLI
   aws secretsmanager create-secret \
     --name WAIaCAnalyzerOIDCSecret \
     --secret-string "your-oidc-client-secret" \
     --region <aws-region>

   # Or you can create it via the AWS Console:
   # 1. Go to AWS Secrets Manager console
   # 2. Choose "Store a new secret"
   # 3. Choose "Other type of secret"
   # 4. Enter your OIDC client secret as a plaintext value
   # 5. Set the secret name exactly as: WAIaCAnalyzerOIDCSecret
   # 6. Do not add any automatic rotation
   # 7. Complete the secret creation
   ```

2. Configure OIDC settings in config.ini:
   ```ini
   # Below is an example when using Okta as your OIDC IdP, refer to the config.ini file for more examples. 
   # In below example, "wa-analyzer.example.com" is the DNS alias that you would create pointing to the ALB deployed by this CDK stack
   authentication = True
   auth_type = oidc
   certificate_arn = arn:aws:acm:region:account:certificate/certificate-id
   oidc_issuer = https://<okta-tenant-id>.us.auth0.com/authorize
   oidc_client_id = <okta-client-id>
   oidc_authorization_endpoint = https://<okta-tenant-id>.us.auth0.com/authorize
   oidc_token_endpoint = https://<okta-tenant-id>.us.auth0.com/oauth/token
   oidc_user_info_endpoint = https://<okta-tenant-id>.us.auth0.com/userinfo
   oidc_logout_url = https://<okta-tenant-id>.us.auth0.com/v2/logout?client_id=<oidc-client-id>&returnTo=https://wa-analyzer.example.com (# Refer to https://auth0.com/docs/authenticate/login/logout)
   ```

</details>

## Clean up

You have two options to remove all resources created by this solution:

### Option 1 - Using AWS Console (Recommended)

1. Open the CloudFormation console
2. Find and delete the stack named `WA-IaC-Analyzer-{region}-GenAIStack`

### Option 2 - Using the Destroy Script

<details>

<summary>Only use this clean up option if you followed either Option 2 or 3 when deploying the solution. Expand for more details:</summary>:

1. Make the destroy script executable:
```bash
chmod +x destroy-wa-analyzer.sh
```

2. Run the script with required parameters. Make sure to use the same region where you deployed the stack:
```bash
# Clean up using Docker
./destroy-wa-analyzer.sh -r us-west-2 -c docker

# Or clean up using Finch
./destroy-wa-analyzer.sh -r us-west-2 -c finch
```

The script will automatically:
- Verify prerequisites
- Set up the necessary environment
- Destroy all resources in the stack

</details>

# Local Development

For development purposes, you can run the application locally using either Finch or Docker containers. This allows you to make changes to the code and see them reflected immediately without having to deploy code changes into your AWS stack.

### Prerequisites for Local Development

In addition to the main prerequisites, ensure you have:
* Either Finch or Docker installed and running
* AWS credentials configured with access to required services
* Access to Amazon Bedrock service and the required models (as described in the main Prerequisites section)

### Setting up Required AWS Resources

> **Note for Existing Stack Users**: If you have already deployed this CDK stack in your AWS account, you can skip the manual resource creation steps below. Instead:
> 1. Go to the CloudFormation console and find your stack (it starts with "WA-IaC-Analyzer-")
> 2. In the "Outputs" tab of the CDK CloudFormation stack, find:
>    - `KnowledgeBaseID`: Use this value for KNOWLEDGE_BASE_ID in your .env file (for "Setting up Local Development Environment" section below)
>    - `WellArchitectedDocsS3Bucket`: Use this value for WA_DOCS_S3_BUCKET in your .env file (for "Setting up Local Development Environment" section below)
>    - `LensMetadataTableName`: Use this value for LENS_METADATA_TABLE in your .env file (for "Setting up Local Development Environment" section below)
>    - `AnalysisStorageBucketName`: Use this value for ANALYSIS_STORAGE_BUCKET in your .env file (for "Setting up Local Development Environment" section below)
>    - `AnalysisMetadataTableName`: Use this value for ANALYSIS_METADATA_TABLE in your .env file (for "Setting up Local Development Environment" section below)
> 
> If you haven't deployed the stack yet, follow the steps below:

To simplify setup for development, you can deploy just the required Knowledge Base and Storage layer components:

1. Navigate to the local development directory:
   ```bash
   cd local_development
   ```

2. Set Up Python Virtual Environment
   ```bash
   # Create virtual environment
   python -m venv .venv

   # Activate virtual environment
   # On Linux/macOS:
   source .venv/bin/activate
   # On Windows:
   .venv\Scripts\activate

   # Verify you're in the virtual environment
   # You should see (.venv) at the beginning of your prompt
   ```

3. Install the required dependencies:
   ```bash
   pip3 install -r requirements.txt
   ```

4. Deploy the KB storage stack:
   ```bash
   # Set your preferred AWS region
   export CDK_DEPLOY_REGION=us-west-2 # Or your preferred region where you have enabled the LLM models
   export CDK_DOCKER=finch # Or docker 
   
   # Bootstrap CDK (if you haven't done this before)
   cdk bootstrap
   
   # Deploy the dev stack (which only deploys Bedrock KB and storage layer resources)
   cdk deploy --require-approval never
   ```

5. After deployment completes, note the outputs from the CloudFormation stack:
   - `KnowledgeBaseID`: Use for KNOWLEDGE_BASE_ID in your .env file in the following section.
   - `WellArchitectedDocsS3Bucket`: Use for WA_DOCS_S3_BUCKET in your .env file in the following section.
   - `LensMetadataTableName`: Use for LENS_METADATA_TABLE in your .env file in the following section.
   - `AnalysisStorageBucketName`: Use for ANALYSIS_STORAGE_BUCKET in your .env file in the following section.
   - `AnalysisMetadataTableName`: Use for ANALYSIS_METADATA_TABLE in your .env file in the following section.

### Setting up Local Development Environment

1. Create a `.env` file in the root directory with the following variables:
```ini
# AWS Authentication
AWS_REGION=your-aws-region-key
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_SESSION_TOKEN=your-session-token

# Well-Architected Framework Resources
WA_DOCS_S3_BUCKET=your-knowledgebase-source-bucket-name
LENS_METADATA_TABLE=your-lens-metadata-table-name
KNOWLEDGE_BASE_ID=your-kb-id
MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# Storage Configuration
STORAGE_ENABLED=true
ANALYSIS_STORAGE_BUCKET=your-analysis-storage-bucket-name
ANALYSIS_METADATA_TABLE=your-analysis-metadata-table-name
```

> **Security Note**: It is encouraged the use of temporary credentials (including AWS_SESSION_TOKEN) when running the application locally. More details in [Temporary security credentials in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html). Temporary credentials have a limited lifetime and automatically expire, providing an additional layer of security.

2. Make the development script executable:
```bash
# Make sure you are in the root directory of this project
chmod +x dev.sh
```

3. Start the development environment using either Docker or Finch:
```bash
# Using Docker
./dev.sh -c docker -up

# Or using Finch
./dev.sh -c finch -up
```

This will:
- Build and start the frontend container (available at http://localhost:8080)
- Build and start the backend container (available at http://localhost:3000)
- Enable hot reloading for both frontend and backend changes
- Mount source code directories as volumes for immediate updates

4. To stop the development environment:
```bash
# Using Docker
./dev.sh -c docker -down

# Or using Finch
./dev.sh -c finch -down
```

### Development Commands Reference

```bash
# Start development environment
./dev.sh -c <container_tool> -up

# Stop development environment
./dev.sh -c <container_tool> -down

# Show help and usage information
./dev.sh -h
```

Where `<container_tool>` is either `docker` or `finch`.

### Switching Between Development and Production

- Local development uses `finch-compose.dev.yaml` for container configuration
- Production deployment continues to use CDK as described in the Installation and Deployment section

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
