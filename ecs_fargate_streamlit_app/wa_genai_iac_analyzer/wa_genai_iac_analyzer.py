import base64
import json
import logging
import os
import re
import sys
import uuid
from datetime import datetime
from io import StringIO

import boto3
import pandas as pd
import streamlit as st
from botocore.config import Config
from botocore.exceptions import ClientError

# Specify the workload parameters
lens_alias = "wellarchitected"

# AWS S3 Configuration
iac_template_s3_bucket = os.environ.get("IAC_TEMPLATE_S3_BUCKET")
wa_docs_s3_bucket = os.environ.get("WA_DOCS_S3_BUCKET")

# Bedrock knowledge base Id
kb_id = os.environ.get("KNOWLEDGE_BASE_ID")
model_id = os.environ.get("MODEL_ID")

# Initialize AWS clients
s3_client = boto3.client("s3")
bedrock_client_config = Config(retries=dict(max_attempts=10, mode="standard"))
bedrock_client = boto3.client("bedrock-runtime", config=bedrock_client_config)
bedrock_agent_client = boto3.client("bedrock-agent-runtime")
wa_client = boto3.client("wellarchitected")


st.set_page_config(
    page_title="Well-Architected IaC Analyzer",
    layout="wide",
    page_icon="static/images/aws-wa-logo.png",
    initial_sidebar_state="auto",
)


