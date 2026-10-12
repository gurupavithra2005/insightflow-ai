'use client';

import React, { useState, useMemo } from 'react';
import {
  DatasetMetrics,
  FeedbackRecord,
  WorkspaceMetadata,
  AggregateInsights,
  IssueRecord,
  RecommendationRecord,
  IssueNote,
  IssueStatusHistory,
  ReportRecord,
  ReportType,
  VALID_CATEGORIES,
  VALID_SENTIMENTS,
  VALID_ISSUE_STATUSES,
} from '../../types/feedback';
import { formatDisplayDate } from '../../lib/dateUtils';
import { PriorityScoreBadge } from '../common/PriorityScoreBadge';
import { ReportGeneratorModal } from '../reports/ReportGeneratorModal';
import {
  exportDomainToCsv,
  downloadExecutivePrintableReport,
  downloadExecutivePdfReport,
  exportReportToJson,
} from '../../services/reportService';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Printer,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Sliders,
  Filter,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Target,
  Database,
  ArrowRight,
} from 'lucide-react';

interface ReportsViewProps {
  metrics: DatasetMetrics;
  records: FeedbackRecord[];
  metadata: WorkspaceMetadata;
  insights: AggregateInsights;
  issues: IssueRecord[];
  recommendations: RecommendationRecord[];
  notes: IssueNote[];
  statusHistory: IssueStatusHistory[];
  reports: ReportRecord[];
  onSaveReport: (report: ReportRecord) => void;
  onDeleteReport: (reportId: string) => void;
  onExportCsv: (recordsToExport: FeedbackRecord[], filename?: string) => void;
  onInspectText?: (text: string) => void;
}

