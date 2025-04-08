import { Injectable, Logger } from '@nestjs/common';
import { AwsConfigService } from '../../config/aws.config';
import {
    ConverseCommand,
    Message,
    SystemContentBlock
} from '@aws-sdk/client-bedrock-runtime';
import { RetrieveAndGenerateCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { paginateListAnswers, AnswerSummary } from '@aws-sdk/client-wellarchitected';
import { ConfigService } from '@nestjs/config';
import { AnalyzerGateway } from './analyzer.gateway';
import { IaCTemplateType } from '../../shared/dto/analysis.dto';
import { Subject } from 'rxjs';
import { AnalysisResult } from '../../shared/interfaces/analysis.interface';
import { StorageService } from '../storage/storage.service';
import * as Prompts from '../../prompts';
import { FileUploadMode } from '../../shared/dto/analysis.dto';
import { LensInfo } from '../../shared/interfaces/storage.interface';


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
    pillarId: string;
}

interface BestPractice {
    name: string;
    relevant: boolean;
    applied: boolean;
    reasonApplied: string;
    reasonNotApplied: string;
    recommendations: string;
    extendedRecommendations?: string;
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
    private readonly storageEnabled: boolean;

    constructor(
        private readonly awsConfig: AwsConfigService,
        private readonly configService: ConfigService,
        private readonly analyzerGateway: AnalyzerGateway,
        private readonly storageService: StorageService,
    ) {
        this.storageEnabled = this.configService.get<boolean>('storage.enabled', false);
    }


    // Check if the current model is Claude 3.7 Sonnet
    private isClaudeSonnet37(): boolean {
        const modelId = this.configService.get<string>('aws.bedrock.modelId');
        return modelId && (
            modelId.includes('anthropic.claude-3-7-sonnet') ||
            modelId.includes('us.anthropic.claude-3-7-sonnet')
        );
    }

    // Configure model parameters based on the model type
    private getModelParameters() {
        const isClaudeSonnet37 = this.isClaudeSonnet37();

        if (isClaudeSonnet37) {
            return {
                additionalModelRequestFields: {
                    thinking: {
                        type: "enabled",
                        budget_tokens: 8000
                    }
                },
                inferenceConfig: {
                    maxTokens: 20480
                }
            };
        }

        return {
            inferenceConfig: {
                maxTokens: 4096,
                temperature: 0.7
            }
        };
    }

    /**
     * Chat functionality - allows users to ask questions about their analysis results
     * @param fileId The ID of the file/analysis to discuss
     * @param message The user's message
     * @param userId The user ID for looking up relevant data
     * @returns A response message from the AI assistant
     */
    async chat(fileId: string, message: string, userId: string, lensName?: string, lensAlias?: string): Promise<string> {
        try {
            if (!fileId || !userId) {
                throw new Error('File ID and User ID are required for chat');
            }

            // Get work item and analysis results
            const workItem = await this.storageService.getWorkItem(userId, fileId);

            if (!workItem) {
                throw new Error('Work item not found');
            }

            // Only allow chat if analysis is completed or partial
            if (!workItem.analysisStatus?.[lensAlias] || 
                (workItem.analysisStatus[lensAlias] !== 'COMPLETED' && 
                 workItem.analysisStatus[lensAlias] !== 'PARTIAL')) {
                throw new Error('Analysis must be completed before chatting');
            }

            // Get analysis results
            const analysisResults = await this.storageService.getAnalysisResults(userId, fileId, lensAlias);

            if (!analysisResults || !Array.isArray(analysisResults) || analysisResults.length === 0) {
                throw new Error('No analysis results found for this file');
            }

            // Check upload mode to determine how to get file content
            const uploadMode = workItem.uploadMode || FileUploadMode.SINGLE_FILE;
            const isImageFile = workItem.fileType.startsWith('image/');

            // Declare variables for file content
            let fileContent;
            let fileType = workItem.fileType;
            let contentStr = '';

            // Get appropriate content based on upload mode
            if (uploadMode === FileUploadMode.SINGLE_FILE) {
                // Get the original content for single files
                const result = await this.storageService.getOriginalContent(userId, fileId, false);
                fileContent = result.data;
                fileType = result.contentType;
            } else {
                // For multiple files or ZIP files, get the packed content
                try {
                    contentStr = await this.storageService.getPackedContent(userId, fileId);
                } catch (error) {
                    this.logger.warn(`Packed content not found for ${fileId}, falling back to original content`);
                    // Fall back to original content
                    const result = await this.storageService.getOriginalContent(userId, fileId, false);
                    fileContent = result.data;
                    fileType = result.contentType;
                }
            }

            // Prepare analysis context for the LLM
            const analysisContext = analysisResults.map(result => {
                return {
                    pillar: result.pillar,
                    question: result.question,
                    bestPractices: result.bestPractices.map(bp => ({
                        name: bp.name,
                        relevant: bp.relevant,
                        applied: bp.applied,
                        reasonApplied: bp.reasonApplied,
                        reasonNotApplied: bp.reasonNotApplied,
                        recommendations: bp.recommendations,
                    }))
                };
            });

            // Retrieve chat history
            let chatHistory = [];
            try {
                chatHistory = await this.storageService.getChatHistory(userId, fileId);
            } catch (error) {
                // If chat history doesn't exist, we will start a new conversation
                this.logger.log('No existing chat history found, starting new conversation');
            }

            // Use the chat system prompt from the prompts directory
            const systemPrompt = Prompts.buildChatSystemPrompt(
                uploadMode,
                analysisContext,
                fileType,
                lensName
            );

            // Create array of messages for conversation
            const messages: Message[] = [];

            // Add previous messages from chat history to maintain conversation context
            if (chatHistory && chatHistory.length > 0) {
                // Convert chat history format to Bedrock message format
                // We only need the last few messages to stay within context limits
                const recentMessages = chatHistory.slice(-25); // Last 25 messages

                for (const msg of recentMessages) {
                    messages.push({
                        role: msg.isUser ? 'user' : 'assistant',
                        content: [
                            {
                                text: msg.content
                            }
                        ]
                    });
                }
            }

            // System message as content block 
            const systemContentBlock: SystemContentBlock[] = [{
                text: systemPrompt
            }];

            // Get model parameters based on model type
            const modelParams = this.getModelParameters();
            const bedrockClient = this.awsConfig.createBedrockClient();
            let response;

            // Handle based on file type and upload mode
            if (uploadMode === FileUploadMode.SINGLE_FILE && isImageFile) {
                // Handle single image file
                let processedContent: string;

                if (Buffer.isBuffer(fileContent)) {
                    processedContent = `data:${fileType};base64,${fileContent.toString('base64')}`;
                } else if (typeof fileContent === 'string' && !fileContent.startsWith('data:')) {
                    processedContent = `data:${fileType};base64,${fileContent}`;
                } else {
                    processedContent = fileContent as string;
                }

                // Extract image data
                const imageBase64Data = processedContent.split(',')[1];
                const imageMediaType = processedContent.split(';')[0].split(':')[1];
                const imageFormat = imageMediaType.split('/')[1]; // Extract format from media type

                // Add the new user message with image content
                const userMessage: Message = {
                    role: 'user',
                    content: [
                        {
                            image: {
                                format: imageFormat as "png" | "jpeg" | "gif" | "webp",
                                source: {
                                    bytes: Buffer.from(imageBase64Data, 'base64')
                                }
                            }
                        },
                        {
                            text: message
                        }
                    ]
                };

                messages.push(userMessage);

                // Create the Converse command for image
                const command = new ConverseCommand({
                    modelId: this.configService.get<string>('aws.bedrock.modelId'),
                    messages: messages,
                    system: systemContentBlock,
                    ...modelParams
                });

                response = await bedrockClient.send(command);
            } else {
                // Handle text-based content (single file, multiple files, or ZIP)
                let fileContentStr: string;

                // For multiple files or ZIP, use the packed content we already retrieved
                if (uploadMode !== FileUploadMode.SINGLE_FILE) {
                    fileContentStr = contentStr;
                } else {
                    // For single file, process the content
                    if (Buffer.isBuffer(fileContent)) {
                        fileContentStr = fileContent.toString('utf-8');
                    } else if (typeof fileContent === 'string') {
                        fileContentStr = fileContent;
                    } else {
                        fileContentStr = JSON.stringify(fileContent);
                    }
                }

                // For projects or large files, ensure it's not too large
                const maxContentLength = 500000; // limiting to ~500k characters
                if (fileContentStr.length > maxContentLength) {
                    fileContentStr = `${fileContentStr.substring(0, maxContentLength)}... [CONTENT TRUNCATED DUE TO SIZE]`;
                }

                // Create a message that includes both file content and user question
                const combinedMessage = `
      FILE CONTENT:
      \`\`\`
      ${fileContentStr}
      \`\`\`
      
      USER QUESTION: ${message}`;

                messages.push({
                    role: 'user',
                    content: [
                        {
                            text: combinedMessage
                        }
                    ]
                });

                // Create the Converse command for text
                const command = new ConverseCommand({
                    modelId: this.configService.get<string>('aws.bedrock.modelId'),
                    messages: messages,
                    system: systemContentBlock,
                    ...modelParams
                });

                response = await bedrockClient.send(command);
            }

            // Extract and return the response
            if (response.output && response.output.message && response.output.message.content) {
                const content = response.output.message.content;
                // Handle different content types
                let responseText = '';
                for (const block of content) {
                    if ('text' in block) {
                        responseText += block.text || '';
                    }
                }

                // Add the user message and AI response to chat history
                chatHistory.push({
                    id: `user-${Date.now()}`,
                    content: message,
                    timestamp: new Date().toISOString(),
                    isUser: true
                });

                chatHistory.push({
                    id: `assistant-${Date.now()}`,
                    content: responseText,
                    timestamp: new Date().toISOString(),
                    isUser: false
                });

                // Save the updated chat history
                await this.storageService.storeChatHistory(userId, fileId, chatHistory);

                return responseText;
            }

            throw new Error('No response generated from AI model');
        } catch (error) {
            this.logger.error('Error in chat:', error);
            throw error;
        }
    }