class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "container_id": os.environ.get("HOSTNAME", "unknown"),
        }
        if record.exc_info:
            log_record["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(log_record)


@st.cache_resource
def get_logger():
    logger = logging.getLogger("wa_review_app")
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = JsonFormatter()
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.propagate = False
    return logger


# Use this at the top of your script
logger = get_logger()

# Inject custom CSS for the expander
st.markdown(
    """
    <style>
    span[class="st-emotion-cache-1dtefog eqpbllx2"] p {
        font-size: 20px !important; /* change 20px to increase or decrease the size */
    }
    </style>
    """,
    unsafe_allow_html=True,
)


##Functions related to Review button
def upload_file_to_s3(uploaded_file, iac_template_s3_bucket):
    try:
        s3_client.upload_fileobj(
            uploaded_file, iac_template_s3_bucket, uploaded_file.name
        )
        file_url = f"https://{iac_template_s3_bucket}.s3.{s3_client.meta.region_name}.amazonaws.com/{uploaded_file.name}"
        st.success(f"File uploaded successfully!")
        return file_url
    except ClientError as e:
        st.error(f"Error uploading file to S3: {e}")
        return None


def extract_json(text):
    # Find the first occurrence of '[' and the last occurrence of ']'
    start = text.find("[")
    end = text.rfind("]")

    if start != -1 and end != -1 and start < end:
        return text[start : end + 1]
    else:
        raise ValueError("No valid JSON array found in the text")


def clean_json_string(json_string):
    # Remove newlines and extra spaces
    json_string = re.sub(r"\s+", " ", json_string)

    # Remove spaces after colons that are not within quotes
    json_string = re.sub(r'(?<!"):\s+', ":", json_string)

    # Remove spaces before colons
    json_string = re.sub(r"\s+:", ":", json_string)

    # Remove spaces after commas that are not within quotes
    json_string = re.sub(r'(?<!"),\s+', ",", json_string)

    # Remove spaces before commas
    json_string = re.sub(r"\s+,", ",", json_string)

    # Remove spaces after opening brackets and before closing brackets
    json_string = re.sub(r"{\s+", "{", json_string)
    json_string = re.sub(r"\s+}", "}", json_string)
    json_string = re.sub(r"\[\s+", "[", json_string)
    json_string = re.sub(r"\s+\]", "]", json_string)

    # Convert Python boolean values to JSON boolean values
    json_string = json_string.replace(": True", ": true")
    json_string = json_string.replace(": False", ": false")

    return json_string


def retrieve(kbId, pillar, question):
    kb_prompt = f"""For each best practice of the question "{question}" in the Well-Architected pillar "{pillar}" provide:
    - Recommendations
    - Best practices
    - Examples
    - Risks"""

    return bedrock_agent_client.retrieve(
        retrievalQuery={"text": kb_prompt},
        knowledgeBaseId=kbId,
        retrievalConfiguration={
            "vectorSearchConfiguration": {
                # 'overrideSearchType':'SEMANTIC',
                "numberOfResults": 20
            }
        },
    )


def get_contexts(retrievalResults):
    contexts = []
    for retrievedResult in retrievalResults:
        contexts.append(retrievedResult["content"]["text"])
    return contexts


def get_bp_json_file(best_practices_json_path):
    # Load the best practices JSON from S3 "WA_DOCS_S3_BUCKET" bucket
    try:
        response = s3_client.get_object(
            Bucket=wa_docs_s3_bucket, Key=best_practices_json_path
        )
        content = response["Body"].read().decode("utf-8")
        best_practices = json.loads(content)
        return best_practices

    except ClientError as e:
        logger.error(f"Error reading best practices file from S3: {str(e)}")
        return None


def get_iac_template_file(uploaded_file):
    # Load the IaC from S3 "iac_template_s3_bucket" bucket
    try:
        response_iac_template = s3_client.get_object(
            Bucket=iac_template_s3_bucket, Key=uploaded_file.name
        )
        content_iac_template = response_iac_template["Body"].read().decode("utf-8")
        return content_iac_template

    except ClientError as e:
        logger.error(f"Error reading IaC template file from S3: {str(e)}")
        return None


def build_model_prompts(pillar, question, question_best_practices_json, iac_template):
    response = retrieve(kb_id, pillar, question)
    retrievalResults = response["retrievalResults"]
    contexts = get_contexts(retrievalResults)

    number_of_bps = len(json.loads(question_best_practices_json))

    system_prompt = f"""You are an AWS Cloud Solutions Architect who specializes in reviewing solution architecture documents against the AWS Well-Architected Framework, using a process called the Well-Architected Framework Review (WAFR).
    The WAFR process consists of evaluating the provided solution architecture document against the 6 pillars of the Well-Architected Framework, namely - Operational Excellence Pillar, Security Pillar, Reliability Pillar, Performance Efficiency Pillar, Cost Optimization Pillar, and Sustainability Pillar - by asking fixed questions for each pillar.
    The content of a CloudFormation or Terraform template document is provided below in the "uploaded_template_document" section. Follow the instructions listed under "instructions" section below. 
    
    <instructions>
    1) In the "best_practices_json" section, you are provided with the name of the {number_of_bps} Best Practices related to the questions "{question}" of the Well-Architected Framework. For each Best Practice, determine if it is applied or not in the given CloudFormation or Terraform template document.
    2) For each of the {number_of_bps} best practices listed in the "best_practices_json" section, create your respond in the following EXACT JSON format only (Important, use the EXACT best practice name as given in the Best Practices): 
    [
        {{
            "Best Practice Name": [Exact Best Practice Name as given in Best Practices in the "best_practices_json" section],
            "Applied": [Use exactly "True" or "False" without the quotes (as Python booleans)]
            "Reason Applied": [Why do you consider this best practice is already applied or followed in the provided architecture document? (Important: 50 words maximum and only add this field when "Applied" == True)]
            "Reason Not Applied": [Why do you consider this best practice is not applied or followed in the provided architecture document? (Important: 50 words maximum and only add this field when "Applied" == False)]
            "Recommendations": [Provide recommendations for the best practice. Include what is the risk of not following, and also provide recommendations and examples of how to implement this best practice. (Important: 350 words maximum and only add this field when "Applied" == False)]
        }}
    ]
    For your reference, below is an example of how the JSON-formatted response should look like:
    ```
    [{{"Best Practice Name": "Implement secure key and certificate management", "Applied": true,"Reason Applied": "The template provisions an AWS Certificate Manager (ACM) certificate for the Application Load Balancer to enforce HTTPS encryption in transit."}},{{"Best Practice Name": "Enforce encryption in transit", "Applied": true,"Reason Applied": "The Application Load Balancer is configured to use HTTPS protocol on port 443 with the SSL policy ELBSecurityPolicy-2016-08."}},{{"Best Practice Name": "Prefer hub-and-spoke topologies over many-to-many mesh", "Applied": false,"Reason Not Applied": "The template does not provide details about the overall network topology or interconnections between multiple VPCs.", "Recommendations": "While not specifically relevant for this single VPC deployment,if you have multiple VPCs that need to communicate,you should implement a hub-and-spoke model using transit gateways. This simplifies network management and reduces the risk of misconfiguration compared to peering every VPC directly in a mesh topology. The risk of using a mesh topology is increased complexity,potential misconfiguration leading to reachability issues,and difficulty applying consistent network policies across VPCs."}}]
    ```
    3) Do not rephrase or summarize the practice name, and DO NOT skip any of the {number_of_bps} best practices listed in the "best_practices_json" section.
    4) Do not make any assumptions or make up information. Your responses should only be based on the actual solution document provided in the "uploaded_template_document" section below.
    5) You are also provided with a Knowledge Base which has more information about the specific question from the Well-Architected Framework. The relevant parts from the Knowledge Base will be provided under the "kb" section.
    </instructions>

    The user has uploaded a CloudFormation or Terraform template document. Here's the content of the template:
    <uploaded_template_document>
    {iac_template}
    </uploaded_template_document>
    """

    prompt = f"""
    <kb>
    {contexts}
    </kb>

    <best_practices_json>
    {question_best_practices_json}
    </best_practices_json>
    """

    return system_prompt, prompt


def invoke_model(system_prompt, prompt):
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "system": system_prompt,
        "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}],
    }

    try:
        response = bedrock_client.invoke_model(
            modelId=model_id,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(request_body),
        )

        response_body = json.loads(response["body"].read())
        analysis_content = response_body.get("content", [])

        return analysis_content

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        logger.error(f"{error_code} - {error_message}")
        st.error(f"{error_code} - {error_message}")
        return None

    except Exception as e:
        logger.error(f"Unexpected error in invoke_model: {str(e)}")
        st.error(f"An unexpected error occurred: {str(e)}")
        return None


