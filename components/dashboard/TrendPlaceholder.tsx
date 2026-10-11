'use client';

import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

export function TrendPlaceholder() {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Temporal Ingestion & Trends
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Timeline Guard
            </span>
          </div>
          <TrendingUp className="w-4 h-4 text-slate-400" />
        </div>

        <div className="py-6 px-4 bg-slate-50/70 rounded-lg border border-dashed border-slate-200 text-center">
          <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-800">
            Time-based trends require feedback dates. This dataset does not currently contain a date column.
          </p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            InsightFlow adheres strictly to data integrity and does not fabricate historical dates or artificial trend slopes.
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Timeline analytics activate when date columns are mapped</span>
        <span>Honest data handling</span>
      </div>
    </div>
  );
}
