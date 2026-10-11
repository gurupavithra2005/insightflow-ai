'use client';

import React from 'react';
import { Download, FileSpreadsheet, Printer, BarChart3, CheckCircle, Database, Sparkles } from 'lucide-react';
import { DatasetMetrics, FeedbackRecord, WorkspaceMetadata, AggregateInsights } from '../../types/feedback';
import { formatDisplayDate } from '../../lib/dateUtils';

interface ReportsViewProps {
  metrics: DatasetMetrics;
  records: FeedbackRecord[];
  metadata: WorkspaceMetadata;
  insights: AggregateInsights;
  onExportCsv: (recordsToExport: FeedbackRecord[], filename?: string) => void;
}

export function ReportsView({
  metrics,
  records,
  metadata,
  insights,
  onExportCsv,
}: ReportsViewProps) {
  const isAnalyzed = insights.analyzedRecords > 0;

  const handleExportSummaryReport = () => {
    const summary = {
      platform: 'InsightFlow',
      datasetName: metadata.datasetName,
      datasetType: metadata.datasetType,
      generatedAt: new Date().toISOString(),
      analysisCoverage: `${insights.coveragePercentage}% (${insights.analyzedRecords} / ${insights.totalRecords})`,
      sentimentDistribution: isAnalyzed ? insights.sentimentCounts : 'Unanalyzed',
      metrics: {
        totalFeedback: metrics.totalFeedback,
        uniqueFeedbackTexts: metrics.uniqueFeedbackCount,
        categoryCount: metrics.categoryCount,
        repeatedFeedbackEntries: metrics.repeatedEntriesCount,
        categoryBreakdown: metrics.categoryBreakdown,
        topRecurringPatterns: metrics.topRecurring,
      },
      discoveredTopics: isAnalyzed
        ? insights.topics.map(t => ({
            label: t.label,
            occurrences: t.occurrenceCount,
            distinctTexts: t.distinctCount,
          }))
        : [],
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `InsightFlow_Executive_Summary_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Executive Feedback & Quality Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Stakeholder-ready summaries and dataset exports computed from active records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSummaryReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title="Download JSON Executive Summary"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Summary (JSON)</span>
          </button>

          <button
            onClick={() => onExportCsv(records, `InsightFlow_Report_Export_${Date.now()}.csv`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Full CSV ({records.length.toLocaleString('en-US')})</span>
          </button>
        </div>
      </div>

      {/* Report Document Surface */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-indigo-600">
              InsightFlow Executive Intelligence
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Customer Feedback Synthesis Report
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Source: {metadata.datasetName}</span>
              <span aria-hidden="true">·</span>
              <span>Updated {formatDisplayDate(metadata.lastUpdated)}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="text-slate-500 font-medium">Dataset Integrity Status:</div>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{metadata.datasetType === 'demo' ? 'Synthetic Demo Records' : 'Direct CSV Import'}</span>
            </div>
            {isAnalyzed && (
              <div className="text-[11px] text-indigo-700 font-medium pt-1">
                AI Coverage: {insights.coveragePercentage}% ({insights.analyzedRecords.toLocaleString('en-US')} analyzed)
              </div>
            )}
          </div>
        </div>

        {/* Executive Summary Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">Total Volume</div>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {metrics.totalFeedback.toLocaleString('en-US')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Evaluated reviews</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">Unique Phrasings</div>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {metrics.uniqueFeedbackCount.toLocaleString('en-US')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Distinct statements</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">Recurring Submissions</div>
            <div className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-1">
              {metrics.repeatedEntriesCount.toLocaleString('en-US')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Multi-instance friction</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">Category Spread</div>
            <div className="text-xl font-bold text-teal-700 font-mono tabular-nums mt-1">
              {metrics.categoryCount} / 4
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active categories</div>
          </div>
        </div>

        {/* Sentiment Synthesis (if analyzed) */}
        {isAnalyzed && (
          <div className="space-y-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Customer Sentiment Polarity Distribution</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-emerald-700 font-semibold block">Positive</span>
                <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                  {insights.sentimentCounts.Positive.toLocaleString('en-US')}
                </span>
                <span className="text-slate-500 text-[11px] block">{insights.sentimentPercentages.Positive}%</span>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-slate-700 font-semibold block">Neutral</span>
                <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                  {insights.sentimentCounts.Neutral.toLocaleString('en-US')}
                </span>
                <span className="text-slate-500 text-[11px] block">{insights.sentimentPercentages.Neutral}%</span>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-rose-700 font-semibold block">Negative</span>
                <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                  {insights.sentimentCounts.Negative.toLocaleString('en-US')}
                </span>
                <span className="text-slate-500 text-[11px] block">{insights.sentimentPercentages.Negative}%</span>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-amber-700 font-semibold block">Mixed</span>
                <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                  {insights.sentimentCounts.Mixed.toLocaleString('en-US')}
                </span>
                <span className="text-slate-500 text-[11px] block">{insights.sentimentPercentages.Mixed}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Category Breakdown & Representation
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Feedback Category</th>
                  <th className="py-2.5 px-4 w-36 text-right">Row Count</th>
                  <th className="py-2.5 px-4 w-32 text-right">Share (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.categoryBreakdown.map(cat => (
                  <tr key={cat.category} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-medium text-slate-800">{cat.category}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900 font-semibold">
                      {cat.count.toLocaleString('en-US')}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      {cat.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Recurring Friction Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Key Recurring Complaint Statements
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-slate-400">#</th>
                  <th className="py-2.5 px-4">Customer Statement</th>
                  <th className="py-2.5 px-4 w-36">Category</th>
                  <th className="py-2.5 px-4 w-28 text-right">Occurrences</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.topRecurring.slice(0, 5).map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{i + 1}</td>
                    <td className="py-2.5 px-4 text-slate-800 font-normal">{item.text}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-700">{item.category}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-indigo-700 font-bold">
                      {item.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
