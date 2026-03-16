import { QuestionGroup } from '../shared/interfaces/analysis.interface';

/**
 * Builds a prompt for analyzing architecture diagrams
 * @param question The question group containing best practices to evaluate
 * @param kbContexts Knowledge base contexts from Bedrock
 * @param supportingDocName Name of supporting document (if any)
 * @param supportingDocDescription Description of supporting document (if any)
 * @returns A prompt for architecture diagram analysis
 */
export function buildImagePrompt(
  question: QuestionGroup,
  kbContexts: string[],
  supportingDocName?: string,
  supportingDocDescription?: string
): string {
  const bestPracticesJson = JSON.stringify({
    pillar: question.pillar,
    question: question.title,
    bestPractices: question.bestPractices
  }, null, 2);

  let prompt = `
  <best_practices_json>
  ${bestPracticesJson}
  </best_practices_json>

  <kb>
  ${kbContexts.join('\n\n')}
  </kb>
`;

  // Add supporting document reference if provided
  if (supportingDocName && supportingDocDescription) {
    prompt += `
  
  <supporting_document>
  <description>
  The attached file named "${supportingDocName}" has been provided as a supporting document that contains CRITICAL context for your assessment. This document may be in any format (.pdf, .txt, .png, .jpg, .jpeg) and requires your careful analysis.

  IMPORTANT INSTRUCTIONS:
  1. Begin by thoroughly examining this supporting document BEFORE analyzing the architecture diagram image
  2. Extract all relevant information, especially:
     - Account-level or organization-level services/configurations
     - Pre-existing infrastructure that interacts with the architecture diagram image
     - Security controls, governance mechanisms, and operational procedures
     - Architectural patterns and relationships not visible in the architecture diagram image alone
  
  3. When assessing best practices, consider the COMPLETE ARCHITECTURE:
     - The architecture diagram image may implement workload-specific resources
     - The supporting document may show broader context (account-level services, shared resources)
     - A best practice should be considered "applied" if implemented at ANY layer affecting the workload
  
  4. If your assessment is influenced by this supporting document:
     - Begin your reasoning with "[From Supporting Doc]" 
     - Explicitly state which elements from the supporting document led to your conclusion
     - Explain how these elements relate to the resources defined in the architecture diagram image
  
  Below is a brief description of the supporting document attached: 
  ${supportingDocDescription}
  </description>
  </supporting_document>
  `;
  }

  return prompt;
}

/**
 * Builds a prompt for analyzing IaC templates
 * @param question The question group containing best practices to evaluate
 * @param kbContexts Knowledge base contexts from Bedrock
 * @param supportingDocName Name of supporting document (if any)
 * @param supportingDocDescription Description of supporting document (if any)
 * @param fileContent Optional IaC template content to include at the top of the prompt
 * @returns A prompt for IaC template analysis
 */
export function buildPrompt(
  question: QuestionGroup,
  kbContexts: string[],
  supportingDocName?: string,
  supportingDocDescription?: string,
  fileContent?: string
): string {
  const bestPracticesJson = JSON.stringify({
    pillar: question.pillar,
    question: question.title,
    bestPractices: question.bestPractices
  }, null, 2);

  // Start with longform document content at the top when provided
  let prompt = '';

  if (fileContent) {
    prompt += `
  <uploaded_document>
  ${fileContent}
  </uploaded_document>

`;
  }

  prompt += `
  <best_practices_json>
  ${bestPracticesJson}
  </best_practices_json>

  <kb>
  ${kbContexts.join('\n\n')}
  </kb>
`;

  // Add supporting document reference if provided
  if (supportingDocName && supportingDocDescription) {
    prompt += `
  
  <supporting_document>
  <description>
  The attached file named "${supportingDocName}" has been provided as a supporting document that contains CRITICAL context for your assessment. This document may be in any format (.pdf, .txt, .png, .jpg, .jpeg) and requires your careful analysis.

  IMPORTANT INSTRUCTIONS:
  1. Begin by thoroughly examining this supporting document BEFORE analyzing the template
  2. Extract all relevant information, especially:
     - Account-level or organization-level services/configurations
     - Pre-existing infrastructure that interacts with the template
     - Security controls, governance mechanisms, and operational procedures
     - Architectural patterns and relationships not visible in the template alone
  
  3. When assessing best practices, consider the COMPLETE ARCHITECTURE:
     - The template may implement workload-specific resources
     - The supporting document may show broader context (account-level services, shared resources)
     - A best practice should be considered "applied" if implemented at ANY layer affecting the workload
  
  4. If your assessment is influenced by this supporting document:
     - Begin your reasoning with "[From Supporting Doc]" 
     - Explicitly state which elements from the supporting document led to your conclusion
     - Explain how these elements relate to the resources defined in the template
  
  Below is a brief description of the supporting document attached: 
  ${supportingDocDescription}
  </description>
  </supporting_document>
  `;
  }

  return prompt;
}

/**
 * Builds a prompt for analyzing projects (multiple files or zip)
 * @param question The question group containing best practices to evaluate
 * @param kbContexts Knowledge base contexts from Bedrock
 * @param supportingDocName Name of supporting document (if any)
 * @param supportingDocDescription Description of supporting document (if any)
 * @param projectContent Optional project packed content to include at the top of the prompt
 * @returns A prompt for project analysis
 */
export function buildProjectPrompt(
  question: QuestionGroup,
  kbContexts: string[],
  supportingDocName?: string,
  supportingDocDescription?: string,
  projectContent?: string
): string {
  const bestPracticesJson = JSON.stringify({
    pillar: question.pillar,
    question: question.title,
    bestPractices: question.bestPractices
  }, null, 2);

  // Start with longform project content at the top when provided
  let prompt = '';

  if (projectContent) {
    prompt += `
  <uploaded_project>
  ${projectContent}
  </uploaded_project>

`;
  }

  prompt += `
  <best_practices_json>
  ${bestPracticesJson}
  </best_practices_json>

  <kb>
  ${kbContexts.join('\n\n')}
  </kb>
`;

  // Add supporting document reference if provided
  if (supportingDocName && supportingDocDescription) {
    prompt += `
  
  <supporting_document>
  <description>
  The attached file named "${supportingDocName}" has been provided as a supporting document that contains CRITICAL context for your assessment. This document may be in any format (.pdf, .txt, .png, .jpg, .jpeg) and requires your careful analysis.

  IMPORTANT INSTRUCTIONS:
  1. Begin by thoroughly examining this supporting document BEFORE analyzing the IaC project
  2. Extract all relevant information, especially:
     - Account-level or organization-level services/configurations
     - Pre-existing infrastructure that interacts with the IaC project
     - Security controls, governance mechanisms, and operational procedures
     - Architectural patterns and relationships not visible in the IaC project alone
  
  3. When assessing best practices, consider the COMPLETE ARCHITECTURE:
     - The IaC project may implement workload-specific resources
     - The supporting document may show broader context (account-level services, shared resources)
     - A best practice should be considered "applied" if implemented at ANY layer affecting the workload
  
  4. If your assessment is influenced by this supporting document:
     - Begin your reasoning with "[From Supporting Doc]" 
     - Explicitly state which elements from the supporting document led to your conclusion
     - Explain how these elements relate to the resources defined in the IaC project
  
  Below is a brief description of the supporting document attached: 
  ${supportingDocDescription}
  </description>
  </supporting_document>
  `;
  }

  return prompt;
}