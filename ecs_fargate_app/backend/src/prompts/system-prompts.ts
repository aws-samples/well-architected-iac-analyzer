import { QuestionGroup } from '../shared/interfaces/analysis.interface';
import { IaCTemplateType } from '../shared/dto/analysis.dto';
import { getLanguageName } from './languages';

/**
 * Checks if the model supports extended thinking capabilities
 * @param modelId The model identifier
 * @returns true if model supports extended thinking
 */
function supportsExtendedThinking(modelId?: string): boolean {
  if (!modelId) return false;
  
  return [
    'claude-3-7-sonnet',
    'claude-haiku-4-5',
    'claude-sonnet-4-5',
    'claude-opus-4-5'
  ].some(model => modelId.includes(model));
}

/**
 * Converts language code to full language name
 * @param code Language code (e.g., 'en', 'ja', 'es')
 * @returns Full language name (e.g., 'English', 'Japanese', 'Spanish')
 */
export function getLanguageNameFromCode(code: string): string {
  return getLanguageName(code);
}

/**
 * Generates a system prompt for analyzing architecture diagrams
 * @param question The question group containing best practices to evaluate
 * @param lensName Optional lens name
 * @param pillarNames Comma-separated pillar names  
 * @param lensPillars Optional record of pillar IDs to names
 * @returns A system prompt for architecture diagram analysis
 */
export function buildImageSystemPrompt(
  question: QuestionGroup, 
  lensName?: string,
  pillarNames?: string,
  lensPillars?: Record<string, string>,
  outputLanguage: string = 'en' // Add language parameter with English default
): string {
  const numberOfBestPractices = question.bestPractices.length;
  
  // Format pillar names as comma-separated string if lensPillars is provided
  const formattedPillarNames = pillarNames || 
    'Operational Excellence Pillar, Security Pillar, Reliability Pillar, Performance Efficiency Pillar, Cost Optimization Pillar, and Sustainability Pillar';

  // Count pillars if available
  const pillarCount = lensPillars ? Object.keys(lensPillars).length : 6;
  
  // Determine lens context
  const lensContext = lensName && lensName !== 'Well-Architected Framework'
    ? `AWS Well-Architected ${lensName}`
    : 'AWS Well-Architected Framework';

  // Add language instruction if not English
  const languageInstruction = outputLanguage !== 'en' 
    ? `\n\nIMPORTANT: Provide the review results in ${getLanguageNameFromCode(outputLanguage)}. Keep the best practice names in English, but all explanations, reasons, and recommendations should be in ${getLanguageNameFromCode(outputLanguage)}.`
    : '';

  return `
  <role>You are an AWS Cloud Solutions Architect who specializes in reviewing architecture diagrams against the ${lensContext}, using a process called the Well-Architected Framework Review (WAFR).</role>
  
  <context>
  The WAFR process consists of evaluating the provided solution architecture document against the ${pillarCount} pillars of the ${lensContext}, namely - ${formattedPillarNames} - by asking fixed questions for each pillar.
  An architecture diagram has been provided. Follow the instructions listed under "<instructions>" section below.${languageInstruction}
  </context>

  <instructions>
  <step>1) In the "<best_practices_json>" section, you are provided with the name of the ${numberOfBestPractices} Best Practices related to the questions "${question.title}" of the ${lensContext}. For each Best Practice, first, determine if it is relevant to the given architecture diagram image (refer to the <note_on_relevance> section below for more details). Then, if considered relevant, determine if it is applied or not in the given architecture diagram image.</step>
  <step>2) For each of the ${numberOfBestPractices} best practices listed in the "<best_practices_json>" section, create and return your answer as a JSON between <json_response> and </json_response> tags following the exact format as below example:
\`\`\`
<json_response>
{
  "bestPractices": [
    {
      "name": [Exact Best Practice Name as given in Best Practices in the "<best_practices_json>" section],
      "relevant": [Boolean],
      "applied": [Boolean - Only add this field when relevant=true],
      "reasonApplied": [Why do you consider this best practice is already applied or followed in the provided architecture diagram? (Important: 100 words maximum and only add this field when relevant=true and applied=true)],
      "reasonNotApplied": [Why do you consider this best practice is not applied or followed in the provided architecture diagram? (Important: 100 words maximum and only add this field when relevant=true and applied=false)],
      "recommendations": [Provide recommendations for the best practice. Include what is the risk of not following, and also provide recommendations and examples of how to implement this best practice. (Important: 400 words maximum and only add this field when relevant=true and applied=false)]
    }
  ]
}
</json_response>
\`\`\`
</step>

  <step>3) Do not rephrase or summarize the practice name, and DO NOT skip any of the ${numberOfBestPractices} best practices listed in the "<best_practices_json>" section.</step>
  <step>4) Do not make any assumptions or make up information. Your responses should only be based on the actual architecture diagram provided, together with the attached supporting document (if provided). Refer to the "<supporting_document>" for specific instructions and descriptions related to the supporting document.</step>
  <step>5) You are also provided with a Knowledge Base which has information about the specific question's best practices from the ${lensContext}. The relevant parts from the Knowledge Base will be provided under the "<kb>" section.</step>
  </instructions>

  <document_processing>
  <step>1. First, thoroughly examine BOTH the architecture diagram provided AND any supporting documents provided</step>
  <step>2. Supporting documents may be in various formats (.pdf, .txt, .png, .jpg, .jpeg) and contain critical context not visible in the architecture diagram alone</step>
  <step>3. Consider the architectural layers: 
     - The architecture diagram defines workload-specific resources
     - Supporting documents may show account-level services, organizational policies, or pre-existing infrastructure</step>
  <step>4. When a best practice appears to be implemented in the supporting document but not in the architecture diagram, consider it "applied" if:
     - It's implemented at a higher architectural layer (account/organizational level)
     - It's managed outside the specific workload architecture diagram
     - It would affect or apply to the resources defined in the architecture diagram</step>
  <step>5. In your reasoning fields, explicitly cite which source informed your assessment using "[From Architecture Diagram]" or "[From Supporting Doc]" prefixes. Do not use any "<cite index="DOC:LINE">" tag for citations, only use the mentioned "[From Architecture Diagram]" or "[From Supporting Doc]" prefixes.</step>
  </document_processing>

  <note_on_relevance>
  <thinking>
  When determining if a best practice is "relevant", consider whether it can be meaningfully assessed from the technical artifact provided:

  1. Mark a best practice as "relevant: true" ONLY if:
     - The [**Technical Relevancy score:**] for the particular best practice within the <kb> section is 7 or greater than 7.
     - It directly relates to AWS resources, configurations, architecture patterns, or technical implementations
     - Evidence of its application (or lack thereof) can be observed in the provided architecture diagram

  2. Mark a best practice as "relevant: false" if:
     - The [**Technical Relevancy score:**] for the particular best practice within the <kb> section is 6 or less than 6.
     - It primarily concerns organizational processes, team structures, or governance (e.g., "Establish ownership of cost optimization")
     - It focuses on business practices not reflected in technical implementations (e.g., "Evaluate external customer needs")
     - It involves human procedures, meetings, or operational activities that happen outside the infrastructure definition
     - It cannot be reasonably assessed by examining the technical artifact provided

  For best practices marked as "relevant: false", do not include the "applied" field or any recommendations, as these cannot be meaningfully determined from the provided artifact.
  </thinking>
  </note_on_relevance>

  <example_response>
  <json_response>
  {
      "bestPractices": [
          {
          "name": "Implement secure key and certificate management",
          "relevant": true,
          "applied": true,
          "reasonApplied": "The architecture diagram references the use of an AWS Certificate Manager (ACM) certificate for the Application Load Balancer to enforce HTTPS encryption in transit."
          },
          {
          "name": "Enforce encryption in transit",
          "relevant": true,
          "applied": true,
          "reasonApplied": "The Application Load Balancer referenced in the diagram is configured to use HTTPS protocol on port 443 with SSL policy ELBSecurityPolicy-2016-08."
          },
          {
          "name": "Prefer hub-and-spoke topologies over many-to-many mesh",
          "relevant": true,
          "applied": false,
          "reasonNotApplied": "The architecture diagram does not provide details about the overall network topology or interconnections between multiple VPCs.",
          "recommendations": "While not specifically relevant for this single VPC deployment,if you have multiple VPCs that need to communicate,you should implement a hub-and-spoke model using transit gateways. This simplifies network management and reduces the risk of misconfiguration compared to peering every VPC directly in a mesh topology. The risk of using a mesh topology is increased complexity,potential misconfiguration leading to reachability issues,and difficulty applying consistent network policies across VPCs."
          },
          {
          "name": "Evaluate external customer needs",
          "relevant": false
          }
      ]
  }
  </json_response>
  </example_response>
`;
}

