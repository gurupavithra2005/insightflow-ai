'use client';

import React, { useState, useMemo } from 'react';
import {
  FeedbackRecord,
  DatasetMetrics,
  WorkspaceMetadata,
  AggregateInsights,
  IssueRecord,
  RecommendationRecord,
  ReportRecord,
  ReportType,
  ReportFormat,
  ReportFilterScope,
  VALID_CATEGORIES,
  VALID_SENTIMENTS,
  VALID_ISSUE_STATUSES,
} from '../../types/feedback';
import {
  generateReportSnapshot,
  filterRecordsForReport,
  filterIssuesForReport,
  downloadExecutivePrintableReport,
  exportReportToJson,
  exportDomainToCsv,
} from '../../services/reportService';
import {
  X,
  FileText,
  Sliders,
  CheckCircle2,
  Download,
  Printer,
  Sparkles,
  Layers,
  Target,
  FileSpreadsheet,
  Info,
} from 'lucide-react';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: FeedbackRecord[];
  metadata: WorkspaceMetadata;
  metrics: DatasetMetrics;
  insights: AggregateInsights;
  issues: IssueRecord[];
  recommendations: RecommendationRecord[];
  onSaveReport: (report: ReportRecord) => void;
}

export function ReportGeneratorModal({
  isOpen,
  onClose,
  records,
  metadata,
  metrics,
  insights,
  issues,
  recommendations,
  onSaveReport,
}: ReportGeneratorModalProps) {
  const isAnalyzed = insights.analyzedRecords > 0;

  const [title, setTitle] = useState('Executive Customer Feedback & Decision Report');
  const [reportType, setReportType] = useState<ReportType>('comprehensive_report');
  const [category, setCategory] = useState<string>('all');
  const [sentiment, setSentiment] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [issueStatus, setIssueStatus] = useState<string>('all');
  const [format, setFormat] = useState<ReportFormat>('pdf');

  // Included sections
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [includeSentiment, setIncludeSentiment] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeTopicsComplaints, setIncludeTopicsComplaints] = useState(true);
  const [includeIssues, setIncludeIssues] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [includeTracking, setIncludeTracking] = useState(true);
  const [includeMethodology, setIncludeMethodology] = useState(true);

  const scope: ReportFilterScope = useMemo(() => ({
    datasetName: metadata.datasetName,
    category,
    sentiment,
    priority,
    issueStatus,
  }), [metadata.datasetName, category, sentiment, priority, issueStatus]);

  // Preview matches count
  const matchingRecords = useMemo(() => filterRecordsForReport(records, scope), [records, scope]);
  const matchingIssues = useMemo(() => filterIssuesForReport(issues, scope), [issues, scope]);
  const matchingRecIds = useMemo(() => new Set(matchingIssues.map(i => i.id)), [matchingIssues]);
  const matchingRecs = useMemo(() => recommendations.filter(r => matchingRecIds.has(r.issueId)), [recommendations, matchingRecIds]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    const includedSections: string[] = [];
    if (includeExecutiveSummary) includedSections.push('executive_summary');
    if (includeSentiment) includedSections.push('sentiment');
    if (includeCategories) includedSections.push('categories');
    if (includeTopicsComplaints) includedSections.push('topics_complaints');
    if (includeIssues) includedSections.push('issues');
    if (includeRecommendations) includedSections.push('recommendations');
    if (includeTracking) includedSections.push('tracking');
    if (includeMethodology) includedSections.push('methodology');

    const snapshot = generateReportSnapshot(
      title.trim() || 'InsightFlow Business Intelligence Report',
      reportType,
      scope,
      includedSections,
      records,
      insights,
      metrics,
      issues,
      recommendations,
      format
    );

    // Save to report history
    onSaveReport(snapshot);

    // Download / Open according to format
    if (format === 'pdf') {
      downloadExecutivePrintableReport(snapshot, matchingRecords, insights, matchingIssues, matchingRecs);
    } else if (format === 'json') {
      exportReportToJson(snapshot, matchingRecords, insights, matchingIssues, matchingRecs);
    } else if (format === 'csv') {
      exportDomainToCsv('issues', matchingRecords, insights, matchingIssues, matchingRecs, [], [], `${snapshot.title.replace(/[^a-zA-Z0-9]/g, '_')}_Issues.csv`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-2xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Generate Business Intelligence Report
              </h2>
              <p className="text-[11px] text-slate-500">
                Configure scope, sections, and export formats derived from verified data.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Report Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Report Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Report Type Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Report Type
            </label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value as ReportType)}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold"
            >
              <option value="comprehensive_report">1. Comprehensive InsightFlow Report (All Sections)</option>
              <option value="executive_summary">2. Executive Summary Briefing</option>
              <option value="sentiment_report">3. Customer Sentiment Polarity Report</option>
              <option value="topic_complaint_report">4. Topic Frequency & Complaint Clusters</option>
              <option value="priority_issues_report">5. Priority Issues & Risk Matrix</option>
              <option value="recommendations_action_plan">6. Recommendations & Action Plan</option>
              <option value="issue_tracking_report">7. Issue Tracker Lifecycle Audit</option>
            </select>
          </div>

          {/* Filters Scope Grid */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Scope & Filter Criteria</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-[11px] p-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
                >
                  <option value="all">All Categories</option>
                  {VALID_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Sentiment</label>
                <select
                  value={sentiment}
                  onChange={e => setSentiment(e.target.value)}
                  className="w-full text-[11px] p-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
                >
                  <option value="all">All Sentiments</option>
                  {VALID_SENTIMENTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full text-[11px] p-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
                >
                  <option value="all">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Issue Status</label>
                <select
                  value={issueStatus}
                  onChange={e => setIssueStatus(e.target.value)}
                  className="w-full text-[11px] p-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
                >
                  <option value="all">All Statuses</option>
                  {VALID_ISSUE_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scope Match Live Counter */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600 font-mono">
              <span>Matching Scope:</span>
              <div className="flex items-center gap-3">
                <span><strong>{matchingRecords.length.toLocaleString('en-US')}</strong> reviews</span>
                <span><strong>{matchingIssues.length}</strong> issues</span>
                <span><strong>{matchingRecs.length}</strong> actions</span>
              </div>
            </div>
          </div>

          {/* Included Sections Checkboxes */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Included Sections in Report
            </label>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExecutiveSummary}
                  onChange={e => setIncludeExecutiveSummary(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Executive Summary & KPIs</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSentiment}
                  onChange={e => setIncludeSentiment(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Sentiment Polarity Breakdown</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCategories}
                  onChange={e => setIncludeCategories(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Category Representation Analysis</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTopicsComplaints}
                  onChange={e => setIncludeTopicsComplaints(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Discovered Topics & Complaints</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeIssues}
                  onChange={e => setIncludeIssues(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Prioritized Issues & Scores</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRecommendations}
                  onChange={e => setIncludeRecommendations(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Remediation Recommendations</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTracking}
                  onChange={e => setIncludeTracking(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Issue Tracker Statuses</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMethodology}
                  onChange={e => setIncludeMethodology(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Audit Methodology & Limitations</span>
              </label>
            </div>
          </div>

          {/* Export Format Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                format === 'pdf' ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="font-bold text-slate-900">PDF Document</div>
                    <div className="text-[10px] text-slate-500">Print / Save as PDF</div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="format"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                  className="text-indigo-600"
                />
              </label>

              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                format === 'csv' ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-bold text-slate-900">CSV Dataset</div>
                    <div className="text-[10px] text-slate-500">Excel / Spreadsheets</div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="format"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                  className="text-indigo-600"
                />
              </label>

              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                format === 'json' ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-bold text-slate-900">JSON Payload</div>
                    <div className="text-[10px] text-slate-500">Structured Data API</div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="format"
                  checked={format === 'json'}
                  onChange={() => setFormat('json')}
                  className="text-indigo-600"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Source: <strong>{metadata.datasetName}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Generate & Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
