export interface WellArchitectedPillar {
  id: string;
  name: string;
  selected: boolean;
}

export interface BestPractice {
  id: string;
  name: string;
  pillarId: string;
  questionId: string;
  applied: boolean;
  reasonApplied?: string;
  reasonNotApplied?: string;
  recommendations?: string;
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
  type: string;
  size: number;
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
      applied: boolean;
      recommendations?: string;
  }[];
}

export enum IaCTemplateType {
  CLOUDFORMATION_YAML = 'CloudFormation (.yaml) template',
  CLOUDFORMATION_JSON = 'CloudFormation (.json) template',
  TERRAFORM = 'Terraform (.tf) document'
}

export * from './auth';