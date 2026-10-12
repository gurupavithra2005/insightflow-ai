'use client';

import React from 'react';
import { PriorityBand } from '../../types/feedback';
import { AlertCircle, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PriorityScoreBadgeProps {
  score: number;
  band: PriorityBand;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export function PriorityScoreBadge({
  score,
  band,
  size = 'md',
  showScore = true,
}: PriorityScoreBadgeProps) {
  const config = {
    Critical: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      icon: ShieldAlert,
    },
    High: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
    },
    Medium: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      icon: AlertCircle,
    },
    Low: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
      icon: CheckCircle2,
    },
  }[band] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: CheckCircle2,
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
      title={`Priority Band: ${band} (${score}/100)`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{band}</span>
      {showScore && (
        <span className="font-mono font-bold tabular-nums opacity-90 border-l border-current/20 pl-1.5 ml-0.5">
          {score}
        </span>
      )}
    </span>
  );
}
