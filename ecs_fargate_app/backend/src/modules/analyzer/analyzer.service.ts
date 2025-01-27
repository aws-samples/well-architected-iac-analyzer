import {Injectable, Logger} from '@nestjs/common';
import {StorageService} from '../../shared/services/storage.service';
import {AwsConfigService} from '../../config/aws.config';
import {InvokeModelCommand} from '@aws-sdk/client-bedrock-runtime';
import {RetrieveCommand} from '@aws-sdk/client-bedrock-agent-runtime';
import {GetObjectCommand} from '@aws-sdk/client-s3';
import {paginateListAnswers, AnswerSummary} from '@aws-sdk/client-wellarchitected';
import {ConfigService} from '@nestjs/config';
import {AnalyzerGateway} from './analyzer.gateway';
import {IaCTemplateType} from '../../shared/dto/analysis.dto';
import {Subject} from 'rxjs';
import {AnalysisResult} from '../../shared/interfaces/analysis.interface';
// import fs
import * as fs from 'fs';

interface QuestionGroup {
    pillar: string;
    title: string;
    questionId: string;
    bestPractices: string[];
    bestPracticeIds: string[];
}

interface WellArchitectedBestPractice {
    Pillar: string;
    Question: string;
    questionId: string;
    'Best Practice': string;
    bestPracticeId: string;
}

interface BestPractice {
    name: string;
    applied: boolean;
    reasonApplied: string;
    reasonNotApplied: string;
    recommendations: string;
}

interface ModelResponse {
    bestPractices: BestPractice[];
}

interface WellArchitectedAnswer {
    AnswerSummaries: AnswerSummary[];
    WorkloadId: string;
    LensAlias?: string;
    LensArn?: string;
}

interface DocumentSection {
    content: string;
    order: number;
    description: string;
}

interface ModelSectionResponse {
    isComplete: boolean;
    sections: DocumentSection[];
}

@Injectable()
export class AnalyzerService {
    private readonly logger = new Logger(AnalyzerService.name);
    private cachedBestPractices: WellArchitectedBestPractice[] | null = null;
    private cancelGeneration$ = new Subject<void>();
    private cancelAnalysis$ = new Subject<void>();

    constructor(
        private readonly awsConfig: AwsConfigService,
        private readonly configService: ConfigService,
        private readonly analyzerGateway: AnalyzerGateway,
        private readonly storageService: StorageService,
    ) {
    }

    private isImageFile(fileType: string | undefined): boolean {
        if (!fileType) return false;
        return fileType.startsWith('image/');
    }

    cancelAnalysis() {
        this.cancelAnalysis$.next();
    }

    async analyze(fileName: string, workloadId: string, selectedPillars: string[], fileType: string): Promise<{
        results: AnalysisResult[];
        isCancelled: boolean;
        error?: string;
    }> {
        // Download file content from S3
        let fileContent = await this.storageService.getFileContent(fileName, fileType);

        const results: AnalysisResult[] = [];
        try {
            // Load all best practices once
            await this.loadBestPractices(workloadId);

            // Pre-calculate question groups for all selected pillars
            const pillarQuestionGroups = await Promise.all(
                selectedPillars.map(pillar => this.retrieveBestPractices(pillar, workloadId))
            );

            // Calculate total questions
            const totalQuestions = pillarQuestionGroups.reduce(
                (sum, groups) => sum + groups.length,
                0
            );

            let processedQuestions = 0;

            // Create a Promise that resolves when cancelAnalysis$ emits
            const cancelPromise = new Promise<boolean>((resolve) => {
                const subscription = this.cancelAnalysis$.subscribe(() => {
                    subscription.unsubscribe();
                    resolve(true);
                });
            });

            // Process each pillar's questions
            for (let i = 0; i < selectedPillars.length; i++) {
                const pillar = selectedPillars[i];
                const questionGroups = pillarQuestionGroups[i];

                for (const question of questionGroups) {
                    try {
                        // Check for cancellation
                        const isCancelled = await Promise.race([
                            cancelPromise,
                            Promise.resolve(false)
                        ]);

                        if (isCancelled) {
                            this.analyzerGateway.emitAnalysisProgress({
                                processedQuestions,
                                totalQuestions,
                                currentPillar: pillar,
                                currentQuestion: 'Analysis cancelled',
                            });
                            return {results, isCancelled: true};
                        }

                        let kbContexts: string[];
                        try {
                            kbContexts = await this.retrieveFromKnowledgeBase(
                                question.pillar,
                                question.title
                            );
                        } catch (error) {
                            this.logger.error(`Error retrieving from knowledge base: ${error}`);
                            return {
                                results,
                                isCancelled: false,
                                error: `Error retrieving from knowledge base. Analysis stopped. ${error}`,
                            };
                        }

                        // Emit progress before processing
                        this.analyzerGateway.emitAnalysisProgress({
                            processedQuestions,
                            totalQuestions,
                            currentPillar: pillar,
                            currentQuestion: question.title,
                        });

                        try {
                            const analysis = await this.analyzeQuestion(
                                fileContent,
                                question,
                                kbContexts,
                                fileType
                            );
                            results.push(analysis);
                            // Wait for 60 seconds
                            await new Promise(resolve => setTimeout(resolve, 60000));
                        } catch (error) {
                            this.logger.error(`Error analyzing question "${question.pillar} - ${question.title}". Error: ${error}`);
                            // Return partial results with error
                            return {
                                results,
                                isCancelled: false,
                                error: `${error}. Error analyzing question "${question.pillar} - ${question.title}". Analysis stopped, ${processedQuestions} questions where analyzed out of ${totalQuestions}.`,
                            };
                        }

                        processedQuestions++;

                        // Emit progress after processing
                        this.analyzerGateway.emitAnalysisProgress({
                            processedQuestions,
                            totalQuestions,
                            currentPillar: pillar,
                            currentQuestion: question.title,
                        });
                    } catch (error) {
                        this.logger.error(`Error processing question: ${error}`);
                        // Return partial results with error
                        return {
                            results,
                            isCancelled: false,
                            error: 'Error processing question. Analysis stopped.',
                        };
                    }
                }
            }

            return {results, isCancelled: false};
        } catch (error) {
            this.logger.error('Analysis failed:', error);
            // Return partial results with error
            return {
                results,
                isCancelled: false,
                error: `Showing partial results. Analysis failed with error: ${error}`,
            };
        }
    }