def analyze_template_with_bedrock(
    best_practices_json_path, uploaded_file, pillars_checks
):

    best_practices = get_bp_json_file(best_practices_json_path)

    iac_template = get_iac_template_file(uploaded_file)

    # Get list of unique WA questions (only for those pillars selected by the user)
    questions = sorted(
        list(
            set(
                item["Question"]
                for item in best_practices
                if item["Pillar"] in pillars_checks
            )
        )
    )
    number_of_questions = len(questions)
    questions_processed = 0
    question_analysis_progress = st.progress(0, text="Starting analysis...")

    for question in questions:

        # Get all best practices for a particular question
        question_best_practices = [
            item for item in best_practices if item["Question"] == question
        ]

        # Convert the best practices to a formatted JSON string
        question_best_practices_json = json.dumps(question_best_practices, indent=2)

        pillar_title = question_best_practices[0]["Pillar"]

        question_title = question_best_practices[0]["Question"]

        # Present progress bar in UI
        questions_processed_percentage = int(
            questions_processed * 100 / number_of_questions
        )
        question_analysis_progress.progress(
            questions_processed_percentage,
            text=f"[{questions_processed}/{number_of_questions}] Analyzing template according to: '{pillar_title} - {question_title}'",
        )

        # Build the prompt and invoke the mode one WA questions and its best practices at a time
        system_prompt, prompt = build_model_prompts(
            pillar_title,
            question_title,
            question_best_practices_json,
            iac_template,
        )
        model_response_content = invoke_model(system_prompt, prompt)

        for item in model_response_content:
            if item["type"] == "text":
                # Extract the JSON part
                json_string = extract_json(item["text"])

                # Clean the JSON string
                cleaned_json_string = clean_json_string(json_string)

                try:
                    json_object = json.loads(cleaned_json_string)
                    yield json_object
                except (ValueError, json.JSONDecodeError) as e:
                    logger.error(f"Error loading the JSON string: {str(e)}")

        questions_processed += 1

    question_analysis_progress.empty()


def display_result_applied_bps(analysis_results, file_path, workload_id_input):
    response = s3_client.get_object(Bucket=wa_docs_s3_bucket, Key=file_path)
    content = response["Body"].read().decode("utf-8")
    best_practices = pd.read_csv(StringIO(content))

    if best_practices.empty:
        st.error(
            "No best practices could be loaded. Please check the file and try again."
        )
        return

    pillars = {}
    for index, row in best_practices.iterrows():
        pillar = row.get("Pillar", "Unknown")
        question = row.get("Question", "Unknown")
        practice = row.get("Best Practice", "")

        if pillar not in pillars:
            pillars[pillar] = {}
        if question not in pillars[pillar]:
            pillars[pillar][question] = []
        pillars[pillar][question].append(practice)

    number_of_bp = {}
    st.subheader(":green[Best Practices found in your architecture]")
    for pillar, questions in pillars.items():
        number_of_bp[pillar] = 0

        # Get the pillar ID
        pillar_id = None
        lens_review_response = wa_client.get_lens_review(
            WorkloadId=workload_id_input, LensAlias=lens_alias
        )
        for pillar_summary in lens_review_response.get("LensReview", {}).get(
            "PillarReviewSummaries", []
        ):
            if pillar_summary.get("PillarName") == pillar:
                pillar_id = pillar_summary.get("PillarId")
                break

        if not pillar_id:
            logger.info(f"Couldn't find PillarId for {pillar}. Skipping...")
            continue

        # Initialize pagination variables
        next_token = None

        applied_practices_content = []

        while True:
            # Build the API request parameters
            params = {
                "WorkloadId": workload_id_input,
                "LensAlias": lens_alias,
                "PillarId": pillar_id,
            }
            if next_token:
                params["NextToken"] = next_token

            # Get answers for each question under the current pillar
            answers_response = wa_client.list_answers(**params)

            # Evaluating "Applied" Best Practices
            for answer in answers_response["AnswerSummaries"]:
                question_title = answer["QuestionTitle"]

                for question, practices in questions.items():
                    if question == question_title:
                        applied_practices = []

                        choice_title_to_id = {
                            choice["Title"]: choice["ChoiceId"]
                            for choice in answer.get("Choices", [])
                        }

                        for practice in practices:
                            practice_text = practice.strip()

                            for best_practice in analysis_results:
                                if (
                                    best_practice["Applied"]
                                    and best_practice["Best Practice Name"]
                                    == practice_text
                                ):
                                    if not any(
                                        practice_text == item["Best Practice Name"]
                                        for item in applied_practices
                                    ):
                                        applied_practices.append(best_practice)
                                        number_of_bp[pillar] += 1

                        # Display the question and its applied practices if any are applied
                        if applied_practices:
                            question_content = [f" ##### **{question}**"]
                            for best_practice in applied_practices:
                                question_content.append(
                                    f" **[{best_practice['Best Practice Name']}](https://docs.aws.amazon.com/wellarchitected/latest/framework/{choice_title_to_id[best_practice['Best Practice Name']]}.html)**"
                                )
                                question_content.append(
                                    f" - Reason: {best_practice['Reason Applied']}"
                                )
                            applied_practices_content.append(
                                "\n\n".join(question_content)
                            )

            # Check if there are more results
            next_token = answers_response.get("NextToken")
            if not next_token:
                break

        # Create the expander for the pillar and questions
        with st.expander(
            f"**{pillar}** [{number_of_bp[pillar]}]",
            expanded=False,
        ):
            for content in applied_practices_content:
                st.markdown(content)


