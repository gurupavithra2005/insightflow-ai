'use client';

import React, { useState, useMemo } from 'react';
import {
  DatasetMetrics,
  FeedbackRecord,
  AggregateInsights,
  IssueRecord,
  RecommendationRecord,
  IssueStatus,
  PriorityBand,
  FeedbackCategory,
  CategoryRelevanceConfig,
  PriorityBandThresholds,
} from '../../types/feedback';
import { PriorityScoreBadge } from '../common/PriorityScoreBadge';
import { IssueDetailModal } from '../issues/IssueDetailModal';
import { RecommendationActionModal } from '../recommendations/RecommendationActionModal';
import { CategoryRelevanceModal } from '../recommendations/CategoryRelevanceModal';
import { generateRecommendationForIssue } from '../../services/recommendationService';
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  Sliders,
  Sparkles,
  Quote,
  Clock,
  RotateCw,
  ExternalLink,
  ChevronDown,
  Layers,
  ShieldAlert,
  FileText,
  User,
} from 'lucide-react';

interface RecommendationsViewProps {
  metrics: DatasetMetrics;
  records: FeedbackRecord[];
  insights: AggregateInsights;
  issues: IssueRecord[];
  recommendations: RecommendationRecord[];
  notes: any[];
  statusHistory: any[];
  categoryConfig: CategoryRelevanceConfig;
  thresholds: PriorityBandThresholds;
  onUpdateStatus: (issueId: string, status: IssueStatus, actor?: string, reason?: string) => void;
  onUpdateDetails: (issueId: string, updates: { owner?: string; dueDate?: string; suggestedNextAction?: string }) => void;
  onAddNote: (issueId: string, note: string, author?: string) => void;
  onDeleteNote: (noteId: string) => void;
  onUpdateRecommendationStatus: (recId: string, status: any, userNotes?: string) => void;
  onReplaceRecommendation: (rec: RecommendationRecord) => void;
  onUpdateCategoryConfig: (newConfig: CategoryRelevanceConfig) => void;
  onUpdatePriorityThresholds: (newThresholds: PriorityBandThresholds) => void;
  onRecalculateIssues: () => void;
  onInspectText: (text: string) => void;
  onNavigateTab: (tab: 'explorer' | 'issues' | 'insights') => void;
}