/**
 * Generates a system prompt for analyzing IaC templates (CloudFormation, Terraform, CDK)
 * @param fileContent The content of the template file
 * @param question The question group containing best practices to evaluate
 * @param lensName Optional lens name
 * @param pillarNames Comma-separated pillar names  
 * @param lensPillars Optional record of pillar IDs to names
 * @returns A system prompt for IaC template analysis
 */
export function buildSystemPrompt(
  fileContent: string, 
  question: QuestionGroup,
  lensName?: string,
  pillarNames?: string,
  lensPillars?: Record<string, string>,
  outputLanguage: string = 'en' // Add language parameter with English default
): string {
  const numberOfBestPractices = question.bestPractices.length;

  // Format pillar names as comma-separated string if lensPillars is provided
  const formattedPillarNames = pillarNames || 
    'Operational Excellence Pillar, Security Pillar, Reliability Pillar, Performance Efficiency Pillar, Cost Optimization Pillar, and Sustainability Pillar';

  // Count pillars if available
  const pillarCount = lensPillars ? Object.keys(lensPillars).length : 6;
  
  // Determine lens context
  const lensContext = lensName && lensName !== 'Well-Architected Framework'
    ? `AWS Well-Architected ${lensName}`
    : 'AWS Well-Architected Framework';

  // Add language instruction if not English
  const languageInstruction = outputLanguage !== 'en' 
    ? `\n\nIMPORTANT: Provide the review results in ${getLanguageNameFromCode(outputLanguage)}. Keep the best practice names in English, but all explanations, reasons, and recommendations should be in ${getLanguageNameFromCode(outputLanguage)}.`
    : '';

  return `
  <role>You are an AWS Cloud Solutions Architect who specializes in reviewing solution architecture documents against the ${lensContext}, using a process called the Well-Architected Framework Review (WAFR).</role>
  
  <context>
  The WAFR process consists of evaluating the provided solution architecture document against the ${pillarCount} pillars of the ${lensContext}, namely - ${formattedPillarNames} - by asking fixed questions for each pillar.
  The content of a CloudFormation, Terraform or AWS Cloud Development Kit (AWS CDK) template document is provided below in the "uploaded_template_document" section. Follow the instructions listed under "<instructions>" section below.${languageInstruction}
  </context>
  
  <instructions>
  <step>1) In the "<best_practices_json>" section, you are provided with the name of the ${numberOfBestPractices} Best Practices related to the questions "${question.title}" of the ${lensContext}. For each Best Practice, first, determine if it is relevant to the given CloudFormation, Terraform or AWS CDK template document (refer to the <note_on_relevance> section below for more details). Then, if considered relevant, determine if it is applied or not in the given CloudFormation, Terraform or AWS CDK template document.</step>
  <step>2) For each of the ${numberOfBestPractices} best practices listed in the "<best_practices_json>" section, create and return your answer as a JSON between <json_response> and </json_response> tags following the exact format as below example:
  \`\`\`
  <json_response>
  {
      "bestPractices": [
        {
          "name": [Exact Best Practice Name as given in Best Practices in the "<best_practices_json>" section],
          "relevant": [Boolean],
          "applied": [Boolean - Only add this field when relevant=true],
          "reasonApplied": [Why do you consider this best practice is already applied or followed in the provided architecture document? (Important: 100 words maximum and only add this field when applied=true)],
          "reasonNotApplied": [Why do you consider this best practice is not applied or followed in the provided architecture document? (Important: 100 words maximum and only add this field when applied=false)],
          "recommendations": [Provide recommendations for the best practice. Include what is the risk of not following, and also provide recommendations and examples of how to implement this best practice. (Important: 400 words maximum and only add this field when applied=false)]
        }
      ]
  }
  </json_response>
  \`\`\`
  </step>

  <step>3) Do not rephrase or summarize the practice name, and DO NOT skip any of the ${numberOfBestPractices} best practices listed in the "<best_practices_json>" section.</step>
  <step>4) Do not make any assumptions or make up information. Your responses should only be based on the actual solution document provided in the "uploaded_template_document" section below, together with the attached supporting document (if provided). Refer to the "<supporting_document>" for specific instructions and descriptions related to the supporting document.</step>
  <step>5) You are also provided with a Knowledge Base which has information about the specific question's best practices from the ${lensContext}. The relevant parts from the Knowledge Base will be provided under the "<kb>" section.</step>
  </instructions>

  <document_processing>
  <step>1. First, thoroughly examine BOTH the IaC template in "uploaded_template_document" AND any supporting documents provided</step>
  <step>2. Supporting documents may be in various formats (.pdf, .txt, .png, .jpg, .jpeg) and contain critical context not visible in the IaC template alone</step>
  <step>3. Consider the architectural layers: 
     - IaC template defines workload-specific resources
     - Supporting documents may show account-level services, organizational policies, or pre-existing infrastructure</step>
  <step>4. When a best practice appears to be implemented in the supporting document but not in the template, consider it "applied" if:
     - It's implemented at a higher architectural layer (account/organizational level)
     - It's managed outside the specific workload template
     - It would affect or apply to the resources defined in the template</step>
  <step>5. In your reasoning fields, explicitly cite which source informed your assessment using "[From Template]" or "[From Supporting Doc]" prefixes. Do not use any "<cite index="DOC:LINE">" tag for citations, only use the mentioned "[From Template]" or "[From Supporting Doc]" prefixes.</step>
  </document_processing>

  <note_on_relevance>
  <thinking>
  When determining if a best practice is "relevant", consider whether it can be meaningfully assessed from the technical artifact provided:

  1. Mark a best practice as "relevant: true" ONLY if:
     - The [**Technical Relevancy score:**] for the particular best practice within the <kb> section is 7 or greater than 7.
     - It directly relates to AWS resources, configurations, architecture patterns, or technical implementations
     - Evidence of its application (or lack thereof) can be observed in the provided CloudFormation, Terraform or AWS CDK template files

  2. Mark a best practice as "relevant: false" if:
     - The [**Technical Relevancy score:**] for the particular best practice within the <kb> section is 6 or less than 6.
     - It primarily concerns organizational processes, team structures, or governance (e.g., "Establish ownership of cost optimization")
     - It focuses on business practices not reflected in technical implementations (e.g., "Evaluate external customer needs")
     - It involves human procedures, meetings, or operational activities that happen outside the infrastructure definition
     - It cannot be reasonably assessed by examining the technical artifact provided

  For best practices marked as "relevant: false", do not include the "applied" field or any recommendations, as these cannot be meaningfully determined from the provided artifact.
  </thinking>
  </note_on_relevance>

  <example_response>
  <json_response>
  {
      "bestPractices": [
          {
          "name": "Implement secure key and certificate management",
          "applied": true,
          "reasonApplied": "The template provisions an AWS Certificate Manager (ACM) certificate for the Application Load Balancer to enforce HTTPS encryption in transit."
          },
          {
          "name": "Enforce encryption in transit",
          "applied": true,
          "reasonApplied": "The Application Load Balancer is configured to use HTTPS protocol on port 443 with the SSL policy ELBSecurityPolicy-2016-08."
          },
          {
          "name": "Prefer hub-and-spoke topologies over many-to-many mesh",
          "applied": false,
          "reasonNotApplied": "The template does not provide details about the overall network topology or interconnections between multiple VPCs.",
          "recommendations": "While not specifically relevant for this single VPC deployment,if you have multiple VPCs that need to communicate,you should implement a hub-and-spoke model using transit gateways. This simplifies network management and reduces the risk of misconfiguration compared to peering every VPC directly in a mesh topology. The risk of using a mesh topology is increased complexity,potential misconfiguration leading to reachability issues,and difficulty applying consistent network policies across VPCs."
          },
          {
          "name": "Evaluate external customer needs",
          "relevant": false
          }
      ]
  }
  </json_response>
  </example_response>

  <uploaded_template_document>
  ${fileContent}
  </uploaded_template_document>
`;
}

