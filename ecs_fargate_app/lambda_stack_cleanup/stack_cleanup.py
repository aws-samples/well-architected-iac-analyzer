import logging
import os

import boto3
from botocore.exceptions import ClientError

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    """
    Lambda function to handle deployment stack deletion events from EventBridge
    """
    logger.info(f"Received event: {event}")

    # Extract details from the event
    try:
        detail = event.get("detail", {})
        stack_name = detail.get("stack-name")

        if not stack_name:
            logger.error("No stack name provided in the event")
            return {"statusCode": 400, "body": "No stack name provided in the event"}

        # Get allowed stack name from environment variable
        allowed_stack_names = os.environ.get("DEPLOYMENT_STACK_NAME", "")

        logger.info(f"Allowed stack names: {allowed_stack_names}")

        # Validate stack name against allowed names
        if stack_name not in allowed_stack_names:
            logger.error(f"Stack name {stack_name} is not allowed for deletion")
            return {
                "statusCode": 400,
                "body": f"Stack name {stack_name} is not allowed for deletion. Allowed: {allowed_stack_names}",
            }

        # Initialize CloudFormation client
        cfn_client = boto3.client("cloudformation")

        # Delete the stack
        logger.info(f"Deleting stack: {stack_name}")
        cfn_client.delete_stack(StackName=stack_name)

        return {
            "statusCode": 200,
            "body": f"Successfully initiated deletion of stack {stack_name}",
        }

    except ClientError as e:
        logger.error(f"Error deleting stack: {str(e)}")
        return {"statusCode": 500, "body": f"Error deleting stack: {str(e)}"}
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {"statusCode": 500, "body": f"Unexpected error: {str(e)}"}