    cancelIaCGeneration() {
        this.cancelGeneration$.next();
    }

    async generateIacDocument(
        fileName: string,
        fileType: string,
        recommendations: any[],
        templateType?: IaCTemplateType
    ): Promise<{ content: string; isCancelled: boolean; error?: string }> {
        // Download file from S3
        let fileContent = await this.storageService.getFileContent(fileName, fileType);

        try {
            // Only proceed if it's an image file
            if (!this.isImageFile(fileType)) {
                throw new Error('This operation is only supported for architecture diagrams');
            }

            let isComplete = false;
            let allSections: DocumentSection[] = [];
            let iteration = 0;

            while (!isComplete) {
                try {
                    this.analyzerGateway.emitImplementationProgress({
                        status: `Generating IaC document...`,
                        progress: Math.min(iteration * 10, 90)
                    });

                    iteration++;

                    const response = await this.invokeBedrockModelForIacGeneration(
                        fileContent,
                        fileType,
                        recommendations,
                        allSections.length,
                        allSections.length > 0 ? `${JSON.stringify(allSections, null, 2)}` : 'No previous sections generated yet',
                        templateType
                    );

                    // If generation was cancelled, return what we have so far
                    if (response.isCancelled) {
                        const sortedSections = allSections.sort((a, b) => a.order - b.order);
                        const cancellationNote = '# Note: Template generation was cancelled. Below is a partial version.\n\n';
                        const content = sortedSections.map(section =>
                            `# ${section.description}\n${section.content}`
                        ).join('\n\n');

                        return {
                            content: cancellationNote + content,
                            isCancelled: true
                        };
                    }

                    const {
                        isComplete: batchComplete,
                        sections
                    } = this.parseImplementationModelResponse(response.content);

                    allSections.push(...sections);
                    isComplete = batchComplete;

                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    this.logger.error(`Error in IaC generation iteration: ${error}`);
                    // If we have any sections generated, return them as partial results
                    if (allSections.length > 0) {
                        const sortedSections = allSections.sort((a, b) => a.order - b.order);
                        const errorNote = '# Note: Template generation encountered an error. Below is a partial version.\n\n';
                        const content = sortedSections.map(section =>
                            `# ${section.description}\n${section.content}`
                        ).join('\n\n');

                        return {
                            content: errorNote + content,
                            isCancelled: false,
                            error: `Template generation encountered an error. Showing partial results. ${error}`
                        };
                    }
                    throw error;
                }
            }

            this.analyzerGateway.emitImplementationProgress({
                status: 'Finalizing IaC document...',
                progress: 100
            });

            const sortedSections = allSections.sort((a, b) => a.order - b.order);
            return {
                content: sortedSections.map(section =>
                    `# ${section.description}\n${section.content}`
                ).join('\n\n'),
                isCancelled: false
            };

        } catch (error) {
            this.logger.error('Error generating IaC document:', error);
            throw new Error('Failed to generate IaC document');
        }
    }

