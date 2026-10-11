'use client';

import React from 'react';
import { MessageSquare, FileText, Layers, Repeat, Info } from 'lucide-react';
import { DatasetMetrics } from '../../types/feedback';
import { formatDisplayNumber } from '../../lib/dateUtils';

interface MetricCardsProps {
  metrics: DatasetMetrics;
}

export function MetricCards({ metrics }: MetricCardsProps) {
  const cards = [
    {
      label: 'Total Feedback Records',
      value: formatDisplayNumber(metrics.totalFeedback),
      subtext: 'Total customer submissions in active dataset',
      icon: MessageSquare,
      accent: 'text-indigo-600',
      bgAccent: 'bg-indigo-50',
    },
    {
      label: 'Unique Feedback Texts',
      value: formatDisplayNumber(metrics.uniqueFeedbackCount),
      subtext: `${(
        metrics.totalFeedback > 0
          ? ((metrics.uniqueFeedbackCount / metrics.totalFeedback) * 100).toFixed(1)
          : '0'
      )}% of dataset has distinct wording`,
      icon: FileText,
      accent: 'text-teal-600',
      bgAccent: 'bg-teal-50',
    },
    {
      label: 'Feedback Categories',
      value: `${metrics.categoryCount} / 4`,
      subtext: 'Operational, Fraud, Product, Service',
      icon: Layers,
      accent: 'text-violet-600',
      bgAccent: 'bg-violet-50',
    },
    {
      label: 'Repeated Feedback Entries',
      value: formatDisplayNumber(metrics.repeatedEntriesCount),
      subtext: 'Multi-instance customer complaint recurrence',
      icon: Repeat,
      accent: 'text-amber-600',
      bgAccent: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500 truncate" title={card.label}>
                {card.label}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bgAccent} ${card.accent} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
              {card.value}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate" title={card.subtext}>
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
