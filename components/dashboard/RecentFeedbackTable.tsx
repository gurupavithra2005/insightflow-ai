'use client';

import React from 'react';
import { Eye, ArrowRight } from 'lucide-react';
import { FeedbackRecord } from '../../types/feedback';
import { formatDisplayDate } from '../../lib/dateUtils';

interface RecentFeedbackTableProps {
  records: FeedbackRecord[];
  onInspect: (record: FeedbackRecord) => void;
  onViewAll: () => void;
}

export function RecentFeedbackTable({ records, onInspect, onViewAll }: RecentFeedbackTableProps) {
  // Show first 6 recent records
  const recentRecords = records.slice(0, 6);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Recent Feedback Submissions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Latest customer feedback entries loaded in the workspace
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <span>Open Explorer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recentRecords.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          No feedback entries recorded in the active workspace.
        </div>
      ) : (
        <div className="border border-slate-200/80 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Feedback Review</th>
                <th className="py-2.5 px-3 w-40">Category</th>
                <th className="py-2.5 px-3 w-32">Recorded Date</th>
                <th className="py-2.5 px-3 w-28">Sentiment</th>
                <th className="py-2.5 px-3 w-20 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentRecords.map(record => {
                const dateDisplay = formatDisplayDate(record.createdAt);

                return (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-2.5 px-3 text-slate-800">
                      <p className="truncate max-w-md font-normal" title={record.text}>
                        {record.text}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                      {record.category}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {dateDisplay}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 italic text-[11px] whitespace-nowrap">
                      Unanalyzed (P2)
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onInspect(record)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-indigo-600 px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 transition-colors"
                        title="Inspect full text"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
