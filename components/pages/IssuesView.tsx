'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Plus, Tag, ExternalLink } from 'lucide-react';
import { DatasetMetrics, FeedbackRecord } from '../../types/feedback';

interface IssuesViewProps {
  metrics: DatasetMetrics;
  records: FeedbackRecord[];
  onInspectText: (text: string) => void;
}

interface TrackedIssue {
  id: string;
  title: string;
  category: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  severity: 'Critical' | 'High' | 'Medium';
  affectedCount: number;
  dateCreated: string;
}

export function IssuesView({ metrics, records, onInspectText }: IssuesViewProps) {
  // Initialize sample tracked issues from the real top recurring dataset entries
  const [issues, setIssues] = useState<TrackedIssue[]>(() => {
    return metrics.topRecurring.slice(0, 4).map((rec, i) => ({
      id: `issue-${i + 1}`,
      title: rec.text,
      category: rec.category,
      status: i === 0 ? 'In Progress' : 'Open',
      severity: rec.category === 'Fraud and Scam' ? 'Critical' : rec.count > 5 ? 'High' : 'Medium',
      affectedCount: rec.count,
      dateCreated: '2026-01-01T00:00:00.000Z',
    }));
  });

  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredIssues = issues.filter(issue => {
    if (filterStatus === 'all') return true;
    return issue.status === filterStatus;
  });

  const toggleStatus = (id: string) => {
    setIssues(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextStatus: Record<string, 'Open' | 'In Progress' | 'Resolved'> = {
            Open: 'In Progress',
            'In Progress': 'Resolved',
            Resolved: 'Open',
          };
          return { ...item, status: nextStatus[item.status] };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Issue Tracker & Remediation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor, track triage lifecycle, and verify resolution of customer-reported issues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {issues.length} tracked items
          </span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg w-fit text-xs">
        {['all', 'Open', 'In Progress', 'Resolved'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              filterStatus === st
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {st === 'all' ? 'All Issues' : st}
          </button>
        ))}
      </div>

      {/* Issues Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No issues matching the selected status.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Issue Description / Identified Friction</th>
                  <th className="py-3 px-3 w-36">Category</th>
                  <th className="py-3 px-3 w-28">Severity</th>
                  <th className="py-3 px-3 w-28">Affected Rows</th>
                  <th className="py-3 px-3 w-32">Status</th>
                  <th className="py-3 px-3 w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map(issue => (
                  <tr key={issue.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-900">
                      <p className="line-clamp-2 font-normal leading-relaxed text-slate-800">
                        {issue.title}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {issue.category}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          issue.severity === 'Critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : issue.severity === 'High'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-slate-700 font-medium">
                      {issue.affectedCount} reports
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => toggleStatus(issue.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border cursor-pointer hover:opacity-80 transition-opacity ${
                          issue.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : issue.status === 'In Progress'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                        title="Click to advance status"
                      >
                        {issue.status === 'Resolved' ? (
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{issue.status}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onInspectText(issue.title)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 p-1"
                        title="Inspect evidence text"
                      >
                        <span>Evidence</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
