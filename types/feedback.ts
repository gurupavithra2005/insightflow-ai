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

export type IssueStatus =
  | 'Open'
  | 'Under Review'
  | 'In Progress'
  | 'Resolved'
  | 'Dismissed';

export const VALID_ISSUE_STATUSES: IssueStatus[] = [
  'Open',
  'Under Review',
  'In Progress',
  'Resolved',
  'Dismissed',
];

export type PriorityBand = 'Critical' | 'High' | 'Medium' | 'Low';

export interface FactorScoreBreakdown {
  score: number; // 0 to 100
  rawWeight: number; // e.g. 0.30
  normalizedWeight: number; // re-normalized weight if some factors missing (sum = 1.0)
  weightedContribution: number; // score * normalizedWeight
  available: boolean;
  explanation: string;
  metrics: Record<string, string | number | boolean>;
}

export interface PriorityScoreExplanation {
  totalScore: number; // 0 to 100
  priorityBand: PriorityBand;
  applicableFactorsCount: number;
  missingFactorsCount: number;
  factors: {
    recurrence: FactorScoreBreakdown;
    sentimentSeverity: FactorScoreBreakdown;
    categoryRelevance: FactorScoreBreakdown;
    distinctEvidence: FactorScoreBreakdown;
    analysisConfidence: FactorScoreBreakdown;
  };
  missingFactorNames: string[];
  normalizationMethod: string;
  limitations: string[];
}

export interface CategoryRelevanceConfig {
  'Fraud and Scam': number;
  'Operational Issues': number;
  'Customer Service': number;
  'Product Feedback': number;
}

export interface PriorityBandThresholds {
  critical: number; // 80
  high: number; // 60
  medium: number; // 35
  low: number; // 0
}

export interface IssueRecord {
  id: string;
  title: string;
  description: string;
  sourceType: 'complaint_cluster' | 'topic_cluster' | 'exact_recurrence';
  linkedClusterId: string;
  occurrenceCount: number;
  distinctCount: number;
  categoryDistribution: { category: FeedbackCategory; count: number; percentage: number }[];
  sentimentDistribution?: Record<SentimentType, number>;
  priorityScore: number;
  priorityBand: PriorityBand;
  priorityExplanation: PriorityScoreExplanation;
  suggestedNextAction: string;
  status: IssueStatus;
  owner?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  linkedRecordIds: string[];
  representativeExamples: string[];
  dismissedRecommendationIds?: string[];
}

export type RecommendationStatus =
  | 'Proposed'
  | 'Approved'
  | 'In Progress'
  | 'Implemented'
  | 'Dismissed';

export interface RecommendationRecord {
  id: string;
  issueId: string;
  issueTitle: string;
  actionTitle: string;
  actionDescription: string;
  reason: string;
  expectedOperationalOutcome: string;
  supportingQuotes: string[];
  relevantMetrics: {
    occurrenceCount: number;
    distinctCount: number;
    priorityScore: number;
    dominantCategory: FeedbackCategory;
    negativeMixedPercentage?: number;
  };
  confidenceOrUncertainty: string;
  recommendedNextStep: string;
  generationMethod: 'gemini-3.8-flash' | 'rule-based-heuristic';
  status: RecommendationStatus;
  userNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueNote {
  id: string;
  issueId: string;
  note: string;
  author: string;
  createdAt: string;
}

export interface IssueStatusHistory {
  id: string;
  issueId: string;
  previousStatus: IssueStatus;
  newStatus: IssueStatus;
  timestamp: string;
  actor: string;
  reason?: string;
}

export type ReportType =
  | 'executive_summary'
  | 'sentiment_report'
  | 'topic_complaint_report'
  | 'priority_issues_report'
  | 'recommendations_action_plan'
  | 'issue_tracking_report'
  | 'comprehensive_report';

export type ReportFormat = 'pdf' | 'csv' | 'json';

export interface ReportFilterScope {
  datasetName: string;
  category: string;
  sentiment: string;
  priority: string;
  issueStatus: string;
  dateRange?: { start?: string; end?: string };
}

export interface ReportRecord {
  id: string;
  title: string;
  reportType: ReportType;
  datasetName: string;
  createdAt: string;
  filters: ReportFilterScope;
  includedSections: string[];
  summaryMetrics: {
    totalFeedback: number;
    analyzedFeedback: number;
    coveragePercentage: number;
    sentimentDistribution?: Record<SentimentType, number>;
    criticalIssuesCount: number;
    highIssuesCount: number;
    openIssuesCount: number;
    resolvedIssuesCount: number;
    approvedRecommendationsCount: number;
  };
  issuesIncluded: number;
  recommendationsIncluded: number;
  status: 'Generated' | 'Archived';
  generatedFormat: ReportFormat;
  methodology: string;
  limitations: string[];
}