def display_result_not_applied_bps(analysis_results, file_path, workload_id_input):
    response = s3_client.get_object(Bucket=wa_docs_s3_bucket, Key=file_path)
    content = response["Body"].read().decode("utf-8")
    best_practices = pd.read_csv(StringIO(content))

    if best_practices.empty:
        st.error(
            "No best practices could be loaded. Please check the file and try again."
        )
        return

    pillars = {}
    for index, row in best_practices.iterrows():
        pillar = row.get("Pillar", "Unknown")
        question = row.get("Question", "Unknown")
        practice = row.get("Best Practice", "")

        if pillar not in pillars:
            pillars[pillar] = {}
        if question not in pillars[pillar]:
            pillars[pillar][question] = []
        pillars[pillar][question].append(practice)

    number_of_bp = {}
    st.subheader(":red[Best Practices NOT found in your architecture]")
    for pillar, questions in pillars.items():
        number_of_bp[pillar] = 0

        # Get the pillar ID
        pillar_id = None
        lens_review_response = wa_client.get_lens_review(
            WorkloadId=workload_id_input, LensAlias=lens_alias
        )
        for pillar_summary in lens_review_response.get("LensReview", {}).get(
            "PillarReviewSummaries", []
        ):
            if pillar_summary.get("PillarName") == pillar:
                pillar_id = pillar_summary.get("PillarId")
                break

        if not pillar_id:
            logger.info(f"Couldn't find PillarId for {pillar}. Skipping...")
            continue

        # Initialize pagination variables
        next_token = None

        practices_not_applied_content = []

        while True:
            # Build the API request parameters
            params = {
                "WorkloadId": workload_id_input,
                "LensAlias": lens_alias,
                "PillarId": pillar_id,
            }
            if next_token:
                params["NextToken"] = next_token

            # Get answers for each question under the current pillar
            answers_response = wa_client.list_answers(**params)

            # Evaluating "Applied" Best Practices
            for answer in answers_response["AnswerSummaries"]:
                question_title = answer["QuestionTitle"]

                for question, practices in questions.items():
                    if question == question_title:
                        practices_not_applied = []

                        choice_title_to_id = {
                            choice["Title"]: choice["ChoiceId"]
                            for choice in answer.get("Choices", [])
                        }

                        for practice in practices:
                            practice_text = practice.strip()

                            for best_practice in analysis_results:
                                if (
                                    not best_practice["Applied"]
                                    and best_practice["Best Practice Name"]
                                    == practice_text
                                ):
                                    practices_not_applied.append(best_practice)
                                    number_of_bp[pillar] += 1

                        # Display the question and the best practices that are not applied (if any)
                        if practices_not_applied:
                            question_content = [f" ##### **{question}**"]
                            for best_practice in practices_not_applied:
                                question_content.append(
                                    f" **[{best_practice['Best Practice Name']}](https://docs.aws.amazon.com/wellarchitected/latest/framework/{choice_title_to_id[best_practice['Best Practice Name']]}.html)**"
                                )
                                question_content.append(
                                    f" - Reason: {best_practice['Reason Not Applied']}"
                                )
                                question_content.append(
                                    f" - Recommendations: {best_practice.get('Recommendations', 'No recommendations provided')}"
                                )
                            practices_not_applied_content.append(
                                "\n\n".join(question_content)
                            )

            # Check if there are more results
            next_token = answers_response.get("NextToken")
            if not next_token:
                break

        # Create the expander for the pillar and questions
        with st.expander(
            f"**{pillar}** [{number_of_bp[pillar]}]",
            expanded=False,
        ):
            for content in practices_not_applied_content:
                st.markdown(content)


