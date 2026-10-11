'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { DatasetMetrics, FeedbackCategory } from '../../types/feedback';
import { formatDisplayNumber } from '../../lib/dateUtils';

interface CategoryChartProps {
  metrics: DatasetMetrics;
  onSelectCategory?: (category: FeedbackCategory) => void;
}

const CATEGORY_COLORS: Record<FeedbackCategory, { bar: string; dot: string }> = {
  'Operational Issues': { bar: 'bg-indigo-600', dot: 'bg-indigo-600' },
  'Fraud and Scam': { bar: 'bg-rose-600', dot: 'bg-rose-600' },
  'Product Feedback': { bar: 'bg-teal-600', dot: 'bg-teal-600' },
  'Customer Service': { bar: 'bg-amber-600', dot: 'bg-amber-600' },
};

export function CategoryChart({ metrics, onSelectCategory }: CategoryChartProps) {
  const maxCount = Math.max(...metrics.categoryBreakdown.map(c => c.count), 1);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Feedback Category Distribution
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time volume distribution calculated from active records
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono tabular-nums">
          {formatDisplayNumber(metrics.totalFeedback)} total
        </div>
      </div>

      <div className="space-y-4">
        {metrics.categoryBreakdown.map(item => {
          const widthPercent = (item.count / maxCount) * 100;
          const styling = CATEGORY_COLORS[item.category] || {
            bar: 'bg-slate-600',
            dot: 'bg-slate-600',
          };

          return (
            <div
              key={item.category}
              onClick={() => onSelectCategory?.(item.category)}
              className="group cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${styling.dot}`} />
                  <span className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 font-mono tabular-nums">
                  <span className="font-semibold text-slate-900">
                    {formatDisplayNumber(item.count)}
                  </span>
                  <span className="text-slate-400">({item.percentage}%)</span>
                </div>
              </div>

              {/* Bar track */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${styling.bar}`}
                  style={{ width: `${Math.max(widthPercent, item.count > 0 ? 2 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <span>Click any category bar to filter Feedback Explorer</span>
        <span>4 standard domain categories</span>
      </div>
    </div>
  );
}
