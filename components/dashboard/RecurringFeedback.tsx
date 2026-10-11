'use client';

import React from 'react';
import { Repeat, ExternalLink, Info } from 'lucide-react';
import { DatasetMetrics, FeedbackRecord } from '../../types/feedback';

interface RecurringFeedbackProps {
  metrics: DatasetMetrics;
  onInspectText: (text: string) => void;
}

export function RecurringFeedback({ metrics, onInspectText }: RecurringFeedbackProps) {
  const recurringItems = metrics.topRecurring;

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Most Frequent Recurring Statements
            </h3>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {recurringItems.length} patterns
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Exact matching customer feedback texts repeated across multiple reviews
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md self-start sm:self-auto">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Exact text repetition only · Not semantic clustering</span>
        </div>
      </div>

      {recurringItems.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          No repeated exact feedback texts detected in the current records.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {recurringItems.map((item, idx) => (
            <div
              key={idx}
              className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-slate-800">{item.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-indigo-700 font-medium">
                    {item.count} exact occurrences
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 selection:bg-indigo-100">
                  {item.text}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onInspectText(item.text)}
                className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-md transition-colors"
                title="Inspect in detail"
              >
                <span>Inspect</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
        <strong>Preservation Policy:</strong> Repeated statements are intentional signals of recurring user friction, not duplicated database glitches. Volume is preserved for severity weighting.
      </div>
    </div>
  );
}