##Functions related to Update Button
def update_workload(analysis_results, file_path, workload_id_input):
    # Fetch workload and lens review details
    lens_review_response = wa_client.get_lens_review(
        WorkloadId=workload_id_input, LensAlias=lens_alias
    )

    # Read best practices from S3
    response = s3_client.get_object(Bucket=wa_docs_s3_bucket, Key=file_path)
    content = response["Body"].read().decode("utf-8")
    best_practices = pd.read_csv(StringIO(content))

    # Create mappings from Best Practice to Pillar and Question
    practice_to_pillar_question = {}
    for index, row in best_practices.iterrows():
        pillar = row.get("Pillar", "").strip().lower()
        question = row.get("Question", "").strip().lower()
        practice = row.get("Best Practice", "").strip()

        # Remove all spaces from the pillar
        pillar_no_spaces = pillar.replace(" ", "")
        # Initialize the dictionary entry if it does not exist
        if pillar_no_spaces not in practice_to_pillar_question:
            practice_to_pillar_question[pillar_no_spaces] = []

        for best_practice in analysis_results:
            if best_practice["Best Practice Name"] == practice:
                practice_text = practice.strip().lower()
                practice_to_pillar_question[pillar_no_spaces].append(
                    {
                        "Question": question,
                        "Practice": practice_text,
                        "Applied": best_practice["Applied"],
                    }
                )

    # Iterate over Pillar IDs from the Lens Review response
    for pillar_summary in lens_review_response.get("LensReview", {}).get(
        "PillarReviewSummaries", []
    ):
        pillar_id = pillar_summary.get("PillarId", "No PillarId")
        logger.info(f"Processing Pillar ID: {pillar_id}")

        # Initialize pagination variables
        next_token = None

        while True:
            try:
                # Build the API request parameters
                params = {
                    "WorkloadId": workload_id_input,
                    "LensAlias": lens_alias,
                    "PillarId": pillar_id,
                }
                if next_token:
                    params["NextToken"] = next_token

                # Get questions for this pillar
                questions_response = wa_client.list_answers(**params)

                # Process questions from the WA Tool workload applied lens
                for question in questions_response.get("AnswerSummaries", []):
                    question_id = question.get("QuestionId", "No QuestionId")
                    question_title = question.get("QuestionTitle", "No QuestionTitle")
                    current_choices = question.get("SelectedChoices", [])
                    updated_choices = current_choices

                    # Iterate over the details list for the current pillar (key = performanceefficiency, reliability, etc.)
                    for key in practice_to_pillar_question.keys():
                        if key.startswith(pillar_id.lower()):
                            # Iterate over the best practices (entry =  {"Question": question, "Practice": practice_text, "Applied": True/False})
                            for entry in practice_to_pillar_question[key]:
                                if entry["Applied"]:
                                    practice1 = entry.get("Practice", "No Practice")
                                    question1 = entry.get("Question", "No Question")
                                    new_choice_ids = []
                                    # If the WA lens question is followed (as per model analysis)
                                    # Then, iterate through the BPs of the question to check which BP is followed (as per model analysis)
                                    if question1 == question_title.lower():
                                        choice_title_to_id = {
                                            choice["Title"]: choice["ChoiceId"]
                                            for choice in question.get("Choices", [])
                                        }
                                        for (
                                            new_choice_title,
                                            choice_id,
                                        ) in choice_title_to_id.items():
                                            if new_choice_title.lower() == practice1:
                                                new_choice_ids.append(choice_id)

                                        updated_choices = list(
                                            set(updated_choices + new_choice_ids)
                                        )  # Remove duplicates
                                        # Update the WA Tool workload question with the followed merge followed choices (best practices) as per model analysis.
                                        wa_client.update_answer(
                                            WorkloadId=workload_id_input,
                                            LensAlias=lens_alias,
                                            QuestionId=question_id,
                                            SelectedChoices=updated_choices,
                                            Notes="Updated from WA IaC Analyzer app",
                                        )

                # Check if there is a next token
                next_token = questions_response.get("NextToken")
                if not next_token:
                    break

            except ClientError as e:
                logger.error(
                    f"Error retrieving or updating answers for Pillar ID {pillar_id}: {str(e)}"
                )
                return e

    create_milestone(workload_id_input)
    return "Success"


def create_milestone(workload_id_input):
    # Define a milestone name with current date and time
    current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    milestone_name = f"Review completed on {current_datetime}"
    client_request_token = str(uuid.uuid4())  # Generate a unique client request token

    try:
        milestone_response = wa_client.create_milestone(
            WorkloadId=workload_id_input,
            MilestoneName=milestone_name,
            ClientRequestToken=client_request_token,
        )
        logger.info("Milestone created")

    except Exception as e:
        logger.error(f"Error creating milestone: {str(e)}")


