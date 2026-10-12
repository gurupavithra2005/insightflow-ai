import { useMemo, useCallback, useEffect, useSyncExternalStore } from 'react';
import { FeedbackRepository } from '../services/feedbackRepository';
import { calculateDatasetMetrics } from '../services/analyticsService';
import {
  FeedbackCategory,
  FeedbackRecord,
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
} from '../types/feedback';

const repoInstance = FeedbackRepository.getInstance();

const subscribe = (onStoreChange: () => void) => repoInstance.subscribe(onStoreChange);
const getSnapshot = () => repoInstance.getSnapshot();
const getServerSnapshot = () => repoInstance.getServerSnapshot();

export function useFeedbackWorkspace() {
  const repo = repoInstance;

  useEffect(() => {
    repo.hydrateFromStorage();
  }, [repo]);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const {
    records,
    metadata,
    insights,
    lastRun,
    issues,
    recommendations,
    notes,
    statusHistory,
    categoryConfig,
    thresholds,
    reports,
  } = snapshot;

  const metrics = useMemo(() => {
    return calculateDatasetMetrics(records);
  }, [records]);

  const addFeedback = useCallback((text: string, category: FeedbackCategory) => {
    return repo.addFeedback(text, category);
  }, [repo]);

  const importRecords = useCallback((newRecords: FeedbackRecord[], fileName: string, fileSizeBytes?: number) => {
    repo.importRecords(newRecords, fileName, fileSizeBytes);
  }, [repo]);

  const resetToDemo = useCallback(() => {
    repo.resetToDemo();
  }, [repo]);

  const loadBenchmark = useCallback(() => {
    repo.loadBenchmarkDataset();
  }, [repo]);

  const updateAnalysis = useCallback((
    updatedRecords: FeedbackRecord[],
    newInsights: AggregateInsights,
    runMeta: AnalysisRunRecord
  ) => {
    repo.updateRecordsWithAnalysis(updatedRecords, newInsights, runMeta);
  }, [repo]);

  const clearAnalysis = useCallback(() => {
    repo.clearAnalysis();
  }, [repo]);

  const exportCsv = useCallback((recordsToExport: FeedbackRecord[], filename?: string) => {
    repo.exportToCsv(recordsToExport, filename);
  }, [repo]);

  const updateIssueStatus = useCallback((
    issueId: string,
    newStatus: IssueStatus,
    actor?: string,
    reason?: string
  ) => {
    repo.updateIssueStatus(issueId, newStatus, actor, reason);
  }, [repo]);

  const updateIssueDetails = useCallback((
    issueId: string,
    updates: {
      owner?: string;
      dueDate?: string;
      suggestedNextAction?: string;
    }
  ) => {
    repo.updateIssueDetails(issueId, updates);
  }, [repo]);

  const addIssueNote = useCallback((issueId: string, noteText: string, author?: string) => {
    return repo.addIssueNote(issueId, noteText, author);
  }, [repo]);

  const deleteIssueNote = useCallback((noteId: string) => {
    repo.deleteIssueNote(noteId);
  }, [repo]);

  const updateRecommendationStatus = useCallback((
    recId: string,
    status: RecommendationStatus,
    userNotes?: string
  ) => {
    repo.updateRecommendationStatus(recId, status, userNotes);
  }, [repo]);

  const replaceRecommendation = useCallback((newRec: RecommendationRecord) => {
    repo.replaceRecommendation(newRec);
  }, [repo]);

  const updateCategoryConfig = useCallback((newConfig: CategoryRelevanceConfig) => {
    repo.updateCategoryConfig(newConfig);
  }, [repo]);

  const updatePriorityThresholds = useCallback((newThresholds: PriorityBandThresholds) => {
    repo.updatePriorityThresholds(newThresholds);
  }, [repo]);

  const recalculateIssues = useCallback(() => {
    repo.recalculateIssuesAndScores(true);
  }, [repo]);

  const addReport = useCallback((report: any) => {
    repo.addReport(report);
  }, [repo]);

  const deleteReport = useCallback((reportId: string) => {
    repo.deleteReport(reportId);
  }, [repo]);

  return {
    records,
    metadata,
    metrics,
    insights,
    lastRun,
    issues,
    recommendations,
    notes,
    statusHistory,
    categoryConfig,
    thresholds,
    reports,
    addFeedback,
    importRecords,
    resetToDemo,
    loadBenchmark,
    updateAnalysis,
    clearAnalysis,
    exportCsv,
    updateIssueStatus,
    updateIssueDetails,
    addIssueNote,
    deleteIssueNote,
    updateRecommendationStatus,
    replaceRecommendation,
    updateCategoryConfig,
    updatePriorityThresholds,
    recalculateIssues,
    addReport,
    deleteReport,
  };
}
