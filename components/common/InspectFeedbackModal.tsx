'use client';

import React from 'react';
import { X, Copy, Check, Repeat, Tag, Calendar, Database, Sparkles, Brain, Quote, AlertCircle } from 'lucide-react';
import { FeedbackRecord } from '../../types/feedback';
import { formatDisplayDateTime } from '../../lib/dateUtils';

interface InspectFeedbackModalProps {
  record: FeedbackRecord | null;
  occurrencesInDataset: number;
  onClose: () => void;
}

export function InspectFeedbackModal({
  record,
  occurrencesInDataset,
  onClose,
}: InspectFeedbackModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!record) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(record.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = record.createdAt
    ? formatDisplayDateTime(record.createdAt)
    : 'Not provided in dataset (Bulk CSV imported)';

  const a = record.analysis;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspect-feedback-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <h2 id="inspect-feedback-title" className="text-base font-semibold text-slate-900">
              Feedback Record Details
            </h2>
            <span className="text-xs font-mono text-slate-400">ID: {record.id.slice(0, 16)}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Feedback Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Customer Statement
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-wrap selection:bg-indigo-100">
              {record.text}
            </div>
          </div>

          {/* AI Analysis Intelligence Section */}
          {a && a.status === 'completed' ? (
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>AI Analytical Intelligence</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-indigo-800 border border-indigo-200 font-semibold">
                  {a.method === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Baseline Lexicon'}
                </span>
              </div>

              {/* Sentiment & Topic badges */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                  <span className="text-[11px] text-slate-500 block">Classified Sentiment</span>
                  <div className="flex items-center gap-1.5 font-bold mt-0.5">
                    <span
                      className={`${
                        a.sentiment === 'Positive'
                          ? 'text-emerald-700'
                          : a.sentiment === 'Negative'
                          ? 'text-rose-700'
                          : a.sentiment === 'Mixed'
                          ? 'text-amber-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {a.sentiment}
                    </span>
                    <span className="text-slate-400 font-mono font-normal text-[11px]">
                      ({Math.round(a.confidence * 100)}% conf)
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                  <span className="text-[11px] text-slate-500 block">Discovered Topic</span>
                  <span className="font-bold text-slate-900 block truncate mt-0.5" title={a.topicLabel}>
                    {a.topicLabel}
                  </span>
                </div>
              </div>

              {/* Rationale */}
              <div className="text-xs text-slate-700 space-y-1">
                <span className="font-semibold text-slate-900 block">Analytical Rationale:</span>
                <p className="leading-relaxed text-[11px] bg-white p-2.5 rounded border border-indigo-100">
                  {a.explanation}
                </p>
              </div>

              {/* Evidence Quote */}
              {a.evidenceQuote && (
                <div className="text-xs text-slate-700 space-y-1">
                  <span className="font-semibold text-slate-900 block">Traceable Quotation Evidence:</span>
                  <p className="leading-relaxed text-[11px] italic bg-white p-2.5 rounded border border-indigo-100 text-indigo-900">
                    &ldquo;{a.evidenceQuote}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <Brain className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Awaiting AI sentiment and topic analysis. Run the analysis engine to classify.</span>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200/80 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-medium">Category</span>
              </div>
              <div className="font-semibold text-slate-800">{record.category}</div>
            </div>

            <div className="p-3 bg-white border border-slate-200/80 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Repeat className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-medium">Exact Recurrence</span>
              </div>
              <div className="font-semibold text-slate-800 tabular-nums">
                {occurrencesInDataset}{' '}
                <span className="text-slate-500 font-normal">
                  {occurrencesInDataset === 1 ? 'occurrence' : 'occurrences in active dataset'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200/80 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Database className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-medium">Ingestion Source</span>
              </div>
              <div className="font-semibold text-slate-800 capitalize">
                {record.source === 'demo' ? 'Synthetic Demo Dataset' : record.source === 'import' ? 'CSV Import' : 'Manual Entry'}
                {record.rowNumber ? ` (Row #${record.rowNumber})` : ''}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200/80 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-medium">Recorded Date</span>
              </div>
              <div className="font-medium text-slate-700 truncate" title={formattedDate}>
                {formattedDate}
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Data Integrity Note:</span> Exact duplicate feedback texts represent distinct customer complaints submitted across sessions. InsightFlow preserves raw occurrence volume rather than pruning repeated records.
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
