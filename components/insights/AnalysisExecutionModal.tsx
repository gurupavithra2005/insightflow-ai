'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Brain,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Layers,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { FeedbackRecord, AggregateInsights, AnalysisRunRecord } from '../../types/feedback';
import {
  executeFeedbackAnalysisPipeline,
  ProgressCallbackData,
  groupRecordsForAnalysis,
} from '../../services/aiAnalysisService';

interface AnalysisExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: FeedbackRecord[];
  datasetName: string;
  onAnalysisSuccess: (
    updatedRecords: FeedbackRecord[],
    insights: AggregateInsights,
    runMeta: AnalysisRunRecord
  ) => void;
}

export function AnalysisExecutionModal({
  isOpen,
  onClose,
  records,
  datasetName,
  onAnalysisSuccess,
}: AnalysisExecutionModalProps) {
  const [provider, setProvider] = useState<'gemini-3.8-flash' | 'baseline-rules'>('gemini-3.8-flash');
  const [isGeminiConfigured, setIsGeminiConfigured] = useState<boolean | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<ProgressCallbackData>({
    status: 'idle',
    message: '',
    completedWorkload: 0,
    totalWorkload: 0,
    percentage: 0,
    currentBatch: 0,
    totalBatches: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Group stats
  const uniqueGroups = React.useMemo(() => groupRecordsForAnalysis(records), [records]);

  // Check server-side Gemini key status when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetch('/api/analyze/status')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        const hasGemini = Boolean(data.configured);
        setIsGeminiConfigured(hasGemini);
        setProvider(hasGemini ? 'gemini-3.8-flash' : 'baseline-rules');
        setIsCheckingStatus(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsGeminiConfigured(false);
        setProvider('baseline-rules');
        setIsCheckingStatus(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartAnalysis = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setErrorMsg(null);

    try {
      const { updatedRecords, insights, runMeta } = await executeFeedbackAnalysisPipeline(
        records,
        datasetName,
        provider,
        prog => {
          setProgress(prog);
        }
      );

      onAnalysisSuccess(updatedRecords, insights, runMeta);
      setTimeout(() => {
        setIsRunning(false);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Analysis execution failed:', err);
      setIsRunning(false);
      setErrorMsg(err.message || 'An unexpected error occurred during analysis.');
      setProgress(prev => ({
        ...prev,
        status: 'failed',
        message: 'Analysis stopped due to an error.',
      }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-modal-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 id="analysis-modal-title" className="text-base font-semibold text-slate-900">
                Run Feedback Intelligence Engine
              </h2>
              <p className="text-xs text-slate-500">
                Perform sentiment analysis, semantic topic discovery, and recurring complaint extraction.
              </p>
            </div>
          </div>
          {!isRunning && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Workload Profile Summary */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">Target Dataset:</span>
              <span className="font-medium text-slate-900">{datasetName}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
              <div>
                <span className="text-slate-500 block">Total Feedback Occurrences</span>
                <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                  {records.length.toLocaleString('en-US')} rows
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Distinct Feedback Statements</span>
                <span className="text-base font-bold text-indigo-700 font-mono tabular-nums">
                  {uniqueGroups.length.toLocaleString('en-US')} unique
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              <strong>Pipeline Optimization:</strong> De-duplicates identical reviews for batch inference ({uniqueGroups.length} statements), then maps validated findings back to all {records.length.toLocaleString('en-US')} occurrences without dropping occurrence counts.
            </p>
          </div>

          {/* Model / Provider Selector */}
          {!isRunning && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Select Analysis Engine
              </label>

              {/* Option 1: Gemini 3.8 Flash */}
              <div
                onClick={() => {
                  if (isGeminiConfigured) setProvider('gemini-3.8-flash');
                }}
                className={`p-3.5 rounded-xl border transition-all ${
                  !isGeminiConfigured
                    ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                    : provider === 'gemini-3.8-flash'
                    ? 'bg-indigo-50/50 border-indigo-400 ring-1 ring-indigo-400 cursor-pointer'
                    : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-900">
                      Gemini 3.8 Flash (AI Model)
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="provider"
                    checked={provider === 'gemini-3.8-flash'}
                    disabled={!isGeminiConfigured}
                    onChange={() => setProvider('gemini-3.8-flash')}
                    className="text-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Deep generative analysis for nuanced sentiment (Positive/Neutral/Negative/Mixed), semantic topic clustering, and exact quotation extraction.
                </p>
                {!isGeminiConfigured && !isCheckingStatus && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>GEMINI_API_KEY not detected in server environment. Use Baseline mode below.</span>
                  </div>
                )}
              </div>

              {/* Option 2: Transparent Rule Baseline */}
              <div
                onClick={() => setProvider('baseline-rules')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  provider === 'baseline-rules'
                    ? 'bg-indigo-50/50 border-indigo-400 ring-1 ring-indigo-400'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-semibold text-slate-900">
                      Transparent Baseline (Heuristic Lexicon)
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="provider"
                    checked={provider === 'baseline-rules'}
                    onChange={() => setProvider('baseline-rules')}
                    className="text-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Deterministic keyword and category rules. High-speed evaluation, zero model latency, and clearly documented as non-AI baseline findings.
                </p>
              </div>
            </div>
          )}

          {/* Running Progress Bar */}
          {isRunning && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Processing Analysis Pipeline...</span>
                </span>
                <span className="font-mono tabular-nums font-bold text-indigo-700">
                  {progress.percentage}%
                </span>
              </div>

              {/* Progress bar track */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate max-w-xs">{progress.message}</span>
                {progress.totalBatches > 0 && (
                  <span className="font-mono tabular-nums shrink-0">
                    Batch {progress.currentBatch}/{progress.totalBatches}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Execution Notice</span>
              </div>
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {records.length > 0 && `${records.length.toLocaleString('en-US')} records ready`}
          </div>

          <div className="flex items-center gap-2">
            {!isRunning && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              disabled={isRunning || records.length === 0}
              onClick={handleStartAnalysis}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Analysis Run</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
