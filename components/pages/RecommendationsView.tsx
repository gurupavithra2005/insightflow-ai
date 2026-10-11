'use client';

import React from 'react';
import { Target, CheckCircle2, AlertTriangle, ArrowRight, Layers, FileText, Sparkles, Quote } from 'lucide-react';
import { DatasetMetrics, FeedbackRecord, AggregateInsights } from '../../types/feedback';

interface RecommendationsViewProps {
  metrics: DatasetMetrics;
  records: FeedbackRecord[];
  insights: AggregateInsights;
  onInspectText: (text: string) => void;
  onNavigateTab: (tab: 'explorer') => void;
}

export function RecommendationsView({
  metrics,
  records,
  insights,
  onInspectText,
  onNavigateTab,
}: RecommendationsViewProps) {
  const isAnalyzed = insights.analyzedRecords > 0;
  // Use discovered complaints if analyzed, otherwise top recurring
  const complaints = insights.complaints;
  const topRecurring = metrics.topRecurring;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Action Recommendations & Decision Matrix
            </h1>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
              {isAnalyzed ? 'AI Synthesized Actions' : 'Recurrence Prioritization'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Connecting identified customer friction points with prioritized executive action items.
          </p>
        </div>
      </div>

      {/* Guidance Banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-indigo-600" />
          <span>Evidence-Backed Decision Architecture</span>
        </div>
        <p className="text-slate-600 leading-relaxed">
          {isAnalyzed
            ? `Decisions below are derived directly from ${insights.analyzedRecords.toLocaleString('en-US')} analyzed customer feedback occurrences. Each recommendation is backed by traceable verbatim quotations and recurrence volume.`
            : `Analysis has not yet been executed on this dataset. The items below represent raw exact recurrence patterns. Run the AI analysis engine in AI Insights to unlock semantic complaint synthesis.`}
        </p>
      </div>

      {/* Action Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Prioritized Problem Themes ({isAnalyzed ? complaints.length : topRecurring.length} Identified)
          </h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            Weighted by customer recurrence
          </span>
        </div>

        {isAnalyzed ? (
          /* Analyzed Complaint Clusters */
          complaints.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
              No complaint clusters identified in the current records.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {complaints.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        PRIORITY #{idx + 1}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900">
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-600">
                      <strong className="text-indigo-700 font-bold">{item.occurrenceCount.toLocaleString('en-US')}</strong> customer occurrences
                      ({((item.occurrenceCount / metrics.totalFeedback) * 100).toFixed(1)}% of dataset)
                    </div>
                  </div>

                  {/* Feedback Evidence Block */}
                  {item.representativeExamples.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Quote className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Customer Statement Evidence</span>
                      </div>
                      <blockquote className="p-3 bg-slate-50 border-l-2 border-indigo-500 text-xs text-slate-800 italic rounded-r-md">
                        &ldquo;{item.representativeExamples[0]}&rdquo;
                      </blockquote>
                    </div>
                  )}

                  {/* Why it matters & Recommended action */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-200/60">
                      <div className="font-semibold text-slate-800 mb-1">Impact Analysis</div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        {item.explanation}
                      </p>
                    </div>

                    <div className="p-3 bg-indigo-50/40 rounded-lg border border-indigo-100">
                      <div className="font-semibold text-indigo-950 mb-1">Recommended Remediation Action</div>
                      <p className="text-indigo-900/80 leading-relaxed text-[11px]">
                        Review technical latency bottlenecks and customer communication playbooks across {item.categories.map(c => c.category).join(', ')}.
                      </p>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[11px] font-mono">
                      {item.distinctCount} distinct reviews aggregated into this cluster
                    </span>
                    <button
                      onClick={() => onInspectText(item.representativeExamples[0] || item.title)}
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <span>Inspect Raw Records</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Unanalyzed Raw Recurrence View */
          topRecurring.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
              No repeated complaint patterns detected yet. Import a dataset or add entries to surface prioritized recommendations.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {topRecurring.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        RECURRING #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        Category: {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-600">
                      <strong className="text-indigo-700 font-bold">{item.count}</strong> customer reports
                    </div>
                  </div>

                  <blockquote className="p-3 bg-slate-50 border-l-2 border-indigo-500 text-xs text-slate-800 italic rounded-r-md">
                    &ldquo;{item.text}&rdquo;
                  </blockquote>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[11px]">Exact recurrence match verified</span>
                    <button
                      onClick={() => onInspectText(item.text)}
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <span>Inspect Raw Matches</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
