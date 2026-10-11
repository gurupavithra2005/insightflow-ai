import { useMemo, useCallback, useEffect, useSyncExternalStore } from 'react';
import { FeedbackRepository } from '../services/feedbackRepository';
import { calculateDatasetMetrics } from '../services/analyticsService';
import {
  FeedbackCategory,
  FeedbackRecord,
  AggregateInsights,
  AnalysisRunRecord,
} from '../types/feedback';

export function useFeedbackWorkspace() {
  const repo = useMemo(() => FeedbackRepository.getInstance(), []);

  useEffect(() => {
    repo.hydrateFromStorage();
  }, [repo]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => repo.subscribe(onStoreChange),
    [repo]
  );

  const getSnapshotRecords = useCallback(() => repo.getRecords(), [repo]);
  const getSnapshotMetadata = useCallback(() => repo.getMetadata(), [repo]);
  const getSnapshotInsights = useCallback(() => repo.getInsights(), [repo]);
  const getSnapshotLastRun = useCallback(() => repo.getLastRun(), [repo]);

  const getServerSnapshotRecords = useCallback(() => repo.getServerSnapshotRecords(), [repo]);
  const getServerSnapshotMetadata = useCallback(() => repo.getServerSnapshotMetadata(), [repo]);
  const getServerSnapshotInsights = useCallback(() => repo.getServerSnapshotInsights(), [repo]);
  const getServerSnapshotLastRun = useCallback(() => repo.getServerSnapshotLastRun(), [repo]);

  const records = useSyncExternalStore(subscribe, getSnapshotRecords, getServerSnapshotRecords);
  const metadata = useSyncExternalStore(subscribe, getSnapshotMetadata, getServerSnapshotMetadata);
  const insights = useSyncExternalStore(subscribe, getSnapshotInsights, getServerSnapshotInsights);
  const lastRun = useSyncExternalStore(subscribe, getSnapshotLastRun, getServerSnapshotLastRun);

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

  return {
    records,
    metadata,
    metrics,
    insights,
    lastRun,
    addFeedback,
    importRecords,
    resetToDemo,
    loadBenchmark,
    updateAnalysis,
    clearAnalysis,
    exportCsv,
  };
}
