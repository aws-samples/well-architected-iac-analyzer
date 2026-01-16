#!/usr/bin/env python3
import os

import aws_cdk as cdk
from cdk_nag import AwsSolutionsChecks, NagPackSuppression, NagSuppressions

from ecs_fargate_app.wa_genai_stack import WAGenAIStack

app = cdk.App()

# Try to get the region from an environment variable
REGION = os.environ.get("CDK_DEPLOY_REGION")

# If REGION is still None, it will use the default region when deployed
env = cdk.Environment(region=REGION) if REGION else None

APP_PREFIX = f"WA-IaC-Analyzer-{REGION or 'default'}"

# Create the front-end Stack
wa_genai_stack = WAGenAIStack(
    app,
    f"{APP_PREFIX}-GenAIStack",
    env=env,
)

# cdk nag suppressions
nagsuppression_checks = [
    {
        "rule": "AwsSolutions-L1",
        "reason": "The Lambda function behind the CDK BucketDeployment construct uses the latest CDK supported runtime version https://github.com/aws/aws-cdk/blob/main/packages/@aws-cdk/custom-resource-handlers/lib/custom-resources-framework/utils/framework-utils.ts",
    },
    {
        "rule": "AwsSolutions-IAM4",
        "reason": "CDK uses AWS managed policies by design for some constructs (e.g. BucketDeployment) and other CDK staging assets",
    },
    {
        "rule": "AwsSolutions-IAM5",
        "reason": "CDK uses AWS managed policies by design for some constructs (e.g. BucketDeployment) and other CDK staging assets. Some of these AWS managed policies contain wildcards in its statements.",
    },
    {
        "rule": "AwsSolutions-S1",
        "reason": "This is a sample solution. S3 server access logging is disabled to minimize costs. Enable in production for audit purposes.",
    },
    {
        "rule": "AwsSolutions-VPC7",
        "reason": "This is a sample solution. VPC Flow Logs are disabled to minimize costs. Enable in production for network monitoring.",
    },
    {
        "rule": "AwsSolutions-ELB2",
        "reason": "This is a sample solution. ELB access logs are disabled to minimize costs. Enable in production for troubleshooting.",
    },
    {
        "rule": "AwsSolutions-EC23",
        "reason": "The ALB security group allows inbound traffic from 0.0.0.0/0 as this is a web application load balancer. The ALB is configured by default to use Cognito or OIDC authentication to protect access to the application. Deploying without authentication is strongly discouraged and should only be used for testing in isolated environments. Backend services are additionally protected in private subnets with restricted security group rules.",
    },
    {
        "rule": "AwsSolutions-ECS2",
        "reason": "This is a sample solution. Environment variables contain non-sensitive configuration. Use Secrets Manager in production for sensitive values.",
    },
    {
        "rule": "AwsSolutions-COG3",
        "reason": "This is a sample solution. AdvancedSecurityMode is not enabled to minimize costs for users evaluating this sample, as it incurs additional charges (Cognito Plus subscription). In production, enable AdvancedSecurityMode set to ENFORCED to detect and act upon malicious sign-in attempts.",
    },
    {
        "rule": "AwsSolutions-COG2",
        "reason": "This is a sample solution. MFA is not enforced to simplify the setup process for users evaluating this sample. In production environments, MFA should be enabled to provide an additional layer of security beyond username and password authentication.",
    },
]

for checks in nagsuppression_checks:
    NagSuppressions.add_stack_suppressions(
        wa_genai_stack, [NagPackSuppression(id=checks["rule"], reason=checks["reason"])]
    )

cdk.Aspects.of(app).add(AwsSolutionsChecks(verbose=True))

app.synth()
