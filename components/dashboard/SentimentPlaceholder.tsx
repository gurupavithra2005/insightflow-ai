'use client';

import React from 'react';
import { Sparkles, Brain, ArrowUpRight } from 'lucide-react';

interface SentimentPlaceholderProps {
  onNavigateInsights?: () => void;
}

export function SentimentPlaceholder({ onNavigateInsights }: SentimentPlaceholderProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Customer Sentiment Analysis
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Phase 2 Ready
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
            Automated sentiment breakdown, emotional polarity, and frustration detection will become available once the Phase 2 AI engine is triggered.
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[11px]">Zero hallucinated scores policy</span>
        {onNavigateInsights && (
          <button
            onClick={onNavigateInsights}
            className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800 transition-colors text-[11px]"
          >
            <span>Preview AI Insights Schema</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
