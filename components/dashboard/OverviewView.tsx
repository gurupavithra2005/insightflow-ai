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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
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
        <div className="flex flex-wrap items-center gap-2.5">
          {metadata.datasetType === 'demo' && onLoadBenchmark && (
            <button
              onClick={onLoadBenchmark}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/90 rounded-lg hover:bg-indigo-100/70 transition-colors shadow-2xs"
              title="Load the authentic 7,000-record Build Battle 2026 Customer Feedback dataset"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load 7,000 Source Dataset</span>
            </button>
          )}

          {metadata.datasetType === 'imported' && (
            <button
              onClick={onResetToDemo}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              title="Restore original sample demo records"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset to Demo</span>
            </button>
          )}

          <button
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Feedback</span>
          </button>
        </div>
      </div>

      {/* Dataset Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-700 shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 flex items-center gap-2">
              <span>Active Source: {metadata.datasetName}</span>
              <span className="font-mono text-slate-400 font-normal">
                ({metrics.totalFeedback.toLocaleString('en-US')} records loaded)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {metadata.datasetType === 'demo'
                ? 'Displaying curated synthetic entries across all 4 categories for immediate evaluation.'
                : `Imported file with real-time recalculation across 4 business categories.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {metadata.datasetType === 'demo' && onLoadBenchmark && (
            <button
              onClick={onLoadBenchmark}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Load 7,000 Dataset</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab('explorer')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>Browse Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Workflow Progress: Collect -> Organize -> Analyze -> Prioritize -> Act */}
      <WorkflowProgress currentStage={insights.analyzedRecords > 0 ? 'analyze' : 'organize'} />

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
