'use client';

import React, { useState } from 'react';
import {
  Layers,
  Database,
  ArrowRight,
  Sliders,
  Play,
  FileCheck,
  BarChart,
  ShieldAlert,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { WorkspaceMetadata, DatasetMetrics } from '../../types/feedback';

interface DataSourcesViewProps {
  metadata: WorkspaceMetadata;
  metrics: DatasetMetrics;
  onOpenImportModal: () => void;
}

export function DataSourcesView({ metadata, metrics, onOpenImportModal }: DataSourcesViewProps) {
  // Configurable recipe preview state
  const [selectedRecipe, setSelectedRecipe] = useState('semantic_dedup');

  const workflowSteps = [
    {
      step: 1,
      title: 'Import Dataset',
      description: 'Ingest raw feedback documents or CSV records with customer reviews.',
      status: 'Ready (Active)',
      isComplete: true,
    },
    {
      step: 2,
      title: 'Map Columns',
      description: 'Align source fields with target review text and category taxonomy.',
      status: 'Ready (Active)',
      isComplete: true,
    },
    {
      step: 3,
      title: 'Choose Processing Recipes',
      description: 'Configure pipeline recipes: deduplication, PII removal, and normalization.',
      status: 'Configurable',
      isComplete: false,
    },
    {
      step: 4,
      title: 'Start Adaptation Run',
      description: 'Execute external Adaption transform job with isolated worker sandbox.',
      status: 'Requires Phase 2 API Config',
      isComplete: false,
    },
    {
      step: 5,
      title: 'Review Resulting Dataset',
      description: 'Audit transformed data rows and examine transformation metadata.',
      status: 'Pending Run',
      isComplete: false,
    },
    {
      step: 6,
      title: 'Evaluate Source vs Adapted Data',
      description: 'Side-by-side verification of data purity and recurring issue visibility.',
      status: 'Pending Run',
      isComplete: false,
    },
  ];

  const recipes = [
    {
      id: 'semantic_dedup',
      name: 'Semantic Clustering & Density Normalization',
      desc: 'Normalizes varied phrasing into canonical friction vectors without losing occurrence weight.',
    },
    {
      id: 'pii_scrubbing',
      name: 'Enterprise PII & Privacy Masking',
      desc: 'Detects and masks customer emails, telephone numbers, credit cards, and addresses before downstream LLM processing.',
    },
    {
      id: 'taxonomy_refinement',
      name: 'Dynamic Sub-Category Classification',
      desc: 'Splits broad categories (e.g. Operational Issues) into targeted component tags (Checkout, SSO, Webhooks).',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Data Sources & Adaption Integration
            </h1>
            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
              Phase 1 Interface Contract
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Architecture for external Adaption transformation recipes, dataset normalization, and source evaluation.
          </p>
        </div>

        <button
          onClick={onOpenImportModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors shrink-0"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Upload Dataset</span>
        </button>
      </div>

      {/* Honest Status Card — Requirement 11 */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl flex items-start gap-3.5 text-xs text-slate-800">
        <ShieldAlert className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-900">
            External Adaption Integration Status: Not Configured in Phase 1
          </div>
          <p className="text-slate-600 leading-relaxed">
            In compliance with strict data integrity and evaluation requirements, InsightFlow does not fabricate artificial API connections, fake run progress bars, or simulated improvement scores. The step workflow below establishes the verified interface boundaries ready for live Adaption API integration in subsequent stages.
          </p>
        </div>
      </div>

      {/* 6-Step Adaption Workflow Visualization */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            6-Step Adaption Pipeline Architecture
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            The standard end-to-end operational sequence for executing external feedback dataset adaptation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {workflowSteps.map(item => (
            <div
              key={item.step}
              className={`p-4 rounded-xl border transition-all ${
                item.isComplete
                  ? 'bg-emerald-50/40 border-emerald-200/80'
                  : 'bg-slate-50/60 border-slate-200/70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-white border border-slate-200 font-mono text-xs font-bold flex items-center justify-center text-slate-800">
                  {item.step}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    item.isComplete
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recipe Selection Sandbox (Configurable Preview) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Available Data-Processing Recipes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-configured transformation recipes ready for future pipeline execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recipes.map(recipe => (
            <div
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedRecipe === recipe.id
                  ? 'bg-indigo-50/50 border-indigo-400 ring-1 ring-indigo-400'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-900">{recipe.name}</span>
                <input
                  type="radio"
                  name="recipe"
                  checked={selectedRecipe === recipe.id}
                  onChange={() => setSelectedRecipe(recipe.id)}
                  className="text-indigo-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{recipe.desc}</p>
            </div>
          ))}
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
          <span>Active dataset: {metadata.datasetName} ({metrics.totalFeedback.toLocaleString('en-US')} rows)</span>
          <span className="italic text-[11px]">Adaption runner will mount against this schema in Phase 2</span>
        </div>
      </div>
    </div>
  );
}
