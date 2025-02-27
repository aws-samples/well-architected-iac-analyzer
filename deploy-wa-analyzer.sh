#!/bin/bash

# 1. Make the script executable:
# ```bash
# chmod +x deploy-wa-analyzer.sh
# ```

# 2. Deploy with required parameters:
# ```bash
# ./deploy-wa-analyzer.sh -r us-west-2 -c docker
# ```

# 3. Show help:
# ```bash
# ./deploy-wa-analyzer.sh -h
# ```

# Exit on error
set -e

# Set environment variable to ignore ECR credentials storage
export AWS_ECR_IGNORE_CREDS_STORAGE=true

# Print script usage
print_usage() {
    echo "Usage: ./deploy-wa-analyzer.sh -r region -c container_tool [-a stack_name]"
    echo ""
    echo "Required Options:"
    echo "  -r    AWS Region"
    echo "  -c    Container tool (finch or docker)"
    echo ""
    echo "Additional Options:"
    echo "  -a    Enable auto-cleanup and specify deployment stack name to clean up"
    echo "  -h    Show this help message"
    echo ""
    echo "Example:"
    echo "  ./deploy-wa-analyzer.sh -r us-east-1 -c docker"
    echo "  ./deploy-wa-analyzer.sh -r us-east-1 -c docker -a iac-analyzer-deployment-stack-no-auth"
}

# Parse command line arguments
while getopts "r:c:a:h" flag; do
    case "${flag}" in
        r) REGION=${OPTARG};;
        c) CONTAINER_TOOL=${OPTARG};;
        a) AUTO_CLEANUP=true
           DEPLOYMENT_STACK_NAME=${OPTARG};;
        h) print_usage
           exit 0;;
        *) print_usage
           exit 1;;
    esac
done

# Validate region is provided
if [ -z "$REGION" ]; then
    echo "❌ Error: Region (-r) is required"
    print_usage
    exit 1
fi

# Validate container tool is provided
if [ -z "$CONTAINER_TOOL" ]; then
    echo "❌ Error: Container tool (-c) is required. Must be either 'finch' or 'docker'"
    print_usage
    exit 1
fi

# Validate container tool value
if [[ "$CONTAINER_TOOL" != "finch" && "$CONTAINER_TOOL" != "docker" ]]; then
    echo "❌ Invalid container tool. Must be either 'finch' or 'docker'"
    print_usage
    exit 1
fi

# Validate stack name if auto-cleanup is enabled
if [ "$AUTO_CLEANUP" = true ] && [ -z "$DEPLOYMENT_STACK_NAME" ]; then
    echo "❌ Error: When using -a flag, you must provide a deployment stack name"
    print_usage
    exit 1
fi

# Set AWS region for deployment
export CDK_DEPLOY_REGION=$REGION

# Set AUTO_CLEANUP and DEPLOYMENT_STACK_NAME environment variables for CDK
if [ "$AUTO_CLEANUP" = true ]; then
    echo "✅ Auto-cleanup of deployment stack enabled for stack: $DEPLOYMENT_STACK_NAME"
    export AUTO_CLEANUP=true
    export DEPLOYMENT_STACK_NAME="$DEPLOYMENT_STACK_NAME"
else
    export AUTO_CLEANUP=false
    export DEPLOYMENT_STACK_NAME=""
fi

# Function to check Docker daemon
check_docker_daemon() {
    echo "Checking Docker setup..."
    
    # First check if Docker client exists
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "Please install Docker Desktop for Mac from https://www.docker.com/products/docker-desktop"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "Please install Docker using your distribution's package manager"
            echo "For Ubuntu/Debian: sudo apt-get install docker.io"
            echo "For RHEL/CentOS: sudo yum install docker"
        else
            echo "Please install Docker and try again"
        fi
        exit 1
    fi

    # Try to get Docker server version and capture the output and exit status
    local server_version
    local exit_status
    
    server_version=$(docker info --format '{{.ServerVersion}}' 2>&1)
    exit_status=$?

    # Check if the command was successful and if the output doesn't contain error messages
    if [ $exit_status -ne 0 ] || [[ $server_version == *"Cannot connect"* ]] || [[ $server_version == *"error"* ]] || [[ $server_version == *"command not found"* ]]; then
        echo "❌ Docker daemon is not running"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "Please start Docker Desktop for Mac and try again"
            echo "You can start it from the Applications folder or menu bar icon"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "Please start Docker daemon (dockerd) and try again"
            echo "You can start it with: sudo systemctl start docker"
        else
            echo "Please start Docker daemon and try again"
        fi
        echo "Error details: $server_version"
        exit 1
    fi
    
    echo "✅ Docker daemon is running (Server Version: $server_version)"
}