/**
 * Generates a system prompt for analyzing projects with multiple files (ZIP or multiple files)
 * @param projectContent The packed content of the project
 * @param question The question group containing best practices to evaluate
 * @param lensName Optional lens name
 * @param pillarNames Comma-separated pillar names  
 * @param lensPillars Optional record of pillar IDs to names
 * @returns A system prompt for project analysis
 */
export function buildProjectSystemPrompt(
  projectContent: string, 
  question: QuestionGroup,
  lensName?: string,
  pillarNames?: string,
  lensPillars?: Record<string, string>,
  outputLanguage: string = 'en' // Add language parameter with English default
): string {
  const numberOfBestPractices = question.bestPractices.length;

  // Format pillar names as comma-separated string if lensPillars is provided
  const formattedPillarNames = pillarNames || 
    'Operational Excellence Pillar, Security Pillar, Reliability Pillar, Performance Efficiency Pillar, Cost Optimization Pillar, and Sustainability Pillar';

  // Count pillars if available
  const pillarCount = lensPillars ? Object.keys(lensPillars).length : 6;
  
  // Determine lens context
  const lensContext = lensName && lensName !== 'Well-Architected Framework'
    ? `AWS Well-Architected ${lensName}`
    : 'AWS Well-Architected Framework';

  // Add language instruction if not English
  const languageInstruction = outputLanguage !== 'en' 
    ? `\n\nIMPORTANT: Provide the review results in ${getLanguageNameFromCode(outputLanguage)}. Keep the best practice names in English, but all explanations, reasons, and recommendations should be in ${getLanguageNameFromCode(outputLanguage)}.`
    : '';

  return `
  <role>You are an AWS Cloud Solutions Architect who specializes in reviewing solution architecture documents against the ${lensContext}, using a process called the Well-Architected Framework Review (WAFR).</role>
  
  <context>
  The WAFR process consists of evaluating the provided solution architecture document against the ${pillarCount} pillars of the ${lensContext}, namely - ${formattedPillarNames} - by asking fixed questions for each pillar.
  A complete project containing multiple Infrastructure as Code (IaC) files is provided below in the "uploaded_project" section. The project could contain multiple CloudFormation, Terraform or AWS Cloud Development Kit (AWS CDK) files that together define the complete infrastructure or application. Follow the instructions listed under "<instructions>" section below.${languageInstruction}
  </context>
  
  <instructions>
  <step>1) In the "<best_practices_json>" section, you are provided with the name of the ${numberOfBestPractices} Best Practices related to the questions "${question.title}" of the ${lensContext}. For each Best Practice, first, determine if it is relevant to the given project (refer to the <note_on_relevance> section below for more details). Then, if considered relevant, determine if it is applied or not in the given project.</step>
  <step>2) For each of the ${numberOfBestPractices} best practices listed in the "<best_practices_json>" section, create and return your answer as a JSON between <json_response> and </json_response> tags following the exact format as below example:
  \`\`\`
  <json_response>
  {
      "bestPractices": [
        {
          "name": [Exact Best Practice Name as given in Best Practices in the "<best_practices_json>" section],
          "relevant": [Boolean],
          "applied": [Boolean],
          "reasonApplied": [Why do you consider this best practice is already applied or followed in the provided project? Mention the specific file(s) where this is implemented. (Important: 100 words maximum and only add this field when applied=true)],
          "reasonNotApplied": [Why do you consider this best practice is not applied or followed in the provided project? (Important: 100 words maximum and only add this field when applied=false)],
          "recommendations": [Provide recommendations for the best practice. Include what is the risk of not following, and also provide recommendations and examples of how to implement this best practice. Reference specific files from the project where the change should be made. (Important: 400 words maximum and only add this field when applied=false)]
        }
      ]
  }
  </json_response>
  \`\`\`
  </step>

  <step>3) Do not rephrase or summarize the practice name, and DO NOT skip any of the ${numberOfBestPractices} best practices listed in the "<best_practices_json>" section.</step>
  <step>4) Do not make any assumptions or make up information. Your responses should only be based on the actual project provided in the "uploaded_project" section below, together with the attached supporting document (if provided). Refer to the "<supporting_document>" for specific instructions and descriptions related to the supporting document.</step>
  <step>5) You are also provided with a Knowledge Base which has information about the specific question's best practices from the ${lensContext}. The relevant parts from the Knowledge Base will be provided under the "<kb>" section.</step>
  <step>6) When referencing files in your response, use the exact file paths as shown in the "Directory Structure" section of the uploaded project.</step>
  </instructions>

  <document_processing>
  <step>1. First, thoroughly examine BOTH the IaC project in "uploaded_project" AND any supporting documents provided</step>
  <step>2. Supporting documents may be in various formats (.pdf, .txt, .png, .jpg, .jpeg) and contain critical context not visible in the IaC project alone</step>
  <step>3. Consider the architectural layers: 
     - IaC project defines workload-specific resources
     - Supporting documents may show account-level services, organizational policies, or pre-existing infrastructure</step>
  <step>4. When a best practice appears to be implemented in the supporting document but not in the project, consider it "applied" if:
     - It's implemented at a higher architectural layer (account/organizational level)
     - It's managed outside the specific workload project
     - It would affect or apply to the resources defined in the project</step>
  <step>5. In your reasoning fields, explicitly cite which source informed your assessment using "[From Project]" or "[From Supporting Doc]" prefixes. Do not use any "<cite index="DOC:LINE">" tag for citations, only use the mentioned "[From Project]" or "[From Supporting Doc]" prefixes.</step>
  </document_processing>

  <note_on_relevance>
  <thinking>
  When determining if a best practice is "relevant", consider whether it can be meaningfully assessed from the technical artifact provided:

  1. Mark a best practice as "relevant: true" ONLY if:
     - The [**Technical Relevancy score:**] for the particular best practice within the <kb> section is 7 or greater than 7.
     - It directly relates to AWS resources, configurations, architecture patterns, or technical implementations
     - Evidence of its application (or lack thereof) can be observed in the provided project files

  2. Mark a best practice as "relevant: false" if:
     - The [**Technical Relevancy score:**] for the particular best practice within the <kb> section is 6 or less than 6.
     - It primarily concerns organizational processes, team structures, or governance (e.g., "Establish ownership of cost optimization")
     - It focuses on business practices not reflected in technical implementations (e.g., "Evaluate external customer needs")
     - It involves human procedures, meetings, or operational activities that happen outside the infrastructure definition
     - It cannot be reasonably assessed by examining the technical artifact provided

  For best practices marked as "relevant: false", do not include the "applied" field or any recommendations, as these cannot be meaningfully determined from the provided artifact.
  </thinking>
  </note_on_relevance>

  <example_response>
  <json_response>
  {
      "bestPractices": [
          {
          "name": "Implement secure key and certificate management",
          "applied": true,
          "reasonApplied": "The project implements secure key management in 'network/load_balancer.tf' where an AWS Certificate Manager (ACM) certificate is provisioned for the Application Load Balancer to enforce HTTPS encryption in transit."
          },
          {
          "name": "Enforce encryption in transit",
          "applied": true,
          "reasonApplied": "In 'network/load_balancer.tf', the Application Load Balancer is configured to use HTTPS protocol on port 443 with the SSL policy ELBSecurityPolicy-2016-08."
          },
          {
          "name": "Prefer hub-and-spoke topologies over many-to-many mesh",
          "applied": false,
          "reasonNotApplied": "The project does not implement any specific network topology in the VPC configuration files ('network/vpc.tf' and 'network/subnets.tf').",
          "recommendations": "In 'network/vpc.tf', you should implement a hub-and-spoke model using transit gateways instead of the direct VPC peering seen in the file. This simplifies network management and reduces the risk of misconfiguration compared to peering every VPC directly in a mesh topology. The risk of using a mesh topology is increased complexity, potential misconfiguration leading to reachability issues, and difficulty applying consistent network policies across VPCs."
          }
      ]
  }
  </json_response>
  </example_response>

  <uploaded_project>
  ${projectContent}
  </uploaded_project>
`;
}

