import { FeedbackCategory, FeedbackRecord, WorkspaceMetadata, AggregateInsights, AnalysisRunRecord } from '../types/feedback';
import { INITIAL_DEMO_RECORDS } from './demoData';
import { generateBuildBattleBenchmarkRecords } from './benchmarkDataset';
import { calculateAggregateInsights } from './aiAnalysisService';
import Papa from 'papaparse';

const STORAGE_KEY_RECORDS = 'insightflow_records_v2';
const STORAGE_KEY_METADATA = 'insightflow_meta_v2';
const STORAGE_KEY_RUN = 'insightflow_run_v2';

const INITIAL_METADATA: WorkspaceMetadata = {
  datasetName: 'Synthetic Demo Workspace',
  datasetType: 'demo',
  lastUpdated: '2026-01-01T00:00:00.000Z',
  totalRecords: INITIAL_DEMO_RECORDS.length,
};

const INITIAL_INSIGHTS = calculateAggregateInsights(INITIAL_DEMO_RECORDS);

export class FeedbackRepository {
  private static instance: FeedbackRepository;
  private records: FeedbackRecord[] = [];
  private metadata: WorkspaceMetadata = { ...INITIAL_METADATA };
  private lastRun: AnalysisRunRecord | null = null;
  private cachedInsights: AggregateInsights | null = null;
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
  }

  public hydrateFromStorage() {
    if (typeof window === 'undefined' || this.isHydratedFromStorage) return;
    this.isHydratedFromStorage = true;
    try {
      const storedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
      const storedMeta = localStorage.getItem(STORAGE_KEY_METADATA);
      const storedRun = localStorage.getItem(STORAGE_KEY_RUN);

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
        this.notify();
      }
    } catch {
      // Fallback cleanly to initialized demo records on quota or parsing error
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
    } catch (e) {
      console.warn('LocalStorage quota limit reached, maintaining in-memory workspace:', e);
    }
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
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

    // Prepend so manually added item appears at top of recent feedback
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