    private async getFileContent(userId: string, fileId: string): Promise<{ content: string; type: string }> {
        try {
            const workItem = await this.storageService.getWorkItem(userId, fileId);
            const { data, contentType: type } = await this.storageService.getOriginalContent(
                userId,
                fileId,
                false
            );
            // Convert Buffer to string or handle base64 data
            let content: string;
            if (Buffer.isBuffer(data)) {
                // If it's an image, convert to base64
                if (type.startsWith('image/')) {
                    content = `data:${type};base64,${data.toString('base64')}`;
                } else {
                    // For text files (IaC templates), convert to UTF-8 string
                    content = data.toString('utf-8');
                }
            } else {
                content = data;
            }

            return { content, type };
        } catch (error) {
            this.logger.error('Error fetching file content:', error);
            throw new Error('Failed to fetch file content from storage');
        }
    }

    private ensureBase64Format(fileContent: string, fileType: string): string {
        // If the content already starts with 'data:', it's already in the correct format
        if (fileContent.startsWith('data:')) {
            return fileContent;
        }

        // Convert Buffer/binary string to base64 and add data URI prefix
        try {
            // If it's a binary string, convert to base64
            const base64Content = Buffer.from(fileContent, 'binary').toString('base64');
            return `data:${fileType};base64,${base64Content}`;
        } catch (error) {
            this.logger.error('Error converting file content to base64:', error);
            throw new Error('Failed to process file content');
        }
    }

    private isImageFile(fileType: string | undefined): boolean {
        if (!fileType) return false;
        return fileType.startsWith('image/');
    }

    cancelAnalysis() {
        this.cancelAnalysis$.next();
    }

