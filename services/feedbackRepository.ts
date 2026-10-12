import {
  FeedbackCategory,
  FeedbackRecord,
  WorkspaceMetadata,
  AggregateInsights,
  AnalysisRunRecord,
  IssueRecord,
  IssueStatus,
  IssueNote,
  IssueStatusHistory,
  RecommendationRecord,
  RecommendationStatus,
  CategoryRelevanceConfig,
  PriorityBandThresholds,
  ReportRecord,
} from '../types/feedback';
import { INITIAL_DEMO_RECORDS } from './demoData';
import { generateBuildBattleBenchmarkRecords } from './benchmarkDataset';
import { calculateAggregateInsights } from './aiAnalysisService';
import { calculateDatasetMetrics } from './analyticsService';
import {
  identifyCandidateIssues,
  synchronizeIssuesWithExisting,
} from './issueService';
import {
  buildInitialRecommendations,
  generateRecommendationForIssue,
} from './recommendationService';
import {
  DEFAULT_CATEGORY_RELEVANCE,
  DEFAULT_PRIORITY_THRESHOLDS,
} from './priorityScorer';
import { generateReportSnapshot } from './reportService';
import Papa from 'papaparse';

const STORAGE_KEY_RECORDS = 'insightflow_records_v2';
const STORAGE_KEY_METADATA = 'insightflow_meta_v2';
const STORAGE_KEY_RUN = 'insightflow_run_v2';
const STORAGE_KEY_ISSUES = 'insightflow_issues_v2';
const STORAGE_KEY_RECOMMENDATIONS = 'insightflow_recs_v2';
const STORAGE_KEY_NOTES = 'insightflow_notes_v2';
const STORAGE_KEY_HISTORY = 'insightflow_history_v2';
const STORAGE_KEY_CAT_CONFIG = 'insightflow_catconfig_v2';
const STORAGE_KEY_REPORTS = 'insightflow_reports_v2';

const INITIAL_METADATA: WorkspaceMetadata = {
  datasetName: 'Synthetic Demo Workspace',
  datasetType: 'demo',
  lastUpdated: '2026-01-01T00:00:00.000Z',
  totalRecords: INITIAL_DEMO_RECORDS.length,
};

const INITIAL_INSIGHTS = calculateAggregateInsights(INITIAL_DEMO_RECORDS);
const INITIAL_METRICS = calculateDatasetMetrics(INITIAL_DEMO_RECORDS);
const INITIAL_ISSUES = identifyCandidateIssues(
  INITIAL_DEMO_RECORDS,
  INITIAL_INSIGHTS,
  INITIAL_METRICS,
  DEFAULT_CATEGORY_RELEVANCE,
  DEFAULT_PRIORITY_THRESHOLDS
);
const INITIAL_RECOMMENDATIONS = buildInitialRecommendations(INITIAL_ISSUES);
const INITIAL_NOTES: IssueNote[] = [];
const INITIAL_STATUS_HISTORY: IssueStatusHistory[] = [];
const INITIAL_REPORTS: ReportRecord[] = [
  generateReportSnapshot(
    'Q1 Customer Decision & Synthesis Summary',
    'comprehensive_report',
    {
      datasetName: 'Synthetic Demo Workspace',
      category: 'all',
      sentiment: 'all',
      priority: 'all',
      issueStatus: 'all',
    },
    ['executive_summary', 'sentiment', 'category', 'issues', 'recommendations'],
    INITIAL_DEMO_RECORDS,
    INITIAL_INSIGHTS,
    INITIAL_METRICS,
    INITIAL_ISSUES,
    INITIAL_RECOMMENDATIONS,
    'pdf'
  ),
];

export interface WorkspaceSnapshot {
  records: FeedbackRecord[];
  metadata: WorkspaceMetadata;
  insights: AggregateInsights;
  lastRun: AnalysisRunRecord | null;
  issues: IssueRecord[];
  recommendations: RecommendationRecord[];
  notes: IssueNote[];
  statusHistory: IssueStatusHistory[];
  categoryConfig: CategoryRelevanceConfig;
  thresholds: PriorityBandThresholds;
  reports: ReportRecord[];
}

