'use client';

import React, { useState } from 'react';
import { X, Plus, AlertCircle, Check } from 'lucide-react';
import { FeedbackCategory, VALID_CATEGORIES } from '../../types/feedback';

interface AddFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, category: FeedbackCategory) => void;
}

export function AddFeedbackModal({ isOpen, onClose, onSubmit }: AddFeedbackModalProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('Operational Issues');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = text.trim();
    if (!trimmed) {
      setError('Feedback text cannot be empty. Please enter customer remarks.');
      return;
    }

    if (trimmed.length < 5) {
      setError('Please provide at least 5 characters for meaningful feedback.');
      return;
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      setError('Please select a valid feedback category.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      onSubmit(trimmed, category);
      setText('');
      setCategory('Operational Issues');
      setIsSubmitting(false);
      onClose();
    } catch {
      setError('Failed to submit feedback record. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-feedback-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 id="add-feedback-title" className="text-base font-semibold text-slate-900">
              Add Customer Feedback
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record individual customer feedback into the active workspace.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 text-xs rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="feedback-text" className="text-xs font-semibold text-slate-700">
                Customer Feedback Text <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {text.length} characters
              </span>
            </div>
            <textarea
              id="feedback-text"
              rows={4}
              value={text}
              onChange={e => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Payment processing timed out during checkout but my credit card was still charged..."
              className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 resize-none transition-all"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="feedback-category" className="block text-xs font-semibold text-slate-700 mb-1">
              Category Classification <span className="text-rose-500">*</span>
            </label>
            <select
              id="feedback-category"
              value={category}
              onChange={e => setCategory(e.target.value as FeedbackCategory)}
              className="w-full text-sm p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-800"
            >
              {VALID_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Permitted categories: Operational Issues, Fraud and Scam, Product Feedback, Customer Service.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Adding...' : 'Save Feedback'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