    async analyze(
        fileId: string,
        workloadId: string,
        selectedPillars: string[],
        uploadMode: FileUploadMode = FileUploadMode.SINGLE_FILE,
        userId?: string,
        supportingDocumentId?: string,
        supportingDocumentDescription?: string,
        lensAlias?: string,
        lensAliasArn?: string,
        lensName?: string,
        lensPillars?: Record<string, string>,
    ): Promise<{ results: AnalysisResult[]; isCancelled: boolean; error?: string; fileId?: string }> {
        const results: AnalysisResult[] = [];
        let workItem;

        try {
            if (!userId) {
                throw new Error('User ID is required for analysis');
            }

            // Get file content from storage
            const { content: fileContent, type: fileType } = await this.getFileContent(userId, fileId);

            // Get existing work item
            workItem = await this.storageService.getWorkItem(userId, fileId);

            // Use the provided lens or default to wellarchitected
            const currentLensAlias = lensAlias || 'wellarchitected';
            const currentLensName = lensName || 'Well-Architected Framework';

            // Get supporting document content if provided
            let supportingDocContent = null;
            let supportingDocType = null;
            let supportingDocName = null;

            if (supportingDocumentId) {
                try {
                    // Note: Passing lens alias to getSupportingDocument
                    const supportingDoc = await this.storageService.getSupportingDocument(
                        userId,
                        fileId,
                        supportingDocumentId,
                        currentLensAlias
                    );

                    // Convert to base64 for images and PDFs, leave as text for text files
                    if (supportingDoc.contentType === 'text/plain') {
                        supportingDocContent = supportingDoc.data.toString('utf8');
                    } else {
                        supportingDocContent = supportingDoc.data.toString('base64');
                    }

                    supportingDocType = supportingDoc.contentType;
                    supportingDocName = supportingDoc.fileName;

                    // Link the supporting document to the work item for this lens
                    // Create/update supporting document record maps
                    const supportingDocIdMap = { ...(workItem.supportingDocumentId || {}) };
                    const supportingDocAddedMap = { ...(workItem.supportingDocumentAdded || {}) };
                    const supportingDocNameMap = { ...(workItem.supportingDocumentName || {}) };
                    const supportingDocTypeMap = { ...(workItem.supportingDocumentType || {}) };
                    const supportingDocDescMap = { ...(workItem.supportingDocumentDescription || {}) };

                    // Set values for this lens
                    supportingDocIdMap[currentLensAlias] = supportingDocumentId;
                    supportingDocAddedMap[currentLensAlias] = true;
                    supportingDocNameMap[currentLensAlias] = supportingDocName;
                    supportingDocTypeMap[currentLensAlias] = supportingDocType;
                    supportingDocDescMap[currentLensAlias] = supportingDocumentDescription || '';

                    await this.storageService.updateWorkItem(userId, fileId, {
                        supportingDocumentId: supportingDocIdMap,
                        supportingDocumentAdded: supportingDocAddedMap,
                        supportingDocumentName: supportingDocNameMap,
                        supportingDocumentType: supportingDocTypeMap,
                        supportingDocumentDescription: supportingDocDescMap,
                        lastModified: new Date().toISOString(),
                    });
                } catch (error) {
                    this.logger.warn(`Failed to retrieve supporting document: ${error.message}. Continuing without it.`);
                }
            }

            // Update the usedLenses array if this lens doesn't exist
            let usedLenses = [...(workItem.usedLenses || [])];
            if (!usedLenses.some(lens => lens.lensAlias === currentLensAlias)) {
                usedLenses.push({
                    lensAlias: currentLensAlias,
                    lensName: currentLensName,
                    lensAliasArn: lensAliasArn,
                });
            }

            // Create or update lens-specific status maps
            const initialAnalysisStatusMap = { ...(workItem.analysisStatus || {}) };
            const analysisProgressMap = { ...(workItem.analysisProgress || {}) };

            // Set the status for this lens
            initialAnalysisStatusMap[currentLensAlias] = 'IN_PROGRESS';
            analysisProgressMap[currentLensAlias] = 0;

            await this.storageService.updateWorkItem(userId, fileId, {
                analysisStatus: initialAnalysisStatusMap,
                analysisProgress: analysisProgressMap,
                usedLenses,
                lastModified: new Date().toISOString(),
            });

            // Pre-calculate question groups for all selected pillars
            const pillarQuestionGroups = await Promise.all(
                selectedPillars.map(pillar => this.retrieveBestPractices(pillar, workloadId, lensAliasArn, lensPillars))
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
                            Promise.resolve(false),
                        ]);

                        if (isCancelled) {
                            // Update lens-specific status maps
                            const updatedAnalysisStatusMap = { ...(workItem.analysisStatus || {}) };
                            const analysisProgressMap = { ...(workItem.analysisProgress || {}) };
                            const analysisErrorMap = { ...(workItem.analysisError || {}) };
                            const analysisPartialResultsMap = { ...(workItem.analysisPartialResults || {}) };

                            // Update status for this lens
                            updatedAnalysisStatusMap[currentLensAlias] = 'PARTIAL';
                            analysisProgressMap[currentLensAlias] = Math.round((processedQuestions / totalQuestions) * 100);
                            analysisErrorMap[currentLensAlias] = 'Analysis cancelled by user.';
                            analysisPartialResultsMap[currentLensAlias] = true;

                            if (workItem && results.length > 0) {
                                // Store partial results with lensAlias
                                await this.storageService.storeAnalysisResults(
                                    userId,
                                    workItem.fileId,
                                    results,
                                    currentLensAlias
                                );

                                await this.storageService.updateWorkItem(userId, workItem.fileId, {
                                    analysisStatus: updatedAnalysisStatusMap,
                                    analysisProgress: analysisProgressMap,
                                    analysisError: analysisErrorMap,
                                    analysisPartialResults: analysisPartialResultsMap,
                                    lastModified: new Date().toISOString(),
                                });
                            }

                            this.analyzerGateway.emitAnalysisProgress({
                                processedQuestions,
                                totalQuestions,
                                currentPillar: pillar,
                                currentQuestion: 'Analysis cancelled',
                            });
                            return { results, isCancelled: true, fileId: workItem?.fileId };
                        }

                        let kbContexts: string[];
                        try {
                            kbContexts = await this.retrieveFromKnowledgeBase(
                                question.pillar,
                                question.title,
                                question,
                                lensName
                            );
                        } catch (error) {
                            if (workItem && results.length > 0) {
                                // Store partial results before marking as failed
                                await this.storageService.storeAnalysisResults(
                                    userId,
                                    workItem.fileId,
                                    results,
                                    currentLensAlias
                                );

                                const progress = Math.round((processedQuestions / totalQuestions) * 100);
                                const analysisProgressMap = { ...(workItem.analysisProgress || {}) };
                                const analysisStatusMap = { ...(workItem.analysisStatus || {}) };
                                const analysisErrorMap = { ...(workItem.analysisError || {}) };
                                const analysisPartialResultsMap = { ...(workItem.analysisPartialResults || {}) };

                                analysisProgressMap[currentLensAlias] = progress;
                                analysisStatusMap[currentLensAlias] = 'PARTIAL';
                                analysisErrorMap[currentLensAlias] = `Error retrieving from knowledge base: ${error}`;
                                analysisPartialResultsMap[currentLensAlias] = true;

                                await this.storageService.updateWorkItem(userId, workItem.fileId, {
                                    analysisStatus: analysisStatusMap,
                                    analysisProgress: analysisProgressMap,
                                    analysisError: analysisErrorMap,
                                    analysisPartialResults: analysisPartialResultsMap,
                                    lastModified: new Date().toISOString(),
                                });
                            }
                            return {
                                results,
                                isCancelled: false,
                                error: `Error retrieving from knowledge base. Analysis stopped. ${error}`,
                                fileId: workItem?.fileId
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
                                fileType,
                                uploadMode,
                                supportingDocContent,
                                supportingDocType,
                                supportingDocName,
                                supportingDocumentDescription,
                                lensName,
                                lensPillars
                            );
                            results.push(analysis);

                            // Update work item progress if storage is enabled
                            if (workItem) {
                                const progress = Math.round((processedQuestions / totalQuestions) * 100);
                                const analysisProgressMap = { ...(workItem.analysisProgress || {}) };
                                analysisProgressMap[currentLensAlias] = progress;

                                await this.storageService.updateWorkItem(userId, workItem.fileId, {
                                    analysisProgress: analysisProgressMap,
                                    lastModified: new Date().toISOString(),
                                });
                            }

                        } catch (error) {
                            if (workItem && results.length > 0) {
                                // Store partial results before marking as failed
                                await this.storageService.storeAnalysisResults(
                                    userId,
                                    workItem.fileId,
                                    results,
                                    currentLensAlias
                                );

                                const progress = Math.round((processedQuestions / totalQuestions) * 100);
                                const analysisProgressMap = { ...(workItem.analysisProgress || {}) };
                                const analysisStatusMap = { ...(workItem.analysisStatus || {}) };
                                const analysisErrorMap = { ...(workItem.analysisError || {}) };
                                const analysisPartialResultsMap = { ...(workItem.analysisPartialResults || {}) };

                                analysisProgressMap[currentLensAlias] = progress;
                                analysisStatusMap[currentLensAlias] = 'PARTIAL';
                                analysisErrorMap[currentLensAlias] = `${error}. Error analyzing question "${question.pillar} - ${question.title}". Analysis stopped, ${processedQuestions} questions where analyzed out of ${totalQuestions}.`;
                                analysisPartialResultsMap[currentLensAlias] = true;

                                await this.storageService.updateWorkItem(userId, workItem.fileId, {
                                    analysisStatus: analysisStatusMap,
                                    analysisProgress: analysisProgressMap,
                                    analysisError: analysisErrorMap,
                                    analysisPartialResults: analysisPartialResultsMap,
                                    lastModified: new Date().toISOString(),
                                });
                            }
                            return {
                                results,
                                isCancelled: false,
                                error: `${error}. Error analyzing question "${question.pillar} - ${question.title}". Analysis stopped, ${processedQuestions} questions where analyzed out of ${totalQuestions}.`,
                                fileId: workItem?.fileId
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
                        // Update lens-specific error status
                        const progress = Math.round((processedQuestions / totalQuestions) * 100);
                        const analysisProgressMap = { ...(workItem.analysisProgress || {}) };
                        const analysisStatusMap = { ...(workItem.analysisStatus || {}) };
                        const analysisErrorMap = { ...(workItem.analysisError || {}) };
                        const analysisPartialResultsMap = { ...(workItem.analysisPartialResults || {}) };

                        analysisStatusMap[currentLensAlias] = 'PARTIAL';
                        analysisErrorMap[currentLensAlias] = error.message || 'Error during analysis';
                        analysisPartialResultsMap[currentLensAlias] = true;
                        analysisProgressMap[currentLensAlias] = progress;

                        if (workItem && results.length > 0) {
                            // Store partial results with lensAlias
                            await this.storageService.storeAnalysisResults(
                                userId,
                                workItem.fileId,
                                results,
                                currentLensAlias
                            );

                            await this.storageService.updateWorkItem(userId, workItem.fileId, {
                                analysisStatus: analysisStatusMap,
                                analysisProgress: analysisProgressMap,
                                analysisError: analysisErrorMap,
                                analysisPartialResults: analysisPartialResultsMap,
                                lastModified: new Date().toISOString(),
                            });
                        }

                        return {
                            results,
                            isCancelled: false,
                            error: `Error analyzing question "${question.pillar} - ${question.title}". Analysis stopped.`,
                            fileId: workItem?.fileId
                        };
                    }
                }
            }

