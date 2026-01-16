#!/bin/bash

# Instructions for using the script:

# 1. Make the script executable:
# ```bash
# chmod +x destroy-wa-analyzer.sh
# ```

# 2. Destroy stack with required parameters:
# ```bash
# ./destroy-wa-analyzer.sh -r us-west-2 -c docker
# ```

# 3. Show help:
# ```bash
# ./destroy-wa-analyzer.sh -h
# ```

# Exit on error
set -e

# Print script usage
print_usage() {
    echo "Usage: ./destroy-wa-analyzer.sh -r region -c container_tool"
    echo ""
    echo "Required Options:"
    echo "  -r    AWS Region"
    echo "  -c    Container tool (finch or docker)"
    echo ""
    echo "Additional Options:"
    echo "  -h    Show this help message"
    echo ""
    echo "Example:"
    echo "  ./destroy-wa-analyzer.sh -r us-east-1 -c docker"
}

# Parse command line arguments
while getopts "r:c:h" flag; do
    case "${flag}" in
        r) REGION=${OPTARG};;
        c) CONTAINER_TOOL=${OPTARG};;
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

# Set AWS region for deployment
export CDK_DEPLOY_REGION=$REGION

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
        if ! command -v "$cmd" &> /dev/null; then
            missing_commands+=("$cmd")
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

# Function to setup Python environment
setup_python_env() {
    echo "🐍 Setting up Python environment..."
    
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
    
    echo "✅ Python environment setup completed"
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

# Function to destroy the stack
destroy_stack() {
    echo "🗑️ Destroying Well-Architected Analyzer stack..."
    
    # Set AWS region
    export CDK_DEPLOY_REGION=$REGION
    echo "Using AWS Region: $REGION"

    # Set container runtime for building the CDK container images
    export CDK_DOCKER=$CONTAINER_TOOL
    echo "Using container runtime: $CONTAINER_TOOL"
    
    # Destroy stack
    echo "⚠️ WARNING: This will destroy all resources in the stack!"
    echo "Proceeding with stack destruction in 5 seconds..."
    sleep 5
    
    echo "Running 'cdk destroy --force' command..."
    cdk destroy --force
}

# Main execution
main() {
    echo "🗑️ Starting Well-Architected Analyzer stack destruction..."
    echo "Region: $REGION"
    echo "Container Tool: $CONTAINER_TOOL"
    
    # Get AWS account ID
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    
    # Set up trap to ensure cleanup runs on exit
    trap cleanup EXIT
    
    # Run destruction steps
    check_prerequisites
    setup_python_env
    destroy_stack
    
    echo -e "\n✅ Stack destruction completed successfully!"
}

# Run main function
main