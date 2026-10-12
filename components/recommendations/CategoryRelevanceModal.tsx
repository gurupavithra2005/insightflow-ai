'use client';

import React, { useState } from 'react';
import {
  CategoryRelevanceConfig,
  PriorityBandThresholds,
  VALID_CATEGORIES,
} from '../../types/feedback';
import {
  DEFAULT_CATEGORY_RELEVANCE,
  DEFAULT_PRIORITY_THRESHOLDS,
} from '../../services/priorityScorer';
import { X, Sliders, RotateCcw, Check, Shield, Info } from 'lucide-react';

interface CategoryRelevanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CategoryRelevanceConfig;
  thresholds: PriorityBandThresholds;
  onSaveConfig: (newConfig: CategoryRelevanceConfig, newThresholds: PriorityBandThresholds) => void;
}

export function CategoryRelevanceModal({
  isOpen,
  onClose,
  config,
  thresholds,
  onSaveConfig,
}: CategoryRelevanceModalProps) {
  const [formConfig, setFormConfig] = useState<CategoryRelevanceConfig>({ ...config });
  const [formThresholds, setFormThresholds] = useState<PriorityBandThresholds>({ ...thresholds });

  if (!isOpen) return null;

  const handleReset = () => {
    setFormConfig({ ...DEFAULT_CATEGORY_RELEVANCE });
    setFormThresholds({ ...DEFAULT_PRIORITY_THRESHOLDS });
  };

  const handleSave = () => {
    onSaveConfig(formConfig, formThresholds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Scoring Weights & Priority Band Thresholds
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs">
          {/* Information Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Transparent & Reviewable Configuration</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Category weights contribute 15% toward the overall priority score. Adjusting these weights allows your organization to calibrate risk profiles for regulatory compliance, operational SLAs, or product roadmaps.
            </p>
          </div>

          {/* Category Weights Inputs */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Category Relevance Weights (0 - 100)
            </h3>

            {VALID_CATEGORIES.map(cat => (
              <div key={cat} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{cat}</span>
                  <span className="font-mono font-bold text-indigo-600 tabular-nums">
                    {formConfig[cat]} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={formConfig[cat]}
                  onChange={e =>
                    setFormConfig(prev => ({
                      ...prev,
                      [cat]: Number(e.target.value),
                    }))
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            ))}
          </div>

          {/* Priority Band Thresholds */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Priority Band Cutoff Thresholds
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Critical Cutoff (≥)
                </label>
                <input
                  type="number"
                  min="60"
                  max="95"
                  value={formThresholds.critical}
                  onChange={e =>
                    setFormThresholds(prev => ({
                      ...prev,
                      critical: Number(e.target.value),
                    }))
                  }
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  High Cutoff (≥)
                </label>
                <input
                  type="number"
                  min="40"
                  max="79"
                  value={formThresholds.high}
                  onChange={e =>
                    setFormThresholds(prev => ({
                      ...prev,
                      high: Number(e.target.value),
                    }))
                  }
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Medium Cutoff (≥)
                </label>
                <input
                  type="number"
                  min="20"
                  max="59"
                  value={formThresholds.medium}
                  onChange={e =>
                    setFormThresholds(prev => ({
                      ...prev,
                      medium: Number(e.target.value),
                    }))
                  }
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-md font-mono"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Low band automatically applies to scores below {formThresholds.medium}.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 rounded-lg font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply & Recalculate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