            // Update lens-specific completed status
            const completeAnalysisStatusMap = { ...(workItem.analysisStatus || {}) };
            completeAnalysisStatusMap[currentLensAlias] = 'COMPLETED';

            const completeAnalysisProgressMap = { ...(workItem.analysisProgress || {}) };
            completeAnalysisProgressMap[currentLensAlias] = 100;

            // Store final results for this lens
            await this.storageService.storeAnalysisResults(
                userId,
                fileId,
                results,
                currentLensAlias
            );

            await this.storageService.updateWorkItem(userId, fileId, {
                analysisStatus: completeAnalysisStatusMap,
                analysisProgress: completeAnalysisProgressMap,
                lastModified: new Date().toISOString(),
            });

            return { results, isCancelled: false, fileId: workItem.fileId };
        } catch (error) {
            const usedLensAlias = lensAlias || 'wellarchitected';
            // Store partial results if available before marking as failed
            if (workItem && results.length > 0) {
                // Update lens-specific error status
                const analysisStatusMap = { ...(workItem.analysisStatus || {}) };
                const analysisErrorMap = { ...(workItem.analysisError || {}) };
                const analysisPartialResultsMap = { ...(workItem.analysisPartialResults || {}) };

                analysisStatusMap[usedLensAlias] = 'PARTIAL';
                analysisErrorMap[usedLensAlias] = error.message || 'Error during analysis';
                analysisPartialResultsMap[usedLensAlias] = true;

                await this.storageService.storeAnalysisResults(
                    userId,
                    fileId,
                    results,
                    usedLensAlias
                );

                await this.storageService.updateWorkItem(userId, fileId, {
                    analysisStatus: analysisStatusMap,
                    analysisError: analysisErrorMap,
                    analysisPartialResults: analysisPartialResultsMap,
                    lastModified: new Date().toISOString(),
                });
            }
            throw error;
        }
    }

    cancelIaCGeneration() {
        this.cancelGeneration$.next();
    }

    async generateIacDocument(
        fileId: string,
        recommendations: any[],
        templateType: IaCTemplateType,
        userId?: string,
        lensAlias?: string,
        lensName?: string
    ): Promise<{ content: string; isCancelled: boolean; error?: string }> {
        try {
            if (!userId) {
                throw new Error('User ID is required for IaC generation');
            }

            // Get file content from storage
            const { content: fileContent, type: fileType } = await this.getFileContent(userId, fileId);
            const workItem = await this.storageService.getWorkItem(userId, fileId);

            if (!fileType.startsWith('image/')) {
                throw new Error('This operation is only supported for architecture diagrams');
            }

            // Use provided lens or default to 'wellarchitected'
            const currentLensAlias = lensAlias || 'wellarchitected';
            const currentLensName = lensName || 'Well-Architected Framework';

            // Update lens-specific IaC generation status
            const iacGenerationStatusMap = { ...(workItem.iacGenerationStatus || {}) };
            const iacGenerationProgressMap = { ...(workItem.iacGenerationProgress || {}) };

            iacGenerationStatusMap[currentLensAlias] = 'IN_PROGRESS';
            iacGenerationProgressMap[currentLensAlias] = 0;

            await this.storageService.updateWorkItem(userId, fileId, {
                iacGenerationStatus: iacGenerationStatusMap,
                iacGenerationProgress: iacGenerationProgressMap,
                lastModified: new Date().toISOString(),
            });

            let isComplete = false;
            let allSections: DocumentSection[] = [];
            let iteration = 0;

            // Ensure fileContent is in the correct base64 format
            const processedContent = this.ensureBase64Format(fileContent, fileType);

            // Extract base64 data and media type
            const base64Data = fileContent.split(',')[1];
            const mediaType = fileContent.split(';')[0].split(':')[1];

            while (!isComplete) {
                try {
                    const progress = Math.min(iteration * 10, 90);
                    this.analyzerGateway.emitImplementationProgress({
                        status: `Generating IaC document...`,
                        progress,
                    });

                    // Update lens-specific storage progress
                    const iacGenerationProgressMap = { ...(workItem.iacGenerationProgress || {}) };
                    iacGenerationProgressMap[currentLensAlias] = progress;

                    await this.storageService.updateWorkItem(userId, fileId, {
                        iacGenerationProgress: iacGenerationProgressMap,
                        lastModified: new Date().toISOString(),
                    });

                    iteration++;

                    const response = await this.invokeBedrockModelForIacGeneration(
                        base64Data,
                        mediaType,
                        recommendations,
                        allSections.length,
                        allSections.length > 0 ? `${JSON.stringify(allSections, null, 2)}` : 'No previous sections generated yet',
                        templateType,
                        null,
                        null,
                        null,
                        null,
                        currentLensName
                    );

                    // Handle cancellation and storage updates
                    if (response.isCancelled) {
                        const sortedSections = allSections.sort((a, b) => a.order - b.order);
                        const cancellationNote = '# Note: Template generation was cancelled. Below is a partial version.\n\n';
                        const partialContent = cancellationNote + sortedSections.map(section =>
                            `# ${section.description}\n${section.content}`
                        ).join('\n\n');

                        if (allSections.length > 0) {
                            const extension = templateType.includes('yaml') ? 'yaml' :
                                templateType.includes('json') ? 'json' : 'tf';

                            // Store partial content with lens alias
                            await this.storageService.storeIaCDocument(
                                userId,
                                fileId,
                                partialContent,
                                extension,
                                templateType,
                                currentLensAlias
                            );

                            // Update lens-specific IaC generation status
                            const progress = Math.min(Math.round((allSections.length / 10) * 100), 90)
                            const iacGenerationStatusMap = { ...(workItem.iacGenerationStatus || {}) };
                            const iacGenerationErrorMap = { ...(workItem.iacGenerationError || {}) };
                            const iacPartialResultsMap = { ...(workItem.iacPartialResults || {}) };
                            const iacGenerationProgressMap = { ...(workItem.iacGenerationProgress || {}) };


                            iacGenerationStatusMap[currentLensAlias] = 'PARTIAL';
                            iacGenerationErrorMap[currentLensAlias] = 'Generation cancelled by user';
                            iacPartialResultsMap[currentLensAlias] = true;
                            iacGenerationProgressMap[currentLensAlias] = progress;

                            await this.storageService.updateWorkItem(userId, fileId, {
                                iacGenerationStatus: iacGenerationStatusMap,
                                iacGenerationProgress: iacGenerationProgressMap,
                                iacGenerationError: iacGenerationErrorMap,
                                iacPartialResults: iacPartialResultsMap,
                                lastModified: new Date().toISOString(),
                            });
                        }

                        return {
                            content: partialContent || '',
                            isCancelled: true,
                        };
                    }

                    const { isComplete: batchComplete, sections } = this.parseImplementationModelResponse(response.content);
                    allSections.push(...sections);
                    isComplete = batchComplete;

                    // If we have sections but encounter an error, save partial results
                    if (!isComplete && allSections.length > 0) {
                        const sortedSections = allSections.sort((a, b) => a.order - b.order);
                        const partialContent = sortedSections.map(section =>
                            `# ${section.description}\n${section.content}`
                        ).join('\n\n');

                        const extension = templateType.includes('yaml') ? 'yaml' :
                            templateType.includes('json') ? 'json' : 'tf';

                        await this.storageService.storeIaCDocument(
                            userId,
                            fileId,
                            partialContent,
                            extension,
                            templateType,
                            currentLensAlias
                        );
                    }

                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    // Handle error and save partial results if available
                    if (allSections.length > 0) {
                        const sortedSections = allSections.sort((a, b) => a.order - b.order);
                        const errorNote = '# Note: Template generation encountered an error. Below is a partial version.\n\n';
                        const partialContent = errorNote + sortedSections.map(section =>
                            `# ${section.description}\n${section.content}`
                        ).join('\n\n');

                        const extension = templateType.includes('yaml') ? 'yaml' :
                            templateType.includes('json') ? 'json' : 'tf';

                        // Store partial content with lens alias
                        await this.storageService.storeIaCDocument(
                            userId,
                            fileId,
                            partialContent,
                            extension,
                            templateType,
                            currentLensAlias
                        );

                        // Update lens-specific error status
                        const progress = Math.min(Math.round((allSections.length / 10) * 100), 90)
                        const iacGenerationStatusMap = { ...(workItem.iacGenerationStatus || {}) };
                        const iacGenerationErrorMap = { ...(workItem.iacGenerationError || {}) };
                        const iacPartialResultsMap = { ...(workItem.iacPartialResults || {}) };
                        const iacGenerationProgressMap = { ...(workItem.iacGenerationProgress || {}) };

                        iacGenerationStatusMap[currentLensAlias] = 'PARTIAL';
                        iacGenerationErrorMap[currentLensAlias] = error.message || 'Error during IaC generation';
                        iacPartialResultsMap[currentLensAlias] = true;
                        iacGenerationProgressMap[currentLensAlias] = progress;

                        await this.storageService.updateWorkItem(userId, fileId, {
                            iacGenerationStatus: iacGenerationStatusMap,
                            iacGenerationProgress: iacGenerationProgressMap,
                            iacGenerationError: iacGenerationErrorMap,
                            iacPartialResults: iacPartialResultsMap,
                            lastModified: new Date().toISOString(),
                        });

                        return {
                            content: partialContent,
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
            const content = sortedSections.map(section =>
                `# ${section.description}\n${section.content}`
            ).join('\n\n');

            // Store final results with lens alias
            const extension = templateType.includes('yaml') ? 'yaml' :
                templateType.includes('json') ? 'json' : 'tf';

            await this.storageService.storeIaCDocument(
                userId,
                fileId,
                content,
                extension,
                templateType,
                currentLensAlias
            );

            // Update lens-specific completed status
            const finalIacGenerationStatusMap = { ...(workItem.iacGenerationStatus || {}) };
            const finalIacGenerationProgressMap = { ...(workItem.iacGenerationProgress || {}) };
            finalIacGenerationStatusMap[currentLensAlias] = 'COMPLETED';
            finalIacGenerationProgressMap[currentLensAlias] = 100;

            await this.storageService.updateWorkItem(userId, fileId, {
                iacGenerationStatus: finalIacGenerationStatusMap,
                iacGenerationProgress: finalIacGenerationProgressMap,
                lastModified: new Date().toISOString(),
            });

            return {
                content,
                isCancelled: false
            };
        } catch (error) {
            this.logger.error('Error generating IaC document:', error);
            const currentLensForIac = lensAlias || 'wellarchitected';
            if (userId && fileId) {
                // Update lens-specific error status
                const workItem = await this.storageService.getWorkItem(userId, fileId);
                const iacGenerationStatusMap = { ...(workItem.iacGenerationStatus || {}) };
                const iacGenerationErrorMap = { ...(workItem.iacGenerationError || {}) };

                iacGenerationStatusMap[currentLensForIac] = 'FAILED';
                iacGenerationErrorMap[currentLensForIac] = error.message || 'Error during IaC generation';

                await this.storageService.updateWorkItem(userId, fileId, {
                    iacGenerationStatus: iacGenerationStatusMap,
                    iacGenerationError: iacGenerationErrorMap,
                    lastModified: new Date().toISOString(),
                });
            }
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

    async getMoreDetails(
        selectedItems: any[],
        userId: string,
        fileId: string,
        templateType?: IaCTemplateType,
        lensAlias?: string,
        lensName?: string
    ): Promise<{ content: string; error?: string }> {
        const filteredItems = selectedItems.filter(item => !item.applied && item.relevant === true);
        try {
            if (!selectedItems || selectedItems.length === 0) {
                throw new Error('No items selected for detailed analysis');
            }

            if (!fileId || !userId) {
                throw new Error('File ID and User ID are required');
            }

            // Get file type from work item
            const workItem = await this.storageService.getWorkItem(userId, fileId);
            const fileType = workItem.fileType;

            if (!fileType) {
                throw new Error('No file type provided');
            }

            // Get the file content from storage
            const { data: fileContent } = await this.storageService.getOriginalContent(
                userId,
                fileId,
                false
            );

            // Get supporting document if available
            let supportingDocContent = null;
            let supportingDocType = null;
            let supportingDocName = null;
            let supportingDocDescription = null;

            const usedLensAlias = lensAlias || 'wellarchitected';

            if (workItem.supportingDocumentId && workItem.supportingDocumentAdded) {
                try {
                    const supportingDoc = await this.storageService.getSupportingDocument(
                        userId,
                        fileId,
                        workItem.supportingDocumentId[usedLensAlias],
                        usedLensAlias
                    );

                    // Convert to base64 for images and PDFs, leave as text for text files
                    if (supportingDoc.contentType === 'text/plain') {
                        supportingDocContent = supportingDoc.data.toString('utf8');
                    } else {
                        supportingDocContent = supportingDoc.data.toString('base64');
                    }

                    supportingDocType = supportingDoc.contentType;
                    supportingDocName = supportingDoc.fileName;
                    supportingDocDescription = workItem.supportingDocumentDescription;
                } catch (error) {
                    this.logger.warn(`Failed to retrieve supporting document: ${error.message}. Continuing without it.`);
                }
            }

            // Convert Buffer to string if necessary and ensure proper format
            const processedContent = Buffer.isBuffer(fileContent)
                ? fileType.startsWith('image/')
                    ? `data:${fileType};base64,${fileContent.toString('base64')}`
                    : fileContent.toString('utf-8')
                : typeof fileContent === 'string' && fileType.startsWith('image/') && !fileContent.startsWith('data:')
                    ? `data:${fileType};base64,${fileContent}`
                    : fileContent;

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
                        let response;

                        if (isImage) {
                            // Invoke model for image details with supporting doc if available
                            const imageBase64Data = processedContent.split(',')[1];
                            const imageMediaType = processedContent.split(';')[0].split(':')[1];
                            const imageFormat = imageMediaType.split('/')[1]; // Extract format from media type

                            const messages: Message[] = [
                                {
                                    role: "user",
                                    content: [
                                        {
                                            image: {
                                                format: imageFormat as "png" | "jpeg" | "gif" | "webp",
                                                source: {
                                                    bytes: Buffer.from(imageBase64Data, 'base64')
                                                }
                                            }
                                        },
                                        {
                                            text: Prompts.buildImageDetailsPrompt(
                                                item,
                                                itemDetails,
                                                supportingDocName,
                                                supportingDocDescription
                                            )
                                        }
                                    ]
                                }
                            ];

                            // Add supporting document to messages if available
                            if (supportingDocContent && supportingDocType) {
                                if (supportingDocType === 'text/plain') {
                                    // For plain text
                                    messages[0].content.push({
                                        text: supportingDocContent
                                    });
                                } else if (supportingDocType.startsWith('image/')) {
                                    // For images
                                    const supportingFormat = supportingDocType.split('/')[1]; // Extract format
                                    messages[0].content.push({
                                        image: {
                                            format: supportingFormat as "png" | "jpeg" | "gif" | "webp",
                                            source: {
                                                bytes: Buffer.from(supportingDocContent, 'base64')
                                            }
                                        }
                                    });
                                } else if (supportingDocType === 'application/pdf') {
                                    // For PDFs
                                    messages[0].content.push({
                                        document: {
                                            format: "pdf",
                                            name: this.normalizeFileName(supportingDocName || "supporting-document.pdf"),
                                            source: {
                                                bytes: Buffer.from(supportingDocContent, 'base64')
                                            }
                                        }
                                    });
                                }
                            }

                            const bedrockClient = this.awsConfig.createBedrockClient();
                            const modelId = this.configService.get<string>('aws.bedrock.modelId');

                            // Get model parameters based on the model type
                            const modelParams = this.getModelParameters();

                            const command = new ConverseCommand({
                                modelId,
                                ...modelParams,
                                messages,
                                system: [
                                    {
                                        text: Prompts.buildImageDetailsSystemPrompt(templateType, modelId, lensName)
                                    }
                                ]
                            });

                            const modelResponse = await bedrockClient.send(command);
                            response = modelResponse;
                        } else {
                            // For non-image files, use the text-based approach with supporting doc if available
                            const detailsPrompt = Prompts.buildDetailsPrompt(
                                item,
                                processedContent,
                                itemDetails,
                                supportingDocName,
                                supportingDocDescription
                            );

                            const messages: Message[] = [
                                {
                                    role: "user",
                                    content: [
                                        {
                                            text: detailsPrompt
                                        }
                                    ]
                                }
                            ];

                            // Add supporting document to message content if available
                            if (supportingDocContent && supportingDocType) {
                                if (supportingDocType === 'text/plain') {
                                    // For plain text
                                    messages[0].content.push({
                                        text: supportingDocContent
                                    });
                                } else if (supportingDocType.startsWith('image/')) {
                                    // For images
                                    const supportingFormat = supportingDocType.split('/')[1]; // Extract format
                                    messages[0].content.push({
                                        image: {
                                            format: supportingFormat as "png" | "jpeg" | "gif" | "webp",
                                            source: {
                                                bytes: Buffer.from(supportingDocContent, 'base64')
                                            }
                                        }
                                    });
                                } else if (supportingDocType === 'application/pdf') {
                                    // For PDFs
                                    messages[0].content.push({
                                        document: {
                                            format: "pdf",
                                            name: this.normalizeFileName(supportingDocName || "supporting-document.pdf"),
                                            source: {
                                                bytes: Buffer.from(supportingDocContent, 'base64')
                                            }
                                        }
                                    });
                                }
                            }

                            const bedrockClient = this.awsConfig.createBedrockClient();
                            const modelId = this.configService.get<string>('aws.bedrock.modelId');

                            // Get model parameters based on the model type
                            const modelParams = this.getModelParameters();

                            const command = new ConverseCommand({
                                modelId,
                                ...modelParams,
                                messages,
                                system: [
                                    {
                                        text: Prompts.buildDetailsSystemPrompt(modelId, lensName)
                                    }
                                ]
                            });

                            const modelResponse = await bedrockClient.send(command);
                            response = modelResponse;
                        }

                        // Extract text from response output
                        const responseText = response.output.message.content.find(c => c.text)?.text || '';

                        const { content, isComplete: sectionComplete } =
                            this.parseDetailsModelResponse(responseText);

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

            return { content: allDetails.trim() };
        } catch (error) {
            this.logger.error('Error getting more details:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get detailed analysis');
        }
    }

    /**
     * Normalizes file names to comply with Bedrock API requirements:
     * - Only alphanumeric characters, whitespace, hyphens, parentheses, and square brackets
     * - No consecutive whitespace characters
     */
    private normalizeFileName(fileName: string): string {
        if (!fileName) return 'document.pdf';

        // Replace invalid characters with hyphens
        let normalizedName = fileName
            // Keep only allowed characters, replace others with hyphens
            .replace(/[^a-zA-Z0-9\s\-\(\)\[\]]/g, '-')
            // Replace consecutive whitespace with single space
            .replace(/\s+/g, ' ')
            // Trim leading/trailing spaces
            .trim();

        // If empty after normalization, use default name
        return normalizedName || 'document.pdf';
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

    private async retrieveFromKnowledgeBase(
        pillar: string,
        question: string,
        questionGroup: QuestionGroup,
        lensName?: string
    ): Promise<string[]> {
        const bedrockAgent = this.awsConfig.createBedrockAgentClient();
        const knowledgeBaseId = this.configService.get<string>('aws.bedrock.knowledgeBaseId');
        const modelId = this.configService.get<string>('aws.bedrock.modelId');

        const command = new RetrieveAndGenerateCommand({
            input: {
                text: Prompts.buildKnowledgeBaseInputPrompt(question, pillar, questionGroup, lensName),
            },
            retrieveAndGenerateConfiguration: {
                type: "KNOWLEDGE_BASE",
                knowledgeBaseConfiguration: {
                    knowledgeBaseId: knowledgeBaseId,
                    modelArn: modelId,
                    retrievalConfiguration: {
                        vectorSearchConfiguration: {
                            numberOfResults: 10,
                            filter: {
                                equals: {
                                    key: "lens_name",
                                    value: lensName
                                }
                            }
                        },
                    },
                    generationConfiguration: {
                        inferenceConfig: {
                            textInferenceConfig: {
                                maxTokens: 4096,
                                temperature: 0.7
                            }
                        },
                        promptTemplate: {
                            textPromptTemplate: Prompts.buildKnowledgeBasePromptTemplate(lensName)
                        }
                    }
                }
            }
        });

        const response = await bedrockAgent.send(command);

        // Return as an array with one element to match the expected return type
        return response.output?.text ? [response.output.text] : [];
    }

    private async analyzeQuestion(
        fileContent: string,
        question: QuestionGroup,
        kbContexts: string[],
        fileType: string,
        uploadMode: FileUploadMode = FileUploadMode.SINGLE_FILE,
        supportingDocContent?: string,
        supportingDocType?: string,
        supportingDocName?: string,
        supportingDocDescription?: string,
        lensName?: string,
        lensPillars?: Record<string, string>
    ): Promise<any> {
        try {
            // Determine if it's an image
            const isImage = uploadMode === FileUploadMode.SINGLE_FILE && fileType.startsWith('image/');

            // Choose the appropriate prompt based on uploadMode
            const prompt = isImage
                ? Prompts.buildImagePrompt(question, kbContexts, supportingDocName, supportingDocDescription)
                : uploadMode === FileUploadMode.SINGLE_FILE
                    ? Prompts.buildPrompt(question, kbContexts, supportingDocName, supportingDocDescription)
                    : Prompts.buildProjectPrompt(question, kbContexts, supportingDocName, supportingDocDescription);

            // Get pillar names as comma-separated string for prompts
            const pillarNames = lensPillars ? Object.values(lensPillars).join(', ') :
                'Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability';

            // Choose the appropriate system prompt based on uploadMode
            const systemPrompt = isImage
                ? Prompts.buildImageSystemPrompt(question, lensName, pillarNames, lensPillars)
                : uploadMode === FileUploadMode.SINGLE_FILE
                    ? Prompts.buildSystemPrompt(fileContent, question, lensName, pillarNames, lensPillars)
                    : Prompts.buildProjectSystemPrompt(fileContent, question, lensName, pillarNames, lensPillars);

            // Ensure fileContent is properly formatted for images
            if (isImage && !fileContent.startsWith('data:')) {
                this.logger.error('Invalid image content format');
                throw new Error('Invalid image content format');
            }

            const response = isImage
                ? await this.invokeBedrockModelWithImage(
                    prompt,
                    systemPrompt,
                    fileContent,
                    supportingDocContent,
                    supportingDocType,
                    supportingDocName
                )
                : await this.invokeBedrockModel(
                    prompt,
                    systemPrompt,
                    supportingDocContent,
                    supportingDocType,
                    supportingDocName
                );

            return {
                pillar: question.pillar,
                question: question.title,
                questionId: question.questionId,
                bestPractices: this.parseModelResponse(response, question),
            };
        } catch (error) {
            this.logger.error('Error analyzing question:', error);
            throw error;
        }
    }

    private cleanJsonString(jsonString: string): string {
        // First trim everything outside the outermost json_response tags
        const startTag = "<json_response>";
        const endTag = "</json_response>";
        const startIndex = jsonString.indexOf(startTag);
        const endIndex = jsonString.lastIndexOf(endTag);

        if (startIndex !== -1 && endIndex !== -1) {
            // Extract content between tags (excluding the tags themselves)
            jsonString = jsonString.substring(startIndex + startTag.length, endIndex);
        }

        // Then trim everything outside the outermost curly braces
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

    private async invokeBedrockModelWithImage(
        prompt: string,
        systemPrompt: string,
        imageContent: string,
        supportingDocContent?: string,
        supportingDocType?: string,
        supportingDocName?: string
    ): Promise<ModelResponse> {
        const bedrockClient = this.awsConfig.createBedrockClient();
        const modelId = this.configService.get<string>('aws.bedrock.modelId');

        // Get model parameters based on the model type
        const modelParams = this.getModelParameters();

        try {
            // Extract base64 data and media type from data URL
            const matches = imageContent.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) {
                throw new Error('Invalid image data format');
            }

            const [, imageMediaType, imageBase64Data] = matches;
            const imageFormat = imageMediaType.split('/')[1]; // Extract format from media type (e.g., "png" from "image/png")

            const messages: Message[] = [
                {
                    role: "user", // Using literal "user" as required by the API
                    content: [
                        {
                            image: {
                                format: imageFormat as "png" | "jpeg" | "gif" | "webp",
                                source: {
                                    bytes: Buffer.from(imageBase64Data, 'base64')
                                }
                            }
                        },
                        {
                            text: prompt
                        }
                    ]
                }
            ];

            // Add supporting document to message content if provided
            if (supportingDocContent && supportingDocType) {
                if (supportingDocType === 'text/plain') {
                    // For plain text
                    messages[0].content.push({
                        text: supportingDocContent
                    });
                } else if (supportingDocType.startsWith('image/')) {
                    // For images
                    const supportingFormat = supportingDocType.split('/')[1]; // Extract format
                    messages[0].content.push({
                        image: {
                            format: supportingFormat as "png" | "jpeg" | "gif" | "webp",
                            source: {
                                bytes: Buffer.from(supportingDocContent, 'base64')
                            }
                        }
                    });
                } else if (supportingDocType === 'application/pdf') {
                    // For PDFs
                    messages[0].content.push({
                        document: {
                            format: "pdf",
                            name: this.normalizeFileName(supportingDocName || "supporting-document.pdf"),
                            source: {
                                bytes: Buffer.from(supportingDocContent, 'base64')
                            }
                        }
                    });
                }
            }

            // Prepare system content
            const system: SystemContentBlock[] = [
                {
                    text: systemPrompt
                }
            ];

            const command = new ConverseCommand({
                modelId,
                ...modelParams,
                messages,
                system
            });

            const response = await bedrockClient.send(command);

            // Extract text from the response
            const responseText = response.output.message.content.find(c => c.text)?.text || '';

            const cleanedAnalysisJsonString = this.cleanJsonString(responseText);
            return JSON.parse(cleanedAnalysisJsonString);
        } catch (error) {
            this.logger.error('Error invoking Bedrock model:', error);
            throw new Error(`Failed to analyze diagram with AI model. Error invoking Bedrock model: ${error}`);
        }
    }

    private async invokeBedrockModel(
        prompt: string,
        systemPrompt: string,
        supportingDocContent?: string,
        supportingDocType?: string,
        supportingDocName?: string
    ): Promise<ModelResponse> {
        const bedrockClient = this.awsConfig.createBedrockClient();
        const modelId = this.configService.get<string>('aws.bedrock.modelId');

        // Get model parameters based on the model type
        const modelParams = this.getModelParameters();

        // Prepare base message
        const messages: Message[] = [
            {
                role: "user",
                content: [
                    {
                        text: prompt
                    }
                ]
            }
        ];

        // Add supporting document to message content if provided
        if (supportingDocContent && supportingDocType) {
            if (supportingDocType === 'text/plain') {
                // For plain text
                messages[0].content.push({
                    text: supportingDocContent
                });
            } else if (supportingDocType.startsWith('image/')) {
                // For images
                const supportingFormat = supportingDocType.split('/')[1]; // Extract format
                messages[0].content.push({
                    image: {
                        format: supportingFormat as "png" | "jpeg" | "gif" | "webp",
                        source: {
                            bytes: Buffer.from(supportingDocContent, 'base64')
                        }
                    }
                });
            } else if (supportingDocType === 'application/pdf') {
                // For PDFs
                messages[0].content.push({
                    document: {
                        format: "pdf",
                        name: this.normalizeFileName(supportingDocName || "supporting-document.pdf"),
                        source: {
                            bytes: Buffer.from(supportingDocContent, 'base64')
                        }
                    }
                });
            }
        }

        try {
            const command = new ConverseCommand({
                modelId,
                ...modelParams,
                messages,
                system: [
                    {
                        text: systemPrompt
                    }
                ]
            });

            const response = await bedrockClient.send(command);

            // Extract text from response
            const responseText = response.output.message.content.find(c => c.text)?.text || '';

            const cleanedAnalysisJsonString = this.cleanJsonString(responseText);
            const parsedAnalysis = JSON.parse(cleanedAnalysisJsonString);

            return parsedAnalysis;
        } catch (error) {
            this.logger.error('Error invoking Bedrock model:', error);
            throw new Error(`Failed to analyze template with AI model. Error invoking Bedrock model: ${error}`);
        }
    }

    async invokeBedrockModelForIacGeneration(
        imageData: string,
        mediaType: string,
        recommendations: any[],
        previousSections: number,
        allPreviousSections: string,
        templateType?: IaCTemplateType,
        supportingDocContent?: string,
        supportingDocType?: string,
        supportingDocName?: string,
        supportingDocDescription?: string,
        lensName?: string
    ): Promise<{ content: string; isCancelled: boolean }> {
        const bedrockClient = this.awsConfig.createBedrockClient();
        const modelId = this.configService.get<string>('aws.bedrock.modelId');

        // Get model parameters based on the model type
        const modelParams = this.getModelParameters();

        const systemPrompt = Prompts.buildIacGenerationSystemPrompt(templateType, modelId, lensName);
        const prompt = Prompts.buildIacGenerationPrompt(
            previousSections,
            allPreviousSections,
            recommendations,
            supportingDocName,
            supportingDocDescription
        );

        const imageFormat = mediaType.split('/')[1]; // Extract format from media type

        const messages: Message[] = [
            {
                role: "user",
                content: [
                    {
                        image: {
                            format: imageFormat as "png" | "jpeg" | "gif" | "webp",
                            source: {
                                bytes: Buffer.from(imageData, 'base64')
                            }
                        }
                    },
                    {
                        text: prompt
                    }
                ]
            }
        ];

        // Add supporting document to message content if provided
        if (supportingDocContent && supportingDocType) {
            if (supportingDocType === 'text/plain') {
                // For plain text
                messages[0].content.push({
                    text: supportingDocContent
                });
            } else if (supportingDocType.startsWith('image/')) {
                // For images
                const supportingFormat = supportingDocType.split('/')[1]; // Extract format
                messages[0].content.push({
                    image: {
                        format: supportingFormat as "png" | "jpeg" | "gif" | "webp",
                        source: {
                            bytes: Buffer.from(supportingDocContent, 'base64')
                        }
                    }
                });
            } else if (supportingDocType === 'application/pdf') {
                // For PDFs
                messages[0].content.push({
                    document: {
                        format: "pdf",
                        name: this.normalizeFileName(supportingDocName || "supporting-document.pdf"),
                        source: {
                            bytes: Buffer.from(supportingDocContent, 'base64')
                        }
                    }
                });
            }
        }

        // Create a Promise that resolves when cancelGeneration$ emits
        const cancelPromise = new Promise<void>((resolve) => {
            const subscription = this.cancelGeneration$.subscribe(() => {
                subscription.unsubscribe();
                resolve();
            });
        });

        try {
            const command = new ConverseCommand({
                modelId,
                ...modelParams,
                messages,
                system: [
                    {
                        text: systemPrompt
                    }
                ]
            });

            // Race between the Bedrock call and cancellation
            const modelResponsePromise = bedrockClient.send(command);
            const raceResult = await Promise.race([
                modelResponsePromise,
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
            const responseText = raceResult.output.message.content.find(c => c.text)?.text || '';

            return {
                content: responseText,
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
                relevant: bp.relevant,
                applied: bp.applied,
                reasonApplied: bp.reasonApplied,
                reasonNotApplied: bp.reasonNotApplied,
                recommendations: bp.recommendations,
                extendedRecommendations: bp.extendedRecommendations,
            }));
        } catch (error) {
            this.logger.error('Error parsing model response:', error);
            throw new Error('Failed to parse analysis results');
        }
    }

    private async loadWellArchitectedAnswers(workloadId: string, lensAlias?: string): Promise<WellArchitectedAnswer> {
        const waClient = this.awsConfig.createWAClient();

        try {
            const allAnswers: WellArchitectedAnswer = {
                AnswerSummaries: [],
                WorkloadId: workloadId,
            };

            // Use the provided lens alias or default to wellarchitected
            const usedLensAlias = lensAlias || 'wellarchitected';

            const paginator = paginateListAnswers(
                { client: waClient },
                {
                    WorkloadId: workloadId,
                    LensAlias: usedLensAlias
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
    private async loadBestPractices(workloadId: string, lensAliasArn: string, lensPillars: Record<string, string>): Promise<WellArchitectedBestPractice[]> {

        const s3Client = this.awsConfig.createS3Client();
        const waDocsBucket = this.configService.get<string>('aws.s3.waDocsBucket');

        try {
            // Extract the lens name from the lens alias (everything after the last slash)
            let lensName = 'wellarchitected';
            if (lensAliasArn) {
                lensName = lensAliasArn.split('/').pop() || 'wellarchitected';
            }

            // Create the path to the best practices JSON file
            const bestPracticesPath = `${lensName}/best_practices_list/${lensName}_best_practices.json`;

            // Fetch best practices from S3
            const s3Response = await s3Client.send(
                new GetObjectCommand({
                    Bucket: waDocsBucket,
                    Key: bestPracticesPath
                })
            );

            const responseBody = await s3Response.Body?.transformToString();
            if (!responseBody) {
                throw new Error('No data received from S3');
            }

            const baseBestPractices: WellArchitectedBestPractice[] = JSON.parse(responseBody);

            // Fetch WA Tool answers
            const waAnswers = await this.loadWellArchitectedAnswers(workloadId, lensAliasArn);

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

            // Create the reverse mapping (from pillar name to ID)
            const reversePillarMapping = {};
            Object.entries(lensPillars).forEach(([id, name]) => {
                reversePillarMapping[name] = id;
            });

            // Enhance best practices with their corresponding ChoiceIds and QuestionIds
            this.cachedBestPractices = baseBestPractices.map(bp => {
                // Create the same unique key for lookup
                const uniqueKey = `${bp.Question}|||${bp['Best Practice']}`;

                const pillarId = reversePillarMapping[bp.Pillar];

                return {
                    ...bp,
                    bestPracticeId: choiceIdMapping.get(uniqueKey) ||
                        this.generateFallbackBestPracticeId(`${bp.Question}-${bp['Best Practice']}`),
                    questionId: questionIdMapping.get(bp.Question) ||
                        this.generateFallbackBestPracticeId(bp.Question),
                    pillarId: pillarId
                };
            });

            return this.cachedBestPractices;
        } catch (error) {
            this.logger.error('Error loading best practices:', error);
            throw new Error('Failed to load Well-Architected best practices');
        }
    }

    private async retrieveBestPractices(pillarId: string, workloadId: string, lensAliasArn?: string, lensPillars?: Record<string, string>): Promise<QuestionGroup[]> {
        try {
            const allBestPractices = await this.loadBestPractices(workloadId, lensAliasArn, lensPillars);
            const pillarBestPractices = allBestPractices.filter(
                bp => bp.pillarId === pillarId
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