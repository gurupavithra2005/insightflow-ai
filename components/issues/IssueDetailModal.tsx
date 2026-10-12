'use client';

import React, { useState } from 'react';
import {
  IssueRecord,
  IssueStatus,
  IssueNote,
  IssueStatusHistory,
  VALID_ISSUE_STATUSES,
} from '../../types/feedback';
import { PriorityScoreBadge } from '../common/PriorityScoreBadge';
import {
  X,
  Target,
  FileText,
  Clock,
  User,
  Calendar,
  Quote,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Send,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface IssueDetailModalProps {
  issue: IssueRecord | null;
  notes: IssueNote[];
  statusHistory: IssueStatusHistory[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (issueId: string, status: IssueStatus, actor?: string, reason?: string) => void;
  onUpdateDetails: (issueId: string, updates: { owner?: string; dueDate?: string; suggestedNextAction?: string }) => void;
  onAddNote: (issueId: string, note: string, author?: string) => void;
  onDeleteNote: (noteId: string) => void;
  onInspectText: (text: string) => void;
}

export function IssueDetailModal({
  issue,
  notes,
  statusHistory,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateDetails,
  onAddNote,
  onDeleteNote,
  onInspectText,
}: IssueDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'explainability' | 'evidence' | 'notes' | 'history'>('explainability');
  const [newNoteText, setNewNoteText] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('Analyst');
  const [ownerInput, setOwnerInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [showStatusPrompt, setShowStatusPrompt] = useState<IssueStatus | null>(null);

  if (!isOpen || !issue) return null;

  const issueNotes = notes.filter(n => n.issueId === issue.id);
  const issueHistory = statusHistory.filter(h => h.issueId === issue.id);
  const exp = issue.priorityExplanation;

  const handleSaveDetails = () => {
    onUpdateDetails(issue.id, {
      owner: ownerInput.trim() || undefined,
      dueDate: dueDateInput || undefined,
    });
    setIsEditingDetails(false);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(issue.id, newNoteText, noteAuthor);
    setNewNoteText('');
  };

  const handleStatusSelect = (nextStatus: IssueStatus) => {
    if (nextStatus === issue.status) return;
    setShowStatusPrompt(nextStatus);
  };

  const confirmStatusChange = () => {
    if (!showStatusPrompt) return;
    onUpdateStatus(issue.id, showStatusPrompt, noteAuthor || 'User', statusReason || undefined);
    setShowStatusPrompt(null);
    setStatusReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityScoreBadge score={issue.priorityScore} band={issue.priorityBand} size="md" />
              <span className="text-[11px] font-mono font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                {issue.id}
              </span>
              <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded capitalize">
                {issue.sourceType.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
              {issue.title}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              {issue.description}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Status Selector Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="issue-status-select" className="text-[11px] font-semibold text-slate-500">Status:</label>
              <select
                id="issue-status-select"
                value={issue.status}
                onChange={e => handleStatusSelect(e.target.value as IssueStatus)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 shadow-2xs hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {VALID_ISSUE_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Confirmation Prompt Banner */}
        {showStatusPrompt && (
          <div className="p-3 bg-indigo-50 border-b border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2 text-indigo-950 font-medium">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Change status from <strong>{issue.status}</strong> to <strong>{showStatusPrompt}</strong>?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Optional reason for audit history..."
                value={statusReason}
                onChange={e => setStatusReason(e.target.value)}
                className="text-xs px-2.5 py-1 bg-white border border-indigo-200 rounded-md text-slate-800 w-52"
              />
              <button
                onClick={confirmStatusChange}
                className="px-3 py-1 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowStatusPrompt(null)}
                className="px-2 py-1 text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quick Metadata Bar */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono">
              <strong className="text-slate-900 font-bold">{issue.occurrenceCount.toLocaleString('en-US')}</strong> occurrences
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <strong className="text-slate-900 font-bold">{issue.distinctCount}</strong> distinct statements
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Owner: <strong className="text-slate-800">{issue.owner || 'Unassigned'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Due: <strong className="text-slate-800">{issue.dueDate || 'None set'}</strong></span>
            </div>
          </div>

          <button
            onClick={() => {
              setOwnerInput(issue.owner || '');
              setDueDateInput(issue.dueDate || '');
              setIsEditingDetails(!isEditingDetails);
            }}
            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
          >
            {isEditingDetails ? 'Cancel edit' : 'Edit owner / due date'}
          </button>
        </div>

        {/* Owner / Due Date Inline Form */}
        {isEditingDetails && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-end gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assigned Owner</label>
              <input
                type="text"
                placeholder="e.g. SRE Lead, Alex M."
                value={ownerInput}
                onChange={e => setOwnerInput(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 w-44"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDateInput}
                onChange={e => setDueDateInput(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900"
              />
            </div>
            <button
              onClick={handleSaveDetails}
              className="px-3.5 py-1.5 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        )}

        {/* Modal Tabs Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('explainability')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'explainability'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Score Explainability</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
            <span>Customer Evidence ({issue.representativeExamples.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Internal Notes ({issueNotes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Status Audit Trail ({issueHistory.length})</span>
          </button>
        </div>

        {/* Scrollable Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'explainability' && (
            <div className="space-y-6">
              {/* Score Breakdown Overview Card */}
              <div className="p-4 sm:p-5 bg-linear-to-br from-slate-50 to-indigo-50/40 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Deterministic Decision Formula
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      Priority Score: {exp.totalScore} / 100 ({exp.priorityBand} Band)
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-slate-600">
                      {exp.applicableFactorsCount} of 5 factors active
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Sum of normalized active weights: 100%
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong>Methodology:</strong> {exp.normalizationMethod}. Priority scores represent an explainable decision-support ranking derived from feedback volume, dissatisfaction severity, and risk tier.
                  </p>
                </div>
              </div>

              {/* Factors Table / Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Weighted Factor Calculation Breakdown
                </h4>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* 1. Recurrence Factor */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Feedback Recurrence</span>
                        <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Raw Weight: 30% | Effective: {Math.round(exp.factors.recurrence.normalizedWeight * 100)}%
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        {exp.factors.recurrence.explanation}
                      </p>
                    </div>
                    <div className="text-right sm:w-28 shrink-0">
                      <div className="font-mono font-bold text-sm text-slate-900">
                        {exp.factors.recurrence.score} / 100
                      </div>
                      <div className="text-[11px] font-mono text-indigo-600">
                        +{exp.factors.recurrence.weightedContribution} pts
                      </div>
                    </div>
                  </div>

                  {/* 2. Sentiment Severity Factor */}
                  <div className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    exp.factors.sentimentSeverity.available ? 'border-slate-200 bg-white' : 'border-amber-200 bg-amber-50/50'
                  }`}>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Negative & Mixed Sentiment Severity</span>
                        <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Raw Weight: 30% | Effective: {exp.factors.sentimentSeverity.available ? `${Math.round(exp.factors.sentimentSeverity.normalizedWeight * 100)}%` : 'Excluded'}
                        </span>
                        {!exp.factors.sentimentSeverity.available && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            Factor Unavailable
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        {exp.factors.sentimentSeverity.explanation}
                      </p>
                    </div>
                    <div className="text-right sm:w-28 shrink-0">
                      <div className="font-mono font-bold text-sm text-slate-900">
                        {exp.factors.sentimentSeverity.available ? `${exp.factors.sentimentSeverity.score} / 100` : 'N/A'}
                      </div>
                      <div className="text-[11px] font-mono text-indigo-600">
                        {exp.factors.sentimentSeverity.available ? `+${exp.factors.sentimentSeverity.weightedContribution} pts` : '0 pts'}
                      </div>
                    </div>
                  </div>

                  {/* 3. Category Relevance Factor */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Category Relevance Index</span>
                        <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Raw Weight: 15% | Effective: {Math.round(exp.factors.categoryRelevance.normalizedWeight * 100)}%
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        {exp.factors.categoryRelevance.explanation}
                      </p>
                    </div>
                    <div className="text-right sm:w-28 shrink-0">
                      <div className="font-mono font-bold text-sm text-slate-900">
                        {exp.factors.categoryRelevance.score} / 100
                      </div>
                      <div className="text-[11px] font-mono text-indigo-600">
                        +{exp.factors.categoryRelevance.weightedContribution} pts
                      </div>
                    </div>
                  </div>

                  {/* 4. Distinct Evidence Statements */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Distinct Phrasing Evidence</span>
                        <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Raw Weight: 15% | Effective: {Math.round(exp.factors.distinctEvidence.normalizedWeight * 100)}%
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        {exp.factors.distinctEvidence.explanation}
                      </p>
                    </div>
                    <div className="text-right sm:w-28 shrink-0">
                      <div className="font-mono font-bold text-sm text-slate-900">
                        {exp.factors.distinctEvidence.score} / 100
                      </div>
                      <div className="text-[11px] font-mono text-indigo-600">
                        +{exp.factors.distinctEvidence.weightedContribution} pts
                      </div>
                    </div>
                  </div>

                  {/* 5. Analysis Confidence Factor */}
                  <div className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    exp.factors.analysisConfidence.available ? 'border-slate-200 bg-white' : 'border-slate-200/60 bg-slate-50/50'
                  }`}>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Validated Model Confidence</span>
                        <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Raw Weight: 10% | Effective: {exp.factors.analysisConfidence.available ? `${Math.round(exp.factors.analysisConfidence.normalizedWeight * 100)}%` : 'Excluded'}
                        </span>
                        {!exp.factors.analysisConfidence.available && (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                            Factor Excluded
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        {exp.factors.analysisConfidence.explanation}
                      </p>
                    </div>
                    <div className="text-right sm:w-28 shrink-0">
                      <div className="font-mono font-bold text-sm text-slate-900">
                        {exp.factors.analysisConfidence.available ? `${exp.factors.analysisConfidence.score} / 100` : 'N/A'}
                      </div>
                      <div className="text-[11px] font-mono text-indigo-600">
                        {exp.factors.analysisConfidence.available ? `+${exp.factors.analysisConfidence.weightedContribution} pts` : '0 pts'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Limitations Notice */}
              {exp.limitations.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                  <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Transparent Data Limitations</span>
                  </div>
                  <ul className="list-disc pl-5 text-amber-800 space-y-1 mt-1 text-[11px]">
                    {exp.limitations.map((lim, i) => (
                      <li key={i}>{lim}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Remediation Box */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2 text-xs">
                <div className="font-semibold text-indigo-950 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>Proposed Next Remediation Action</span>
                </div>
                <p className="text-indigo-900 leading-relaxed text-[11px]">
                  {issue.suggestedNextAction}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Supporting Customer Quotes ({issue.representativeExamples.length} Samples)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Verbatim statements from customer feedback contributing to this issue.
                  </p>
                </div>
                <span className="text-xs font-mono font-medium text-slate-500">
                  Total occurrences: {issue.occurrenceCount.toLocaleString('en-US')}
                </span>
              </div>

              {issue.representativeExamples.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No representative quotes recorded for this item.
                </div>
              ) : (
                <div className="space-y-3">
                  {issue.representativeExamples.map((quote, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-slate-300 transition-colors"
                    >
                      <blockquote className="text-xs text-slate-800 italic border-l-3 border-indigo-500 pl-3 leading-relaxed">
                        &ldquo;{quote}&rdquo;
                      </blockquote>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span className="font-mono">Verbatim Evidence Item #{idx + 1}</span>
                        <button
                          onClick={() => onInspectText(quote)}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <span>Inspect in Workspace</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-5">
              {/* Add Note Form */}
              <form onSubmit={handleCreateNote} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Add Team Investigation Note</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Your name / role"
                      value={noteAuthor}
                      onChange={e => setNoteAuthor(e.target.value)}
                      className="text-[11px] px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700 w-28"
                    />
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder="Record root cause findings, ticket IDs, engineering Jira links, or mitigation notes..."
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Save Note</span>
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900">
                  Investigation Notes ({issueNotes.length})
                </h4>

                {issueNotes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    No notes recorded yet. Add investigative context or remediation plans above.
                  </div>
                ) : (
                  issueNotes.map(note => (
                    <div key={note.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{note.author}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {note.note}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Lifecycle Status History ({issueHistory.length} Transitions)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Audit trail tracking state transitions for this issue.
                </p>
              </div>

              {issueHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No status transitions recorded yet. Issue remains in initial state ({issue.status}).
                </div>
              ) : (
                <div className="space-y-3">
                  {issueHistory.map(hist => (
                    <div key={hist.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-start gap-3">
                      <div className="mt-0.5 p-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-600">{hist.previousStatus}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-900">{hist.newStatus}</span>
                          <span className="text-[10px] text-slate-400 font-mono ml-auto">
                            {new Date(hist.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Updated by <strong className="text-slate-700">{hist.actor}</strong>
                          {hist.reason && <span className="italic ml-1">&ldquo;{hist.reason}&rdquo;</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Last updated: {new Date(issue.updatedAt).toLocaleDateString()}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