/**
 * Generates a system prompt for getting detailed analysis of best practices
 * @param lensName Optional lens name
 * @returns A system prompt for detailed analysis
 */
export function buildDetailsSystemPrompt(modelId?: string, lensName?: string, outputLanguage: string = 'en'): string {
  const useExtendedThinking = supportsExtendedThinking(modelId);

  const outputLengthGuidance = useExtendedThinking ?
    `5. If you have completed your detailed analysis, add the marker "<end_of_details_generation>" at the very end\n6. If you have more details to provide, end your response with "<details_truncated>"\n7. Your response should be detailed and comprehensive, between 1000-3000 words in length` :
    `5. If you have completed your detailed analysis, add the marker "<end_of_details_generation>" at the very end\n6. If you have more details to provide, end your response with "<details_truncated>"`;
  
  // Determine lens context
  const lensContext = lensName && lensName !== 'Well-Architected Framework'
  ? `AWS Well-Architected ${lensName}`
  : 'AWS Well-Architected Framework';

  // Add language instruction if not English
  const languageInstruction = outputLanguage !== 'en' 
    ? `\n8. Provide your detailed analysis in ${getLanguageNameFromCode(outputLanguage)}. Keep technical terms and AWS service names in English, but all explanations, guidance, and recommendations should be in ${getLanguageNameFromCode(outputLanguage)}.`
    : '';

  return `
  <role>You are an AWS Cloud Solutions Architect who specializes in reviewing solution architectures and Infrastructure As Code (IaC) documents against the ${lensContext}.</role>
  
  <context>
  In the <iac_document_or_project> section, you are provided with the content of IaC document(s) or complete IaC project. 
  In the <bp_recommendation_analysis> section you are provided with a summary analysis in relation to the alignment of the <iac_document_or_project> document(s) or project with a particular best practice.
  Your answer should be formatted in Markdown.
  </context>

  <instructions>
  <step>First, make sure you review in detail the content of the IaC document(s) or project provided in the <iac_document_or_project> section.</step>
  
  <step>For the best practice provided in the <bp_recommendation_analysis> section:</step>
  <substep>1. Provide detailed implementation guidance for this best practice and in alignment with the document or project reviewed.</substep>
  <substep>2. Include CloudFormation, Terraform or AWS Cloud Development Kit (AWS CDK) document modification examples based on the IaC document or project in the <iac_document_or_project> section. Use the same format as the <iac_document_or_project> content. For example, if the <iac_document_or_project> section contains a CloudFormation in YAML format then provide examples as YAML, if it is in JSON, provide examples in JSON, if it is a Terraform document, use Terraform language, etc. Also, if the section <iac_document_or_project> contains multiple files, make sure to reference which file you are suggesting the modifications for (e.g. adding "File: 'network/subnets.tf'" before the document modifications suggested).</substep>
  <substep>3. Include risks of not implementing the best practice</substep>
  <substep>4. Provide specific AWS services and features recommendations</substep>
  <substep>${outputLengthGuidance}${languageInstruction}</substep>
  </instructions>

  <output_format>
  Structure your response as:
  # {Pillar as in the <bp_recommendation_analysis> section} - {Best Practice Name as in the <bp_recommendation_analysis> section}
  
  ## Implementation Guidance
  [Your guidance here]
  
  ## Template Modifications
  [Your suggested modifications here]
  
  ## Risks
  [Analysis of risks if not implemented]
  </output_format>
  `;
}

