'use client';

import React from 'react';
import { ArrowRight, Check, Clock } from 'lucide-react';

interface WorkflowProgressProps {
  currentStage?: 'collect' | 'organize' | 'analyze' | 'prioritize' | 'act';
  recordsCount?: number;
  analyzedCount?: number;
  uniqueCount?: number;
  issuesCount?: number;
}

export function WorkflowProgress({
  currentStage = 'prioritize',
  recordsCount = 0,
  analyzedCount = 0,
  uniqueCount = 0,
  issuesCount = 0,
}: WorkflowProgressProps) {
  const isAnalyzed = analyzedCount > 0;

  const stages = [
    {
      id: 'collect',
      name: 'Collect',
      desc: recordsCount > 0 ? `${recordsCount.toLocaleString('en-US')} records ingested & validated` : 'Ingest raw feedback & CSV data',
      status: recordsCount > 0 ? 'Verified Active' : 'Awaiting Data',
      isComplete: recordsCount > 0,
    },
    {
      id: 'organize',
      name: 'Organize',
      desc: uniqueCount > 0 ? `${uniqueCount.toLocaleString('en-US')} distinct statements mapped` : 'Categorize & identify recurrences',
      status: 'Verified Active',
      isComplete: true,
    },
    {
      id: 'analyze',
      name: 'Analyze',
      desc: isAnalyzed ? `${analyzedCount.toLocaleString('en-US')} records analyzed (sentiment & topics)` : 'Awaiting analysis pipeline execution',
      status: isAnalyzed ? 'Analyzed' : 'Awaiting Analysis',
      isComplete: isAnalyzed,
    },
    {
      id: 'prioritize',
      name: 'Prioritize',
      desc: issuesCount > 0 ? `${issuesCount} prioritized problem themes scored` : 'Explainable 5-factor priority score',
      status: 'Verified Active',
      isComplete: true,
    },
    {
      id: 'act',
      name: 'Act',
      desc: 'Evidence-backed recommendations, issues & exports',
      status: 'Verified Active',
      isComplete: true,
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
            Transparent progression from raw reviews to verified business decisions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
          <span className="inline-flex items-center gap-1 font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            {isAnalyzed ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Full Intelligence Active</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Recurrence Engine Active (Analysis Pending)</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-1 items-stretch">
        {stages.map((stage, idx) => {
          return (
            <div
              key={stage.id}
              className={`relative flex flex-col p-2.5 rounded-lg border transition-colors ${
                stage.isComplete
                  ? 'bg-emerald-50/50 border-emerald-200/80'
                  : 'bg-slate-50/70 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-xs font-bold ${stage.isComplete ? 'text-emerald-900' : 'text-slate-800'}`}>
                  {idx + 1}. {stage.name}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                    stage.isComplete
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {stage.status}
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