    private parseImplementationModelResponse(content: string): ModelSectionResponse {
        const isComplete = content.includes('<end_of_iac_document_generation>');
        const cleanContent = content.replace('<end_of_iac_document_generation>', '').trim();

        // Split content into sections based on comments
        const sectionMatches = cleanContent.match(/#\s*Section\s*\d+.*?(?=#\s*Section|\s*$)/gs) || [];

        const sections: DocumentSection[] = sectionMatches.map(section => {
            const orderMatch = section.match(/^#\s*Section\s*(\d+)/);
            const descriptionMatch = section.match(/^#\s*Section\s*\d+\s*-\s*(.+?)\n/);
            const cleanedContent = section
                .replace(/^#\s*Section\s*\d+.*?\n/, '') // Remove section header
                .replace(/<message_truncated>\s*$/, '') // Remove <message_truncated> flag
                .trim();

            return {
                content: cleanedContent,
                order: orderMatch ? parseInt(orderMatch[1]) : 999,
                description: descriptionMatch ? descriptionMatch[1].trim() : 'Unnamed Section'
            };
        });

        return {
            isComplete,
            sections
        };
    }

    private buildDetailsPrompt(item: any, fileContent: string, previousContent: string): string {
        return `
          <bp_recommendation_analysis>
          ${JSON.stringify([item], null, 2)}
          </bp_recommendation_analysis>
          
          <iac_document>
          ${fileContent}
          </iac_document>
          ${previousContent ? `\nPreviously generated content:\n${previousContent}` : ''}
        `;
    }

    private buildDetailsSystemPrompt(): string {
        return `You are an AWS Cloud Solutions Architect who specializes in reviewing solution architecture documents against the AWS Well-Architected Framework. Your answer should be formatted in Markdown.
        
        For the best practice provided in the <bp_recommendation_analysis> section:
        1. Provide detailed implementation guidance
        2. Include CloudFormation or Terraform template modification examples based on the document in <iac_document> section. Use the same format as the <iac_document> document, for example, if the <iac_document> document is CloudFormation in YAML format then provide examples as YAML, if it is in JSON, provide examples in JSON and if it is a Terraform document, use Terraform language, etc.
        3. Include risks of not implementing the best practice
        4. Provide specific AWS services and features recommendations
        5. If you have completed your detailed analysis, add the marker "<end_of_details_generation>" at the very end
        6. If you have more details to provide, end your response with "<details_truncated>"
        
        Structure your response as:
        # {Pillar as in the <bp_recommendation_analysis> section} - {Best Practice Name as in the <bp_recommendation_analysis> section}
        ## Implementation Guidance
        [Your guidance here]
        ## Template Modifications
        [Your examples here]
        ## Risks and Recommendations
        [Your analysis here]`;
    }

    async getMoreDetails(
        selectedItems: any[],
        fileContent: string,
        fileType: string,
        templateType?: IaCTemplateType
    ): Promise<{ content: string; error?: string }> {
        const filteredItems = selectedItems.filter(item => !item.applied);
        try {
            if (!selectedItems || selectedItems.length === 0) {
                throw new Error('No items selected for detailed analysis');
            }

            if (!fileContent) {
                throw new Error('No file content provided');
            }

            if (!fileType) {
                throw new Error('No file type provided');
            }

            let allDetails = '';
            let hasError = false;
            const totalItems = filteredItems.length;
            const isImage = this.isImageFile(fileType);

            this.analyzerGateway.emitImplementationProgress({
                status: `Analyzing 1 of ${totalItems} selected best practices not applied - Best practice: '${filteredItems[0].name}'`,
                progress: 0
            });

            for (let i = 0; i < totalItems; i++) {
                try {
                    const item = filteredItems[i];

                    let itemDetails = '';
                    let isComplete = false;

                    while (!isComplete) {
                        const response = isImage
                            ? await this.invokeBedrockModelForImageDetails(
                                fileContent,
                                item,
                                itemDetails,
                                fileType,
                                templateType
                            )
                            : await this.invokeBedrockModelForMoreDetails(
                                this.buildDetailsPrompt(item, fileContent, itemDetails),
                                this.buildDetailsSystemPrompt()
                            );

                        const {content, isComplete: sectionComplete} =
                            this.parseDetailsModelResponse(response.content[0].text);

                        itemDetails += content;
                        isComplete = sectionComplete;

                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    // Update progress
                    this.analyzerGateway.emitImplementationProgress({
                        status: `Analyzing ${i + 1} of ${totalItems} selected best practices not applied - Best practice: '${item.name}'`,
                        progress: Math.round(((i + 1) / totalItems) * 100)
                    });

                    allDetails += itemDetails + '\n\n---\n\n';
                } catch (error) {
                    this.logger.error(`Error analyzing item ${i + 1}:`, error);
                    hasError = true;
                    // Continue with next item instead of stopping completely
                    continue;
                }
            }

            this.analyzerGateway.emitImplementationProgress({
                status: 'Analysis complete',
                progress: 100
            });

            // If we have any details but also encountered errors
            if (allDetails && hasError) {
                return {
                    content: allDetails,
                    error: 'Some items could not be analyzed. Showing partial results.'
                };
            }

            // If we have no details at all
            if (!allDetails) {
                throw new Error('Failed to generate any detailed analysis');
            }

            return {content: allDetails.trim()};
        } catch (error) {
            this.logger.error('Error getting more details:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get detailed analysis');
        }
    }

    private async invokeBedrockModelForImageDetails(
        imageContent: string,
        item: any,
        previousContent: string,
        fileType: string,
        templateType?: IaCTemplateType,
    ): Promise<any> {
        const bedrockClient = this.awsConfig.createBedrockClient();
        const modelId = this.configService.get<string>('aws.bedrock.modelId');

        const systemPrompt = `You are an AWS Cloud Solutions Architect who specializes in reviewing architecture diagrams against the AWS Well-Architected Framework. Your answer should be formatted in Markdown.

        For the best practice provided in the <bp_recommendation_analysis> section:
        1. Provide detailed implementation guidance
        2. Include ${templateType} examples
        3. Include risks of not implementing the best practice
        4. Provide specific AWS services and features recommendations
        5. If you have completed your detailed analysis, add the marker "<end_of_details_generation>" at the very end
        6. If you have more details to provide, end your response with "<details_truncated>"
        
        Structure your response in Markdown format as follows:
        # {Pillar as in the <bp_recommendation_analysis> section} - {Best Practice Name as in the <bp_recommendation_analysis> section}
        ## Implementation Guidance
        [Detailed guidance based on the diagram]
        ## Architecture Modifications
        [Specific changes needed in the architecture]
        ## Risks and Recommendations
        [Analysis of risks and detailed recommendations including ${templateType} examples]
    
        If you have completed your analysis, add "<end_of_details_generation>"
        If you have more details to provide, end with "<details_truncated>"`;

        const prompt = `<bp_recommendation_analysis>${JSON.stringify([item], null, 2)}</bp_recommendation_analysis>
        ${previousContent ? `\nPreviously generated content:\n${previousContent}` : ''}`;

        const payload = {
            max_tokens: 4096,
            anthropic_version: "bedrock-2023-05-31",
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: fileType,
                                data: imageContent,
                            },
                        },
                        {
                            type: "text",
                            text: prompt
                        }
                    ],
                }
            ],
        };

        try {
            const command = new InvokeModelCommand({
                modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(payload),
            });

            const response = await bedrockClient.send(command);
            return JSON.parse(new TextDecoder().decode(response.body));
        } catch (error) {
            this.logger.error('Error invoking Bedrock model:', error);
            throw new Error(`Failed to get detailed analysis. Error invoking Bedrock model: ${error}`);
        }
    }

