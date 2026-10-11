export type FeedbackCategory =
  | 'Operational Issues'
  | 'Fraud and Scam'
  | 'Product Feedback'
  | 'Customer Service';

export const VALID_CATEGORIES: FeedbackCategory[] = [
  'Operational Issues',
  'Fraud and Scam',
  'Product Feedback',
  'Customer Service',
];

export type SentimentType = 'Positive' | 'Neutral' | 'Negative' | 'Mixed';

export const VALID_SENTIMENTS: SentimentType[] = [
  'Positive',
  'Neutral',
  'Negative',
  'Mixed',
];

export interface FeedbackAnalysisRecord {
  analysisId: string;
  sentiment: SentimentType;
  confidence: number; // 0.0 to 1.0
  explanation: string;
  evidenceQuote: string;
  topicLabel: string;
  topicDescription: string;
  complaintTitle?: string;
  complaintExplanation?: string;
  method: 'gemini-3.8-flash' | 'baseline-rules';
  status: 'completed' | 'failed';
  analyzedAt: string;
}

export interface FeedbackRecord {
  id: string;
  text: string;
  category: FeedbackCategory;
  source: 'demo' | 'import' | 'manual';
  createdAt?: string; // Genuine timestamp if manually added, undefined for bulk imported without date
  rowNumber?: number; // Original CSV row index if imported
  analysis?: FeedbackAnalysisRecord;
}

export interface WorkspaceMetadata {
  datasetName: string;
  datasetType: 'demo' | 'imported';
  lastUpdated: string;
  totalRecords: number;
  fileName?: string;
  fileSizeBytes?: number;
}

export interface DatasetMetrics {
  totalFeedback: number;
  uniqueFeedbackCount: number;
  categoryCount: number;
  repeatedEntriesCount: number;
  categoryBreakdown: {
    category: FeedbackCategory;
    count: number;
    percentage: number;
  }[];
  topRecurring: {
    text: string;
    count: number;
    category: FeedbackCategory;
  }[];
}

export interface TopicRecord {
  id: string;
  label: string;
  description: string;
  occurrenceCount: number;
  distinctCount: number;
  categories: { category: FeedbackCategory; count: number }[];
  sentimentBreakdown: Record<SentimentType, number>;
  representativeExamples: string[];
  recordIds: string[];
}

export interface ComplaintGroupRecord {
  id: string;
  title: string;
  explanation: string;
  occurrenceCount: number;
  distinctCount: number;
  categories: { category: FeedbackCategory; count: number }[];
  representativeExamples: string[];
  recordIds: string[];
}

export interface AnalysisRunRecord {
  runId: string;
  datasetName: string;
  datasetFingerprint: string;
  startedAt: string;
  completedAt?: string;
  status: 'idle' | 'running' | 'completed' | 'partial' | 'failed';
  totalWorkload: number; // Total distinct text items
  completedWorkload: number;
  failedWorkload: number;
  provider: 'gemini-3.8-flash' | 'baseline-rules';
  errorSummary?: string;
}

export interface AggregateInsights {
  totalRecords: number;
  analyzedRecords: number;
  unanalyzedRecords: number;
  failedRecords: number;
  coveragePercentage: number;
  sentimentCounts: Record<SentimentType, number>;
  sentimentPercentages: Record<SentimentType, number>;
  categorySentiment: Record<FeedbackCategory, Record<SentimentType, number>>;
  topics: TopicRecord[];
  complaints: ComplaintGroupRecord[];
  runMeta?: AnalysisRunRecord;
}

export interface CsvValidationSummary {
  isValid: boolean;
  totalRowsDetected: number;
  validRowsCount: number;
  invalidRowsCount: number;
  detectedHeaders: string[];
  mappedReviewColumn: string | null;
  mappedCategoryColumn: string | null;
  previewRows: {
    rowNumber: number;
    review: string;
    category: string;
    isValidCategory: boolean;
  }[];
  categoryStats: Record<string, number>;
  errors: string[];
  warnings: string[];
}

export type ActiveNavTab =
  | 'overview'
  | 'explorer'
  | 'insights'
  | 'recommendations'
  | 'issues'
  | 'reports'
  | 'adaption';
