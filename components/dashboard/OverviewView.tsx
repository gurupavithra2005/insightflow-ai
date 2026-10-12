'use client';

import React, { useMemo } from 'react';
import {
  UploadCloud,
  Plus,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  CheckCircle,
  Database,
  ArrowRight,
} from 'lucide-react';
import {
  FeedbackRecord,
  WorkspaceMetadata,
  DatasetMetrics,
  FeedbackCategory,
  AggregateInsights,
  SentimentType,
} from '../../types/feedback';
import { WorkflowProgress } from '../common/WorkflowProgress';
import { MetricCards } from './MetricCards';
import { CategoryChart } from './CategoryChart';
import { RecurringFeedback } from './RecurringFeedback';
import { RecentFeedbackTable } from './RecentFeedbackTable';
import { SentimentWidget } from './SentimentWidget';
import { TrendPlaceholder } from './TrendPlaceholder';

interface OverviewViewProps {
  records: FeedbackRecord[];
  metadata: WorkspaceMetadata;
  metrics: DatasetMetrics;
  insights: AggregateInsights;
  onOpenImportModal: () => void;
  onOpenAddModal: () => void;
  onOpenAnalysisModal?: () => void;
  onLoadBenchmark?: () => void;
  onResetToDemo: () => void;
  onNavigateTab: (tab: 'explorer' | 'insights') => void;
  onInspectRecord: (record: FeedbackRecord) => void;
  onFilterByCategory: (category: FeedbackCategory) => void;
  onFilterBySentiment: (sentiment: SentimentType) => void;
}

export function OverviewView({
  records,
  metadata,
  metrics,
  insights,
  onOpenImportModal,
  onOpenAddModal,
  onOpenAnalysisModal,
  onLoadBenchmark,
  onResetToDemo,
  onNavigateTab,
  onInspectRecord,
  onFilterByCategory,
  onFilterBySentiment,
}: OverviewViewProps) {
  const handleInspectByText = (text: string) => {
    const found = records.find(r => r.text.trim() === text.trim());
    if (found) {
      onInspectRecord(found);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Welcome to InsightFlow
            </h1>
            {metadata.datasetType === 'demo' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full shrink-0">
                <Database className="w-3 h-3 text-amber-600" /> Demo Workspace
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shrink-0">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> Imported Dataset
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Your customer feedback, organized into business-ready insights.
          </p>
        </div>

        {/* Primary Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
          {metadata.datasetType === 'demo' && onLoadBenchmark && (
            <button
              onClick={onLoadBenchmark}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-2xs"
              title="Load the authentic 7,000-record Build Battle 2026 Customer Feedback dataset"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load 7,000 Source Dataset</span>
            </button>
          )}

          {metadata.datasetType === 'imported' && (
            <button
              onClick={onResetToDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              title="Restore original sample demo records"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset to Demo</span>
            </button>
          )}

          <button
            onClick={onOpenImportModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Feedback</span>
          </button>
        </div>
      </div>

      {/* Dataset Status Banner */}
      <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-600 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-700 shrink-0 mt-0.5 sm:mt-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-semibold text-slate-900 truncate">
                Active Source: {metadata.datasetName}
              </span>
              <span className="font-mono text-slate-500 text-[11px] whitespace-nowrap">
                ({metrics.totalFeedback.toLocaleString('en-US')} records loaded)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              {metadata.datasetType === 'demo'
                ? 'Curated synthetic demonstration entries across all 4 categories for immediate evaluation.'
                : 'Imported customer feedback with real-time recalculation across 4 business categories.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <button
            onClick={() => onNavigateTab('explorer')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors py-1"
          >
            <span>Browse Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Workflow Progress: Collect -> Organize -> Analyze -> Prioritize -> Act */}
      <WorkflowProgress
        currentStage={insights.analyzedRecords > 0 ? 'analyze' : 'organize'}
        recordsCount={records.length}
        analyzedCount={insights.analyzedRecords}
        uniqueCount={metrics.uniqueFeedbackCount}
      />

      {/* Primary KPI Metric Cards */}
      <MetricCards metrics={metrics} />

      {/* Category Chart & Recurring Statements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart
          metrics={metrics}
          onSelectCategory={cat => {
            onFilterByCategory(cat);
            onNavigateTab('explorer');
          }}
        />
        <RecurringFeedback
          metrics={metrics}
          onInspectText={handleInspectByText}
        />
      </div>

      {/* Recent Feedback Table */}
      <RecentFeedbackTable
        records={records}
        onInspect={onInspectRecord}
        onViewAll={() => onNavigateTab('explorer')}
      />

      {/* Sentiment Widget & Timeline Guard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SentimentWidget
          insights={insights}
          onNavigateInsights={() => onNavigateTab('insights')}
          onOpenAnalysisModal={onOpenAnalysisModal}
          onFilterSentiment={s => {
            onFilterBySentiment(s);
            onNavigateTab('explorer');
          }}
        />
        <TrendPlaceholder />
      </div>
    </div>
  );
}