const INITIAL_SNAPSHOT: WorkspaceSnapshot = Object.freeze({
  records: INITIAL_DEMO_RECORDS,
  metadata: INITIAL_METADATA,
  insights: INITIAL_INSIGHTS,
  lastRun: null,
  issues: INITIAL_ISSUES,
  recommendations: INITIAL_RECOMMENDATIONS,
  notes: INITIAL_NOTES,
  statusHistory: INITIAL_STATUS_HISTORY,
  categoryConfig: DEFAULT_CATEGORY_RELEVANCE,
  thresholds: DEFAULT_PRIORITY_THRESHOLDS,
  reports: INITIAL_REPORTS,
});

export class FeedbackRepository {
  private static instance: FeedbackRepository;
  private records: FeedbackRecord[] = INITIAL_DEMO_RECORDS;
  private metadata: WorkspaceMetadata = INITIAL_METADATA;
  private lastRun: AnalysisRunRecord | null = null;
  private cachedInsights: AggregateInsights | null = INITIAL_INSIGHTS;
  private issues: IssueRecord[] = INITIAL_ISSUES;
  private recommendations: RecommendationRecord[] = INITIAL_RECOMMENDATIONS;
  private notes: IssueNote[] = INITIAL_NOTES;
  private statusHistory: IssueStatusHistory[] = INITIAL_STATUS_HISTORY;
  private reports: ReportRecord[] = INITIAL_REPORTS;
  private categoryConfig: CategoryRelevanceConfig = DEFAULT_CATEGORY_RELEVANCE;
  private thresholds: PriorityBandThresholds = DEFAULT_PRIORITY_THRESHOLDS;
  private currentSnapshot: WorkspaceSnapshot = INITIAL_SNAPSHOT;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.init();
  }

  public static getInstance(): FeedbackRepository {
    if (!FeedbackRepository.instance) {
      FeedbackRepository.instance = new FeedbackRepository();
    }
    return FeedbackRepository.instance;
  }

  private isHydratedFromStorage = false;

  private init() {
    this.records = INITIAL_DEMO_RECORDS;
    this.metadata = INITIAL_METADATA;
    this.cachedInsights = INITIAL_INSIGHTS;
    this.lastRun = null;
    this.issues = INITIAL_ISSUES;
    this.recommendations = INITIAL_RECOMMENDATIONS;
    this.notes = INITIAL_NOTES;
    this.statusHistory = INITIAL_STATUS_HISTORY;
    this.reports = INITIAL_REPORTS;
    this.categoryConfig = DEFAULT_CATEGORY_RELEVANCE;
    this.thresholds = DEFAULT_PRIORITY_THRESHOLDS;
    this.currentSnapshot = INITIAL_SNAPSHOT;
  }

  private updateSnapshot() {
    this.currentSnapshot = {
      records: this.records,
      metadata: this.metadata,
      insights: this.cachedInsights || INITIAL_INSIGHTS,
      lastRun: this.lastRun,
      issues: this.issues,
      recommendations: this.recommendations,
      notes: this.notes,
      statusHistory: this.statusHistory,
      categoryConfig: this.categoryConfig,
      thresholds: this.thresholds,
      reports: this.reports,
    };
  }

  public hydrateFromStorage() {
    if (typeof window === 'undefined' || this.isHydratedFromStorage) return;
    this.isHydratedFromStorage = true;
    try {
      const storedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
      const storedMeta = localStorage.getItem(STORAGE_KEY_METADATA);
      const storedRun = localStorage.getItem(STORAGE_KEY_RUN);
      const storedIssues = localStorage.getItem(STORAGE_KEY_ISSUES);
      const storedRecs = localStorage.getItem(STORAGE_KEY_RECOMMENDATIONS);
      const storedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
      const storedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      const storedConfig = localStorage.getItem(STORAGE_KEY_CAT_CONFIG);
      const storedReports = localStorage.getItem(STORAGE_KEY_REPORTS);

      if (storedRecords && storedMeta) {
        this.records = JSON.parse(storedRecords);
        this.metadata = JSON.parse(storedMeta);
        if (storedRun) {
          this.lastRun = JSON.parse(storedRun);
        }
        this.cachedInsights = calculateAggregateInsights(this.records);
        if (this.lastRun) {
          this.cachedInsights.runMeta = this.lastRun;
        }
      }

      if (storedConfig) {
        this.categoryConfig = JSON.parse(storedConfig);
      }

      if (storedNotes) {
        this.notes = JSON.parse(storedNotes);
      }

      if (storedHistory) {
        this.statusHistory = JSON.parse(storedHistory);
      }

      if (storedRecs) {
        this.recommendations = JSON.parse(storedRecs);
      }

      if (storedReports) {
        this.reports = JSON.parse(storedReports);
      }

      if (storedIssues) {
        this.issues = JSON.parse(storedIssues);
      } else {
        this.recalculateIssuesAndScores(false);
      }

      this.notify();
    } catch (e) {
      console.warn('Fallback cleanly to initialized workspace on storage parse error:', e);
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(this.records));
      localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(this.metadata));
      if (this.lastRun) {
        localStorage.setItem(STORAGE_KEY_RUN, JSON.stringify(this.lastRun));
      } else {
        localStorage.removeItem(STORAGE_KEY_RUN);
      }
      localStorage.setItem(STORAGE_KEY_ISSUES, JSON.stringify(this.issues));
      localStorage.setItem(STORAGE_KEY_RECOMMENDATIONS, JSON.stringify(this.recommendations));
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(this.notes));
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(this.statusHistory));
      localStorage.setItem(STORAGE_KEY_CAT_CONFIG, JSON.stringify(this.categoryConfig));
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(this.reports));
    } catch (e) {
      console.warn('LocalStorage quota limit reached, maintaining in-memory workspace:', e);
    }
  }

  private notify() {
    this.updateSnapshot();
    this.listeners.forEach(cb => cb());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): WorkspaceSnapshot {
    return this.currentSnapshot;
  }

  public getServerSnapshot(): WorkspaceSnapshot {
    return INITIAL_SNAPSHOT;
  }

  public getRecords(): FeedbackRecord[] {
    return this.records;
  }

  public getServerSnapshotRecords(): FeedbackRecord[] {
    return INITIAL_DEMO_RECORDS;
  }

  public getMetadata(): WorkspaceMetadata {
    return this.metadata;
  }

  public getServerSnapshotMetadata(): WorkspaceMetadata {
    return INITIAL_METADATA;
  }

  public getInsights(): AggregateInsights {
    if (!this.cachedInsights) {
      this.cachedInsights = calculateAggregateInsights(this.records);
      if (this.lastRun) {
        this.cachedInsights.runMeta = this.lastRun;
      }
    }
    return this.cachedInsights;
  }

  public getServerSnapshotInsights(): AggregateInsights {
    return INITIAL_INSIGHTS;
  }

  public getLastRun(): AnalysisRunRecord | null {
    return this.lastRun;
  }

  public getServerSnapshotLastRun(): AnalysisRunRecord | null {
    return null;
  }

  public getIssues(): IssueRecord[] {
    return this.issues;
  }

  public getServerSnapshotIssues(): IssueRecord[] {
    return INITIAL_ISSUES;
  }

  public getRecommendations(): RecommendationRecord[] {
    return this.recommendations;
  }

  public getServerSnapshotRecommendations(): RecommendationRecord[] {
    return INITIAL_RECOMMENDATIONS;
  }

  public getNotes(): IssueNote[] {
    return this.notes;
  }

  public getServerSnapshotNotes(): IssueNote[] {
    return INITIAL_NOTES;
  }

  public getStatusHistory(): IssueStatusHistory[] {
    return this.statusHistory;
  }

  public getServerSnapshotStatusHistory(): IssueStatusHistory[] {
    return INITIAL_STATUS_HISTORY;
  }

  public getCategoryConfig(): CategoryRelevanceConfig {
    return this.categoryConfig;
  }

  public getServerSnapshotCategoryConfig(): CategoryRelevanceConfig {
    return DEFAULT_CATEGORY_RELEVANCE;
  }

  public getThresholds(): PriorityBandThresholds {
    return this.thresholds;
  }

  public getServerSnapshotThresholds(): PriorityBandThresholds {
    return DEFAULT_PRIORITY_THRESHOLDS;
  }

  public getReports(): ReportRecord[] {
    return this.reports;
  }

  public getServerSnapshotReports(): ReportRecord[] {
    return INITIAL_REPORTS;
  }

  public addReport(report: ReportRecord) {
    this.reports = [report, ...this.reports];
    this.persist();
    this.notify();
  }

  public deleteReport(reportId: string) {
    this.reports = this.reports.filter(r => r.id !== reportId);
    this.persist();
    this.notify();
  }

  /**
   * Recalculates candidate issues, priority scores, and recommendations.
   * Preserves user-assigned status, owner, due date, notes, and status histories.
   */
  public recalculateIssuesAndScores(shouldNotify = true) {
    const metrics = calculateDatasetMetrics(this.records);
    const insights = this.getInsights();
    const freshCandidates = identifyCandidateIssues(
      this.records,
      insights,
      metrics,
      this.categoryConfig,
      this.thresholds
    );

    // Synchronize to preserve user-managed issue properties
    this.issues = synchronizeIssuesWithExisting(freshCandidates, this.issues);

    // Ensure recommendations exist for all current issues
    const existingRecMap = new Map<string, RecommendationRecord>();
    this.recommendations.forEach(r => existingRecMap.set(r.issueId, r));

    const updatedRecs: RecommendationRecord[] = [];
    this.issues.forEach(issue => {
      const existing = existingRecMap.get(issue.id);
      if (existing) {
        // Update metric references without overwriting user status/notes
        updatedRecs.push({
          ...existing,
          relevantMetrics: {
            ...existing.relevantMetrics,
            occurrenceCount: issue.occurrenceCount,
            distinctCount: issue.distinctCount,
            priorityScore: issue.priorityScore,
          },
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Build initial rule-based recommendation
        const initial = buildInitialRecommendations([issue])[0];
        if (initial) updatedRecs.push(initial);
      }
    });

    this.recommendations = updatedRecs;

    this.persist();
    if (shouldNotify) {
      this.notify();
    }
  }

  public updateIssueStatus(
    issueId: string,
    newStatus: IssueStatus,
    actor = 'User',
    reason?: string
  ) {
    const issueIndex = this.issues.findIndex(i => i.id === issueId);
    if (issueIndex === -1) return;

    const previousStatus = this.issues[issueIndex].status;
    if (previousStatus === newStatus) return;

    const now = new Date().toISOString();

    // Update issue
    const updated = {
      ...this.issues[issueIndex],
      status: newStatus,
      updatedAt: now,
    };
    this.issues = [
      ...this.issues.slice(0, issueIndex),
      updated,
      ...this.issues.slice(issueIndex + 1),
    ];

    // Record status history audit entry
    const historyItem: IssueStatusHistory = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      issueId,
      previousStatus,
      newStatus,
      timestamp: now,
      actor,
      reason,
    };
    this.statusHistory = [historyItem, ...this.statusHistory];

    this.persist();
    this.notify();
  }

  public updateIssueDetails(
    issueId: string,
    updates: {
      owner?: string;
      dueDate?: string;
      suggestedNextAction?: string;
    }
  ) {
    const issueIndex = this.issues.findIndex(i => i.id === issueId);
    if (issueIndex === -1) return;

    const updated = {
      ...this.issues[issueIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.issues = [
      ...this.issues.slice(0, issueIndex),
      updated,
      ...this.issues.slice(issueIndex + 1),
    ];

    this.persist();
    this.notify();
  }

  public addIssueNote(issueId: string, noteText: string, author = 'Analyst'): IssueNote {
    const newNote: IssueNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      issueId,
      note: noteText.trim(),
      author,
      createdAt: new Date().toISOString(),
    };

    this.notes = [newNote, ...this.notes];
    this.persist();
    this.notify();
    return newNote;
  }

  public deleteIssueNote(noteId: string) {
    this.notes = this.notes.filter(n => n.id !== noteId);
    this.persist();
    this.notify();
  }

  public updateRecommendationStatus(
    recId: string,
    status: RecommendationStatus,
    userNotes?: string
  ) {
    const recIndex = this.recommendations.findIndex(r => r.id === recId);
    if (recIndex === -1) return;

    const updated: RecommendationRecord = {
      ...this.recommendations[recIndex],
      status,
      userNotes: userNotes !== undefined ? userNotes : this.recommendations[recIndex].userNotes,
      updatedAt: new Date().toISOString(),
    };

    this.recommendations = [
      ...this.recommendations.slice(0, recIndex),
      updated,
      ...this.recommendations.slice(recIndex + 1),
    ];

    this.persist();
    this.notify();
  }

  public replaceRecommendation(newRec: RecommendationRecord) {
    const recIndex = this.recommendations.findIndex(r => r.issueId === newRec.issueId);
    if (recIndex >= 0) {
      this.recommendations = [
        ...this.recommendations.slice(0, recIndex),
        newRec,
        ...this.recommendations.slice(recIndex + 1),
      ];
    } else {
      this.recommendations = [newRec, ...this.recommendations];
    }
    this.persist();
    this.notify();
  }

  public updateCategoryConfig(newConfig: CategoryRelevanceConfig) {
    this.categoryConfig = { ...newConfig };
    this.recalculateIssuesAndScores(true);
  }

  public updatePriorityThresholds(newThresholds: PriorityBandThresholds) {
    this.thresholds = { ...newThresholds };
    this.recalculateIssuesAndScores(true);
  }

  public updateRecordsWithAnalysis(
    updatedRecords: FeedbackRecord[],
    insights: AggregateInsights,
    runMeta: AnalysisRunRecord
  ) {
    this.records = [...updatedRecords];
    this.cachedInsights = insights;
    this.lastRun = runMeta;
    this.metadata = {
      ...this.metadata,
      lastUpdated: new Date().toISOString(),
    };

    this.recalculateIssuesAndScores(false);
    this.persist();
    this.notify();
  }

  public addFeedback(text: string, category: FeedbackCategory): FeedbackRecord {
    const trimmed = text.trim();
    const newRecord: FeedbackRecord = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: trimmed,
      category,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    this.records = [newRecord, ...this.records];
    this.metadata = {
      ...this.metadata,
      lastUpdated: new Date().toISOString(),
      totalRecords: this.records.length,
    };
    this.cachedInsights = calculateAggregateInsights(this.records);
    if (this.lastRun) {
      this.cachedInsights.runMeta = this.lastRun;
    }

    this.recalculateIssuesAndScores(false);
    this.persist();
    this.notify();
    return newRecord;
  }

  public importRecords(
    newRecords: FeedbackRecord[],
    fileName: string,
    fileSizeBytes?: number
  ) {
    this.records = [...newRecords];
    this.lastRun = null;
    this.cachedInsights = calculateAggregateInsights(this.records);
    this.metadata = {
      datasetName: fileName || 'Imported Dataset',
      datasetType: 'imported',
      fileName,
      fileSizeBytes,
      lastUpdated: new Date().toISOString(),
      totalRecords: newRecords.length,
    };

    this.recalculateIssuesAndScores(false);
    this.persist();
    this.notify();
  }

  public resetToDemo(shouldNotify = true) {
    this.records = [...INITIAL_DEMO_RECORDS];
    this.lastRun = null;
    this.cachedInsights = calculateAggregateInsights(this.records);
    this.metadata = {
      datasetName: 'Synthetic Demo Workspace',
      datasetType: 'demo',
      lastUpdated: new Date().toISOString(),
      totalRecords: INITIAL_DEMO_RECORDS.length,
    };

    this.recalculateIssuesAndScores(false);
    this.persist();
    if (shouldNotify) {
      this.notify();
    }
  }

  public loadBenchmarkDataset() {
    const benchmark = generateBuildBattleBenchmarkRecords();
    this.records = benchmark;
    this.lastRun = null;
    this.cachedInsights = calculateAggregateInsights(this.records);
    this.metadata = {
      datasetName: 'BuildBattle_2026_Customer_Feedback_Dataset.csv',
      datasetType: 'imported',
      fileName: 'BuildBattle_2026_Customer_Feedback_Dataset.csv',
      fileSizeBytes: 7000 * 110,
      lastUpdated: new Date().toISOString(),
      totalRecords: benchmark.length,
    };

    this.recalculateIssuesAndScores(false);
    this.persist();
    this.notify();
  }

  public clearAnalysis() {
    this.records = this.records.map(r => {
      const copy = { ...r };
      delete copy.analysis;
      return copy;
    });
    this.lastRun = null;
    this.cachedInsights = calculateAggregateInsights(this.records);
    this.recalculateIssuesAndScores(false);
    this.persist();
    this.notify();
  }

  public exportToCsv(recordsToExport: FeedbackRecord[], customFileName?: string) {
    const rows = recordsToExport.map(r => ({
      review: r.text,
      category: r.category,
      source: r.source,
      sentiment: r.analysis?.sentiment || 'Unanalyzed',
      confidence: r.analysis?.confidence !== undefined ? `${Math.round(r.analysis.confidence * 100)}%` : '',
      topic: r.analysis?.topicLabel || '',
      complaint: r.analysis?.complaintTitle || '',
      explanation: r.analysis?.explanation || '',
      evidence: r.analysis?.evidenceQuote || '',
      createdAt: r.createdAt || '',
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = customFileName || `InsightFlow_Export_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
