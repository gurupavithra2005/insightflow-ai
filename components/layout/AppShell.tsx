'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import {
  ActiveNavTab,
  FeedbackRecord,
  FeedbackCategory,
  SentimentType,
  AggregateInsights,
  AnalysisRunRecord,
} from '../../types/feedback';
import { useFeedbackWorkspace } from '../../hooks/useFeedbackWorkspace';
import { OverviewView } from '../dashboard/OverviewView';
import { FeedbackExplorerView } from '../explorer/FeedbackExplorerView';
import { InsightsView } from '../pages/InsightsView';
import { RecommendationsView } from '../pages/RecommendationsView';
import { IssuesView } from '../pages/IssuesView';
import { ReportsView } from '../pages/ReportsView';
import { DataSourcesView } from '../pages/DataSourcesView';
import { AddFeedbackModal } from '../common/AddFeedbackModal';
import { ImportCsvModal } from '../common/ImportCsvModal';
import { InspectFeedbackModal } from '../common/InspectFeedbackModal';
import { AnalysisExecutionModal } from '../insights/AnalysisExecutionModal';
import { NotificationToastContainer, ToastMessage } from '../common/NotificationToast';
import { getFeedbackOccurrenceCount } from '../../services/analyticsService';
import { X } from 'lucide-react';