    private parseDetailsModelResponse(content: string): { content: string; isComplete: boolean } {
        const isComplete = content.includes('<end_of_details_generation>');

        // Clean up the content
        let cleanContent = content
            .replace('<end_of_details_generation>', '')
            .replace('<details_truncated>', '')
            .trim();

        // If this isn't the final section, we need to find the last complete section
        if (!isComplete && cleanContent.includes('#')) {
            const sections = cleanContent.split(/(?=# )/);
            // Remove the last potentially incomplete section
            sections.pop();
            cleanContent = sections.join('');
        }

        return {
            content: cleanContent,
            isComplete
        };
    }

    private async retrieveFromKnowledgeBase(pillar: string, question: string) {
        const bedrockAgent = this.awsConfig.createBedrockAgentClient();
        const knowledgeBaseId = this.configService.get<string>('aws.bedrock.knowledgeBaseId');

        const command = new RetrieveCommand({
            knowledgeBaseId,
            retrievalQuery: {
                text: `For each best practice of the question "${question}" in the Well-Architected pillar "${pillar}" provide:
        - Recommendations
        - Best practices
        - Examples
        - Risks`,
            },
            retrievalConfiguration: {
                vectorSearchConfiguration: {
                    numberOfResults: 20,
                },
            },
        });

        const response = await bedrockAgent.send(command);
        return response.retrievalResults?.map(result => result.content?.text || '') || [];
    }

    private async analyzeQuestion(
        fileContent: string,
        question: QuestionGroup,
        kbContexts: string[],
        fileType: string
    ) {
        const isImage = this.isImageFile(fileType);

        this.logger.log(`Analyzing question, isImage: ${isImage}, fileType: ${fileType}`);

        const prompt = isImage
            ? this.buildImagePrompt(question, kbContexts)
            : this.buildPrompt(question, kbContexts);

        const systemPrompt = isImage
            ? this.buildImageSystemPrompt(question)
            : this.buildSystemPrompt(fileContent, question);

        const response = isImage
            ? await this.invokeBedrockModelWithImage(prompt, systemPrompt, fileContent, fileType)
            : await this.invokeBedrockModel(prompt, systemPrompt);

        return {
            pillar: question.pillar,
            question: question.title,
            questionId: question.questionId,
            bestPractices: this.parseModelResponse(response, question),
        };
    }

    private cleanJsonString(jsonString: string): string {
        // First trim everything outside the outermost curly braces
        const firstCurlyBrace = jsonString.indexOf('{');
        const lastCurlyBrace = jsonString.lastIndexOf('}');

        if (firstCurlyBrace !== -1 && lastCurlyBrace !== -1) {
            jsonString = jsonString.substring(firstCurlyBrace, lastCurlyBrace + 1);
        }

        // Remove newlines and extra spaces
        jsonString = jsonString.replace(/\s+/g, " ");

        // Remove spaces after colons that are not within quotes
        jsonString = jsonString.replace(/(?<!"):\s+/g, ":");

        // Remove spaces before colons
        jsonString = jsonString.replace(/\s+:/g, ":");

        // Remove spaces after commas that are not within quotes
        jsonString = jsonString.replace(/(?<!"),\s+/g, ",");

        // Remove spaces before commas
        jsonString = jsonString.replace(/\s+,/g, ",");

        // Remove spaces after opening brackets and before closing brackets
        jsonString = jsonString.replace(/{\s+/g, "{");
        jsonString = jsonString.replace(/\s+}/g, "}");
        jsonString = jsonString.replace(/\[\s+/g, "[");
        jsonString = jsonString.replace(/\s+\]/g, "]");

        // Convert Python boolean values to JSON boolean values
        jsonString = jsonString.replace(/: True/g, ": true");
        jsonString = jsonString.replace(/: False/g, ": false");

        return jsonString;
    }

    private buildImagePrompt(question: QuestionGroup, kbContexts: string[]): string {
        const bestPracticesJson = JSON.stringify({
            pillar: question.pillar,
            question: question.title,
            bestPractices: question.bestPractices
        }, null, 2);

        return `
          Analyze the provided architecture diagram against the following Well-Architected best practices.
          
          <kb>
          ${kbContexts.join('\n\n')}
          </kb>
    
          <best_practices_json>
          ${bestPracticesJson}
          </best_practices_json>
        `;
    }

    private buildImageSystemPrompt(question: QuestionGroup): string {
        const numberOfBestPractices = question.bestPractices.length;

        return `
          You are an AWS Cloud Solutions Architect who specializes in reviewing architecture diagrams against the AWS Well-Architected Framework, using a process called the Well-Architected Framework Review (WAFR).
          The WAFR process consists of evaluating the provided solution architecture document against the 6 pillars of the Well-Architected Framework, namely - Operational Excellence Pillar, Security Pillar, Reliability Pillar, Performance Efficiency Pillar, Cost Optimization Pillar, and Sustainability Pillar - by asking fixed questions for each pillar.
          An architecture diagram has been provided. Follow the instructions listed under "instructions" section below.

          <instructions>
      1) In the "best_practices_json" section, you are provided with the name of the ${numberOfBestPractices} Best Practices related to the questions "${question.title}" of the Well-Architected Framework. For each Best Practice, determine if it is applied or not in the given architecture diagram image.
      2) For each of the ${numberOfBestPractices} best practices listed in the "best_practices_json" section, create your respond in the following EXACT JSON format only:
      {
          "bestPractices": [
            {
              "name": [Exact Best Practice Name as given in Best Practices in the "best_practices_json" section],
              "applied": [Boolean],
              "reasonApplied": [Why do you consider this best practice is already applied or followed in the provided architecture diagram? (Important: 50 words maximum and only add this field when applied=true)],
              "reasonNotApplied": [Why do you consider this best practice is not applied or followed in the provided architecture diagram? (Important: 50 words maximum and only add this field when applied=false)],
              "recommendations": [Provide recommendations for the best practice. Include what is the risk of not following, and also provide recommendations and examples of how to implement this best practice. (Important: 350 words maximum and only add this field when applied=false)]
            }
          ]
      }

      For your reference, below is an example of how the JSON-formatted response should look like:
        {
            "bestPractices": [
                {
                "name": "Implement secure key and certificate management",
                "applied": true,
                "reasonApplied": "The architecture diagram references the use of an AWS Certificate Manager (ACM) certificate for the Application Load Balancer to enforce HTTPS encryption in transit."
                },
                {
                "name": "Enforce encryption in transit",
                "applied": true,
                "reasonApplied": "The Application Load Balancer referenced in the diagram is configured to use HTTPS protocol on port 443 with SSL policy ELBSecurityPolicy-2016-08."
                },
                {
                "name": "Prefer hub-and-spoke topologies over many-to-many mesh",
                "applied": false,
                "reasonNotApplied": "The architecture diagram does not provide details about the overall network topology or interconnections between multiple VPCs.",
                "recommendations": "While not specifically relevant for this single VPC deployment,if you have multiple VPCs that need to communicate,you should implement a hub-and-spoke model using transit gateways. This simplifies network management and reduces the risk of misconfiguration compared to peering every VPC directly in a mesh topology. The risk of using a mesh topology is increased complexity,potential misconfiguration leading to reachability issues,and difficulty applying consistent network policies across VPCs."
                }
            ]
        }

      3) Do not rephrase or summarize the practice name, and DO NOT skip any of the ${numberOfBestPractices} best practices listed in the "best_practices_json" section.
      4) Do not make any assumptions or make up information. Your responses should only be based on the actual architecture diagram provided.
      5) You are also provided with a Knowledge Base which has more information about the specific question from the Well-Architected Framework. The relevant parts from the Knowledge Base will be provided under the "kb" section.
      </instructions>
        `;
    }

    private buildPrompt(question: QuestionGroup, kbContexts: string[]): string {
        const bestPracticesJson = JSON.stringify({
            pillar: question.pillar,
            question: question.title,
            bestPractices: question.bestPractices
        }, null, 2);

        return `
      <kb>
      ${kbContexts.join('\n\n')}
      </kb>

      <best_practices_json>
      ${bestPracticesJson}
      </best_practices_json>
    `;
    }

    private buildSystemPrompt(fileContent: string, question: QuestionGroup): string {
        const numberOfBestPractices = question.bestPractices.length;

        return `
      You are an AWS Cloud Solutions Architect who specializes in reviewing solution architecture documents against the AWS Well-Architected Framework, using a process called the Well-Architected Framework Review (WAFR).
      The WAFR process consists of evaluating the provided solution architecture document against the 6 pillars of the Well-Architected Framework, namely - Operational Excellence Pillar, Security Pillar, Reliability Pillar, Performance Efficiency Pillar, Cost Optimization Pillar, and Sustainability Pillar - by asking fixed questions for each pillar.
      The content of a CloudFormation or Terraform template document is provided below in the "uploaded_template_document" section. Follow the instructions listed under "instructions" section below. 
      
      <instructions>
      1) In the "best_practices_json" section, you are provided with the name of the ${numberOfBestPractices} Best Practices related to the questions "${question.title}" of the Well-Architected Framework. For each Best Practice, determine if it is applied or not in the given CloudFormation or Terraform template document.
      2) For each of the ${numberOfBestPractices} best practices listed in the "best_practices_json" section, create your respond in the following EXACT JSON format only:
      {
          "bestPractices": [
            {
              "name": [Exact Best Practice Name as given in Best Practices in the "best_practices_json" section],
              "applied": [Boolean],
              "reasonApplied": [Why do you consider this best practice is already applied or followed in the provided architecture document? (Important: 50 words maximum and only add this field when applied=true)],
              "reasonNotApplied": [Why do you consider this best practice is not applied or followed in the provided architecture document? (Important: 50 words maximum and only add this field when applied=false)],
              "recommendations": [Provide recommendations for the best practice. Include what is the risk of not following, and also provide recommendations and examples of how to implement this best practice. (Important: 350 words maximum and only add this field when applied=false)]
            }
          ]
      }

      For your reference, below is an example of how the JSON-formatted response should look like:
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
                }
            ]
        }

      3) Do not rephrase or summarize the practice name, and DO NOT skip any of the ${numberOfBestPractices} best practices listed in the "best_practices_json" section.
      4) Do not make any assumptions or make up information. Your responses should only be based on the actual solution document provided in the "uploaded_template_document" section below.
      5) You are also provided with a Knowledge Base which has more information about the specific question from the Well-Architected Framework. The relevant parts from the Knowledge Base will be provided under the "kb" section.
      </instructions>

      <uploaded_template_document>
      ${fileContent}
      </uploaded_template_document>
    `;
    }

    private async invokeBedrockModelWithImage(
        prompt: string,
        systemPrompt: string,
        imageContent: string,
        mediaType: string
    ): Promise<ModelResponse> {
        const bedrockClient = this.awsConfig.createBedrockClient();
        const modelId = this.configService.get<string>('aws.bedrock.modelId');

        const payload = {
            max_tokens: 4096,
            anthropic_version: "bedrock-2023-05-31",
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: mediaType,
                                data: imageContent,
                            },
                        },
                        {
                            type: "text",
                            text: prompt
                        }
                    ],
                }
            ],
        };

        try {
            const command = new InvokeModelCommand({
                modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(payload),
            });

            const response = await bedrockClient.send(command);
            const responseBody = new TextDecoder().decode(response.body);
            const parsedResponse = JSON.parse(responseBody);

            const cleanedAnalysisJsonString = this.cleanJsonString(parsedResponse.content[0].text)

            const parsedAnalysis = JSON.parse(cleanedAnalysisJsonString)

            // return JSON.parse(responseBody);
            return parsedAnalysis;
        } catch (error) {
            this.logger.error('Error invoking Bedrock model:', error);
            throw new Error(`Failed to analyze diagram with AI model. Error invoking Bedrock model: ${error}`);
        }
    }

    private async invokeBedrockModel(prompt: string, systemPrompt: string): Promise<ModelResponse> {
        const bedrockClient = this.awsConfig.createBedrockClient();
        const modelId = this.configService.get<string>('aws.bedrock.modelId');

        const payload = {
            max_tokens: 4096,
            anthropic_version: "bedrock-2023-05-31",
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: [{type: "text", text: prompt}],
                },
            ],
        };

