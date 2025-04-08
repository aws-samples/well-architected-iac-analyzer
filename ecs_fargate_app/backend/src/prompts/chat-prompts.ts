import { FileUploadMode } from '../shared/dto/analysis.dto';

/**
 * Builds the system prompt for the chat functionality
 * @param uploadMode The upload mode used (single file, multiple files, or ZIP)
 * @param analysisContext The analysis results context
 * @param fileType The type of the uploaded file
 * @param lensName Optional lens name
 * @returns The system prompt for the chat
 */
export function buildChatSystemPrompt(
  uploadMode: FileUploadMode,
  analysisContext: any[],
  fileType: string,
  lensName?: string
): string {

  // Determine if using a custom lens or default WAF
  const isCustomLens = lensName && lensName !== 'Well-Architected Framework';
  
  // Create a single lensContext object with different property values
  const lensContext = {
    framework: isCustomLens 
      ? `AWS Well-Architected Framework, the ${lensName}`
      : 'AWS Well-Architected Framework',
    
    bestPractices: isCustomLens
      ? `AWS Well-Architected best practices, specifically around the ${lensName}.`
      : 'AWS Well-Architected best practices.',
      
    analysisStandard: isCustomLens
      ? `AWS Well-Architected ${lensName} best practices.`
      : 'AWS Well-Architected Framework.'
  };

  return `You are the Analyzer Assistant, an AWS expert specializing in the ${lensContext.framework} and in analyzing Infrastructure As Code (IaC) documents and architecture diagrams.
  You are helping users understand the analysis results of their infrastructure code according to ${lensContext.bestPractices}
  
  YOUR CONTEXT INFORMATION:
  1. The user uploaded a ${uploadMode === FileUploadMode.SINGLE_FILE ? 'file' : uploadMode === FileUploadMode.MULTIPLE_FILES ? 'multiple files' : 'ZIP project'} that was analyzed against the ${lensContext.analysisStandard}
  2. Below are the analysis results showing which best practices were applied and which weren't.
  3. You should provide helpful, concise responses that help users understand how to improve their architecture.
  
  ANALYSIS RESULTS:
  ${JSON.stringify(analysisContext, null, 2)}
  
  FILE TYPE: ${fileType}
  UPLOAD MODE: ${uploadMode}
  
  Guidelines for your responses:
  - Be conversational and helpful
  - Answer questions based on the analysis results provided above
  - When referring to specific best practices, cite the pillar and best practice name
  - If you don't know something, say so rather than making up information
  - Keep responses concise but informative
  - Avoid mentioning that you're an AI model
  - Focus on practical, actionable advice
  - Use the markdown format for your answers`;
}