def summarize_risks(workload_id_input, lens_alias):
    # Initialize counters for different risk levels
    pillar_summaries = {}
    total_questions = 0
    answered_questions = 0

    # Retrieve all pillars for the lens review
    lens_review_response = wa_client.get_lens_review(
        WorkloadId=workload_id_input, LensAlias=lens_alias
    )

    # Loop through each pillar and list answers for each pillar
    for pillar_summary in lens_review_response.get("LensReview", {}).get(
        "PillarReviewSummaries", []
    ):
        pillar_id = pillar_summary.get("PillarId", "No PillarId")
        pillar_name = pillar_summary.get("PillarName", "Unknown Pillar")

        pillar_summaries[pillar_id] = {
            "name": pillar_name,
            "total": 0,
            "answered": 0,
            "high": 0,
            "medium": 0,
        }

        # Initialize pagination variables
        next_token = None

        while True:
            try:
                # Build the API request parameters
                params = {
                    "WorkloadId": workload_id_input,
                    "LensAlias": lens_alias,
                    "PillarId": pillar_id,
                }
                if next_token:
                    params["NextToken"] = next_token

                # Get answers for each question under the current pillar
                answers_response = wa_client.list_answers(**params)

                for answer_summary in answers_response.get("AnswerSummaries", []):
                    pillar_summaries[pillar_id]["total"] += 1
                    total_questions += 1
                    risk = answer_summary.get("Risk", "UNANSWERED")
                    if risk != "UNANSWERED":
                        pillar_summaries[pillar_id]["answered"] += 1
                        answered_questions += 1
                    if risk == "HIGH":
                        pillar_summaries[pillar_id]["high"] += 1
                    elif risk == "MEDIUM":
                        pillar_summaries[pillar_id]["medium"] += 1

                # Check if there is a next token
                next_token = answers_response.get("NextToken")
                if not next_token:
                    break  # Exit the loop if no more pages are available

            except ClientError as e:
                logger.error(
                    f"Error retrieving answers for Pillar ID {pillar_id}: {str(e)}"
                )
                break  # Exit the loop on error to prevent infinite retries

    return pillar_summaries, total_questions, answered_questions


def display_risk_summary(pillar_summaries, total_questions, answered_questions):
    # Display the summary of risks on the Streamlit interface
    st.subheader("Risk Summary")
    st.markdown(f"Questions Answered: {answered_questions}/{total_questions}")

    # Initialize counters for overall risk levels
    total_high = 0
    total_medium = 0

    # Sum up the risks across all pillars
    for pillar_data in pillar_summaries.values():
        total_high += pillar_data["high"]
        total_medium += pillar_data["medium"]

    # Display overall risk metrics
    col1, col2 = st.columns(2)
    col1.markdown(
        f"<h3 style='color: red;'>High Risks: {total_high}</h3>", unsafe_allow_html=True
    )
    col2.markdown(
        f"<h3 style='color: orange;'>Medium Risks: {total_medium}</h3>",
        unsafe_allow_html=True,
    )

    # Display risk breakdown by pillar in a table
    st.subheader("Risk Breakdown by Pillar")

    # Prepare data for the table
    table_data = []
    for pillar_id, pillar_data in pillar_summaries.items():
        table_data.append(
            {
                "Pillar": pillar_data["name"],
                "Questions Answered": f"{pillar_data['answered']}/{pillar_data['total']}",
                "High Risks": pillar_data["high"],
                "Medium Risks": pillar_data["medium"],
            }
        )

    # Create a DataFrame and display it as a table
    df = pd.DataFrame(table_data)
    df = df.reset_index(drop=True)

    html = df.to_html(index=False)

    st.markdown(html, unsafe_allow_html=True)


# Functions related to Generate Button
def generate_and_download_report(workload_id_input, lens_alias):
    try:
        # Generate the report using GetLensReviewReport API
        response = wa_client.get_lens_review_report(
            WorkloadId=workload_id_input, LensAlias=lens_alias
        )

        # Extract the Base64 encoded report data
        base64_string = response.get("LensReviewReport", {}).get("Base64String")

        if not base64_string:
            st.error("Failed to retrieve the report data.")
            return None

        # Decode the Base64 string
        report_data = base64.b64decode(base64_string)

        # Create a download link
        b64 = base64.b64encode(report_data).decode()
        href = f'<a href="data:application/pdf;base64,{b64}" download="WA_Review_Report_{workload_id_input}.pdf">Click here to download the report</a>'
        st.markdown(href, unsafe_allow_html=True)

        return "Report generated successfully"

    except Exception as e:
        st.error(f"Error generating report: {str(e)}")
        return None

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        st.error(f"AWS Error: {error_code} - {error_message}")
        if error_code == "ValidationException":
            st.error("Please check if the WorkloadId and LensAlias are correct.")
        elif error_code == "ResourceNotFoundException":
            st.error("The specified workload or lens was not found.")
        elif error_code == "AccessDeniedException":
            st.error(
                "You don't have permission to perform this operation. Check your IAM policies."
            )
        else:
            st.error("Please check your AWS credentials and permissions.")
        return None
    except Exception as e:
        st.error(f"Unexpected error: {str(e)}")
        return None