        try {
            const command = new InvokeModelCommand({
                modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(payload),
            });

            const response = await bedrockClient.send(command);

            const responseBody = new TextDecoder().decode(response.body);

            const parsedResponse = JSON.parse(responseBody);

            const cleanedAnalysisJsonString = this.cleanJsonString(parsedResponse.content[0].text)

            const parsedAnalysis = JSON.parse(cleanedAnalysisJsonString)

            return parsedAnalysis;
        } catch (error) {
            this.logger.error('Error invoking Bedrock model:', error);
            throw new Error(`Failed to analyze template with AI model. Error invoking Bedrock model: ${error}`);
        }
    }

    private async invokeBedrockModelForMoreDetails(prompt: string, systemPrompt: string): Promise<any> {
        const bedrockClient = this.awsConfig.createBedrockClient();
        const modelId = this.configService.get<string>('aws.bedrock.modelId');

        const payload = {
            max_tokens: 4096,
            anthropic_version: "bedrock-2023-05-31",
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: [{type: "text", text: prompt}],
                },
            ],
        };

        try {
            const command = new InvokeModelCommand({
                modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(payload),
            });

            const response = await bedrockClient.send(command);

            const responseBody = new TextDecoder().decode(response.body);

            const parsedResponse = JSON.parse(responseBody);

            return parsedResponse;
        } catch (error) {
            this.logger.error('Error invoking Bedrock model:', error);
            throw new Error(`Failed to get detailed analysis. Error invoking Bedrock model: ${error}`);
        }
    }

    private async invokeBedrockModelForIacGeneration(
        imageData: string,
        mediaType: string,
        recommendations: any[],
        previousSections: number,
        allPreviousSections: string,
        templateType?: IaCTemplateType
    ): Promise<{ content: string; isCancelled: boolean }> {
        const bedrockClient = this.awsConfig.createBedrockClient();
        const modelId = this.configService.get<string>('aws.bedrock.modelId');

        const systemPrompt = `You are an AWS Cloud Solutions Architect who specializes in creating Infrastructure as Code (IaC) templates. 
        An architecture diagram has been provided along with AWS Well-Architected Framework recommendations for your reference.

        Generate a ${templateType} that implements this architecture following AWS best practices. Follow the instructions below when generating the template:

        <instructions>
        1. If the template you are going to generate is too large, split the template into multiple parts, each part starting with "# Section {number} - {description}.
        2. If you complete the template (e.g. you are providing with the last part of the template), end your response with "<end_of_iac_document_generation>".
        3. If you need to provide with more parts or sections for the template, end your response with "<message_truncated>".
        4. Each of your answers have at least 800 words, unless you are providing a response with the last part of a template.
        5. Do not repeat any section or part already provided.
        </instructions>
        
        For your reference, after you complete providing all parts of the template, all template parts/sections you provided will be concatenated into a single ${templateType}.`;

        const prompt = `Based on the architecture diagram and the recommendations within the <recommendations> below, generate an IaC template.
        Consider the ${previousSections} previously generated sections within the <previous_responses> section below (if any).

        <previous_responses>
        ${allPreviousSections}
        </previous_responses>
        
        <recommendations>
        ${JSON.stringify(recommendations, null, 2)}
        </recommendations>`;

        const payload = {
            max_tokens: 4096,
            anthropic_version: "bedrock-2023-05-31",
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: mediaType,
                                data: imageData,
                            },
                        },
                        {
                            type: "text",
                            text: prompt
                        }
                    ],
                }
            ],
        };

        // Create a Promise that resolves when cancelGeneration$ emits
        const cancelPromise = new Promise<void>((resolve) => {
            const subscription = this.cancelGeneration$.subscribe(() => {
                subscription.unsubscribe();
                resolve();
            });
        });

        try {
            const command = new InvokeModelCommand({
                modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(payload),
            });

            // Race between the Bedrock call and cancellation
            const modelResponse = bedrockClient.send(command);
            const raceResult = await Promise.race([
                modelResponse,
                cancelPromise.then(() => null)
            ]);

            if (!raceResult) {
                // Cancelled
                return {
                    content: allPreviousSections,
                    isCancelled: true
                };
            }

            // Not cancelled, process normal response
            const responseContent = JSON.parse(new TextDecoder().decode(raceResult.body));
            return {
                content: responseContent.content[0].text,
                isCancelled: false
            };
        } catch (error) {
            this.logger.error('Error invoking Bedrock model:', error);
            throw new Error(`Failed to generate IaC document. Error invoking Bedrock model: ${error}`);
        }
    }

    private parseModelResponse(response: ModelResponse, questionGroup: QuestionGroup): any[] {
        try {
            return response.bestPractices.map((bp: BestPractice, index: number) => ({
                id: questionGroup.bestPracticeIds[index],
                name: bp.name,
                applied: bp.applied,
                reasonApplied: bp.reasonApplied,
                reasonNotApplied: bp.reasonNotApplied,
                recommendations: bp.recommendations,
            }));
        } catch (error) {
            this.logger.error('Error parsing model response:', error);
            throw new Error('Failed to parse analysis results');
        }
    }

    private async loadWellArchitectedAnswers(workloadId: string): Promise<WellArchitectedAnswer> {
        const waClient = this.awsConfig.createWAClient();

        try {
            const allAnswers: WellArchitectedAnswer = {
                AnswerSummaries: [],
                WorkloadId: workloadId,
            };

            const paginator = paginateListAnswers(
                {client: waClient},
                {
                    WorkloadId: workloadId,
                    LensAlias: 'wellarchitected'
                }
            );

            // Iterate through all pages
            for await (const page of paginator) {
                if (page.AnswerSummaries) {
                    allAnswers.AnswerSummaries.push(...page.AnswerSummaries);
                }

                // Set LensAlias and LensArn from the page response
                if (page.LensAlias) {
                    allAnswers.LensAlias = page.LensAlias;
                }
                if (page.LensArn) {
                    allAnswers.LensArn = page.LensArn;
                }
            }

            return allAnswers;
        } catch (error) {
            this.logger.error('Error fetching Well-Architected answers:', error);
            throw new Error('Failed to fetch Well-Architected answers');
        }
    }

    // Load best practices once
    private async loadBestPractices(workloadId: string): Promise<WellArchitectedBestPractice[]> {
        if (this.cachedBestPractices) {
            return this.cachedBestPractices;
        }

        const s3Client = this.awsConfig.createS3Client();
        const waDocsBucket = this.configService.get<string>('aws.s3.waDocsBucket');

        try {
            // Fetch best practices from S3
            const s3Response = await s3Client.send(
                new GetObjectCommand({
                    Bucket: waDocsBucket,
                    Key: 'well_architected_best_practices.json'
                })
            );

            const responseBody = await s3Response.Body?.transformToString();
            if (!responseBody) {
                throw new Error('No data received from S3');
            }

            const baseBestPractices: WellArchitectedBestPractice[] = JSON.parse(responseBody);

            // Fetch WA Tool answers
            const waAnswers = await this.loadWellArchitectedAnswers(workloadId);

            // Create mappings for both ChoiceIds and QuestionIds
            const choiceIdMapping = new Map<string, string>();
            const questionIdMapping = new Map<string, string>();

            waAnswers.AnswerSummaries.forEach(answer => {
                // Map QuestionId to Question Title
                questionIdMapping.set(answer.QuestionTitle, answer.QuestionId);

                // Map Choice Titles to ChoiceIds
                answer.Choices?.forEach(choice => {
                    if (choice.Title && choice.ChoiceId) {
                        // Create a unique key combining question and choice (for cases of WA questions with same BP title)
                        const uniqueKey = `${answer.QuestionTitle}|||${choice.Title}`;
                        choiceIdMapping.set(uniqueKey, choice.ChoiceId);
                    }
                });
            });

            // Enhance best practices with their corresponding ChoiceIds and QuestionIds
            this.cachedBestPractices = baseBestPractices.map(bp => {
                // Create the same unique key for lookup
                const uniqueKey = `${bp.Question}|||${bp['Best Practice']}`;

                return {
                    ...bp,
                    bestPracticeId: choiceIdMapping.get(uniqueKey) ||
                        this.generateFallbackBestPracticeId(`${bp.Question}-${bp['Best Practice']}`),
                    questionId: questionIdMapping.get(bp.Question) ||
                        this.generateFallbackBestPracticeId(bp.Question)
                };
            });

            return this.cachedBestPractices;
        } catch (error) {
            this.logger.error('Error loading best practices:', error);
            throw new Error('Failed to load Well-Architected best practices');
        }
    }

    private async retrieveBestPractices(pillarId: string, workloadId: string): Promise<QuestionGroup[]> {
        try {
            const allBestPractices = await this.loadBestPractices(workloadId);
            const pillarBestPractices = allBestPractices.filter(
                bp => bp.Pillar.toLowerCase().replace(/\s+/g, '-') === pillarId
            );

            const questionGroups = new Map<string, {
                practices: Array<{ practice: string, id: string }>,
                questionId: string
            }>();

            pillarBestPractices.forEach(bp => {
                if (!questionGroups.has(bp.Question)) {
                    questionGroups.set(bp.Question, {
                        practices: [],
                        questionId: bp.questionId
                    });
                }
                questionGroups.get(bp.Question)?.practices.push({
                    practice: bp['Best Practice'],
                    id: bp.bestPracticeId
                });
            });

            return Array.from(questionGroups.entries()).map(([question, data]) => ({
                pillar: pillarBestPractices[0].Pillar,
                title: question,
                questionId: data.questionId,
                bestPractices: data.practices.map(p => p.practice),
                bestPracticeIds: data.practices.map(p => p.id)
            }));
        } catch (error) {
            this.logger.error('Error retrieving best practices:', error);
            throw new Error('Failed to retrieve Well-Architected best practices');
        }
    }

    private generateFallbackBestPracticeId(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
}