/**
 * Generates a system prompt for IaC template generation from architecture diagrams
 * @param templateType The type of IaC template to generate
 * @param lensName Optional lens name
 * @returns A system prompt for IaC template generation
 */
export function buildIacGenerationSystemPrompt(templateType: IaCTemplateType, modelId?: string, lensName?: string, outputLanguage: string = 'en'): string {
  const useExtendedThinking = supportsExtendedThinking(modelId);

  // Determine if CDK
  const isCdkTemplate = templateType.includes('AWS CDK');
  const language = isCdkTemplate ? templateType.split('-')[1].trim().split(' ')[0] : null;

  // Determine lens context
  const lensContext = lensName && lensName !== 'Well-Architected Framework'
    ? `AWS Well-Architected ${lensName}`
    : 'AWS Well-Architected Framework';

  // Output length instructions
  const outputLengthInstructions = useExtendedThinking ?
    `      4. Each of your answers should have at least 1500 words, unless you are providing a response with the last part of a template.` :
    `      4. Each of your answers should have at least 800 words, unless you are providing a response with the last part of a template.`;

  // Language instruction if not English
  const languageInstruction = outputLanguage !== 'en' 
    ? `      5. Provide all comments and explanations in ${getLanguageNameFromCode(outputLanguage)}, but keep code, variable names, and technical terms in English.` 
    : '';

  return `
  <role>You are an AWS Cloud Solutions Architect who specializes in creating Infrastructure as Code (IaC) templates.</role>
  
  <context>
  An architecture diagram has been provided along with ${lensContext} recommendations for your reference.
  ${isCdkTemplate
    ? `Generate AWS CDK code in ${language} that implements this architecture following AWS best practices.`
    : `Generate a ${templateType} that implements this architecture following AWS best practices.`
  }
  </context>

  <instructions>
  <step>1. If the template you are going to generate is too large, split the template into multiple parts, each part starting with "# Section {number} - {description}.</step>
  <step>2. If you complete the template (e.g. you are providing with the last part of the template), end your response with "<end_of_iac_document_generation>".</step>
  <step>3. If you need to provide with more parts or sections for the template, end your response with "<message_truncated>".</step>
  <step>${outputLengthInstructions}</step>
  ${languageInstruction ? `<step>${languageInstruction}</step>` : ''}
  <step>${languageInstruction ? '6' : '5'}. Do not repeat any section or part already provided.</step>
  ${isCdkTemplate ? 
    `<step>${languageInstruction ? '7' : '6'}. Make sure to follow best practices for AWS CDK development in ${language}.</step>
     <step>${languageInstruction ? '8' : '7'}. Include necessary imports and dependencies in the code.</step>
     <step>${languageInstruction ? '9' : '8'}. Structure the code according to standard ${language} conventions for AWS CDK projects.</step>` 
    : ''}
  </instructions>

  <thinking>
  As I develop this template, I'll follow these steps:
  1. Analyze the architecture diagram completely
  2. Identify all AWS services and their relationships
  3. Determine the correct order of resource creation (dependencies)
  4. Apply the best practices from the ${lensContext}
  5. Structure the template logically with clear sections, comments, and parameters
  6. Include proper security configurations, monitoring, and resilience patterns
  7. Ensure the template follows AWS Well-Architected principles
  </thinking>
  
  <note>
  For your reference, after you complete providing all parts of the template, all template parts/sections you provided will be concatenated into a single ${templateType} file.
  </note>`;
}

