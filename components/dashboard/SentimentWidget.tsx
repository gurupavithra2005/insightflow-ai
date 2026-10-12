'use client';

import React from 'react';
import { Sparkles, Brain, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { AggregateInsights, SentimentType, VALID_SENTIMENTS } from '../../types/feedback';

interface SentimentWidgetProps {
  insights: AggregateInsights;
  onNavigateInsights: () => void;
  onOpenAnalysisModal?: () => void;
  onFilterSentiment?: (sentiment: SentimentType) => void;
}

const SENTIMENT_STYLES: Record<SentimentType, { label: string; text: string; bg: string; bar: string }> = {
  Positive: { label: 'Positive', text: 'text-emerald-700', bg: 'bg-emerald-50', bar: 'bg-emerald-600' },
  Neutral: { label: 'Neutral', text: 'text-slate-700', bg: 'bg-slate-100', bar: 'bg-slate-500' },
  Negative: { label: 'Negative', text: 'text-rose-700', bg: 'bg-rose-50', bar: 'bg-rose-600' },
  Mixed: { label: 'Mixed', text: 'text-amber-700', bg: 'bg-amber-50', bar: 'bg-amber-600' },
};

export function SentimentWidget({
  insights,
  onNavigateInsights,
  onOpenAnalysisModal,
  onFilterSentiment,
}: SentimentWidgetProps) {
  const isAnalyzed = insights.analyzedRecords > 0;

  if (!isAnalyzed) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Customer Sentiment Analysis
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Awaiting Analysis
              </span>
            </div>
            <Brain className="w-4 h-4 text-slate-400" />
          </div>

          <div className="py-6 px-4 bg-slate-50/70 rounded-lg border border-dashed border-slate-200 text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Sentiment analysis has not been run on this dataset yet.
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              Launch the Phase 2 analysis engine to evaluate customer emotion polarity, detect frustration spikes, and isolate critical complaints.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px]">Zero hallucinated scores policy</span>
          <button
            onClick={() => {
              if (onOpenAnalysisModal) {
                onOpenAnalysisModal();
              } else {
                onNavigateInsights();
              }
            }}
            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors text-[11px] bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200/70"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Launch Analysis Pipeline</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Customer Sentiment Distribution
            </h3>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Analyzed ({insights.coveragePercentage}%)
            </span>
          </div>
          <button
            onClick={onNavigateInsights}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Deep Insights</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stacked Bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex my-3">
          {VALID_SENTIMENTS.map(s => {
            const pct = insights.sentimentPercentages[s];
            if (pct <= 0) return null;
            return (
              <div
                key={s}
                className={`h-full ${SENTIMENT_STYLES[s].bar} transition-all duration-500`}
                style={{ width: `${pct}%` }}
                title={`${s}: ${insights.sentimentCounts[s].toLocaleString('en-US')} (${pct}%)`}
              />
            );
          })}
        </div>

        {/* Sentiment Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {VALID_SENTIMENTS.map(s => {
            const count = insights.sentimentCounts[s];
            const pct = insights.sentimentPercentages[s];
            const st = SENTIMENT_STYLES[s];

            return (
              <div
                key={s}
                onClick={() => onFilterSentiment?.(s)}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group bg-slate-50/50"
              >
                <span className={`text-[11px] font-bold ${st.text} block`}>{s}</span>
                <span className="text-base font-bold text-slate-900 font-mono tabular-nums block mt-0.5">
                  {count.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] text-slate-500">{pct}% share</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
        <span>Click any card to filter Explorer</span>
        <span>Denominator: {insights.analyzedRecords.toLocaleString('en-US')} analyzed rows</span>
      </div>
    </div>
  );
}
