'use client';

import React from 'react';
import { ArrowRight, Check, Clock } from 'lucide-react';

interface WorkflowProgressProps {
  currentStage?: 'collect' | 'organize' | 'analyze' | 'prioritize' | 'act';
}

export function WorkflowProgress({ currentStage = 'prioritize' }: WorkflowProgressProps) {
  const stages = [
    {
      id: 'collect',
      name: 'Collect',
      desc: 'Ingest raw feedback & CSV data',
      status: 'active',
      phase: 'Phase 1 Complete',
    },
    {
      id: 'organize',
      name: 'Organize',
      desc: 'Categorize & identify recurrences',
      status: 'active',
      phase: 'Phase 1 Complete',
    },
    {
      id: 'analyze',
      name: 'Analyze',
      desc: 'Sentiment, confidence & topics',
      status: 'active',
      phase: 'Phase 2 Complete',
    },
    {
      id: 'prioritize',
      name: 'Prioritize',
      desc: 'Explainable 5-factor priority score',
      status: 'active',
      phase: 'Phase 3 Complete',
    },
    {
      id: 'act',
      name: 'Act',
      desc: 'Evidence-backed recommendations, issues & exports',
      status: 'active',
      phase: 'Phase 4 & 5 Complete',
    },
  ];

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold text-indigo-600 tracking-wider uppercase">
            Product Architecture & Decision Pipeline
          </span>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent progression from raw reviews to verified business decisions (Phases 1–6 Complete).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" /> Full Decision Suite Ready
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-1 items-stretch">
        {stages.map((stage, idx) => {
          return (
            <div
              key={stage.id}
              className="relative flex flex-col p-2.5 rounded-lg border transition-colors bg-emerald-50/50 border-emerald-200/80"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-emerald-900">
                  {idx + 1}. {stage.name}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  {stage.phase}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">{stage.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
