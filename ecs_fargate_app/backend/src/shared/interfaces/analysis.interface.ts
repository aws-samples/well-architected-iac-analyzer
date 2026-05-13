export interface AnalysisResult {
  pillar: string;
  question: string;
  questionId: string;
  bestPractices: BestPractice[];
}

export type CriticalityLevel = 'High' | 'Medium' | 'Low' | 'N/A';
export type ComplexityLevel = 'High' | 'Medium' | 'Low' | 'N/A';
export type PriorityLevel = 'Immediate' | 'Short-term' | 'Long-term' | 'N/A';

export interface BestPractice {
  id: string;
  name: string;
  relevant: boolean;
  applied: boolean;
  reasonApplied?: string;
  reasonNotApplied?: string;
  recommendations?: string;
  criticality?: CriticalityLevel;
  criticalityReason?: string;
  complexity?: ComplexityLevel;
  complexityReason?: string;
  priority?: PriorityLevel;
  priorityReason?: string;
}

export interface RiskSummary {
  pillarName: string;
  totalQuestions: number;
  answeredQuestions: number;
  highRisks: number;
  mediumRisks: number;
}

export interface WorkloadReview {
  workloadId: string;
  lensAlias: string;
  results: AnalysisResult[];
}

export interface QuestionGroup {
  pillar: string;
  title: string;
  questionId: string;
  bestPractices: string[];
  bestPracticeIds: string[];
}