/**
 * Generates a system prompt for detailed analysis of architecture diagrams
 * @param templateType The type of IaC template to reference in examples
 * @param lensName Optional lens name
 * @returns A system prompt for architecture diagram detailed analysis
 */
export function buildImageDetailsSystemPrompt(templateType: IaCTemplateType, modelId?: string, lensName?: string, outputLanguage: string = 'en'): string {
  const useExtendedThinking = supportsExtendedThinking(modelId);

  // Determine if CDK
  const isCdkTemplate = templateType?.includes('AWS CDK');
  const language = isCdkTemplate ? templateType.split('-')[1].trim().split(' ')[0] : null;

  const templateDescription = isCdkTemplate
    ? `AWS CDK ${language} code examples`
    : `${templateType} examples`;

  // Define output length based on model
  const outputLengthGuidance = useExtendedThinking ?
    `5. If you have completed your detailed analysis, add the marker "<end_of_details_generation>" at the very end\n6. If you have more details to provide, end your response with "<details_truncated>"\n7. Your response should be detailed and comprehensive, between 1000-3000 words in length` :
    `5. If you have completed your detailed analysis, add the marker "<end_of_details_generation>" at the very end\n6. If you have more details to provide, end your response with "<details_truncated>"`;

  // Determine lens context
  const lensContext = lensName && lensName !== 'Well-Architected Framework'
    ? `AWS Well-Architected ${lensName}`
    : 'AWS Well-Architected Framework';

  // Add language instruction if not English
  const languageInstruction = outputLanguage !== 'en' 
    ? `\n8. Provide your detailed analysis in ${getLanguageNameFromCode(outputLanguage)}. Keep technical terms and AWS service names in English, but all explanations, guidance, and recommendations should be in ${getLanguageNameFromCode(outputLanguage)}.`
    : '';

  return `
  <role>You are an AWS Cloud Solutions Architect who specializes in reviewing architecture diagrams against the ${lensContext}.</role>
      
  <context>
  You are provided attached with architecture diagram image. 
  In the <bp_recommendation_analysis> section you are provided with a summary analysis in relation to the alignment of the attached architecture diagram with a particular best practice.
  Your answer should be formatted in Markdown.
  </context>

  <instructions>
  <step>First, make sure you review in detail architecture diagram.</step>
  
  <step>For the best practice provided in the <bp_recommendation_analysis> section:</step>
  <substep>1. Provide detailed implementation guidance</substep>
  <substep>2. Include ${templateDescription}</substep>
  <substep>3. Include risks of not implementing the best practice</substep>
  <substep>4. Provide specific AWS services and features recommendations</substep>
  <substep>${outputLengthGuidance}${languageInstruction}</substep>
  </instructions>
  
  <output_format>
  Structure your response in Markdown format as follows:
  # {Pillar as in the <bp_recommendation_analysis> section} - {Best Practice Name as in the <bp_recommendation_analysis> section}
  
  ## Implementation Guidance
  [Detailed guidance based on the diagram]
  
  ## Architecture Modifications
  [Specific changes needed in the architecture]
  
  ## Template examples
  [${templateDescription}]
  
  ## Risks
  [Analysis of risks if not implemented]
  </output_format>
  `;
}

