'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Download,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { parseAndValidateCsv, CsvParseResult } from '../../services/csvImportService';
import { generateBuildBattleBenchmarkCsvString } from '../../services/benchmarkDataset';
import { FeedbackRecord } from '../../types/feedback';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (records: FeedbackRecord[], fileName: string, fileSizeBytes?: number) => void;
  onLoadBenchmarkQuick: () => void;
}

export function ImportCsvModal({
  isOpen,
  onClose,
  onImportSuccess,
  onLoadBenchmarkQuick,
}: ImportCsvModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [csvRawText, setCsvRawText] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [reviewColOverride, setReviewColOverride] = useState<string>('');
  const [categoryColOverride, setCategoryColOverride] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFileName(null);
    setSelectedFileSize(null);
    setCsvRawText(null);
    setParseResult(null);
    setReviewColOverride('');
    setCategoryColOverride('');
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert('Please upload a standard CSV file (.csv)');
      return;
    }

    setSelectedFileName(file.name);
    setSelectedFileSize(file.size);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setCsvRawText(text);
      const res = parseAndValidateCsv(text);
      setParseResult(res);
      if (res.summary.mappedReviewColumn) setReviewColOverride(res.summary.mappedReviewColumn);
      if (res.summary.mappedCategoryColumn) setCategoryColOverride(res.summary.mappedCategoryColumn);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setIsProcessing(false);
      alert('Failed to read CSV file. Please ensure it is valid UTF-8 text.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleReMapColumns = (newReviewCol: string, newCatCol: string) => {
    if (!csvRawText) return;
    setReviewColOverride(newReviewCol);
    setCategoryColOverride(newCatCol);
    const res = parseAndValidateCsv(csvRawText, newReviewCol, newCatCol);
    setParseResult(res);
  };

  const handleConfirmImport = () => {
    if (!parseResult || !parseResult.summary.isValid) return;
    onImportSuccess(
      parseResult.records,
      selectedFileName || 'Imported_Feedback.csv',
      selectedFileSize || undefined
    );
    handleReset();
    onClose();
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = generateBuildBattleBenchmarkCsvString();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BuildBattle_2026_Customer_Feedback_Dataset.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-import-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 id="csv-import-title" className="text-base font-semibold text-slate-900">
                Import Customer Feedback Dataset
              </h2>
              <p className="text-xs text-slate-500">
                Upload CSV files with feedback reviews and category classifications.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick evaluation strip for Hackathon Judges */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-950">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Build Battle 2026 Customer Feedback Dataset (7,000 rows)</span>
              </div>
              <p className="text-[11px] text-indigo-800/80 mt-0.5">
                Expected benchmark: 7,000 records, 320 unique reviews across 4 categories.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-white border border-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors shadow-2xs"
                title="Download benchmark CSV file to disk"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Download CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onLoadBenchmarkQuick();
                  handleReset();
                  onClose();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs"
                title="Directly load 7,000 benchmark records into workspace"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>1-Click Load (7,000 rows)</span>
              </button>
            </div>
          </div>

          {!parseResult ? (
            /* Upload Drop Area */
            <div>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/40'
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="mx-auto w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to browse or drag and drop your CSV file here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Expected columns: <code className="font-mono text-slate-700">review</code> and{' '}
                  <code className="font-mono text-slate-700">category</code> (or similar headers)
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  UTF-8 encoded standard CSV · Max file size: 25MB · Fast client-side parsing
                </p>
              </div>
            </div>
          ) : (
            /* Parsing & Validation Review */
            <div className="space-y-4">
              {/* File Info Card */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 truncate max-w-sm">
                      {selectedFileName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatFileSize(selectedFileSize)} · {parseResult.summary.totalRowsDetected.toLocaleString('en-US')} total rows detected
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-900 underline font-medium"
                >
                  Change File
                </button>
              </div>

              {/* Column Mapping Section */}
              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Column Mapping Configuration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Feedback Review Text Column:
                    </label>
                    <select
                      value={reviewColOverride}
                      onChange={e => handleReMapColumns(e.target.value, categoryColOverride)}
                      className="w-full p-2 border border-slate-200 rounded-md bg-white text-slate-800 font-medium"
                    >
                      {parseResult.rawHeaders.map(h => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Feedback Category Column:
                    </label>
                    <select
                      value={categoryColOverride}
                      onChange={e => handleReMapColumns(reviewColOverride, e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-md bg-white text-slate-800 font-medium"
                    >
                      {parseResult.rawHeaders.map(h => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Validation Stats */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="text-[11px] text-slate-500 font-medium">Total Rows</div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    {parseResult.summary.totalRowsDetected.toLocaleString('en-US')}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
                  <div className="text-[11px] text-emerald-700 font-medium">Valid Records</div>
                  <div className="text-lg font-bold text-emerald-700 tabular-nums">
                    {parseResult.summary.validRowsCount.toLocaleString('en-US')}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="text-[11px] text-slate-500 font-medium">Rejected / Skipped</div>
                  <div className="text-lg font-bold text-slate-700 tabular-nums">
                    {parseResult.summary.invalidRowsCount.toLocaleString('en-US')}
                  </div>
                </div>
              </div>

              {/* Category Breakdown preview */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs font-semibold text-slate-700 mb-1.5">
                  Detected Category Distribution:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(parseResult.summary.categoryStats).map(([cat, count]) => (
                    <div key={cat} className="p-2 bg-white rounded border border-slate-200/80">
                      <div className="text-[11px] text-slate-500 truncate" title={cat}>
                        {cat}
                      </div>
                      <div className="font-semibold text-slate-800 tabular-nums">
                        {count.toLocaleString('en-US')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings / Errors */}
              {parseResult.summary.errors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Validation Errors</span>
                  </div>
                  {parseResult.summary.errors.map((err, i) => (
                    <p key={i}>· {err}</p>
                  ))}
                </div>
              )}

              {parseResult.summary.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1 max-h-28 overflow-y-auto">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Parser Warnings & Row Notices</span>
                  </div>
                  {parseResult.summary.warnings.map((w, i) => (
                    <p key={i}>· {w}</p>
                  ))}
                </div>
              )}

              {/* Preview Table of First 10 Rows */}
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1.5">
                  Preview: First 10 Rows
                </div>
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-48">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-2.5 w-12 text-slate-400">#</th>
                        <th className="py-2 px-3">Review Preview</th>
                        <th className="py-2 px-3 w-40">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseResult.summary.previewRows.map(row => (
                        <tr key={row.rowNumber} className="hover:bg-slate-50/50">
                          <td className="py-1.5 px-2.5 text-slate-400 font-mono text-[11px]">
                            {row.rowNumber}
                          </td>
                          <td className="py-1.5 px-3 text-slate-800 truncate max-w-xs" title={row.review}>
                            {row.review}
                          </td>
                          <td className="py-1.5 px-3 text-slate-700 font-medium">
                            <span
                              className={`inline-block truncate ${
                                row.isValidCategory ? 'text-slate-800' : 'text-rose-600'
                              }`}
                            >
                              {row.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {parseResult && parseResult.summary.isValid && (
              <span>
                Ready to import{' '}
                <strong className="text-slate-900 font-semibold tabular-nums">
                  {parseResult.summary.validRowsCount.toLocaleString('en-US')}
                </strong>{' '}
                verified records.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!parseResult || !parseResult.summary.isValid || isProcessing}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm & Load Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