export function AppShell() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [inspectingRecord, setInspectingRecord] = useState<FeedbackRecord | null>(null);

  // Filter pass-through from dashboard and insights to explorer
  const [explorerCategoryFilter, setExplorerCategoryFilter] = useState<FeedbackCategory | null>(null);
  const [explorerSentimentFilter, setExplorerSentimentFilter] = useState<string | null>(null);
  const [explorerTopicFilter, setExplorerTopicFilter] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const {
    records,
    metadata,
    metrics,
    insights,
    lastRun,
    issues,
    recommendations,
    notes,
    statusHistory,
    categoryConfig,
    thresholds,
    addFeedback,
    importRecords,
    resetToDemo,
    loadBenchmark,
    updateAnalysis,
    clearAnalysis,
    exportCsv,
    updateIssueStatus,
    updateIssueDetails,
    addIssueNote,
    deleteIssueNote,
    updateRecommendationStatus,
    replaceRecommendation,
    updateCategoryConfig,
    updatePriorityThresholds,
    recalculateIssues,
    reports,
    addReport,
    deleteReport,
  } = useFeedbackWorkspace();

  // Listen for hashchange events and sync initial hash on mount
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ActiveNavTab;
      const validTabs: ActiveNavTab[] = [
        'overview',
        'explorer',
        'insights',
        'recommendations',
        'issues',
        'reports',
        'adaption',
      ];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: ActiveNavTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleAddFeedbackSubmit = (text: string, category: FeedbackCategory) => {
    addFeedback(text, category);
    addToast(
      'success',
      'Feedback Recorded Successfully',
      `Saved under "${category}". Dashboard metrics and recurrence frequencies updated.`
    );
  };

  const handleImportSuccess = (
    newRecords: FeedbackRecord[],
    fileName: string,
    fileSizeBytes?: number
  ) => {
    importRecords(newRecords, fileName, fileSizeBytes);
    addToast(
      'success',
      'Dataset Imported Successfully',
      `Loaded ${newRecords.length.toLocaleString('en-US')} verified feedback rows from ${fileName}.`
    );
  };

  const handleLoadBenchmarkQuick = () => {
    loadBenchmark();
    addToast(
      'success',
      'Build Battle 2026 Dataset Loaded',
      'Loaded 7,000 verified benchmark records across 4 categories (320 distinct statements).'
    );
  };

  const handleResetToDemo = () => {
    resetToDemo();
    addToast(
      'info',
      'Demo Workspace Restored',
      'Reset workspace to initial synthetic demo records.'
    );
  };

  const handleAnalysisSuccess = (
    updatedRecords: FeedbackRecord[],
    newInsights: AggregateInsights,
    runMeta: AnalysisRunRecord
  ) => {
    updateAnalysis(updatedRecords, newInsights, runMeta);
    addToast(
      'success',
      'Analysis Engine Completed',
      `Categorized ${newInsights.analyzedRecords.toLocaleString('en-US')} feedback occurrences across ${newInsights.topics.length} discovered topics (${runMeta.provider}).`
    );
  };

  const handleClearAnalysis = () => {
    clearAnalysis();
    addToast('info', 'Analysis Reset', 'Cleared analysis classifications for current workspace.');
  };

  const handleNavigateExplorerWithFilter = (
    filterType: 'sentiment' | 'topic' | 'complaint',
    filterValue: string
  ) => {
    if (filterType === 'sentiment') {
      setExplorerSentimentFilter(filterValue);
      setExplorerTopicFilter(null);
    } else if (filterType === 'topic' || filterType === 'complaint') {
      setExplorerTopicFilter(filterValue);
      setExplorerSentimentFilter(null);
    }
    handleTabChange('explorer');
  };

  const handleInspectByText = (text: string) => {
    const match = records.find(r => r.text.trim() === text.trim());
    if (match) {
      setInspectingRecord(match);
    } else {
      setInspectingRecord({
        id: 'virtual-inspect',
        text,
        category: 'Operational Issues',
        source: 'import',
      });
    }
  };

  const occurrencesForInspecting = inspectingRecord
    ? getFeedbackOccurrenceCount(records, inspectingRecord.text)
    : 1;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          totalRecordsCount={records.length}
          issuesCount={issues.length}
          recommendationsCount={recommendations.length}
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onCloseMobile={() => setMobileMenuOpen(false)}
                totalRecordsCount={records.length}
                issuesCount={issues.length}
                recommendationsCount={recommendations.length}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <TopHeader
          activeTab={activeTab}
          metadata={metadata}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              records={records}
              metadata={metadata}
              metrics={metrics}
              insights={insights}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenAnalysisModal={() => setIsAnalysisModalOpen(true)}
              onLoadBenchmark={handleLoadBenchmark}
              onResetToDemo={handleResetToDemo}
              onNavigateTab={tab => handleTabChange(tab)}
              onInspectRecord={rec => setInspectingRecord(rec)}
              onFilterByCategory={cat => setExplorerCategoryFilter(cat)}
              onFilterBySentiment={sent => {
                setExplorerSentimentFilter(sent);
                handleTabChange('explorer');
              }}
            />
          )}

          {activeTab === 'explorer' && (
            <FeedbackExplorerView
              key={`${explorerCategoryFilter || 'all'}-${explorerSentimentFilter || 'all'}-${explorerTopicFilter || 'all'}`}
              records={records}
              initialCategory={explorerCategoryFilter}
              initialSentiment={explorerSentimentFilter}
              initialTopic={explorerTopicFilter}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onInspectRecord={rec => setInspectingRecord(rec)}
              onExportCsv={exportCsv}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsView
              metrics={metrics}
              metadata={metadata}
              records={records}
              insights={insights}
              lastRun={lastRun}
              onOpenAnalysisModal={() => setIsAnalysisModalOpen(true)}
              onClearAnalysis={handleClearAnalysis}
              onNavigateExplorerWithFilter={handleNavigateExplorerWithFilter}
              onInspectRecord={rec => setInspectingRecord(rec)}
            />
          )}

          {activeTab === 'recommendations' && (
            <RecommendationsView
              metrics={metrics}
              records={records}
              insights={insights}
              issues={issues}
              recommendations={recommendations}
              notes={notes}
              statusHistory={statusHistory}
              categoryConfig={categoryConfig}
              thresholds={thresholds}
              onUpdateStatus={(issueId, status, actor, reason) => {
                updateIssueStatus(issueId, status, actor, reason);
                addToast('info', 'Issue Status Updated', `Status changed to ${status}. Audit trail recorded.`);
              }}
              onUpdateDetails={(issueId, updates) => {
                updateIssueDetails(issueId, updates);
                addToast('success', 'Issue Details Updated', 'Saved owner and target dates.');
              }}
              onAddNote={(issueId, noteText, author) => {
                addIssueNote(issueId, noteText, author);
                addToast('success', 'Investigation Note Saved', 'Appended to team audit log.');
              }}
              onDeleteNote={(noteId) => {
                deleteIssueNote(noteId);
                addToast('info', 'Note Removed');
              }}
              onUpdateRecommendationStatus={(recId, status, userNotes) => {
                updateRecommendationStatus(recId, status, userNotes);
                addToast('success', 'Recommendation Updated', `Marked recommendation as ${status}.`);
              }}
              onReplaceRecommendation={replaceRecommendation}
              onUpdateCategoryConfig={(cfg) => {
                updateCategoryConfig(cfg);
                addToast('success', 'Scoring Weights Updated', 'Priority scores recalculated.');
              }}
              onUpdatePriorityThresholds={(th) => {
                updatePriorityThresholds(th);
                addToast('success', 'Priority Bands Updated', 'Priority classifications updated.');
              }}
              onRecalculateIssues={() => {
                recalculateIssues();
                addToast('success', 'Scores Recalculated', 'Synchronized priority rankings against dataset.');
              }}
              onInspectText={handleInspectByText}
              onNavigateTab={tab => handleTabChange(tab)}
            />
          )}

          {activeTab === 'issues' && (
            <IssuesView
              metrics={metrics}
              records={records}
              issues={issues}
              notes={notes}
              statusHistory={statusHistory}
              onUpdateStatus={(issueId, status, actor, reason) => {
                updateIssueStatus(issueId, status, actor, reason);
                addToast('info', 'Issue Status Updated', `Status changed to ${status}.`);
              }}
              onUpdateDetails={(issueId, updates) => {
                updateIssueDetails(issueId, updates);
                addToast('success', 'Issue Details Updated');
              }}
              onAddNote={(issueId, noteText, author) => {
                addIssueNote(issueId, noteText, author);
                addToast('success', 'Investigation Note Saved');
              }}
              onDeleteNote={(noteId) => {
                deleteIssueNote(noteId);
                addToast('info', 'Note Removed');
              }}
              onInspectText={handleInspectByText}
              onRecalculateIssues={() => {
                recalculateIssues();
                addToast('success', 'Issues Synchronized');
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              metrics={metrics}
              records={records}
              metadata={metadata}
              insights={insights}
              issues={issues}
              recommendations={recommendations}
              notes={notes}
              statusHistory={statusHistory}
              reports={reports}
              onSaveReport={(rep) => {
                addReport(rep);
                addToast('success', 'Report Generated Successfully', `Saved ${rep.title} to report history.`);
              }}
              onDeleteReport={(id) => {
                deleteReport(id);
                addToast('info', 'Report Removed from History');
              }}
              onExportCsv={exportCsv}
              onInspectText={handleInspectByText}
            />
          )}

          {activeTab === 'adaption' && (
            <DataSourcesView
              metadata={metadata}
              metrics={metrics}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onLoadBenchmark={loadBenchmark}
              onNotify={addToast}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AddFeedbackModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddFeedbackSubmit}
      />

      <ImportCsvModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
        onLoadBenchmarkQuick={handleLoadBenchmarkQuick}
      />

      <AnalysisExecutionModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        records={records}
        datasetName={metadata.datasetName}
        onAnalysisSuccess={handleAnalysisSuccess}
      />

      <InspectFeedbackModal
        record={inspectingRecord}
        occurrencesInDataset={occurrencesForInspecting}
        onClose={() => setInspectingRecord(null)}
      />

      {/* Action Notification Toasts */}
      <NotificationToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
