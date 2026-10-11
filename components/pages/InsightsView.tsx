'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Brain,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  TrendingDown,
  Quote,
  Eye,
  Filter,
} from 'lucide-react';
import {
  FeedbackRecord,
  DatasetMetrics,
  WorkspaceMetadata,
  AggregateInsights,
  AnalysisRunRecord,
  TopicRecord,
  ComplaintGroupRecord,
  SentimentType,
  VALID_SENTIMENTS,
  VALID_CATEGORIES,
} from '../../types/feedback';
import { formatDisplayTime } from '../../lib/dateUtils';
import { EvidenceModal, EvidenceModalData } from '../insights/EvidenceModal';

interface InsightsViewProps {
  metrics: DatasetMetrics;
  metadata: WorkspaceMetadata;
  records: FeedbackRecord[];
  insights: AggregateInsights;
  lastRun: AnalysisRunRecord | null;
  onOpenAnalysisModal: () => void;
  onClearAnalysis: () => void;
  onNavigateExplorerWithFilter: (filterType: 'sentiment' | 'topic' | 'complaint', filterValue: string) => void;
  onInspectRecord: (record: FeedbackRecord) => void;
}

const SENTIMENT_STYLES: Record<SentimentType, { label: string; bg: string; text: string; bar: string }> = {
  Positive: { label: 'Positive', bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-600' },
  Neutral: { label: 'Neutral', bg: 'bg-slate-100', text: 'text-slate-700', bar: 'bg-slate-500' },
  Negative: { label: 'Negative', bg: 'bg-rose-50', text: 'text-rose-700', bar: 'bg-rose-600' },
  Mixed: { label: 'Mixed', bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-600' },
};

export function InsightsView({
  metrics,
  metadata,
  records,
  insights,
  lastRun,
  onOpenAnalysisModal,
  onClearAnalysis,
  onNavigateExplorerWithFilter,
  onInspectRecord,
}: InsightsViewProps) {
  const [evidenceModalData, setEvidenceModalData] = useState<EvidenceModalData | null>(null);

  const isAnalyzed = insights.analyzedRecords > 0;
  const maxTopicOccurrences = Math.max(...(insights.topics.map(t => t.occurrenceCount)), 1);

  const handleOpenTopicEvidence = (topic: TopicRecord) => {
    const matchingRecords = records.filter(
      r => r.analysis?.topicLabel.toLowerCase() === topic.label.toLowerCase()
    );

    setEvidenceModalData({
      title: topic.label,
      type: 'topic',
      description: topic.description,
      occurrenceCount: topic.occurrenceCount,
      distinctCount: topic.distinctCount,
      categories: topic.categories,
      representativeExamples: topic.representativeExamples,
      records: matchingRecords.length > 0 ? matchingRecords : records.filter(r => topic.recordIds.includes(r.id)),
    });
  };

  const handleOpenComplaintEvidence = (complaint: ComplaintGroupRecord) => {
    const matchingRecords = records.filter(
      r => r.analysis?.complaintTitle?.toLowerCase() === complaint.title.toLowerCase()
    );

    setEvidenceModalData({
      title: complaint.title,
      type: 'complaint',
      description: complaint.explanation,
      occurrenceCount: complaint.occurrenceCount,
      distinctCount: complaint.distinctCount,
      categories: complaint.categories,
      representativeExamples: complaint.representativeExamples,
      records: matchingRecords.length > 0 ? matchingRecords : records.filter(r => complaint.recordIds.includes(r.id)),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              AI Insights
            </h1>
            {isAnalyzed ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>
                  {lastRun?.provider === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash Analyzed' : 'Baseline Lexicon Analyzed'}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full shrink-0">
                <AlertCircle className="w-3 h-3 text-amber-600" /> Awaiting Analysis
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Discover the patterns, customer sentiment and recurring issues hidden in your feedback.
          </p>
        </div>

        {/* Primary Header Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isAnalyzed && (
            <button
              onClick={onClearAnalysis}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              title="Reset analysis results for active workspace"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Analysis</span>
            </button>
          )}

          <button
            onClick={onOpenAnalysisModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAnalyzed ? 'Re-Run Analysis' : 'Analyze Feedback'}</span>
          </button>
        </div>
      </div>

      {/* Dataset & Execution Summary Ribbon */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Active Dataset</span>
            <span className="font-semibold text-slate-900 block truncate" title={metadata.datasetName}>
              {metadata.datasetName}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Total Workload</span>
            <span className="font-bold text-slate-900 font-mono tabular-nums">
              {insights.totalRecords.toLocaleString('en-US')} rows
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Successfully Analyzed</span>
            <span className="font-bold text-emerald-700 font-mono tabular-nums">
              {insights.analyzedRecords.toLocaleString('en-US')} rows
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Pending Analysis</span>
            <span className="font-bold text-slate-600 font-mono tabular-nums">
              {insights.unanalyzedRecords.toLocaleString('en-US')} rows
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-slate-500 block">Coverage</span>
            <span className="font-bold text-indigo-700 font-mono tabular-nums">
              {insights.coveragePercentage}%
            </span>
          </div>
        </div>

        {lastRun?.completedAt && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
            <span>
              Engine: <strong>{lastRun.provider === 'gemini-3.8-flash' ? 'Google Gemini 3.8 Flash' : 'Transparent Rule Lexicon'}</strong>
            </span>
            <span>
              Completed: {formatDisplayTime(lastRun.completedAt)}
            </span>
          </div>
        )}
      </div>

      {!isAnalyzed ? (
        /* Empty / Unanalyzed State */
        <div className="p-12 bg-white border border-slate-200/80 rounded-xl text-center space-y-4 shadow-2xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Sentiment and Topic Analysis Has Not Been Run Yet
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Run the analysis engine to classify sentiment across your {records.length.toLocaleString('en-US')} customer reviews, group semantic friction topics, and extract representative complaint evidence.
            </p>
          </div>
          <button
            onClick={onOpenAnalysisModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Analysis Pipeline</span>
          </button>
        </div>
      ) : (
        /* Populated Analytical View */
        <div className="space-y-6">
          {/* Sentiment Distribution & Topic Frequency */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Sentiment Distribution */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Customer Sentiment Distribution</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Calculated across {insights.analyzedRecords.toLocaleString('en-US')} analyzed feedback occurrences
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  100% total
                </span>
              </div>

              {/* Stacked Sentiment Visualizer */}
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                {VALID_SENTIMENTS.map(s => {
                  const pct = insights.sentimentPercentages[s];
                  if (pct <= 0) return null;
                  return (
                    <div
                      key={s}
                      className={`h-full ${SENTIMENT_STYLES[s].bar} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                      title={`${s}: ${insights.sentimentCounts[s].toLocaleString('en-US')} (${pct}%)`}
                    />
                  );
                })}
              </div>

              {/* Sentiment Detail Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {VALID_SENTIMENTS.map(s => {
                  const count = insights.sentimentCounts[s];
                  const pct = insights.sentimentPercentages[s];
                  const st = SENTIMENT_STYLES[s];

                  return (
                    <div
                      key={s}
                      onClick={() => onNavigateExplorerWithFilter('sentiment', s)}
                      className={`p-3 rounded-lg border border-slate-200/80 hover:border-slate-300 transition-colors cursor-pointer group`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={`font-semibold ${st.text}`}>{s}</span>
                      </div>
                      <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                        {count.toLocaleString('en-US')}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {pct}% share
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                <span>Click any sentiment card to filter Feedback Explorer</span>
                <span>Analyzed denominator: {insights.analyzedRecords.toLocaleString('en-US')}</span>
              </div>
            </div>

            {/* 2. Topic Frequency Chart */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Discovered Topic Frequency</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Semantic topics ranked by feedback recurrence volume
                  </p>
                </div>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {insights.topics.length} topics
                </span>
              </div>

              {insights.topics.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No topics generated.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                  {insights.topics.slice(0, 6).map(topic => {
                    const widthPercent = (topic.occurrenceCount / maxTopicOccurrences) * 100;

                    return (
                      <div
                        key={topic.id}
                        onClick={() => handleOpenTopicEvidence(topic)}
                        className="group cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate max-w-xs">
                            {topic.label}
                          </span>
                          <span className="font-mono tabular-nums text-slate-600 shrink-0">
                            <strong>{topic.occurrenceCount.toLocaleString('en-US')}</strong> occurrences ({topic.distinctCount} unique)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(widthPercent, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                <span>Click any topic to inspect verbatim quotation evidence</span>
                <span>Recurrence-weighted volume</span>
              </div>
            </div>
          </div>

          {/* 3. Category-Level Sentiment Cross-Tabulation */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Category-Level Sentiment Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cross-tabulated customer sentiment across the 4 verified operational categories
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-3 text-right">Positive</th>
                    <th className="py-2.5 px-3 text-right">Neutral</th>
                    <th className="py-2.5 px-3 text-right">Negative</th>
                    <th className="py-2.5 px-3 text-right">Mixed</th>
                    <th className="py-2.5 px-4 text-right">Total Analyzed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {VALID_CATEGORIES.map(cat => {
                    const row = insights.categorySentiment[cat];
                    const catTotal = row.Positive + row.Neutral + row.Negative + row.Mixed;

                    return (
                      <tr key={cat} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{cat}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700">
                          {row.Positive.toLocaleString('en-US')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                          {row.Neutral.toLocaleString('en-US')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-700 font-medium">
                          {row.Negative.toLocaleString('en-US')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-700">
                          {row.Mixed.toLocaleString('en-US')}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          {catTotal.toLocaleString('en-US')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Common Complaint Identification Explorer */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Identified Common Customer Complaints ({insights.complaints.length} Groups)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synthesized friction groups from negative customer feedback, weighted by occurrence volume
                </p>
              </div>
            </div>

            {insights.complaints.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No complaint clusters identified in the current records.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.complaints.slice(0, 6).map(complaint => (
                  <div
                    key={complaint.id}
                    className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-900 line-clamp-1">
                          {complaint.title}
                        </span>
                        <span className="font-mono tabular-nums text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded text-[11px] shrink-0">
                          {complaint.occurrenceCount.toLocaleString('en-US')} occurrences
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {complaint.explanation}
                      </p>
                      {complaint.representativeExamples.length > 0 && (
                        <blockquote className="mt-2 text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 italic line-clamp-2">
                          &ldquo;{complaint.representativeExamples[0]}&rdquo;
                        </blockquote>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">
                        {complaint.distinctCount} distinct statements
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenComplaintEvidence(complaint)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <Quote className="w-3 h-3" />
                        <span>Inspect Evidence</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Complete Topic Discovery Directory */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Topic Discovery Directory ({insights.topics.length} Discovered Clusters)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Semantic clusters with occurrence counts, primary category associations, and evidence access
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {insights.topics.map(topic => (
                <div
                  key={topic.id}
                  onClick={() => handleOpenTopicEvidence(topic)}
                  className="p-3.5 rounded-xl border border-slate-200/90 hover:border-indigo-300 transition-all cursor-pointer bg-white group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {topic.label}
                      </span>
                      <span className="font-mono tabular-nums text-slate-700 font-semibold text-[11px] shrink-0">
                        {topic.occurrenceCount.toLocaleString('en-US')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{topic.distinctCount} distinct reviews</span>
                    <span className="text-indigo-600 font-medium group-hover:underline">View Evidence →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Traceable Evidence Modal */}
      <EvidenceModal
        data={evidenceModalData}
        onClose={() => setEvidenceModalData(null)}
        onViewInExplorer={query => onNavigateExplorerWithFilter('topic', query)}
        onInspectRecord={onInspectRecord}
      />
    </div>
  );
}