# Function to check Finch VM status
check_finch_vm() {
    echo "Checking Finch setup..."
    local max_attempts=30  # Maximum number of attempts (30 * 2 seconds = 60 seconds timeout)
    local attempt=1

    if ! finch vm status &> /dev/null; then
        echo "Initializing Finch VM..."
        finch vm init
        echo "Starting Finch VM..."
        finch vm start
    elif ! finch vm status | grep -q "Running"; then
        echo "Starting Finch VM..."
        finch vm start
    fi

    echo "Waiting for Finch VM to be ready..."
    while ! finch vm status | grep -q "Running"; do
        if [ $attempt -ge $max_attempts ]; then
            echo "❌ Timeout waiting for Finch VM to start"
            exit 1
        fi
        echo "Still waiting for Finch VM to be ready... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    echo "✅ Finch VM is running"
}

# Function to check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Define base required commands
    local base_commands=("node" "npm" "aws" "cdk" "python3" "pip3")
    local required_commands=("${base_commands[@]}")
    
    # Add container-specific command
    required_commands+=("$CONTAINER_TOOL")
    
    local missing_commands=()
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            missing_commands+=($cmd)
            echo "❌ $cmd is required but not installed"
        else
            echo "✅ $cmd is installed"
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "❌ AWS credentials not configured"
        exit 1
    else
        echo "✅ AWS credentials configured"
    fi
    
    # Check container runtime
    if [ "$CONTAINER_TOOL" = "docker" ]; then
        check_docker_daemon
    else
        check_finch_vm
    fi
    
    # Exit if any commands are missing
    if [ ${#missing_commands[@]} -ne 0 ]; then
        echo -e "\n❌ Please install missing prerequisites: ${missing_commands[*]}"
        exit 1
    fi
    
    echo "✅ All prerequisites met"
}

check_auth_config() {
    echo "📋 Checking authentication configs..."

    if [ -f config.ini ]; then
        # Read authentication setting
        AUTH_ENABLED=$(awk -F "=" '/^authentication/ {gsub(/ /,"",$2); print $2}' config.ini)
        
        if [ "$AUTH_ENABLED" = "True" ]; then
            # Read auth type
            AUTH_TYPE=$(awk -F "=" '/^auth_type/ {gsub(/ /,"",$2); print $2}' config.ini)
            CERT_ARN=$(awk -F "=" '/^certificate_arn/ {gsub(/ /,"",$2); print $2}' config.ini)
            
            # Validate certificate ARN
            if [ -z "$CERT_ARN" ]; then
                echo "❌ Error: certificate_arn is required when authentication is enabled"
                exit 1
            fi
            
            # Validate auth type specific configuration
            case "$AUTH_TYPE" in
                "new-cognito")
                    DOMAIN_PREFIX=$(awk -F "=" '/^cognito_domain_prefix/ {gsub(/ /,"",$2); print $2}' config.ini)
                    CALLBACK_URLS=$(awk -F "=" '/^callback_urls/ {gsub(/ /,"",$2); print $2}' config.ini)
                    LOGOUT_URL=$(awk -F "=" '/^logout_url/ {gsub(/ /,"",$2); print $2}' config.ini)
                    if [ -z "$DOMAIN_PREFIX" ]; then
                        echo "❌ Error: cognito_domain_prefix is required for new-cognito auth type"
                        exit 1
                    fi
                    if [ -z "$CALLBACK_URLS" ]; then
                        echo "❌ Error: callback_urls is required for new-cognito auth type"
                        exit 1
                    fi
                    if [ -z "$LOGOUT_URL" ]; then
                        echo "❌ Error: logout_url is required for new-cognito auth type"
                        exit 1
                    fi
                    ;;
                "existing-cognito")
                    USER_POOL_ARN=$(awk -F "=" '/^existing_user_pool_arn/ {gsub(/ /,"",$2); print $2}' config.ini)
                    CLIENT_ID=$(awk -F "=" '/^existing_user_pool_client_id/ {gsub(/ /,"",$2); print $2}' config.ini)
                    DOMAIN=$(awk -F "=" '/^existing_user_pool_domain/ {gsub(/ /,"",$2); print $2}' config.ini)
                    LOGOUT_URL=$(awk -F "=" '/^existing_cognito_logout_url/ {gsub(/ /,"",$2); print $2}' config.ini)
                    if [ -z "$USER_POOL_ARN" ]; then
                        echo "❌ Error: existing_user_pool_arn is required for existing-cognito auth type"
                        exit 1
                    fi
                    if [ -z "$CLIENT_ID" ]; then
                        echo "❌ Error: existing_user_pool_client_id is required for existing-cognito auth type"
                        exit 1
                    fi
                    if [ -z "$DOMAIN" ]; then
                        echo "❌ Error: existing_user_pool_domain is required for existing-cognito auth type"
                        exit 1
                    fi
                    if [ -z "$LOGOUT_URL" ]; then
                        echo "❌ Error: existing_cognito_logout_url is required for existing-cognito auth type"
                        exit 1
                    fi
                    ;;
                "oidc")
                    OIDC_ISSUER=$(awk -F "=" '/^oidc_issuer/ {gsub(/ /,"",$2); print $2}' config.ini)
                    OIDC_CLIENT_ID=$(awk -F "=" '/^oidc_client_id/ {gsub(/ /,"",$2); print $2}' config.ini)
                    OIDC_AUTH_ENDPOINT=$(awk -F "=" '/^oidc_authorization_endpoint/ {gsub(/ /,"",$2); print $2}' config.ini)
                    OIDC_TOKEN_ENDPOINT=$(awk -F "=" '/^oidc_token_endpoint/ {gsub(/ /,"",$2); print $2}' config.ini)
                    OIDC_USER_INFO_ENDPOINT=$(awk -F "=" '/^oidc_user_info_endpoint/ {gsub(/ /,"",$2); print $2}' config.ini)
                    OIDC_LOGOUT_URL=$(awk -F "=" '/^oidc_logout_url/ {gsub(/ /,"",$2); print $2}' config.ini)
                    if [ -z "$OIDC_ISSUER" ] || [ -z "$OIDC_CLIENT_ID" ] || \
                       [ -z "$OIDC_AUTH_ENDPOINT" ] || [ -z "$OIDC_TOKEN_ENDPOINT" ] || [ -z "$OIDC_USER_INFO_ENDPOINT" ] || \
                       [ -z "$OIDC_LOGOUT_URL" ]; then
                        echo "❌ Error: all OIDC configuration parameters are required for oidc auth type"
                        exit 1
                    fi
                    ;;
                *)
                    echo "❌ Error: Invalid auth_type. Must be one of: new-cognito, existing-cognito, oidc"
                    exit 1
                    ;;
            esac
            echo "✅ Valid authentication configs."
        elif [ "$AUTH_ENABLED" = "False" ]; then
            echo "✅ Authentication is disabled. No verification needed."
        fi
    fi
}

