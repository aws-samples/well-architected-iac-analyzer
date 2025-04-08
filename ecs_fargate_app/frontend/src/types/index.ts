export interface WellArchitectedPillar {
  id: string;
  name: string;
  selected: boolean;
  pillarId?: string;
}

export interface BestPractice {
  id: string;
  name: string;
  pillarId: string;
  questionId: string;
  relevant: boolean;
  applied: boolean;
  reasonApplied?: string;
  reasonNotApplied?: string;
  recommendations?: string;
  extendedRecommendations?: string;
}

export interface AnalysisResult {
  pillar: string;
  question: string;
  questionId: string;
  bestPractices: BestPractice[];
}

export interface WorkloadReview {
  workloadId: string;
  lensAlias: string;
  results: AnalysisResult[];
}

export interface RiskSummary {
  pillarName: string;
  totalQuestions: number;
  answeredQuestions: number;
  highRisks: number;
  mediumRisks: number;
}

export interface UploadedFile {
  name: string;
  content: string;
  type: string;
  size: number;
}

export interface WorkItemUpdate {
  analysisStatus?: WorkItemStatus;
  analysisProgress?: number;
  analysisError?: string;
  analysisPartialResults?: boolean;
  iacGenerationStatus?: WorkItemStatus;
  iacGenerationProgress?: number;
  iacGenerationError?: string;
  iacGeneratedFileType?: string;
  iacPartialResults?: boolean;
  lastModified?: string;
  workloadId?: string;
  uploadMode?: FileUploadMode;
  exceedsTokenLimit?: boolean;
  tokenCount?: number;
  
  // Supporting document properties
  supportingDocumentId?: string;
  supportingDocumentAdded?: boolean;
  supportingDocumentDescription?: string;
  supportingDocumentName?: string;
  supportingDocumentType?: string;
}

export interface UploadedFiles {
  // Single file case
  singleFile?: UploadedFile;
  // Multi-file case
  multipleFiles?: UploadedFile[];
  // ZIP file case
  zipFile?: UploadedFile;
  // Upload mode
  mode: FileUploadMode;
  // If tokens exceed limit (for ZIP and multiple files)
  exceedsTokenLimit?: boolean;
  // Estimated token count (for ZIP and multiple files)
  tokenCount?: number;

  // Supporting document
  supportingDocument?: UploadedFile;
  supportingDocumentId?: string;
  supportingDocumentDescription?: string;
}

// Upload modes
export enum FileUploadMode {
  SINGLE_FILE = 'single_file',
  MULTIPLE_FILES = 'multiple_files',
  ZIP_FILE = 'zip_file'
}

export enum FileType {
  IAC = 'iac',
  IMAGE = 'image'
}

export interface UpdatedDocument {
  content: string;
  name: string;
  templateType?: IaCTemplateType;
}

export interface WorkloadCreationResult {
  workloadId: string;
  isTemp: boolean;
}

export interface RiskSummaryProps {
  summary: RiskSummary[] | null;
  onUpdate: () => void;
  onGenerateReport: () => void;
  onDeleteWorkload: () => void;
  onRefresh: () => void;
  isUpdating: boolean;
  isRefreshing: boolean;
  isGeneratingReport: boolean;
  isDeleting: boolean;
  canDeleteWorkload: boolean;
  hasProvidedWorkloadId: boolean;
  currentWorkloadId?: string; // Display the current workloadId
  activeLensAlias?: string; // Track the current lens
  awsRegion?: string;
}

export interface SelectedAnalysisItem {
  pillar: string;
  question: string;
  questionId: string;
  bestPractices: BestPractice[];
}

export interface SelectedItem {
  pillar: string;
  question: string;
  bestPractices: {
      id: string;
      name: string;
      relevant: boolean;
      applied: boolean;
      recommendations?: string;
      extendedRecommendations?: string;
  }[];
}

export enum IaCTemplateType {
  CLOUDFORMATION_YAML = 'CloudFormation (.yaml) template',
  CLOUDFORMATION_JSON = 'CloudFormation (.json) template',
  TERRAFORM = 'Terraform (.tf) document',
  CDK_TYPESCRIPT = 'AWS CDK - TypeScript (.ts)',
  CDK_PYTHON = 'AWS CDK - Python (.py)',
  CDK_GO = 'AWS CDK - Go (.go)',
  CDK_JAVA = 'AWS CDK - Java (.java)',
  CDK_CSHARP = 'AWS CDK - C# (.cs)'
}

export * from './auth';

export interface LensInfo {
  lensAlias: string;
  lensName: string;
  lensAliasArn?: string;
}

export interface WorkloadIdInfo {
  id?: string;
  protected: boolean;
}

export interface WorkItem {
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
  
  // New field to track which lenses were used
  usedLenses?: LensInfo[];
  
  // Fields now structured by lensAlias
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
  
  supportingDocumentId?: Record<string, string | undefined>;
  supportingDocumentAdded?: Record<string, boolean>;
  supportingDocumentDescription?: Record<string, string | undefined>;
  supportingDocumentName?: Record<string, string | undefined>;
  supportingDocumentType?: Record<string, string | undefined>;
}

export type WorkItemStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

export interface WorkItemContent {
  data: string;
  contentType: string;
}

export interface WorkItemResponse {
  workItem: WorkItem;
  content?: WorkItemContent | string;
  analysisResults?: any;
  iacDocument?: string;
  hasChatHistory?: boolean;
}

export interface LensMetadata {
  lensAlias: string;
  lensName: string;
  lensDescription: string;
  lensPillars: Record<string, string>;
  pdfUrl: string;
  uploadDate: string;
}

export interface RiskSummaryResponse {
  summaries: RiskSummary[];
  region: string;
}