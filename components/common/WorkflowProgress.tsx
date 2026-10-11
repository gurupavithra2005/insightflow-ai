'use client';

import React from 'react';
import { ArrowRight, Check, Clock } from 'lucide-react';

interface WorkflowProgressProps {
  currentStage?: 'collect' | 'organize' | 'analyze' | 'prioritize' | 'act';
}

export function WorkflowProgress({ currentStage = 'organize' }: WorkflowProgressProps) {
  const stages = [
    {
      id: 'collect',
      name: 'Collect',
      desc: 'Ingest raw feedback & CSV data',
      status: 'active', // Phase 1 active
      phase: 'Phase 1',
    },
    {
      id: 'organize',
      name: 'Organize',
      desc: 'Categorize & identify recurrences',
      status: 'active', // Phase 1 active
      phase: 'Phase 1',
    },
    {
      id: 'analyze',
      name: 'Analyze',
      desc: 'Sentiment & semantic themes',
      status: 'planned', // Phase 2
      phase: 'Phase 2',
    },
    {
      id: 'prioritize',
      name: 'Prioritize',
      desc: 'Score severity & customer impact',
      status: 'planned', // Phase 2
      phase: 'Phase 2',
    },
    {
      id: 'act',
      name: 'Act',
      desc: 'Actionable decision recommendations',
      status: 'planned', // Phase 2
      phase: 'Phase 2',
    },
  ];

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold text-indigo-600 tracking-wider uppercase">
            Product Architecture & Workflow Pipeline
          </span>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent progression from raw reviews to verified business decisions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" /> Phase 1 Active
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" /> Phase 2 Planned
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-1 items-stretch">
        {stages.map((stage, idx) => {
          const isPhase1 = stage.status === 'active';
          return (
            <div
              key={stage.id}
              className={`relative flex flex-col p-2.5 rounded-lg border transition-colors ${
                isPhase1
                  ? 'bg-indigo-50/50 border-indigo-200/80'
                  : 'bg-slate-50/60 border-slate-200/60'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className={`text-xs font-bold ${
                    isPhase1 ? 'text-indigo-900' : 'text-slate-600'
                  }`}
                >
                  {idx + 1}. {stage.name}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                    isPhase1
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200/70 text-slate-500'
                  }`}
                >
                  {stage.phase}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">{stage.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