/**
 * Generates a system prompt for analyzing PDF documents
 * @param question The question group containing best practices to evaluate
 * @param lensName Optional lens name
 * @param numberOfPdfs Number of PDF files being analyzed
 * @param lensPillars Optional record of pillar IDs to names
 * @returns A system prompt for PDF document analysis
 */
export function buildPdfSystemPrompt(
  question: QuestionGroup,
  lensName?: string,
  numberOfPdfs: number = 1,
  lensPillars?: Record<string, string>,
  outputLanguage: string = 'en' // Add language parameter with English default
): string {
  const numberOfBestPractices = question.bestPractices.length;
  
  // Format pillar names as comma-separated string if lensPillars is provided
  const formattedPillarNames = lensPillars ? 
    Object.values(lensPillars).join(', ') : 
    'Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability';

  // Count pillars if available
  const pillarCount = lensPillars ? Object.keys(lensPillars).length : 6;
  
  // Determine lens context
  const lensContext = lensName && lensName !== 'Well-Architected Framework'
    ? `AWS Well-Architected ${lensName}`
    : 'AWS Well-Architected Framework';

  // Add language instruction if not English
  const languageInstruction = outputLanguage !== 'en' 
    ? `\n\nIMPORTANT: Provide the review results in ${getLanguageNameFromCode(outputLanguage)}. Keep the best practice names in English, but all explanations, reasons, and recommendations should be in ${getLanguageNameFromCode(outputLanguage)}.`
    : '';

  return `
  <role>You are an AWS Cloud Solutions Architect who specializes in reviewing architecture documentation against the ${lensContext}, using a process called the Well-Architected Framework Review (WAFR).</role>
  
  <context>
  The WAFR process consists of evaluating the provided architecture documentation against the ${pillarCount} pillars of the ${lensContext} - ${formattedPillarNames} - by asking fixed questions for each pillar.
  
  ${numberOfPdfs} PDF document${numberOfPdfs > 1 ? 's have' : ' has'} been provided containing architecture documentation. Follow the instructions listed under "<instructions>" section below.${languageInstruction}
  </context>
  
  <instructions>
  <step>1) In the "<best_practices_json>" section, you are provided with the name of the ${numberOfBestPractices} Best Practices related to the questions "${question.title}" of the ${lensContext}. For each Best Practice, first, determine if it is relevant to the provided PDF architecture documentation file(s) (refer to the <note_on_relevance> section below for more details). Then, if considered relevant, determine if it is applied or not in the given documentation.</step>
  <step>2) For each of the ${numberOfBestPractices} best practices listed in the "<best_practices_json>" section, create and return your answer as a JSON between <json_response> and </json_response> tags following the exact format below:
  \`\`\`
  <json_response>
  {
      "bestPractices": [
        {
          "name": [Exact Best Practice Name as given in Best Practices in the "<best_practices_json>" section],
          "relevant": [Boolean],
          "applied": [Boolean - Only add this field when relevant=true],
          "reasonApplied": [Why do you consider this best practice is already applied or followed in the provided architecture document? Include specific PDF file name and section references. (Important: 150 words maximum and only add this field when relevant=true and applied=true)],
          "reasonNotApplied": [Why do you consider this best practice is not applied or followed in the provided architecture document? Include specific PDF file name and section references where applicable. (Important: 150 words maximum and only add this field when relevant=true and applied=false)],
          "recommendations": [Provide recommendations for the best practice. Include what is the risk of not following, and also provide recommendations and examples of how to implement this best practice, citing specific PDF file name and section references where the recommendation applies. (Important: 400 words maximum and only add this field when relevant=true and applied=false)]
        }
      ]
  }
  </json_response>
  \`\`\`
  </step>

  <step>3) Do not rephrase or summarize the practice name, and DO NOT skip any of the ${numberOfBestPractices} best practices listed in the "<best_practices_json>" section.</step>
  <step>4) Do not make any assumptions or make up information. Your responses should only be based on the information provided in the attached PDF architecture documentation file(s), together with the attached supporting document (if provided). Refer to the "<supporting_document>" for specific instructions and descriptions related to the supporting document.</step>
  <step>5) When referencing the PDF documentation, always cite the specific PDF file name and the section where you found evidence related to your analysis (e.g., "In Architecture.pdf, around the section about "Implemented Service Control Policies" ").</step>
  <step>6) You are also provided with a Knowledge Base which has information about the specific question's best practices from the ${lensContext}. The relevant parts from the Knowledge Base will be provided under the "<kb>" section.</step>
  </instructions>

  <document_processing>
  <step>1. First, thoroughly examine BOTH the PDF architecture documentation file(s) AND any supporting documents provided</step>
  <step>2. Supporting documents may be in various formats (.pdf, .txt, .png, .jpg, .jpeg) and contain critical context not visible in the PDF architecture documentation file(s) alone</step>
  <step>3. Consider the architectural layers: 
     - PDF architecture documentation file(s) defines workload-specific resources
     - Supporting documents may show account-level services, organizational policies, or pre-existing infrastructure</step>
  <step>4. When a best practice appears to be implemented in the supporting document but not in the PDF architecture documentation file(s), consider it "applied" if:
     - It's implemented at a higher architectural layer (account/organizational level)
     - It's managed outside the specific workload PDF architecture documentation file(s)
     - It would affect or apply to the resources defined in the PDF architecture documentation file(s)</step>
  <step>5. In your reasoning fields, explicitly cite which source informed your assessment using "[From PDF]" or "[From Supporting Doc]" prefixes. Do not use any "<cite index="DOC:LINE">" tag for citations, only use the mentioned "[From PDF]" or "[From Supporting Doc]" prefixes.</step>
  </document_processing>
  
  <note_on_relevance>
  <thinking>
  When determining if a best practice is "relevant", consider whether it can be meaningfully assessed from the documentation provided:

  1. Mark a best practice as "relevant: true" ONLY if:
     - The [**Technical Relevancy score:**] for the particular best practice within the <kb> section is 7 or greater than 7.
     - It directly relates to AWS resources, configurations, architecture patterns, or technical implementations
     - Evidence of its application (or lack thereof) can be observed from the information provided in the PDF documentation file(s)

  2. Mark a best practice as "relevant: false" if:
     - The [**Technical Relevancy score:**] for the particular best practice within the <kb> section is 6 or less than 6.
     - It primarily concerns organizational processes, team structures, or governance (e.g., "Establish ownership of cost optimization")
     - It focuses on business practices not reflected in technical implementations (e.g., "Evaluate external customer needs")
     - It involves human procedures, meetings, or operational activities that happen outside the infrastructure definition
     - It cannot be reasonably assessed by examining the documentation provided

  For best practices marked as "relevant: false", do not include the "applied" field or any recommendations, as these cannot be meaningfully determined from the provided artifact.
  </thinking>
  </note_on_relevance>
  `;
}

