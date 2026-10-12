'use client';

import React, { useState } from 'react';
import {
  RecommendationRecord,
  RecommendationStatus,
  IssueRecord,
} from '../../types/feedback';
import {
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  Ban,
  ArrowRight,
  Quote,
  ShieldCheck,
  RotateCw,
  Target,
  FileText,
} from 'lucide-react';

interface RecommendationActionModalProps {
  recommendation: RecommendationRecord | null;
  issue: IssueRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (recId: string, status: RecommendationStatus, userNotes?: string) => void;
  onRegenerateAi?: (issue: IssueRecord) => Promise<void>;
  onInspectText: (text: string) => void;
}

export function RecommendationActionModal({
  recommendation,
  issue,
  isOpen,
  onClose,
  onUpdateStatus,
  onRegenerateAi,
  onInspectText,
}: RecommendationActionModalProps) {
  const [userNotes, setUserNotes] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!isOpen || !recommendation) return null;

  const handleStatusChange = (nextStatus: RecommendationStatus) => {
    onUpdateStatus(recommendation.id, nextStatus, userNotes || undefined);
    onClose();
  };

  const handleRegenerate = async () => {
    if (!issue || !onRegenerateAi) return;
    setIsRegenerating(true);
    try {
      await onRegenerateAi(issue);
    } finally {
      setIsRegenerating(false);
    }
  };

  const isAi = recommendation.generationMethod === 'gemini-3.8-flash';

  const statusConfig = {
    Proposed: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    Approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'In Progress': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    Implemented: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    Dismissed: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  }[recommendation.status] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                {recommendation.status}
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded border flex items-center gap-1 ${
                isAi ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {isAi ? <Sparkles className="w-3 h-3 text-purple-600" /> : <Target className="w-3 h-3 text-slate-500" />}
                <span>{isAi ? 'Gemini 3.8 Flash AI Model' : 'Deterministic Rule Engine'}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {recommendation.id}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
              {recommendation.actionTitle}
            </h2>
            <p className="text-xs text-slate-500">
              Linked Issue: <strong className="text-slate-800">{recommendation.issueTitle}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* Action Description */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Remediation Action Plan
            </h3>
            <p className="text-slate-700 leading-relaxed text-xs">
              {recommendation.actionDescription}
            </p>
          </div>

          {/* Qualitative Outcome & Reason Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Expected Operational Outcome</span>
              </span>
              <p className="text-emerald-900 leading-relaxed text-xs">
                {recommendation.expectedOperationalOutcome}
              </p>
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>Strategic Rationale</span>
              </span>
              <p className="text-indigo-900 leading-relaxed text-xs">
                {recommendation.reason}
              </p>
            </div>
          </div>

          {/* Immediate Next Step */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl flex items-start gap-2.5">
            <ArrowRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-950">Recommended Immediate Next Step:</span>
              <p className="text-blue-900 mt-0.5 leading-relaxed">
                {recommendation.recommendedNextStep}
              </p>
            </div>
          </div>

          {/* Supporting Evidence Quotes */}
          {recommendation.supportingQuotes.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <Quote className="w-3.5 h-3.5 text-indigo-500" />
                <span>Supporting Feedback Verbatim Evidence</span>
              </h3>
              <div className="space-y-2">
                {recommendation.supportingQuotes.map((q, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                    <blockquote className="text-slate-800 italic border-l-2 border-indigo-500 pl-2.5 text-xs line-clamp-2">
                      &ldquo;{q}&rdquo;
                    </blockquote>
                    <button
                      onClick={() => onInspectText(q)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] shrink-0"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uncertainty or Confidence Information */}
          <div className="p-3 bg-slate-100/70 border border-slate-200/80 rounded-xl text-slate-600 text-[11px] leading-relaxed">
            <strong className="text-slate-800">Confidence & Uncertainty Profile:</strong> {recommendation.confidenceOrUncertainty}
          </div>

          {/* Team Implementation Notes */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Implementation Notes / Decision Justification
            </label>
            <textarea
              rows={2}
              placeholder="Add internal notes about stakeholder approval, rollout milestones, or reason for dismissal..."
              value={userNotes || recommendation.userNotes || ''}
              onChange={e => setUserNotes(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {onRegenerateAi && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>{isRegenerating ? 'Synthesizing...' : 'Re-synthesize with AI'}</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {recommendation.status !== 'Dismissed' && (
              <button
                onClick={() => handleStatusChange('Dismissed')}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors font-medium"
                title="Dismiss recommendation (retains audit log, does not delete source feedback)"
              >
                Dismiss
              </button>
            )}

            {recommendation.status !== 'Approved' && (
              <button
                onClick={() => handleStatusChange('Approved')}
                className="px-3.5 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-2xs transition-colors"
              >
                Approve Action
              </button>
            )}

            {recommendation.status === 'Approved' && (
              <button
                onClick={() => handleStatusChange('In Progress')}
                className="px-3.5 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-2xs transition-colors"
              >
                Mark In Progress
              </button>
            )}

            {recommendation.status === 'In Progress' && (
              <button
                onClick={() => handleStatusChange('Implemented')}
                className="px-3.5 py-1.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 shadow-2xs transition-colors"
              >
                Mark Implemented
              </button>
            )}

            {recommendation.status === 'Dismissed' && (
              <button
                onClick={() => handleStatusChange('Proposed')}
                className="px-3.5 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-2xs transition-colors"
              >
                Restore to Proposed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
