import { FileUploadMode } from "../dto/analysis.dto";

export type WorkItemStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

export interface LensInfo {
  lensAlias: string;
  lensName: string;
  lensAliasArn: string;
}

export interface WorkloadIdInfo {
  id: string;
  protected: boolean;
}

export interface WorkItem {
  // Partition and Sort Keys
  userId: string;           // Partition key (email hash)
  fileId: string;          // Sort key (file hash)
  
  fileName: string;        // Original file name
  fileType: string;        // MIME type
  uploadDate: string;      // ISO timestamp
  s3Prefix: string;        // Base S3 path for this work item
  lastModified: string;    // Last activity timestamp
  uploadMode?: FileUploadMode;
  hasChatHistory?: boolean;
  workloadId?: string;     // Legacy field
  tags?: string[];         // Optional user tags

  workloadIds?: Record<string, WorkloadIdInfo>;
  
  // Track which lenses were used for this work item
  usedLenses?: LensInfo[];
  
  // Analysis status fields by lensAlias
  analysisStatus?: Record<string, WorkItemStatus>;
  analysisProgress?: Record<string, number>;
  analysisError?: Record<string, string>;
  analysisPartialResults?: Record<string, boolean>;
  
  // IaC generation status fields by lensAlias
  iacGenerationStatus?: Record<string, WorkItemStatus>;
  iacGenerationProgress?: Record<string, number>;
  iacGenerationError?: Record<string, string>;
  iacGeneratedFileType?: Record<string, string>;
  iacPartialResults?: Record<string, boolean>;
  
  // Token fields by lensAlias
  exceedsTokenLimit?: Record<string, boolean>;
  tokenCount?: Record<string, number>;
  
  // Supporting document by lensAlias
  supportingDocumentId?: Record<string, string>;
  supportingDocumentAdded?: Record<string, boolean>;
  supportingDocumentDescription?: Record<string, string>;
  supportingDocumentName?: Record<string, string>;
  supportingDocumentType?: Record<string, string>;
}

export interface WorkItemUpdate {
  lastModified?: string;
  workloadId?: string; // Legacy field
  workloadIds?: Record<string, WorkloadIdInfo>;
  uploadMode?: FileUploadMode;
  hasChatHistory?: boolean;
  
  // Lens information
  usedLenses?: LensInfo[];
  
  // Fields structured by lensAlias
  analysisStatus?: Record<string, WorkItemStatus>;
  analysisProgress?: Record<string, number>;
  analysisError?: Record<string, string>;
  analysisPartialResults?: Record<string, boolean>;
  
  iacGenerationStatus?: Record<string, WorkItemStatus>;
  iacGenerationProgress?: Record<string, number>;
  iacGenerationError?: Record<string, string>;
  iacGeneratedFileType?: Record<string, string>;
  iacPartialResults?: Record<string, boolean>;
  
  exceedsTokenLimit?: Record<string, boolean>;
  tokenCount?: Record<string, number>;
  
  supportingDocumentId?: Record<string, string>;
  supportingDocumentAdded?: Record<string, boolean>;
  supportingDocumentDescription?: Record<string, string>;
  supportingDocumentName?: Record<string, string>;
  supportingDocumentType?: Record<string, string>;
}

export interface S3Locations {
  metadata: string;
  originalContent: string;
  packedContent: string;
  chatHistory: string;
  // Function to get analysis results path for a specific lens
  getAnalysisResultsPath(lensAlias: string): string;
  // Function to get IaC document path for a specific lens
  getIaCDocumentPath(lensAlias: string, extension?: string): string;
  // Function to get supporting document path for a specific lens
  getSupportingDocumentPath(lensAlias: string, documentId: string): string;
  // Function to get supporting document metadata path for a specific lens
  getSupportingDocumentMetadataPath(lensAlias: string, documentId: string): string;
}

export interface StorageConfig {
  enabled: boolean;
  bucket?: string;
  table?: string;
}