# Function to setup dependencies
setup_dependencies() {
    echo "📦 Setting up dependencies..."
    
    # Create and activate Python virtual environment
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    
    # Activate virtual environment
    echo "Activating virtual environment..."
    source .venv/bin/activate
    
    # Install Python dependencies
    echo "Installing Python dependencies..."
    pip3 install --upgrade pip
    pip3 install -r requirements.txt
    
    # Install CDK dependencies
    echo "Installing CDK dependencies..."
    npm install
    
    # Install frontend dependencies
    echo "Installing frontend dependencies..."
    cd ecs_fargate_app/frontend
    npm install
    cd ../..
    
    # Install backend dependencies
    echo "Installing backend dependencies..."
    cd ecs_fargate_app/backend
    npm install
    cd ../..
    
    echo "✅ Dependencies setup completed"
}

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    # Deactivate virtual environment if it's active
    if [ -n "$VIRTUAL_ENV" ]; then
        deactivate
        echo "✅ Virtual environment deactivated"
    fi
}

# Function to deploy the stack
deploy_stack() {
    echo "🚀 Deploying Well-Architected Analyzer stack..."
    
    # Set AWS region
    export CDK_DEPLOY_REGION=$REGION
    echo "Using AWS Region: $REGION"

    # Set container runtime for building the CDK container images
    export CDK_DOCKER=$CONTAINER_TOOL
    echo "Using container runtime: $CONTAINER_TOOL"
    
    # Bootstrap CDK if needed
    echo "Bootstrapping CDK (if needed) in AWS account $AWS_ACCOUNT and region $REGION..."
    cdk bootstrap aws://$AWS_ACCOUNT/$REGION
    
    # Deploy stack
    echo "Deploying stack..."
    cdk deploy --require-approval never
    
    # Print post-deployment information
    echo -e "\n📝 Post-Deployment Steps:"
    echo "1. Note the ALB Domain Name from the outputs above"
    echo "2. Access the application through the ALB domain name"
}

# Main execution
main() {
    echo "🚀 Starting Well-Architected Analyzer deployment..."
    echo "Region: $REGION"
    echo "Container Tool: $CONTAINER_TOOL"
    
    # Get AWS account ID
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    
    # Set up trap to ensure cleanup runs on exit
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    check_auth_config
    setup_dependencies
    deploy_stack
    
    echo -e "\n✅ Deployment completed successfully!"
}

# Run main function
main