export function ReportsView({
  metrics,
  records,
  metadata,
  insights,
  issues,
  recommendations,
  notes,
  statusHistory,
  reports,
  onSaveReport,
  onDeleteReport,
  onExportCsv,
  onInspectText,
}: ReportsViewProps) {
  const isAnalyzed = insights.analyzedRecords > 0;

  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filtered views for report preview
  const filteredIssues = useMemo(() => {
    return issues.filter(i => {
      if (filterCategory !== 'all' && !i.categoryDistribution.some(c => c.category === filterCategory)) return false;
      if (filterPriority !== 'all' && i.priorityBand !== filterPriority) return false;
      if (filterStatus !== 'all' && i.status !== filterStatus) return false;
      return true;
    });
  }, [issues, filterCategory, filterPriority, filterStatus]);

  // Executive summary counts
  const totalVolume = metrics.totalFeedback;
  const analyzedVolume = insights.analyzedRecords;
  const coveragePct = insights.coveragePercentage;
  const criticalCount = issues.filter(i => i.priorityBand === 'Critical').length;
  const highCount = issues.filter(i => i.priorityBand === 'High').length;
  const openCount = issues.filter(i => i.status === 'Open').length;
  const inProgressCount = issues.filter(i => i.status === 'In Progress').length;
  const resolvedCount = issues.filter(i => i.status === 'Resolved').length;
  const approvedRecs = recommendations.filter(r => r.status === 'Approved').length;

  const handleDownloadHistoricalPdf = (rep: ReportRecord) => {
    downloadExecutivePdfReport(rep, records, insights, issues, recommendations);
  };

  const handleDownloadHistoricalJson = (rep: ReportRecord) => {
    exportReportToJson(rep, records, insights, issues, recommendations);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Reports & Business Intelligence
            </h1>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Phase 5 & 6 BI Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Turn customer feedback analysis into clear, evidence-backed business reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsGeneratorModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New Report</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Volume
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalVolume.toLocaleString('en-US')}
          </div>
          <span className="text-[10px] text-slate-400">Feedback occurrences</span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
            AI Coverage
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-600 tabular-nums">
            {coveragePct}%
          </div>
          <span className="text-[10px] text-slate-400">{analyzedVolume.toLocaleString('en-US')} evaluated</span>
        </div>

        <div className="p-4 bg-rose-50/50 border border-rose-200/80 rounded-xl shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
            Critical Risk
          </span>
          <div className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
            {criticalCount}
          </div>
          <span className="text-[10px] text-rose-600">Priority Score ≥ 80</span>
        </div>

        <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-xl shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            High Priority
          </span>
          <div className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
            {highCount}
          </div>
          <span className="text-[10px] text-amber-700">Priority Score 60–79</span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
            Open Issues
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {openCount}
          </div>
          <span className="text-[10px] text-slate-400">{inProgressCount} in progress</span>
        </div>

        <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            Approved Actions
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {approvedRecs}
          </div>
          <span className="text-[10px] text-emerald-600">{resolvedCount} resolved issues</span>
        </div>
      </div>

      {/* Export Hub Bar */}
      <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Multi-Format Export Hub</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Download clean, domain-specific CSV data files or formatted executive document snapshots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onExportCsv(records, `InsightFlow_Feedback_All_${Date.now()}.csv`)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>All Feedback CSV</span>
            </button>

            {isAnalyzed && (
              <button
                onClick={() => exportDomainToCsv('sentiment', records, insights, issues, recommendations, notes, statusHistory)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Sentiment CSV</span>
              </button>
            )}

            <button
              onClick={() => exportDomainToCsv('issues', records, insights, issues, recommendations, notes, statusHistory)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>Priority Issues CSV</span>
            </button>

            <button
              onClick={() => exportDomainToCsv('recommendations', records, insights, issues, recommendations, notes, statusHistory)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Recommendations CSV</span>
            </button>

            <button
              onClick={() => exportDomainToCsv('tracking', records, insights, issues, recommendations, notes, statusHistory)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span>Audit Trail CSV</span>
            </button>

            <button
              onClick={() => setIsGeneratorModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Printable PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Report Document Surface */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-8">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-slate-200 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-indigo-600">
              InsightFlow Business Intelligence
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Customer Feedback & Quality Synthesis Report
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Active Dataset: <strong className="text-slate-800">{metadata.datasetName}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Updated {formatDisplayDate(metadata.lastUpdated)}</span>
              <span aria-hidden="true">·</span>
              <span>Scope: {totalVolume.toLocaleString('en-US')} total occurrences</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 shrink-0">
            <div className="text-slate-500 font-medium">Dataset Source Integrity:</div>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{metadata.datasetType === 'demo' ? 'Synthetic Demo Records' : 'Direct CSV Import'}</span>
            </div>
            <div className="text-[11px] text-indigo-700 font-medium pt-0.5">
              {isAnalyzed ? `AI Evaluated (${coveragePct}% Coverage)` : 'Exact Recurrence Baseline'}
            </div>
          </div>
        </div>

        {/* Section 1: Customer Sentiment Distribution */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>1. Customer Sentiment Polarity Distribution</span>
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Denominator: {analyzedVolume.toLocaleString('en-US')} analyzed records
            </span>
          </div>

          {isAnalyzed ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-emerald-800 font-semibold block text-[11px]">Positive</span>
                <span className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5 block">
                  {insights.sentimentCounts.Positive.toLocaleString('en-US')}
                </span>
                <span className="text-emerald-700 text-[11px] font-mono block">
                  {insights.sentimentPercentages.Positive}% of analyzed
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-700 font-semibold block text-[11px]">Neutral</span>
                <span className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5 block">
                  {insights.sentimentCounts.Neutral.toLocaleString('en-US')}
                </span>
                <span className="text-slate-600 text-[11px] font-mono block">
                  {insights.sentimentPercentages.Neutral}% of analyzed
                </span>
              </div>

              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                <span className="text-rose-800 font-semibold block text-[11px]">Negative</span>
                <span className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5 block">
                  {insights.sentimentCounts.Negative.toLocaleString('en-US')}
                </span>
                <span className="text-rose-700 text-[11px] font-mono block">
                  {insights.sentimentPercentages.Negative}% of analyzed
                </span>
              </div>

              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                <span className="text-amber-800 font-semibold block text-[11px]">Mixed</span>
                <span className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5 block">
                  {insights.sentimentCounts.Mixed.toLocaleString('en-US')}
                </span>
                <span className="text-amber-700 text-[11px] font-mono block">
                  {insights.sentimentPercentages.Mixed}% of analyzed
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
              Sentiment distribution is unavailable because AI analysis has not been executed yet on this dataset.
            </div>
          )}
        </div>

        {/* Section 2: Category Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>2. Feedback Category Distribution & Representation</span>
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Feedback Category</th>
                  <th className="py-2.5 px-4 w-36 text-right">Occurrence Count</th>
                  <th className="py-2.5 px-4 w-32 text-right">Dataset Share</th>
                  {isAnalyzed && <th className="py-2.5 px-4 w-44 text-right">Dissatisfaction (Neg+Mix)</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.categoryBreakdown.map(cat => {
                  const catSent = insights.categorySentiment[cat.category];
                  const totalCatSent = catSent ? catSent.Negative + catSent.Mixed + catSent.Positive + catSent.Neutral : 0;
                  const dissatPct = totalCatSent > 0 ? Math.round(((catSent.Negative + catSent.Mixed) / totalCatSent) * 100) : 0;

                  return (
                    <tr key={cat.category} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{cat.category}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900 font-bold">
                        {cat.count.toLocaleString('en-US')}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                        {cat.percentage}%
                      </td>
                      {isAnalyzed && (
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-rose-700 font-semibold">
                          {totalCatSent > 0 ? `${dissatPct}%` : 'N/A'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Discovered Topics Frequency */}
        {isAnalyzed && insights.topics.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>3. Discovered Customer Feedback Topics ({insights.topics.length})</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Ranked by customer recurrence volume
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Topic Label</th>
                    <th className="py-2.5 px-4 w-32 text-right">Occurrences</th>
                    <th className="py-2.5 px-4 w-28 text-right">Distinct Texts</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Representative Verbatim Quote</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {insights.topics.slice(0, 6).map((topic, i) => (
                    <tr key={topic.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-slate-900">{topic.label}</span>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{topic.description}</p>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-indigo-700">
                        {topic.occurrenceCount.toLocaleString('en-US')}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                        {topic.distinctCount}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 italic text-[11px]">
                        &ldquo;{topic.representativeExamples[0] || 'N/A'}&rdquo;
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 4: Prioritized Business Issues & Calculated Scores */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              <span>4. Prioritized Business Issues & Decision Matrix ({issues.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Deterministic 5-factor logarithmic scoring
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Problem Theme</th>
                  <th className="py-2.5 px-3 w-32">Priority Score</th>
                  <th className="py-2.5 px-3 w-32">Category</th>
                  <th className="py-2.5 px-3 w-28 text-right">Occurrences</th>
                  <th className="py-2.5 px-3 w-28">Status</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Proposed Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.slice(0, 8).map(issue => (
                  <tr key={issue.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4">
                      <strong className="text-slate-900 block">{issue.title}</strong>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{issue.description}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <PriorityScoreBadge score={issue.priorityScore} band={issue.priorityBand} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {issue.categoryDistribution[0]?.category || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {issue.occurrenceCount.toLocaleString('en-US')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-700">{issue.status}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 text-[11px] line-clamp-2">
                      {issue.suggestedNextAction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Action Recommendations */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>5. Evidence-Backed Action Recommendations ({recommendations.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {recommendations.slice(0, 6).map(rec => (
              <div key={rec.id} className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{rec.actionTitle}</span>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {rec.status}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {rec.actionDescription}
                </p>
                <div className="pt-1 text-[11px] text-emerald-800 font-medium">
                  Outcome: {rec.expectedOperationalOutcome}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Temporal Analysis & Audit Limitations */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>6. Temporal Analysis & Methodological Transparency</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            <strong>Timestamp Availability Notice:</strong> The active dataset schema contains feedback text and category assignments without transaction timestamps. In strict compliance with data integrity principles, InsightFlow refuses to synthesize fictional historical timestamps or fabricated week-over-week trends. Time-series calculations will automatically activate when dated records are provided.
          </p>
          <p className="text-slate-500 text-[10px] italic">
            Priority scores reflect calculated decision rankings grounded in verified volume and dissatisfaction, not measured dollar liability.
          </p>
        </div>
      </div>

      {/* Report History & Saved Snapshots Section */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Report History & Audit Snapshots ({reports.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Persistent record of executive briefings and exported intelligence snapshots.
            </p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No reports generated yet. Click &quot;Generate New Report&quot; to create your first executive briefing.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Report Title</th>
                  <th className="py-2.5 px-3 w-36">Report Type</th>
                  <th className="py-2.5 px-3 w-40">Dataset</th>
                  <th className="py-2.5 px-3 w-32">Generated At</th>
                  <th className="py-2.5 px-3 w-28">Format</th>
                  <th className="py-2.5 px-4 w-40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map(rep => (
                  <tr key={rep.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4">
                      <strong className="text-slate-900 block">{rep.title}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{rep.id}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 capitalize">
                      {rep.reportType.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-[140px]">
                      {rep.datasetName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] font-mono">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-mono font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {rep.generatedFormat}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadHistoricalPdf(rep)}
                          className="p-1 text-slate-600 hover:text-indigo-600 rounded"
                          title="Download Printable PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadHistoricalJson(rep)}
                          className="p-1 text-slate-600 hover:text-indigo-600 rounded"
                          title="Download JSON Snapshot"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteReport(rep.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Report Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Generator Modal */}
      <ReportGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
        records={records}
        metadata={metadata}
        metrics={metrics}
        insights={insights}
        issues={issues}
        recommendations={recommendations}
        onSaveReport={onSaveReport}
      />
    </div>
  );
}