export function RecommendationsView({
  metrics,
  records,
  insights,
  issues,
  recommendations,
  notes,
  statusHistory,
  categoryConfig,
  thresholds,
  onUpdateStatus,
  onUpdateDetails,
  onAddNote,
  onDeleteNote,
  onUpdateRecommendationStatus,
  onReplaceRecommendation,
  onUpdateCategoryConfig,
  onUpdatePriorityThresholds,
  onRecalculateIssues,
  onInspectText,
  onNavigateTab,
}: RecommendationsViewProps) {
  const isAnalyzed = insights.analyzedRecords > 0;

  // Filter and search state
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'occurrences_desc' | 'recent'>('score_desc');

  // Modals state
  const [selectedIssueForDetail, setSelectedIssueForDetail] = useState<IssueRecord | null>(null);
  const [selectedRecForAction, setSelectedRecForAction] = useState<{ rec: RecommendationRecord; issue: IssueRecord } | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Recommendations map for quick lookup
  const recMap = useMemo(() => {
    const map = new Map<string, RecommendationRecord>();
    recommendations.forEach(r => map.set(r.issueId, r));
    return map;
  }, [recommendations]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (filterPriority !== 'all' && issue.priorityBand !== filterPriority) return false;
      if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
      if (filterCategory !== 'all') {
        const hasCat = issue.categoryDistribution.some(c => c.category === filterCategory);
        if (!hasCat) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(q);
        const matchesDesc = issue.description.toLowerCase().includes(q);
        const matchesAction = issue.suggestedNextAction.toLowerCase().includes(q);
        const matchesQuotes = issue.representativeExamples.some(ex => ex.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesAction && !matchesQuotes) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'score_desc') return b.priorityScore - a.priorityScore;
      if (sortBy === 'score_asc') return a.priorityScore - b.priorityScore;
      if (sortBy === 'occurrences_desc') return b.occurrenceCount - a.occurrenceCount;
      if (sortBy === 'recent') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return b.priorityScore - a.priorityScore;
    });
  }, [issues, filterPriority, filterStatus, filterCategory, searchQuery, sortBy]);

  // Metrics derived from actual issues data
  const totalIssuesCount = issues.length;
  const criticalCount = issues.filter(i => i.priorityBand === 'Critical').length;
  const highCount = issues.filter(i => i.priorityBand === 'High').length;
  const openCount = issues.filter(i => i.status === 'Open').length;
  const underReviewCount = issues.filter(i => i.status === 'Under Review').length;
  const inProgressCount = issues.filter(i => i.status === 'In Progress').length;
  const resolvedCount = issues.filter(i => i.status === 'Resolved').length;

  const handleRegenerateAi = async (issue: IssueRecord) => {
    const updated = await generateRecommendationForIssue(issue, true);
    onReplaceRecommendation(updated);
    if (selectedRecForAction && selectedRecForAction.issue.id === issue.id) {
      setSelectedRecForAction({ rec: updated, issue });
    }
  };

  const clearAllFilters = () => {
    setFilterPriority('all');
    setFilterStatus('all');
    setFilterCategory('all');
    setSearchQuery('');
    setSortBy('score_desc');
  };

  const hasActiveFilters = filterPriority !== 'all' || filterStatus !== 'all' || filterCategory !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Primary Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Recommendations
            </h1>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
              isAnalyzed
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {isAnalyzed ? 'Evidence-Backed Analytical Clusters' : 'Exact Recurrence Baseline'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Turn customer feedback patterns into clear, prioritized business actions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
            title="Configure category relevance weights and cutoff thresholds"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Scoring Weights</span>
          </button>

          <button
            onClick={onRecalculateIssues}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100 shadow-2xs transition-colors"
            title="Recalculate priority scores across active feedback"
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* Decision Support Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Issues
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalIssuesCount}
          </div>
          <span className="text-[10px] text-slate-400">Identified from feedback</span>
        </div>

        <div className="p-4 bg-rose-50/50 border border-rose-200/80 rounded-xl shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
            Critical Priority
          </span>
          <div className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
            {criticalCount}
          </div>
          <span className="text-[10px] text-rose-600">Score ≥ {thresholds.critical}</span>
        </div>

        <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-xl shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            High Priority
          </span>
          <div className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
            {highCount}
          </div>
          <span className="text-[10px] text-amber-700">Score {thresholds.high}–{thresholds.critical - 1}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
            Open Issues
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-700 tabular-nums">
            {openCount}
          </div>
          <span className="text-[10px] text-slate-400">Requires triage</span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
            Under Review
          </span>
          <div className="text-2xl font-bold font-mono text-blue-700 tabular-nums">
            {underReviewCount}
          </div>
          <span className="text-[10px] text-slate-400">In team assessment</span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Resolved / Progress
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {resolvedCount + inProgressCount}
          </div>
          <span className="text-[10px] text-slate-400">{inProgressCount} active / {resolvedCount} closed</span>
        </div>
      </div>

      {/* Unanalyzed Notification Notice */}
      {!isAnalyzed && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Workspace Running in Exact Recurrence Mode</span>
            </span>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              AI sentiment and semantic topic analysis have not been executed on this dataset yet. Issues currently reflect exact repeated feedback phrasing. Run the analysis engine to unlock deep semantic complaint discovery.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('insights')}
            className="px-3.5 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap shadow-2xs text-xs self-start sm:self-auto"
          >
            Go to AI Insights
          </button>
        </div>
      )}

      {/* Filter & Search Controls Bar */}
      <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search problem titles, descriptions, verbatim quotes, or action plans..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <label htmlFor="sort-by-select" className="text-slate-500 font-medium">Sort:</label>
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="score_desc">Priority Score (Highest first)</option>
              <option value="score_asc">Priority Score (Lowest first)</option>
              <option value="occurrences_desc">Customer Occurrences (Volume)</option>
              <option value="recent">Recently Updated</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </span>

          {/* Priority Pill */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical (≥ {thresholds.critical})</option>
            <option value="High">High ({thresholds.high}–{thresholds.critical - 1})</option>
            <option value="Medium">Medium ({thresholds.medium}–{thresholds.high - 1})</option>
            <option value="Low">Low (&lt; {thresholds.medium})</option>
          </select>

          {/* Status Pill */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Under Review">Under Review</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
          </select>

          {/* Category Pill */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800"
          >
            <option value="all">All Categories</option>
            <option value="Operational Issues">Operational Issues</option>
            <option value="Fraud and Scam">Fraud and Scam</option>
            <option value="Customer Service">Customer Service</option>
            <option value="Product Feedback">Product Feedback</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2 ml-auto"
            >
              Clear filters
            </button>
          )}

          <span className="text-[11px] text-slate-500 font-mono ml-auto">
            Showing {filteredIssues.length} of {totalIssuesCount} issues
          </span>
        </div>
      </div>

      {/* Prioritized Issue & Recommendation Cards List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-xl text-center space-y-3">
            <Target className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {totalIssuesCount === 0 ? 'No issues identified yet' : 'No matching issues found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {totalIssuesCount === 0
                ? 'Import feedback records or add entries to surface prioritized customer issues.'
                : 'Try adjusting your search query, priority filter, or category settings.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredIssues.map((issue, idx) => {
            const linkedRec = recMap.get(issue.id);
            const dominantCat = issue.categoryDistribution[0]?.category || 'Operational Issues';
            const quotes = issue.representativeExamples;

            // Sentiment stats
            const neg = issue.sentimentDistribution?.Negative || 0;
            const mix = issue.sentimentDistribution?.Mixed || 0;
            const pos = issue.sentimentDistribution?.Positive || 0;
            const totalSent = neg + mix + pos + (issue.sentimentDistribution?.Neutral || 0);

            return (
              <div
                key={issue.id}
                className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Top Card Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityScoreBadge score={issue.priorityScore} band={issue.priorityBand} size="md" />
                      <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                        #{idx + 1} • {issue.id}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        issue.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : issue.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : issue.status === 'Under Review'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : issue.status === 'Dismissed'
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        Status: {issue.status}
                      </span>
                      {linkedRec && (
                        <span className="text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-purple-600" />
                          <span>Action {linkedRec.status}</span>
                        </span>
                      )}
                    </div>

                    <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                      {issue.title}
                    </h2>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>

                  {/* Volume Stats */}
                  <div className="flex sm:flex-col items-end gap-1 text-right shrink-0">
                    <div className="text-xs font-mono tabular-nums text-slate-700">
                      <strong className="text-indigo-700 font-bold text-sm">
                        {issue.occurrenceCount.toLocaleString('en-US')}
                      </strong> occurrences
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {issue.distinctCount} distinct phrasing variations
                    </div>
                    {issue.owner && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <User className="w-3 h-3" />
                        <span>{issue.owner}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verbatim Quote Snippet Preview */}
                {quotes.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Quote className="w-3 h-3 text-indigo-500" />
                      <span>Verbatim Customer Statement Evidence</span>
                    </div>
                    <blockquote className="p-3 bg-slate-50 border-l-3 border-indigo-500 text-xs text-slate-800 italic rounded-r-lg">
                      &ldquo;{quotes[0]}&rdquo;
                    </blockquote>
                  </div>
                )}

                {/* Two-Column Remediation Action & Impact Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Category & Sentiment Profile */}
                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                        Source Category & Sentiment
                      </span>
                      <span className="text-[11px] font-medium text-slate-600">
                        {dominantCat}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {issue.categoryDistribution.map(cd => (
                        <span
                          key={cd.category}
                          className="text-[10px] font-mono font-medium bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700"
                        >
                          {cd.category}: {cd.count} ({cd.percentage}%)
                        </span>
                      ))}
                    </div>

                    {totalSent > 0 && (
                      <div className="text-[11px] text-slate-600 flex items-center gap-2 pt-1 border-t border-slate-200/60">
                        <span>Dissatisfaction:</span>
                        <strong className="text-rose-600 font-mono">
                          {Math.round(((neg + mix) / totalSent) * 100)}%
                        </strong>
                        <span className="text-slate-400">({neg} Negative, {mix} Mixed of {totalSent})</span>
                      </div>
                    )}
                  </div>

                  {/* Proposed Action Box */}
                  <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-950 text-[11px] uppercase tracking-wider flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Recommended Remediation</span>
                      </span>
                      {linkedRec && (
                        <span className="text-[10px] font-medium text-indigo-600 capitalize">
                          {linkedRec.generationMethod.replace('-', ' ')}
                        </span>
                      )}
                    </div>

                    <p className="text-indigo-900 leading-relaxed text-[11px]">
                      {linkedRec ? linkedRec.actionTitle : issue.suggestedNextAction}
                    </p>

                    {linkedRec && (
                      <p className="text-indigo-800/80 text-[10px] italic">
                        Outcome: {linkedRec.expectedOperationalOutcome}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <button
                      onClick={() => onInspectText(quotes[0] || issue.title)}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Inspect Raw Records</span>
                    </button>
                    {issue.dueDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Due: {issue.dueDate}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedIssueForDetail(issue)}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      Explain Priority & Evidence
                    </button>

                    {linkedRec && (
                      <button
                        onClick={() => setSelectedRecForAction({ rec: linkedRec, issue })}
                        className="px-3.5 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs flex items-center gap-1.5"
                      >
                        <span>Action Plan ({linkedRec.status})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Issue Detail & Explainability Modal */}
      <IssueDetailModal
        issue={selectedIssueForDetail}
        notes={notes}
        statusHistory={statusHistory}
        isOpen={Boolean(selectedIssueForDetail)}
        onClose={() => setSelectedIssueForDetail(null)}
        onUpdateStatus={onUpdateStatus}
        onUpdateDetails={onUpdateDetails}
        onAddNote={onAddNote}
        onDeleteNote={onDeleteNote}
        onInspectText={onInspectText}
      />

      {/* Recommendation Action Modal */}
      <RecommendationActionModal
        recommendation={selectedRecForAction?.rec || null}
        issue={selectedRecForAction?.issue || null}
        isOpen={Boolean(selectedRecForAction)}
        onClose={() => setSelectedRecForAction(null)}
        onUpdateStatus={onUpdateRecommendationStatus}
        onRegenerateAi={handleRegenerateAi}
        onInspectText={onInspectText}
      />

      {/* Category Relevance & Thresholds Config Modal */}
      <CategoryRelevanceModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={categoryConfig}
        thresholds={thresholds}
        onSaveConfig={(newConfig, newThresholds) => {
          onUpdateCategoryConfig(newConfig);
          onUpdatePriorityThresholds(newThresholds);
        }}
      />
    </div>
  );
}
