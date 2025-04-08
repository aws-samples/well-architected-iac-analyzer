import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AwsConfigService } from '../../config/aws.config';
import {
  GetObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { Upload } from "@aws-sdk/lib-storage";
import {
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  QueryCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { createHash } from 'crypto';
import {
  WorkItem,
  WorkItemUpdate,
  S3Locations,
  StorageConfig,
  LensInfo,
  WorkloadIdInfo
} from '../../shared/interfaces/storage.interface';
import { FileUploadMode } from '../../shared/dto/analysis.dto';
import { ProjectPacker } from '../../shared/utils/project-packer';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly config: StorageConfig;
  private readonly projectPacker: ProjectPacker;

  constructor(
    private readonly awsConfig: AwsConfigService,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      enabled: true,
      bucket: this.configService.get<string>('storage.bucket'),
      table: this.configService.get<string>('storage.table'),
    };
    this.projectPacker = new ProjectPacker();
  }

  public createUserIdHash(email: string): string {
    // Trim and lowercase email before hashing to ensure consistency
    const normalizedEmail = email.trim().toLowerCase();
    return createHash('sha256').update(normalizedEmail).digest('hex');
  }

  private createFileIdHash(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  private getS3Locations(userId: string, fileId: string): S3Locations {
    const prefix = `${userId}/${fileId}`;
    return {
      metadata: `${prefix}/metadata.json`,
      originalContent: `${prefix}/original_content`,
      packedContent: `${prefix}/packed_content`,
      chatHistory: `${prefix}/chat_history.json`,
      
      // Get lens-specific paths
      getAnalysisResultsPath: (lensAlias: string): string => {
        return `${prefix}/analysis/${lensAlias}/analysis_results.json`;
      },
      
      getIaCDocumentPath: (lensAlias: string, extension?: string): string => {
        const basePath = `${prefix}/iac_templates/${lensAlias}/generated_template`;
        return extension ? `${basePath}.${extension}` : basePath;
      },
      
      getSupportingDocumentPath: (lensAlias: string, documentId: string): string => {
        return `${prefix}/supporting_documents/${lensAlias}/${documentId}`;
      },
      
      getSupportingDocumentMetadataPath: (lensAlias: string, documentId: string): string => {
        return `${prefix}/supporting_documents/${lensAlias}/${documentId}_metadata.json`;
      }
    };
  }

  // Store chat history
  async storeChatHistory(
    userId: string,
    fileId: string,
    messages: any[]
  ): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const s3Client = this.awsConfig.createS3Client();
    const dynamoClient = this.awsConfig.createDynamoDBClient();
    const s3Locations = this.getS3Locations(userId, fileId);

    try {
      // Only store chat history if there are messages
      if (messages && messages.length > 0) {
        const upload = new Upload({
          client: s3Client,
          params: {
            Bucket: this.config.bucket,
            Key: s3Locations.chatHistory,
            Body: JSON.stringify(messages),
            ContentType: 'application/json',
          },
        });
  
        await upload.done();
  
        // Set hasChatHistory to true
        await dynamoClient.send(
          new UpdateItemCommand({
            TableName: this.config.table,
            Key: marshall({
              userId,
              fileId,
            }),
            UpdateExpression: 'SET hasChatHistory = :hasChat',
            ExpressionAttributeValues: marshall({
              ':hasChat': true,
            }),
          })
        );
      } else {
        // If no messages, make sure hasChatHistory is false
        await dynamoClient.send(
          new UpdateItemCommand({
            TableName: this.config.table,
            Key: marshall({
              userId,
              fileId,
            }),
            UpdateExpression: 'SET hasChatHistory = :hasChat',
            ExpressionAttributeValues: marshall({
              ':hasChat': false,
            }),
          })
        );
      }
    } catch (error) {
      this.logger.error('Error storing chat history:', error);
      throw new Error('Failed to store chat history');
    }
  }

  // Retrieve chat history
  async getChatHistory(userId: string, fileId: string): Promise<any[]> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const s3Client = this.awsConfig.createS3Client();
    const s3Locations = this.getS3Locations(userId, fileId);

    try {
      const result = await s3Client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: s3Locations.chatHistory,
        })
      );

      const content = await result.Body.transformToString();
      return JSON.parse(content);
    } catch (error) {
      // If it's a NoSuchKey error, the chat history doesn't exist
      if (error.name === 'NoSuchKey') {
        // Also ensure the hasChatHistory flag is false in the WorkItem
        try {
          const dynamoClient = this.awsConfig.createDynamoDBClient();
          await dynamoClient.send(
            new UpdateItemCommand({
              TableName: this.config.table,
              Key: marshall({
                userId,
                fileId,
              }),
              UpdateExpression: 'SET hasChatHistory = :hasChat',
              ExpressionAttributeValues: marshall({
                ':hasChat': false,
              }),
            })
          );
        } catch (updateError) {
          this.logger.warn('Error updating hasChatHistory flag:', updateError);
        }
        
        return [];
      }
      
      this.logger.error('Error getting chat history:', error);
      throw new Error('Failed to get chat history');
    }
  }

  // Delete chat history
  async deleteChatHistory(userId: string, fileId: string): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const s3Client = this.awsConfig.createS3Client();
    const dynamoClient = this.awsConfig.createDynamoDBClient();
    const s3Locations = this.getS3Locations(userId, fileId);

    try {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.config.bucket,
          Delete: {
            Objects: [
              { Key: s3Locations.chatHistory }
            ],
          },
        })
      );

      // Update the work item to set hasChatHistory to false
      await dynamoClient.send(
        new UpdateItemCommand({
          TableName: this.config.table,
          Key: marshall({
            userId,
            fileId,
          }),
          UpdateExpression: 'SET hasChatHistory = :hasChat',
          ExpressionAttributeValues: marshall({
            ':hasChat': false,
          }),
        })
      );
    } catch (error) {
      this.logger.error('Error deleting chat history:', error);
      throw new Error('Failed to delete chat history');
    }
  }

  // Method to store supporting document
  async storeSupportingDocument(
    userId: string,
    mainFileId: string,
    fileName: string,
    fileType: string,
    fileBuffer: Buffer,
    description: string,
    lensAlias: string,
    lensAliasArn: string,
  ): Promise<string> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    // Generate a unique ID for the supporting document
    const supportingDocIdHash = this.createFileIdHash(`supporting_${mainFileId}_${fileName}_${Date.now().toString()}`);
    const timestamp = new Date().toISOString();
    const s3Client = this.awsConfig.createS3Client();
    const dynamoClient = this.awsConfig.createDynamoDBClient();

    // Get S3 locations
    const s3Locations = this.getS3Locations(userId, mainFileId);
    
    try {
      // Store supporting document in S3 with lens-specific path
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: this.config.bucket,
          Key: s3Locations.getSupportingDocumentPath(lensAlias, supportingDocIdHash),
          Body: fileBuffer,
          ContentType: fileType,
        },
      });

      await upload.done();

      // Store metadata for the supporting document
      const metadata = {
        userId,
        fileId: supportingDocIdHash,
        mainFileId,
        fileName,
        fileType,
        uploadDate: timestamp,
        lastModified: timestamp,
        description,
        lensAlias,
        type: 'supporting-document',
      };

      const metadataUpload = new Upload({
        client: s3Client,
        params: {
          Bucket: this.config.bucket,
          Key: s3Locations.getSupportingDocumentMetadataPath(lensAlias, supportingDocIdHash),
          Body: JSON.stringify(metadata),
          ContentType: 'application/json',
        },
      });

      await metadataUpload.done();

      // Get current work item to update lens-specific supporting document fields
      const workItem = await this.getWorkItem(userId, mainFileId);
      
      // Initialize or update lens information
      let usedLenses: LensInfo[] = workItem.usedLenses || [];
      
      // Get lens name from existing lenses or use default
      const lensName = this.getLensNameFromAlias(usedLenses, lensAlias);
      
      // Check if lens already exists in usedLenses
      if (!usedLenses.some(lens => lens.lensAlias === lensAlias)) {
        usedLenses.push({ lensAlias, lensName, lensAliasArn });
      }
      
      // Initialize or update lens-specific supporting document maps
      let supportingDocId: Record<string, string> = { 
        ...(workItem.supportingDocumentId || {})
      };
      let supportingDocAdded: Record<string, boolean> = {
        ...(workItem.supportingDocumentAdded || {})
      };
      let supportingDocDesc: Record<string, string> = {
        ...(workItem.supportingDocumentDescription || {})
      };
      let supportingDocName: Record<string, string> = {
        ...(workItem.supportingDocumentName || {})
      };
      let supportingDocType: Record<string, string> = {
        ...(workItem.supportingDocumentType || {})
      };
      
      // Set values for this lens
      supportingDocId[lensAlias] = supportingDocIdHash;
      supportingDocAdded[lensAlias] = true;
      supportingDocDesc[lensAlias] = description;
      supportingDocName[lensAlias] = fileName;
      supportingDocType[lensAlias] = fileType;

      // Update the work item
      await this.updateWorkItem(userId, mainFileId, {
        usedLenses,
        supportingDocumentId: supportingDocId,
        supportingDocumentAdded: supportingDocAdded,
        supportingDocumentDescription: supportingDocDesc,
        supportingDocumentName: supportingDocName,
        supportingDocumentType: supportingDocType,
        lastModified: timestamp
      });

      return supportingDocIdHash;
    } catch (error) {
      this.logger.error('Error storing supporting document:', error);
      throw new Error('Failed to store supporting document');
    }
  }

  // Helper method to get lens name from alias
  private getLensNameFromAlias(lenses: LensInfo[], lensAlias: string): string {
    const lens = lenses.find(l => l.lensAlias === lensAlias);
    if (lens) {
      return lens.lensName;
    }
    
    // Default names for common lenses if not found
    if (lensAlias === 'wellarchitected') {
      return 'Well-Architected Framework';
    } else if (lensAlias === 'serverless') {
      return 'Serverless Lens';
    }
    
    // Generic fallback
    return `Lens: ${lensAlias}`;
  }

  // Method to get supporting document
  async getSupportingDocument(
    userId: string,
    mainFileId: string,
    supportingDocId: string,
    lensAlias: string
  ): Promise<{ data: Buffer; contentType: string; fileName: string }> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const s3Client = this.awsConfig.createS3Client();

    try {
      // Get the main work item to validate the supporting document relationship
      const workItem = await this.getWorkItem(userId, mainFileId);

      // Check if lens is in the usedLenses list
      if (!workItem.usedLenses?.some(lens => lens.lensAlias === lensAlias)) {
        throw new Error(`No lens '${lensAlias}' found for this work item`);
      }

      if (!workItem.supportingDocumentId?.[lensAlias] || !workItem.supportingDocumentAdded?.[lensAlias]) {
        throw new Error(`No supporting document available for lens '${lensAlias}'`);
      }

      if (workItem.supportingDocumentId[lensAlias] !== supportingDocId) {
        throw new Error('Supporting document ID does not match the work item record for this lens');
      }

      // Get the supporting document from S3 using lens-specific path
      const s3Locations = this.getS3Locations(userId, mainFileId);
      const supportingDocKey = s3Locations.getSupportingDocumentPath(lensAlias, supportingDocId);

      const result = await s3Client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: supportingDocKey,
        })
      );

      const contentType = result.ContentType || 'application/octet-stream';
      const response = await result.Body.transformToByteArray();

      return {
        data: Buffer.from(response),
        contentType,
        fileName: workItem.supportingDocumentName?.[lensAlias] || 'supporting-document'
      };
    } catch (error) {
      this.logger.error('Error getting supporting document:', error);
      throw new Error('Failed to get supporting document');
    }
  }

  /**
   * Handles zip file upload
   * @param userId User ID
   * @param filename Original filename
   * @param buffer File buffer
   * @returns Object containing file ID and token info
   */
  async handleZipFile(
    userId: string,
    filename: string,
    buffer: Buffer
  ): Promise<{ fileId: string; tokenCount?: number; exceedsTokenLimit?: boolean }> {
    try {
      // Process the zip file
      const packedProject = await this.projectPacker.processZipFile(buffer, filename);

      // Create file ID
      const fileId = this.createFileIdHash(filename + Date.now().toString());
      const timestamp = new Date().toISOString();
      
      // Create work item
      const workItem: WorkItem = {
        userId,
        fileId,
        fileName: filename,
        fileType: 'application/zip',
        uploadDate: timestamp,
        s3Prefix: `${userId}/${fileId}`,
        lastModified: timestamp,
        uploadMode: FileUploadMode.ZIP_FILE,
      };

      // Store work item in DynamoDB
      await this.storeWorkItemInDynamoDB(workItem);

      // Store original zip file in S3
      await this.storeOriginalContent(
        userId,
        fileId,
        buffer,
        'application/zip'
      );

      // Store packed content in S3
      await this.storePackedContent(
        userId,
        fileId,
        packedProject.packedContent
      );

      return {
        fileId,
        tokenCount: packedProject.tokenCount,
        exceedsTokenLimit: packedProject.exceedsTokenLimit,
      };
    } catch (error) {
      this.logger.error('Error handling zip file:', error);
      throw new Error(`Failed to process zip file: ${error.message}`);
    }
  }

  /**
   * Handles multiple file uploads
   * @param userId User ID
   * @param files Array of files with filename, buffer, and mimetype
   * @returns Object containing file ID and token info
   */
  async handleMultipleFiles(
    userId: string,
    files: Array<{ filename: string; buffer: Buffer; mimetype: string }>
  ): Promise<{ fileId: string; tokenCount?: number; exceedsTokenLimit?: boolean }> {
    try {
      const filesWithType = files.map(file => ({
        filename: file.filename,
        buffer: file.buffer,
        type: file.mimetype
      }));

      // Create zip from multiple files
      const zipBuffer = await this.projectPacker.createZipFromFiles(filesWithType);

      // Process the created zip
      const packedProject = await this.projectPacker.processMultipleFiles(filesWithType);

      // Create file ID using the first filename and timestamp
      const fileId = this.createFileIdHash(files[0].filename + Date.now().toString());
      const timestamp = new Date().toISOString();

      // Create combined filename
      const combinedFilename = files.length < 2
        ? files.map(f => f.filename).join('_')
        : `${files[0].filename}_and_${files.length - 1}_more_files.zip`;
      
      const workItem: WorkItem = {
        userId,
        fileId,
        fileName: combinedFilename,
        fileType: 'application/multiple-files',
        uploadDate: timestamp,
        s3Prefix: `${userId}/${fileId}`,
        lastModified: timestamp,
        uploadMode: FileUploadMode.MULTIPLE_FILES,
      };

      // Store work item in DynamoDB
      await this.storeWorkItemInDynamoDB(workItem);

      // Store created zip file as original content
      await this.storeOriginalContent(
        userId,
        fileId,
        zipBuffer,
        'application/zip'
      );

      // Store packed content in S3
      await this.storePackedContent(
        userId,
        fileId,
        packedProject.packedContent
      );

      return {
        fileId,
        tokenCount: packedProject.tokenCount,
        exceedsTokenLimit: packedProject.exceedsTokenLimit,
      };
    } catch (error) {
      this.logger.error('Error handling multiple files:', error);
      throw new Error(`Failed to process multiple files: ${error.message}`);
    }
  }

  /**
   * Stores work item in DynamoDB
   * @param workItem Work item to store
   */
  private async storeWorkItemInDynamoDB(workItem: WorkItem): Promise<void> {
    const dynamoClient = this.awsConfig.createDynamoDBClient();

    try {
      await dynamoClient.send(
        new PutItemCommand({
          TableName: this.config.table,
          Item: marshall(workItem, { removeUndefinedValues: true }),
        }),
      );
    } catch (error) {
      this.logger.error('Error storing work item in DynamoDB:', error);
      throw new Error('Failed to store work item metadata');
    }
  }

  /**
   * Stores the packed content in S3
   * @param userId User ID
   * @param fileId File ID
   * @param content Packed content as string
   */
  async storePackedContent(
    userId: string,
    fileId: string,
    content: string
  ): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const s3Client = this.awsConfig.createS3Client();
    const s3Locations = this.getS3Locations(userId, fileId);

    try {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: this.config.bucket,
          Key: s3Locations.packedContent,
          Body: content,
          ContentType: 'text/plain'
        },
      });

      await upload.done();
    } catch (error) {
      this.logger.error('Error storing packed content:', error);
      throw new Error('Failed to store packed content');
    }
  }

  /**
   * Gets packed content from S3
   * @param userId User ID
   * @param fileId File ID
   * @returns Packed content as string
   */
  async getPackedContent(
    userId: string,
    fileId: string
  ): Promise<string> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const s3Client = this.awsConfig.createS3Client();
    const s3Locations = this.getS3Locations(userId, fileId);

    try {
      const result = await s3Client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: s3Locations.packedContent,
        }),
      );

      return await result.Body.transformToString();
    } catch (error) {
      this.logger.error('Error getting packed content:', error);
      throw new Error('Failed to get packed content');
    }
  }

  async createWorkItem(
    userId: string,
    fileName: string,
    fileType: string,
    fileBuffer: Buffer,
    uploadMode: FileUploadMode = FileUploadMode.SINGLE_FILE,
  ): Promise<WorkItem> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const fileId = this.createFileIdHash(fileName + Date.now().toString());
    const timestamp = new Date().toISOString();
    const s3Client = this.awsConfig.createS3Client();
    const dynamoClient = this.awsConfig.createDynamoDBClient();
    const s3Locations = this.getS3Locations(userId, fileId);

    const workItem: WorkItem = {
      userId,
      fileId,
      fileName,
      fileType,
      uploadDate: timestamp,
      s3Prefix: `${userId}/${fileId}`,
      lastModified: timestamp,
      uploadMode,
    };

    try {
      // Store metadata in DynamoDB
      await dynamoClient.send(
        new PutItemCommand({
          TableName: this.config.table,
          Item: marshall(workItem, { removeUndefinedValues: true }),
        }),
      );

      // Store the original content
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: this.config.bucket,
          Key: s3Locations.originalContent,
          Body: fileBuffer,
          ContentType: fileType,
        },
      });

      await upload.done();

      // Store metadata in S3
      const metadataUpload = new Upload({
        client: s3Client,
        params: {
          Bucket: this.config.bucket,
          Key: s3Locations.metadata,
          Body: JSON.stringify(workItem),
          ContentType: 'application/json',
        },
      });

      await metadataUpload.done();

      return workItem;
    } catch (error) {
      this.logger.error('Error creating work item:', error);
      throw new Error('Failed to create work item');
    }
  }

  async updateWorkItem(userId: string, fileId: string, updates: WorkItemUpdate): Promise<WorkItem> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const dynamoClient = this.awsConfig.createDynamoDBClient();
    
    try {
      // Get the current work item to correctly merge updates
      const currentWorkItem = await this.getWorkItem(userId, fileId);
      
      // Build the update expression parts
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};
      
      // Handle flat fields
      const flatFields = ['lastModified', 'uploadMode', 'hasChatHistory', 'workloadId'];
      flatFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateExpressions.push(`#${field} = :${field}`);
          expressionAttributeNames[`#${field}`] = field;
          expressionAttributeValues[`:${field}`] = updates[field];
        }
      });
      
      // Handle usedLenses specially
      if (updates.usedLenses !== undefined) {
        updateExpressions.push(`#usedLenses = :usedLenses`);
        expressionAttributeNames[`#usedLenses`] = 'usedLenses';
        expressionAttributeValues[`:usedLenses`] = updates.usedLenses;
      }

      // Handle workloadIds map specially
      if (updates.workloadIds !== undefined) {
        updateExpressions.push(`#workloadIds = :workloadIds`);
        expressionAttributeNames[`#workloadIds`] = 'workloadIds';
        expressionAttributeValues[`:workloadIds`] = updates.workloadIds;
      }
      
      // Handle lens-specific map fields
      const mapFields = [
        'analysisStatus', 'analysisProgress', 'analysisError', 'analysisPartialResults',
        'iacGenerationStatus', 'iacGenerationProgress', 'iacGenerationError', 
        'iacGeneratedFileType', 'iacPartialResults',
        'exceedsTokenLimit', 'tokenCount',
        'supportingDocumentId', 'supportingDocumentAdded', 'supportingDocumentDescription',
        'supportingDocumentName', 'supportingDocumentType'
      ];
      
      mapFields.forEach(field => {
        if (updates[field] !== undefined) {
          // For new work items or updating entire map
          updateExpressions.push(`#${field} = :${field}`);
          expressionAttributeNames[`#${field}`] = field;
          expressionAttributeValues[`:${field}`] = updates[field];
        }
      });
      
      // If there are no updates, return the current work item
      if (updateExpressions.length === 0) {
        return currentWorkItem;
      }
      
      // Build the update expression
      const updateExpression = `SET ${updateExpressions.join(', ')}`;
      
      const result = await dynamoClient.send(
        new UpdateItemCommand({
          TableName: this.config.table,
          Key: marshall({
            userId,
            fileId,
          }),
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: marshall(expressionAttributeValues, { removeUndefinedValues: true }),
          ReturnValues: 'ALL_NEW',
        }),
      );

      return unmarshall(result.Attributes) as WorkItem;
    } catch (error) {
      this.logger.error('Error updating work item:', error);
      throw new Error('Failed to update work item');
    }
  }

  async getWorkItem(userId: string, fileId: string): Promise<WorkItem> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const dynamoClient = this.awsConfig.createDynamoDBClient();

    try {
      const result = await dynamoClient.send(
        new GetItemCommand({
          TableName: this.config.table,
          Key: marshall({
            userId,
            fileId,
          }),
        }),
      );

      if (!result.Item) {
        throw new Error('Work item not found');
      }

      return unmarshall(result.Item) as WorkItem;
    } catch (error) {
      this.logger.error('Error getting work item:', error);
      throw new Error('Failed to get work item');
    }
  }

  async listWorkItems(userId: string): Promise<WorkItem[]> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const dynamoClient = this.awsConfig.createDynamoDBClient();

    try {
      const result = await dynamoClient.send(
        new QueryCommand({
          TableName: this.config.table,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: marshall({
            ':userId': userId,
          }),
        }),
      );

      return (result.Items || []).map((item) => unmarshall(item) as WorkItem);
    } catch (error) {
      this.logger.error('Error listing work items:', error);
      throw new Error('Failed to list work items');
    }
  }

  async deleteWorkItem(userId: string, fileId: string): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const s3Client = this.awsConfig.createS3Client();
    const dynamoClient = this.awsConfig.createDynamoDBClient();

    try {
      // Delete all objects in S3 with the prefix
      const listResult = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.config.bucket,
          Prefix: `${userId}/${fileId}`,
        }),
      );

      if (listResult.Contents && listResult.Contents.length > 0) {
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: this.config.bucket,
            Delete: {
              Objects: listResult.Contents.map((obj) => ({ Key: obj.Key })),
            },
          }),
        );
      }

      // Delete metadata from DynamoDB
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: this.config.table,
          Key: marshall({
            userId,
            fileId,
          }),
        }),
      );
    } catch (error) {
      this.logger.error('Error deleting work item:', error);
      throw new Error('Failed to delete work item');
    }
  }

  async storeAnalysisResults(
    userId: string,
    fileId: string,
    results: any,
    lensAlias: string
  ): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const s3Client = this.awsConfig.createS3Client();
    const s3Locations = this.getS3Locations(userId, fileId);

    try {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: this.config.bucket,
          Key: s3Locations.getAnalysisResultsPath(lensAlias),
          Body: JSON.stringify(results),
          ContentType: 'application/json',
        },
      });

      await upload.done();
    } catch (error) {
      this.logger.error('Error storing analysis results:', error);
      throw new Error('Failed to store analysis results');
    }
  }

  async getAnalysisResults(userId: string, fileId: string, lensAlias: string): Promise<any> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const s3Client = this.awsConfig.createS3Client();
    const s3Locations = this.getS3Locations(userId, fileId);

    try {
      const result = await s3Client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: s3Locations.getAnalysisResultsPath(lensAlias),
        }),
      );

      const content = await result.Body.transformToString();
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Error getting analysis results:', error);
      throw new Error('Failed to get analysis results');
    }
  }

  async storeIaCDocument(
    userId: string,
    fileId: string,
    content: string,
    extension: string,
    templateType: string,
    lensAlias: string
  ): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const s3Client = this.awsConfig.createS3Client();
    const s3Locations = this.getS3Locations(userId, fileId);

    try {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: this.config.bucket,
          Key: s3Locations.getIaCDocumentPath(lensAlias, extension),
          Body: content,
        },
      });

      await upload.done();

      // Get the current work item to update lens-specific fields
      const workItem = await this.getWorkItem(userId, fileId);
      
      // Initialize or update lens-specific iacGeneratedFileType
      let iacGeneratedFileType: Record<string, string> = {
        ...(workItem.iacGeneratedFileType || {})
      };
      
      // Set the template type for this lens
      iacGeneratedFileType[lensAlias] = templateType;

      await this.updateWorkItem(userId, fileId, {
        iacGeneratedFileType,
        lastModified: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error storing IaC document:', error);
      throw new Error('Failed to store IaC document');
    }
  }

  async getIaCDocument(
    userId: string,
    fileId: string,
    extension: string,
    lensAlias: string,
    workItem?: WorkItem,
  ): Promise<string> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const s3Client = this.awsConfig.createS3Client();
    const s3Locations = this.getS3Locations(userId, fileId);

    try {
      // If workItem is not provided, fetch it
      if (!workItem) {
        workItem = await this.getWorkItem(userId, fileId);
      }
      
      // Check if this lens exists in the workItem
      if (!workItem.usedLenses?.some(lens => lens.lensAlias === lensAlias)) {
        throw new Error(`No lens '${lensAlias}' found for this work item`);
      }

      // If workItem is provided and has lens-specific iacGeneratedFileType, use that instead of the provided extension
      const iacGeneratedExtension = workItem.iacGeneratedFileType?.[lensAlias] ?
        this.getExtensionFromTemplateType(workItem.iacGeneratedFileType[lensAlias]) :
        extension;

      const result = await s3Client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: s3Locations.getIaCDocumentPath(lensAlias, iacGeneratedExtension),
        })
      );

      return await result.Body.transformToString();
    } catch (error) {
      this.logger.error('Error getting IaC document:', error);
      throw new Error('Failed to get IaC document');
    }
  }

  // Add helper method to get extension from template type
  private getExtensionFromTemplateType(templateType: string): string {
    if (templateType.includes('yaml')) return 'yaml';
    if (templateType.includes('json')) return 'json';
    return 'tf';
  }

  async storeOriginalContent(
    userId: string,
    fileId: string,
    content: string | Buffer,
    fileType: string,
  ): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const s3Client = this.awsConfig.createS3Client();
    const s3Locations = this.getS3Locations(userId, fileId);

    try {
      if (typeof content === 'string' && fileType.startsWith('image/')) {
        // Handle base64 image string
        const base64Data = content.split(';base64,')[1] || content;
        const buffer = Buffer.from(base64Data, 'base64');

        const upload = new Upload({
          client: s3Client,
          params: {
            Bucket: this.config.bucket,
            Key: s3Locations.originalContent,
            Body: buffer,
            ContentType: fileType,
          },
        });

        await upload.done();
      } else {
        // Handle normal content (string or Buffer)
        const upload = new Upload({
          client: s3Client,
          params: {
            Bucket: this.config.bucket,
            Key: s3Locations.originalContent,
            Body: content,
            ContentType: fileType,
          },
        });

        await upload.done();
      }
    } catch (error) {
      this.logger.error('Error storing original content:', error);
      throw new Error('Failed to store original content');
    }
  }

  async getOriginalContent(
    userId: string,
    fileId: string,
    forDownload: boolean = false
  ): Promise<{ data: string | Buffer; contentType: string }> {
    if (!this.config.enabled) {
      throw new Error('Storage is not enabled');
    }

    const s3Client = this.awsConfig.createS3Client();
    const s3Locations = this.getS3Locations(userId, fileId);

    try {
      // Get the work item to check for upload mode
      const workItem = await this.getWorkItem(userId, fileId);

      // If it's a multi-file or zip upload mode and not for download, get packed content
      if ((workItem.uploadMode === FileUploadMode.MULTIPLE_FILES ||
        workItem.uploadMode === FileUploadMode.ZIP_FILE) &&
        !forDownload) {
        try {
          const packedContent = await this.getPackedContent(userId, fileId);
          return {
            data: packedContent,
            contentType: 'text/plain',
          };
        } catch (error) {
          this.logger.warn(`Packed content not found for ${fileId}, falling back to original content`);
          // Fall back to original content if packed content is not found
        }
      }

      // Get original content (for single file mode or download)
      const result = await s3Client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: s3Locations.originalContent,
        }),
      );

      const contentType = result.ContentType || 'application/octet-stream';
      const response = await result.Body.transformToByteArray();

      // For downloads, return the raw buffer
      if (forDownload) {
        return {
          data: Buffer.from(response),
          contentType,
        };
      }

      // For loading into the application
      if (contentType.startsWith('image/')) {
        // Always return image content as base64 data URL
        const base64Data = Buffer.from(response).toString('base64');
        return {
          data: `data:${contentType};base64,${base64Data}`,
          contentType,
        };
      } else {
        // For text content (IaC templates), return as string
        return {
          data: Buffer.from(response).toString('utf-8'),
          contentType,
        };
      }
    } catch (error) {
      this.logger.error('Error getting original content:', error);
      throw new Error('Failed to get original content');
    }
  }
}