# Helper function to check if the given ID is a 32 hex digits
def is_valid_workload_id_format(workload_id_input):
    pattern = re.compile(r"^[a-fA-F0-9]{32}$")
    if pattern.match(workload_id_input):
        return True
    else:
        st.error("Invalid Workload ID, must be 32 hex digits.")
        return False


# Helper function to check if the workload with the specified ID exists
def is_exists_workload_id(workload_id_input):
    try:
        response = wa_client.get_workload(WorkloadId=workload_id_input)
        if response:
            return True
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        st.error(f"AWS Error: {error_code} - {error_message}")
        if error_code == "ValidationException":
            st.error("Please check if the WorkloadId is correct.")
        elif error_code == "ResourceNotFoundException":
            st.error("The specified workload was not found.")
        elif error_code == "AccessDeniedException":
            st.error(
                "You don't have permission to perform this operation. Check your IAM policies."
            )
        else:
            st.error("Please check your AWS credentials and permissions.")
    except Exception as e:
        st.error(f"Unexpected error: {str(e)}")
    return False


# Convert results to CSV
def convert_to_csv(analysis_result):
    df = pd.DataFrame(analysis_result)
    return df.to_csv(index=False).encode("utf-8")


# Functions related to display
def analyze_callback():
    st.session_state.update_disabled = False
    st.session_state.bp_recommendations_disabled = False
    st.session_state.pillars_disabled = True


def update_callback():
    st.session_state.report_disabled = False


