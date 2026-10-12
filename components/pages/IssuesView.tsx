'use client';

import React, { useState, useMemo } from 'react';
import {
  DatasetMetrics,
  FeedbackRecord,
  IssueRecord,
  IssueStatus,
  IssueNote,
  IssueStatusHistory,
  PriorityBand,
  VALID_ISSUE_STATUSES,
} from '../../types/feedback';
import { PriorityScoreBadge } from '../common/PriorityScoreBadge';
import { IssueDetailModal } from '../issues/IssueDetailModal';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Tag,
  ExternalLink,
  Search,
  Filter,
  User,
  Calendar,
  Layers,
  FileText,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
  RotateCw,
} from 'lucide-react';

interface IssuesViewProps {
  metrics: DatasetMetrics;
  records: FeedbackRecord[];
  issues: IssueRecord[];
  notes: IssueNote[];
  statusHistory: IssueStatusHistory[];
  onUpdateStatus: (issueId: string, status: IssueStatus, actor?: string, reason?: string) => void;
  onUpdateDetails: (issueId: string, updates: { owner?: string; dueDate?: string; suggestedNextAction?: string }) => void;
  onAddNote: (issueId: string, note: string, author?: string) => void;
  onDeleteNote: (noteId: string) => void;
  onInspectText: (text: string) => void;
  onRecalculateIssues?: () => void;
}

export function IssuesView({
  metrics,
  records,
  issues,
  notes,
  statusHistory,
  onUpdateStatus,
  onUpdateDetails,
  onAddNote,
  onDeleteNote,
  onInspectText,
  onRecalculateIssues,
}: IssuesViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'priority_desc' | 'priority_asc' | 'recent' | 'occurrences'>('priority_desc');
  const [selectedIssueForDetail, setSelectedIssueForDetail] = useState<IssueRecord | null>(null);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: issues.length,
      Open: 0,
      'Under Review': 0,
      'In Progress': 0,
      Resolved: 0,
      Dismissed: 0,
    };
    issues.forEach(i => {
      if (counts[i.status] !== undefined) counts[i.status]++;
    });
    return counts;
  }, [issues]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
      if (filterPriority !== 'all' && issue.priorityBand !== filterPriority) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(q);
        const matchesDesc = issue.description.toLowerCase().includes(q);
        const matchesOwner = (issue.owner || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesOwner) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'priority_desc') return b.priorityScore - a.priorityScore;
      if (sortBy === 'priority_asc') return a.priorityScore - b.priorityScore;
      if (sortBy === 'occurrences') return b.occurrenceCount - a.occurrenceCount;
      if (sortBy === 'recent') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return b.priorityScore - a.priorityScore;
    });
  }, [issues, filterStatus, filterPriority, searchQuery, sortBy]);

  const handleQuickAdvance = (issue: IssueRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const transitions: Record<IssueStatus, IssueStatus> = {
      Open: 'Under Review',
      'Under Review': 'In Progress',
      'In Progress': 'Resolved',
      Resolved: 'Open',
      Dismissed: 'Open',
    };
    const next = transitions[issue.status] || 'Open';
    onUpdateStatus(issue.id, next, 'User', `Quick advanced status to ${next}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Issue Tracker & Lifecycle Management
            </h1>
            <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              {issues.length} Identified Issues
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor, assign owners, track due dates, review customer evidence, and advance remediation status.
          </p>
        </div>

        {onRecalculateIssues && (
          <button
            onClick={onRecalculateIssues}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 shadow-2xs transition-colors self-start sm:self-auto"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sync Issues</span>
          </button>
        )}
      </div>

      {/* Status Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-xl text-xs w-fit">
        {(['all', ...VALID_ISSUE_STATUSES] as const).map(st => {
          const count = statusCounts[st] || 0;
          const isActive = filterStatus === st;
          return (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{st === 'all' ? 'All Issues' : st}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search issue title, description, or assigned owner..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Priority:</span>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 shadow-2xs"
            >
              <option value="all">All Bands</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 shadow-2xs"
            >
              <option value="priority_desc">Priority (High to Low)</option>
              <option value="priority_asc">Priority (Low to High)</option>
              <option value="occurrences">Occurrences</option>
              <option value="recent">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <AlertCircle className="w-6 h-6 text-slate-300 mx-auto" />
            <p className="font-medium text-slate-600">No issues matching current status or filter criteria.</p>
            <p className="text-[11px]">Adjust your filter options or select &quot;All Issues&quot;.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4 min-w-[280px]">Problem Theme / Friction Title</th>
                  <th className="py-3 px-3 w-32">Priority</th>
                  <th className="py-3 px-3 w-36">Affected Category</th>
                  <th className="py-3 px-3 w-28">Occurrences</th>
                  <th className="py-3 px-3 w-32">Lifecycle Status</th>
                  <th className="py-3 px-3 w-32">Owner & Due</th>
                  <th className="py-3 px-4 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map(issue => {
                  const dominantCat = issue.categoryDistribution[0]?.category || 'Operational Issues';
                  const noteCount = notes.filter(n => n.issueId === issue.id).length;

                  return (
                    <tr
                      key={issue.id}
                      onClick={() => setSelectedIssueForDetail(issue)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Title & Description */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-400 font-medium">
                              {issue.id}
                            </span>
                            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                              {issue.title}
                            </h3>
                          </div>
                          <p className="text-slate-500 text-[11px] line-clamp-1">
                            {issue.description}
                          </p>
                          {noteCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                              <FileText className="w-2.5 h-2.5" />
                              <span>{noteCount} team notes</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Priority Badge */}
                      <td className="py-3 px-3">
                        <PriorityScoreBadge
                          score={issue.priorityScore}
                          band={issue.priorityBand}
                          size="sm"
                        />
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        <span className="inline-block text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {dominantCat}
                        </span>
                      </td>

                      {/* Occurrences & Distinct */}
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-700">
                        <div className="font-bold text-slate-900">
                          {issue.occurrenceCount.toLocaleString('en-US')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {issue.distinctCount} distinct
                        </div>
                      </td>

                      {/* Status Button */}
                      <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={e => handleQuickAdvance(issue, e)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all shadow-2xs hover:opacity-85 ${
                            issue.status === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : issue.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : issue.status === 'Under Review'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : issue.status === 'Dismissed'
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                          title="Click to advance lifecycle status"
                        >
                          {issue.status === 'Resolved' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{issue.status}</span>
                        </button>
                      </td>

                      {/* Owner & Due */}
                      <td className="py-3 px-3 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{issue.owner || 'Unassigned'}</span>
                        </div>
                        {issue.dueDate && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                            <Calendar className="w-2.5 h-2.5 shrink-0" />
                            <span>{issue.dueDate}</span>
                          </div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onInspectText(issue.representativeExamples[0] || issue.title)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                            title="Inspect verbatim feedback records"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedIssueForDetail(issue)}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded font-semibold text-[11px] flex items-center gap-0.5 text-indigo-600"
                            title="Open full explainability panel"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
    </div>
  );
}