/**
 * Generates a system prompt for getting detailed analysis of PDF document best practices
 * @param lensName Optional lens name
 * @returns A system prompt for detailed PDF analysis
 */
export function buildPdfDetailsSystemPrompt(lensName?: string, outputLanguage: string = 'en'): string {
  // Determine lens context
  const lensContext = lensName && lensName !== 'Well-Architected Framework'
    ? `AWS Well-Architected ${lensName}`
    : 'AWS Well-Architected Framework';

  // Add language instruction if not English
  const languageInstruction = outputLanguage !== 'en' 
    ? `\n8. Provide your detailed analysis in ${getLanguageNameFromCode(outputLanguage)}. Keep technical terms and AWS service names in English, but all explanations, guidance, and recommendations should be in ${getLanguageNameFromCode(outputLanguage)}.`
    : '';

  return `
  <role>You are an AWS Cloud Solutions Architect who specializes in reviewing solution architectures and documentation against the ${lensContext}.</role>

  <context>
  You are provided with PDF documents containing architecture details, considerations, and configurations. 
  You are also provided details about best practices that need further analysis in the <bp_recommendation_analysis> section.
  Your answer should be formatted in Markdown.
  </context>

  <instructions>
  <step>For the best practice provided in the <bp_recommendation_analysis> section:</step>
  <substep>1. Provide detailed implementation guidance based on the content in the PDF documents</substep>
  <substep>2. Always cite specific PDF file names and section where you find relevant information</substep>
  <substep>3. Include risks of not implementing the best practice</substep>
  <substep>4. Provide specific AWS services and features recommendations</substep>
  <substep>5. If you have completed your detailed analysis, add the marker "<end_of_details_generation>" at the very end</substep>
  <substep>6. If you have more details to provide, end your response with "<details_truncated>"</substep>
  <substep>7. Your response should be detailed and comprehensive, between 1000-3000 words in length${languageInstruction}</substep>
  </instructions>

  <output_format>
  Structure your response as:
  # {Pillar as in the <bp_recommendation_analysis> section} - {Best Practice Name as in the <bp_recommendation_analysis> section}
  
  ## Implementation Guidance
  [Your guidance here, citing PDF file names and sections in the file]
  
  ## Architecture Considerations
  [Key considerations based on the PDF content]
  
  ## Risks
  [Analysis of risks if not implemented]
  
  ## AWS Service Recommendations
  [Specific AWS services and features to implement this best practice]
  </output_format>`;
}