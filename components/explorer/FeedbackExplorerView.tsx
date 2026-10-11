'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  Plus,
  UploadCloud,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Tag,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  FeedbackRecord,
  FeedbackCategory,
  SentimentType,
  VALID_CATEGORIES,
  VALID_SENTIMENTS,
} from '../../types/feedback';
import { formatDisplayDate } from '../../lib/dateUtils';

interface FeedbackExplorerViewProps {
  records: FeedbackRecord[];
  initialCategory?: FeedbackCategory | null;
  initialSentiment?: string | null;
  initialTopic?: string | null;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onInspectRecord: (record: FeedbackRecord) => void;
  onExportCsv: (recordsToExport: FeedbackRecord[], filename?: string) => void;
}

export function FeedbackExplorerView({
  records,
  initialCategory = null,
  initialSentiment = null,
  initialTopic = null,
  onOpenAddModal,
  onOpenImportModal,
  onInspectRecord,
  onExportCsv,
}: FeedbackExplorerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>(initialSentiment || 'all');
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Extract unique available topics from analyzed records
  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.analysis?.topicLabel) {
        set.add(r.analysis.topicLabel);
      }
    });
    return Array.from(set).sort();
  }, [records]);

  // Filter records efficiently
  const filteredRecords = useMemo(() => {
    let result = records;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        r =>
          r.text.toLowerCase().includes(q) ||
          (r.analysis?.topicLabel && r.analysis.topicLabel.toLowerCase().includes(q)) ||
          (r.analysis?.explanation && r.analysis.explanation.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(r => r.category === selectedCategory);
    }

    // Sentiment filter
    if (selectedSentiment !== 'all') {
      if (selectedSentiment === 'Unanalyzed') {
        result = result.filter(r => !r.analysis || r.analysis.status !== 'completed');
      } else {
        result = result.filter(r => r.analysis?.sentiment === selectedSentiment);
      }
    }

    // Topic filter
    if (selectedTopic !== 'all') {
      result = result.filter(
        r => r.analysis?.topicLabel.toLowerCase() === selectedTopic.toLowerCase()
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'analyzed') {
        result = result.filter(r => r.analysis && r.analysis.status === 'completed');
      } else if (selectedStatus === 'unanalyzed') {
        result = result.filter(r => !r.analysis || r.analysis.status !== 'completed');
      }
    }

    return result;
  }, [records, searchTerm, selectedCategory, selectedSentiment, selectedTopic, selectedStatus]);

  // Reset to page 1 if filtered results change
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRecords = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredRecords, safeCurrentPage, pageSize]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedCategory !== 'all' ||
    selectedSentiment !== 'all' ||
    selectedTopic !== 'all' ||
    selectedStatus !== 'all';

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSentiment('all');
    setSelectedTopic('all');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  const handleExportFiltered = () => {
    const scopeLabel = hasActiveFilters ? 'Filtered' : 'All';
    onExportCsv(
      filteredRecords,
      `InsightFlow_${scopeLabel}_Feedback_${Date.now()}.csv`
    );
  };

  return (
    <div className="space-y-5">
      {/* Explorer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Feedback Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search, filter, inspect and export customer feedback from one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFiltered}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
            title={`Export ${filteredRecords.length} records to CSV`}
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV ({filteredRecords.length.toLocaleString('en-US')})</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
            <span>Import</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Feedback</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-3 shadow-2xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search feedback reviews, topic clusters, or rationale keywords..."
            className="w-full text-xs pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              aria-label="Clear search text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Multi-Dimensional Filter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {VALID_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sentiment Dropdown */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Sentiment
            </label>
            <select
              value={selectedSentiment}
              onChange={e => {
                setSelectedSentiment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Sentiments</option>
              {VALID_SENTIMENTS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="Unanalyzed">Unanalyzed</option>
            </select>
          </div>

          {/* Topic Dropdown */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Discovered Topic
            </label>
            <select
              value={selectedTopic}
              onChange={e => {
                setSelectedTopic(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Topics ({availableTopics.length})</option>
              {availableTopics.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Analysis Status Dropdown */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Analysis Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Records</option>
              <option value="analyzed">Analyzed Only</option>
              <option value="unanalyzed">Awaiting Analysis Only</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end col-span-2 sm:col-span-4 lg:col-span-1">
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            ) : (
              <div className="text-[11px] text-slate-400 py-1.5 hidden lg:block">
                No active filters
              </div>
            )}
          </div>
        </div>

        {/* Status Line: Matching count and Page Size */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <span>
              Showing{' '}
              <strong className="text-slate-900 font-semibold font-mono tabular-nums">
                {filteredRecords.length.toLocaleString('en-US')}
              </strong>{' '}
              of{' '}
              <strong className="text-slate-900 font-semibold font-mono tabular-nums">
                {records.length.toLocaleString('en-US')}
              </strong>{' '}
              total records
            </span>
            {hasActiveFilters && (
              <span className="text-indigo-600 font-medium">
                (Filtered subset)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs py-1 px-2 border border-slate-200 rounded bg-white font-medium text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No matching feedback records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn&apos;t find any feedback entries matching your current search and filter combination.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="py-3 px-3 w-12 text-slate-400 font-mono">#</th>
                  <th className="py-3 px-4">Feedback Review Statement</th>
                  <th className="py-3 px-3 w-36">Category</th>
                  <th className="py-3 px-3 w-28">Sentiment</th>
                  <th className="py-3 px-3 w-40">Discovered Topic</th>
                  <th className="py-3 px-3 w-28">Date</th>
                  <th className="py-3 px-3 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.map((record, index) => {
                  const globalIndex = (safeCurrentPage - 1) * pageSize + index + 1;
                  const dateStr = formatDisplayDate(record.createdAt);

                  const a = record.analysis;

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onInspectRecord(record)}
                    >
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        {globalIndex}
                      </td>
                      <td className="py-2.5 px-4 text-slate-900">
                        <p className="line-clamp-2 font-normal leading-relaxed text-slate-800">
                          {record.text}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {record.category}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {a ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                              a.sentiment === 'Positive'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : a.sentiment === 'Negative'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : a.sentiment === 'Mixed'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <span>{a.sentiment}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Unanalyzed
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {a ? (
                          <span className="truncate max-w-[140px] block font-medium" title={a.topicLabel}>
                            {a.topicLabel}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onInspectRecord(record)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-indigo-600 px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 transition-colors"
                          title="Inspect full text and analysis"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredRecords.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 gap-3">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-900 font-mono tabular-nums">
                {((safeCurrentPage - 1) * pageSize + 1).toLocaleString('en-US')}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900 font-mono tabular-nums">
                {Math.min(safeCurrentPage * pageSize, filteredRecords.length).toLocaleString('en-US')}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-900 font-mono tabular-nums">
                {filteredRecords.length.toLocaleString('en-US')}
              </span>{' '}
              results
            </div>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="px-2 py-1 border border-slate-200 rounded bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 font-medium text-[11px]"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1 border border-slate-200 rounded bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 py-1 font-mono text-[11px] font-medium text-slate-800">
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-1 border border-slate-200 rounded bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="px-2 py-1 border border-slate-200 rounded bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 font-medium text-[11px]"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
