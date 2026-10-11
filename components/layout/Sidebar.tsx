'use client';

import React from 'react';
import {
  LayoutDashboard,
  Search,
  Brain,
  Target,
  CheckSquare,
  FileText,
  Database,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { ActiveNavTab } from '../../types/feedback';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onTabChange: (tab: ActiveNavTab) => void;
  onCloseMobile?: () => void;
  totalRecordsCount: number;
}

interface NavItem {
  id: ActiveNavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export function Sidebar({
  activeTab,
  onTabChange,
  onCloseMobile,
  totalRecordsCount,
}: SidebarProps) {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'explorer',
      label: 'Feedback Explorer',
      icon: Search,
      badge: totalRecordsCount > 0 ? totalRecordsCount.toLocaleString('en-US') : undefined,
    },
    {
      id: 'insights',
      label: 'AI Insights',
      icon: Brain,
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: Target,
    },
    {
      id: 'issues',
      label: 'Issue Tracker',
      icon: CheckSquare,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
    },
    {
      id: 'adaption',
      label: 'Data Sources & Adaption',
      icon: Database,
    },
  ];

  const handleSelect = (tab: ActiveNavTab) => {
    onTabChange(tab);
    onCloseMobile?.();
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 h-full flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-2xs">
            IF
          </div>
          <div className="min-w-0">
            <span className="text-base font-bold text-slate-900 tracking-tight block truncate">
              InsightFlow
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              Feedback & Decision Platform
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors group ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums ${
                      isActive
                        ? 'bg-indigo-100/80 text-indigo-800 font-semibold'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Hackathon Metadata info */}
      <div className="p-4 m-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-800">Build Battle 2026</span>
          <span className="text-[10px] text-indigo-600 font-mono font-bold">Phase 2</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">
          Frontend Arena Hackathon
        </p>
        <div className="pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-400">
          AI Analysis Engine Active
        </div>
      </div>
    </aside>
  );
}