# Main App
def main():
    st.title(":orange[Are you Well-Architected?]")

    best_practices_file_path = "well_architected_best_practices.json"
    best_practices_csv_path = "well_architected_best_practices.csv"

    # Initialize session state variables
    if "analysis_result" not in st.session_state:
        st.session_state.analysis_result = None
    if "analyze_disabled" not in st.session_state:
        st.session_state.analyze_disabled = False
    if "analyze_click" not in st.session_state:
        st.session_state.analyze_click = 1
    if "update_click" not in st.session_state:
        st.session_state.update_click = 1
    if "update_disabled" not in st.session_state:
        st.session_state.update_disabled = True
    if "report_disabled" not in st.session_state:
        st.session_state.report_disabled = True
    if "bp_recommendations_disabled" not in st.session_state:
        st.session_state.bp_recommendations_disabled = True
    if "pillars_disabled" not in st.session_state:
        st.session_state.pillars_disabled = False

    uploaded_file = st.file_uploader(
        "Upload your IaC workload template (e.g. AWS CloudFormation, Terraform). The template will be reviewed based AWS Well-Architected Framework best practices.",
        type=["yaml", "json", "yml", "tf"],
    )

    if uploaded_file is not None:
        s3_url = upload_file_to_s3(uploaded_file, iac_template_s3_bucket)

        workload_id_input = st.text_input(
            "Type below your Well-Architected Tool [Workload Id](https://docs.aws.amazon.com/wellarchitected/latest/userguide/define-workload.html) (*The Id is in the workload's ARN, E.g. arn:aws:wellarchitected:<aws_region>:<account_id>:workload/**:orange[<workload_id>]***)",
            "",
        )

        if workload_id_input and workload_id_input != "":
            st.session_state.analyze_disabled = False
        else:
            st.session_state.analyze_disabled = True

        pillars_checks = st.multiselect(
            "Select the [Well-Architected Pillars](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html) to review:",
            [
                "Operational Excellence",
                "Security",
                "Reliability",
                "Performance Efficiency",
                "Cost Optimization",
                "Sustainability",
            ],
            [
                "Operational Excellence",
                "Security",
                "Reliability",
                "Performance Efficiency",
                "Cost Optimization",
                "Sustainability",
            ],
            disabled=st.session_state.pillars_disabled,
        )

        col1, col2, col3, col4 = st.columns(4, vertical_alignment="center")

        with col1:
            analyze_button = st.button(
                "Review Uploaded Document",
                key="analyze_button",
                on_click=analyze_callback,
                disabled=st.session_state.analyze_disabled,
                type="secondary",
            )
        with col2:
            bp_recommendations_button = st.button(
                "Download Recommendations",
                key="bp_recommendations_button",
                disabled=st.session_state.bp_recommendations_disabled,
                type="secondary",
            )
        with col3:
            update_button = st.button(
                "Complete Well-Architected Review",
                key="update_button",
                on_click=update_callback,
                disabled=st.session_state.update_disabled,
                type="secondary",
            )
        with col4:
            wa_tool_report_button = st.button(
                "Generate Well-Architected Tool Report",
                key="wa_tool_report_button",
                disabled=st.session_state.report_disabled,
                type="secondary",
            )

        if s3_url and analyze_button:
            if st.session_state.analyze_click == 1:
                with st.spinner("Validating Workload ID..."):
                    if not is_valid_workload_id_format(workload_id_input):
                        return None
                    if not is_exists_workload_id(workload_id_input):
                        return None
                with st.spinner("Checking your workload for AWS best practices..."):
                    analysis_generator = analyze_template_with_bedrock(
                        best_practices_file_path, uploaded_file, pillars_checks
                    )

                    full_analysis = []
                    for partial_result in analysis_generator:
                        full_analysis.extend(partial_result)

                    st.session_state.analyze_click += 1
                    st.session_state.analysis_result = full_analysis

                    if st.session_state.analysis_result:
                        display_result_not_applied_bps(
                            st.session_state.analysis_result,
                            best_practices_csv_path,
                            workload_id_input,
                        )
                        display_result_applied_bps(
                            st.session_state.analysis_result,
                            best_practices_csv_path,
                            workload_id_input,
                        )
                    else:
                        st.error("Failed to analyze the template. Please try again.")
                        st.session_state.update_disabled = True
                        st.session_state.report_disabled = True

            else:
                display_result_not_applied_bps(
                    st.session_state.analysis_result,
                    best_practices_csv_path,
                    workload_id_input,
                )
                display_result_applied_bps(
                    st.session_state.analysis_result,
                    best_practices_csv_path,
                    workload_id_input,
                )

        if update_button and st.session_state.analysis_result:
            if st.session_state.update_click == 1:
                with st.spinner(
                    "Updating answers in the Well-Architected Tool workload..."
                ):
                    status = update_workload(
                        st.session_state.analysis_result,
                        best_practices_csv_path,
                        workload_id_input,
                    )
                    if status == "Success":
                        st.success(
                            "Well-Architected Tool workload review updated and a Milestone created"
                        )
                        st.session_state.update_click += 1

                        pillar_summaries, total_questions, answered_questions = (
                            summarize_risks(workload_id_input, lens_alias)
                        )
                        display_risk_summary(
                            pillar_summaries, total_questions, answered_questions
                        )
                    else:
                        st.write(f"Error in updating workload: {status}")
                        st.session_state.update_disabled = False
                        st.session_state.report_disabled = True
            else:
                pillar_summaries, total_questions, answered_questions = summarize_risks(
                    workload_id_input, lens_alias
                )
                display_risk_summary(
                    pillar_summaries, total_questions, answered_questions
                )

        # Display report BPs
        if bp_recommendations_button and st.session_state.analysis_result:
            with st.spinner("Parsing Best Practices Recommendations..."):
                try:
                    analysis_result_csv = convert_to_csv(
                        st.session_state.analysis_result
                    )
                    current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    if analysis_result_csv:
                        st.success(
                            "Recommendations list generated successfully. Click the download button below to save the CSV."
                        )
                        st.download_button(
                            label="Download Best Practices Recommendations (.csv)",
                            data=analysis_result_csv,
                            file_name=f"WAFR_Recommendations_{uploaded_file.name}_{current_datetime}.csv",
                            mime="text/csv",
                            type="primary",
                        )
                    else:
                        st.error("Failed to retrieve the report data.")
                except Exception as e:
                    st.error(f"Error generating report: {str(e)}")

        # Display report download link
        if wa_tool_report_button and st.session_state.analysis_result:
            with st.spinner("Generating Well-Architected Tool Report..."):
                try:
                    response = wa_client.get_lens_review_report(
                        WorkloadId=workload_id_input, LensAlias=lens_alias
                    )
                    base64_string = response.get("LensReviewReport", {}).get(
                        "Base64String"
                    )
                    current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    if base64_string:
                        st.success(
                            "Report generated successfully. Click the download button below to save the PDF."
                        )
                        pdf_data = base64.b64decode(base64_string)
                        st.download_button(
                            label="Download Well-Architected Tool Report (.pdf)",
                            data=pdf_data,
                            file_name=f"WA_Tool_Review_Report_{uploaded_file.name}_{current_datetime}.pdf",
                            mime="application/pdf",
                            type="primary",
                        )
                    else:
                        st.error("Failed to retrieve the report data.")
                except Exception as e:
                    st.error(f"Error generating report: {str(e)}")


# Run the app
if __name__ == "__main__":
    main()
