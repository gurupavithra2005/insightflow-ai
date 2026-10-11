'use client';

import React from 'react';
import { Menu, UploadCloud, Plus, ChevronRight, Database, CheckCircle2 } from 'lucide-react';
import { ActiveNavTab, WorkspaceMetadata } from '../../types/feedback';

interface TopHeaderProps {
  activeTab: ActiveNavTab;
  metadata: WorkspaceMetadata;
  onOpenMobileMenu: () => void;
  onOpenImportModal: () => void;
  onOpenAddModal: () => void;
}

const TAB_TITLES: Record<ActiveNavTab, string> = {
  overview: 'Overview',
  explorer: 'Feedback Explorer',
  insights: 'AI Insights',
  recommendations: 'Recommendations',
  issues: 'Issue Tracker',
  reports: 'Reports',
  adaption: 'Data Sources & Adaption',
};

export function TopHeader({
  activeTab,
  metadata,
  onOpenMobileMenu,
  onOpenImportModal,
  onOpenAddModal,
}: TopHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left zone: Mobile toggle + Breadcrumb trail */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
          <span className="font-medium text-slate-500 whitespace-nowrap">InsightFlow</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-900 truncate whitespace-nowrap">
            {TAB_TITLES[activeTab]}
          </span>
        </nav>
      </div>

      {/* Middle zone: Quiet Workspace Status */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="truncate max-w-xs font-medium text-slate-700">
          {metadata.datasetName}
        </span>
        <span className="text-slate-400 font-mono tabular-nums">
          ({metadata.totalRecords.toLocaleString('en-US')} rows)
        </span>
      </div>

      {/* Right zone: Primary action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenImportModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
          title="Import CSV dataset"
        >
          <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Import CSV</span>
          <span className="sm:hidden">Import</span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs"
          title="Manually record feedback"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Feedback</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </header>
  );
}
