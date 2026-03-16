/**
 * Builds a prompt for getting detailed analysis of IaC template best practices
 * @param item The selected best practice item
 * @param fileContent The content of the IaC template
 * @param previousContent Any previous content from earlier analysis
 * @param supportingDocName Name of supporting document (if any)
 * @param supportingDocDescription Description of supporting document (if any)
 * @returns A prompt for detailed analysis
 */
export function buildDetailsPrompt(
  item: any,
  fileContent: string,
  previousContent: string,
  supportingDocName?: string,
  supportingDocDescription?: string
): string {
  // Longform document content placed first for optimal processing
  let prompt = `
    <iac_document_or_project>
    ${fileContent}
    </iac_document_or_project>

    <bp_recommendation_analysis>
    ${JSON.stringify([item], null, 2)}
    </bp_recommendation_analysis>
    ${previousContent ? `\n<previous_analysis>\n${previousContent}\n</previous_analysis>` : ''}
  `;

  // Add supporting document reference if provided
  if (supportingDocName && supportingDocDescription) {
    prompt += `
    
    <supporting_document>
    <description>
    The attached file named "${supportingDocName}" has been provided as a supporting document that contains CRITICAL context for your detailed analysis. This document may be in any format (.pdf, .txt, .png, .jpg, .jpeg) and requires your careful analysis.

    IMPORTANT INSTRUCTIONS:
    1. Begin by thoroughly examining this supporting document BEFORE analyzing the IaC template(s) or project
    2. Extract all relevant information, especially:
      - Account-level or organization-level services/configurations
      - Pre-existing infrastructure that interacts with the IaC template(s) or project
      - Security controls, governance mechanisms, and operational procedures
      - Architectural patterns and relationships not visible in the IaC template(s) or project alone
    
    3. When assessing best practices, consider the COMPLETE ARCHITECTURE:
      - The IaC template(s) or project may implement workload-specific resources
      - The supporting document may show broader context (account-level services, shared resources)
    
    4. If your detailed analysis is influenced by this supporting document:
      - Begin your reasoning with "[From Supporting Doc]" 
      - Explicitly state which elements from the supporting document led to your conclusion
      - Explain how these elements relate to the resources defined in the IaC template(s) or project
    
    Below is a brief description of the supporting document attached: 
    ${supportingDocDescription}
    </description>
    </supporting_document>
    `;
  }

  return prompt;
}

/**
 * Builds a prompt for getting detailed analysis of architecture diagram best practices
 * @param item The selected best practice item
 * @param previousContent Any previous content from earlier analysis
 * @param supportingDocName Name of supporting document (if any)
 * @param supportingDocDescription Description of supporting document (if any)
 * @returns A prompt for detailed image analysis
 */
export function buildImageDetailsPrompt(
  item: any,
  previousContent: string,
  supportingDocName?: string,
  supportingDocDescription?: string
): string {
  let prompt = `
  <bp_recommendation_analysis>
  ${JSON.stringify([item], null, 2)}
  </bp_recommendation_analysis>
  ${previousContent ? `\n<previous_analysis>\n${previousContent}\n</previous_analysis>` : ''}`;

  // Add supporting document reference if provided
  if (supportingDocName && supportingDocDescription) {
    prompt += `
  
  <supporting_document>
  <description>
  The attached file named "${supportingDocName}" has been provided as a supporting document that contains CRITICAL context for your detailed analysis. This document may be in any format (.pdf, .txt, .png, .jpg, .jpeg) and requires your careful analysis.

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
  
  4. If your detailed analysis is influenced by this supporting document:
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