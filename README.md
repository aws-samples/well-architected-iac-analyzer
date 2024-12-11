# Well-Architected IaC (Infrastructure as Code) Analyzer

![solutions_diagram](/assets/wa_genai_app_diagram.png)

## Description 

Well-Architected Infrastructure as Code (IaC) Analyzer is a project that demonstrates how generative AI can be used to evaluate infrastructure code for alignment with best practices.

It features a web application built with Streamlit.io, allowing users to upload IaC documents (e.g. AWS CloudFormation or Terraform templates) for assessment. The application leverages a large language model running on Amazon Bedrock to analyze the code against AWS Well-Architected best practices. These best practices are sourced from AWS Well-Architected whitepapers and synchronized with the Amazon Bedrock knowledge base.

This tool provides users with insights into how well their infrastructure code aligns with or deviates from established AWS best practices, offering suggestions for improving cloud architecture designs.

The project deploys resources running on the following AWS services:
* Amazon Virtual Private Cloud (VPC)
* Application Load Balancer
* Amazon Elastic Container Service (ECS)
* AWS Fargate
* Amazon S3
* AWS Lambda

## Pre-requisites 
Below pre-requesites are to be deployed in your local machine.

* Install [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html).
* Prepare CDK for python [here](https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-python.html).
* Install and run [Docker](https://docs.docker.com/engine/install/).
* Enable access to **Titan Text Embeddings V2** and **Claude 3.5 Sonnet** models in your AWS region for your stack [here](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access-modify.html).

## Optional
If you want to use a different model than "Claude 3.5 Sonnet", update the config.ini with the correct [model ID](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html#model-ids-arns).
```
[settings]
model_id = anthropic.claude-3-5-sonnet-20240620-v1:0
```
## IMPORTANT SECURITY NOTE
> By default, this project will deploy the Load Balancer scheme as [**internal**](https://docs.aws.amazon.com./elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html#load-balancer-scheme) **(Private load balancer)**. To access the application, you will need to be in the private network connected to the deployed VPC, either via [VPC peering](https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html), VPN, or any other means. If you need to change the load balancer scheme to [**internet-facing**](https://docs.aws.amazon.com./elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html#load-balancer-scheme), you can modify the `public_load_balancer` parameter setting to `True` in the config.ini file, as below example. 
>```
>[settings]
>public_load_balancer = True
>```
> However, please be aware that this project is prepared as a **demo** with **no authentication mechanism**. Therefore, should you choose to change the parameter to `True` or modify the load balancer to be **internet-facing**, you are accepting the risk of any implications that this application, along with its functionalities, will be accessible directly through the internet without any form of authentication.

## IP Address Restrictions

While internet-facing ALBs still require careful consideration, one mitigating measure is to limit inbound communications for security groups to only those from authorized IPs. Use at your own risk, as misconfiguration can result in serious security holes.
Set a comma-separated CIDR without quotes in config.ini.

```
[settings]
allowed_ips = 192.0.2.0/24,198.51.100.0/24,203.0.113.0/24
```

## Instructions to deploy

**1. Clone this repository**

```
git clone https://github.com/aws-samples/well-architected-iac-analyzer
cd well-architected-iac-analyzer
```

**2. Create and activate a Python virtual environment**

```
python -m venv .venv
source .venv/bin/activate
```

**3. Install requirements**

```
pip install -r requirements.txt
```

**4. Set the AWS region were the CDK stack will be deployed**

```
export CDK_DEPLOY_REGION=us-west-2
```

**5. Bootstrap CDK**

```
cdk bootstrap
```

**6. Deploy the solution**

```
cdk synth
cdk deploy
```

After the deployment is complete, you will see the private ALB DNS name in the output of the `cdk deploy` command. You can also find this information in the outputs section of the CloudFormation stack named `WA-IaC-Analyzer-{region}-GenAIStack` in the AWS Console.


### Clean up

Option 1 - Run the following command to remove the CDK stack and all the associated resources created in your AWS account:

```
cdk destroy
```

Option 2 - You can also open the CloudFormation console and directly delete the stack named ``WA-IaC-Analyzer-{region}-GenAIStack``.

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
