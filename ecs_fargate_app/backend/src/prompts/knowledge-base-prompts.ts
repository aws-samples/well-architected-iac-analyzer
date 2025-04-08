import { QuestionGroup } from '../shared/interfaces/analysis.interface';

/**
 * Builds the input text prompt for RetrieveAndGenerateCommand to fetch information about best practices
 * @param question The question string
 * @param pillar The pillar name
 * @param questionGroup The question group containing best practices
 * @param lensName Optional lens name
 * @returns The formatted input text for the knowledge base query
 */
export function buildKnowledgeBaseInputPrompt(
  question: string, 
  pillar: string, 
  questionGroup: QuestionGroup,
  lensName?: string
): string {
  const bestPracticesJson = JSON.stringify({
    pillar: questionGroup.pillar,
    question: questionGroup.title,
    bestPractices: questionGroup.bestPractices
  }, null, 2);

  // Determine the lens context
  const lensContext = lensName && lensName !== 'Well-Architected Framework' 
    ? `AWS Well-Architected ${lensName} pillar "${pillar}"` 
    : `Well-Architected pillar "${pillar}"`;

  return `Below <best_practices_to_retrieve> section contains the list of best practices of the question "${question}" in the ${lensContext}:
<best_practices_to_retrieve>
${bestPracticesJson}
</best_practices_to_retrieve>
For each best practice provide:
- Name of the Best Practice
- Level of risk exposed if this best practice is not established
- Implementation guidance details
- List common anti-patterns (if any)
- Does this best practice directly relates to AWS resources, configurations, architecture patterns, or technical implementations? Or, does it primarily concerns organizational processes, team structures, or governance?`;
}

/**
 * Builds the text prompt template for the knowledge base generation configuration
 * @param lensName Optional lens name
 * @returns The formatted text prompt template for the knowledge base
 */
export function buildKnowledgeBasePromptTemplate(lensName?: string): string {
  // Determine the lens context
  const lensContext = lensName && lensName !== 'Well-Architected Framework' 
    ? `AWS Well-Architected ${lensName} expert. Using the following retrieved information about the ${lensName} lens best practices` 
    : `AWS Well-Architected Framework expert. Using the following retrieved information about AWS Well-Architected best practices`;

  return `You are an ${lensContext}:
  
  $search_results$
  
  Answer the following query:
  
  Provide a comprehensive response that covers each best practice, its associated risk level, implementation guidance and a list of common anti-patterns (if any). Format your response clearly with proper headings and bullet points such as:
  
  ## <Best Practice ID : Best Practice Name> (e.g. OPS01-BP01: Evaluate External Customer Needs)
  
  **Risk Level**: <Associated risk level>
  
  **Implementation Guidance**:
  
  <bullet points with implementation guidance details>
  
  **Common anti-patterns**:
  
  <bullet points with list common anti-patterns (if any)>
  
  **Relationship**: <Answers to the mentioned question Does this best practice directly relates to AWS resources, configurations, architecture patterns, or technical implementations? Or, does it primarily concerns organizational processes, team structures, or governance?>
  
  **Technical Relevancy score:** <1 to 10, where 1 is not related at all to AWS resources, configurations, architecture patterns, or technical implementations while 10 is fully related to them>`;
}