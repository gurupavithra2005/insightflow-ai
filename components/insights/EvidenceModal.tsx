'use client';

import React from 'react';
import { X, ExternalLink, Tag, Repeat, Quote, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { FeedbackRecord, FeedbackCategory, SentimentType } from '../../types/feedback';

export interface EvidenceModalData {
  title: string;
  type: 'topic' | 'complaint';
  description: string;
  occurrenceCount: number;
  distinctCount: number;
  categories: { category: FeedbackCategory; count: number }[];
  representativeExamples: string[];
  records: FeedbackRecord[];
}

interface EvidenceModalProps {
  data: EvidenceModalData | null;
  onClose: () => void;
  onViewInExplorer: (filterQuery: string) => void;
  onInspectRecord: (record: FeedbackRecord) => void;
}

export function EvidenceModal({
  data,
  onClose,
  onViewInExplorer,
  onInspectRecord,
}: EvidenceModalProps) {
  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Quote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {data.type === 'topic' ? 'Discovered Topic' : 'Common Complaint'}
                </span>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {data.occurrenceCount.toLocaleString('en-US')} total occurrences
                </span>
              </div>
              <h2 id="evidence-modal-title" className="text-base font-bold text-slate-900 mt-0.5">
                {data.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Explanation */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Analytical Explanation
            </h3>
            <p className="text-xs text-slate-800 leading-relaxed">{data.description}</p>
          </div>

          {/* Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 block">Total Occurrences</span>
              <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {data.occurrenceCount.toLocaleString('en-US')}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 block">Distinct Wordings</span>
              <span className="text-lg font-bold text-indigo-700 font-mono tabular-nums">
                {data.distinctCount.toLocaleString('en-US')}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 block">Associated Categories</span>
              <span className="text-xs font-semibold text-slate-800 block truncate">
                {data.categories.map(c => c.category).join(', ')}
              </span>
            </div>
          </div>

          {/* Representative Quotations & Verbatim Proof */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Verbatim Customer Feedback Evidence ({data.records.length} Sample Matches)
              </h3>
              <span className="text-[11px] text-slate-400">Exact source text preserved</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {data.records.slice(0, 15).map(record => (
                <div
                  key={record.id}
                  onClick={() => onInspectRecord(record)}
                  className="p-3.5 bg-white border border-slate-200/90 hover:border-indigo-300 rounded-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{record.category}</span>
                      {record.analysis && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span
                            className={`font-semibold ${
                              record.analysis.sentiment === 'Positive'
                                ? 'text-emerald-700'
                                : record.analysis.sentiment === 'Negative'
                                ? 'text-rose-700'
                                : record.analysis.sentiment === 'Mixed'
                                ? 'text-amber-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {record.analysis.sentiment} ({Math.round(record.analysis.confidence * 100)}%)
                          </span>
                        </>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      ID: {record.id.slice(0, 12)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed italic group-hover:text-indigo-950 transition-colors">
                    &ldquo;{record.text}&rdquo;
                  </p>
                  {record.analysis?.evidenceQuote && (
                    <div className="mt-2 text-[11px] text-indigo-700 bg-indigo-50/60 p-2 rounded border border-indigo-100 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-indigo-600 mt-0.5" />
                      <span>
                        <strong>Key Excerpt:</strong> &ldquo;{record.analysis.evidenceQuote}&rdquo;
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Click any row to open record details
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewInExplorer(data.title);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
            >
              <span>Explore In Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
