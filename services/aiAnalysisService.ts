import {
  FeedbackRecord,
  FeedbackCategory,
  SentimentType,
  TopicRecord,
  ComplaintGroupRecord,
  AggregateInsights,
  AnalysisRunRecord,
  VALID_SENTIMENTS,
  VALID_CATEGORIES,
} from '../types/feedback';
import { AnalysisOutputItem } from './baselineAnalyzer';

export interface ProgressCallbackData {
  status: 'idle' | 'preparing' | 'analyzing' | 'aggregating' | 'completed' | 'failed';
  message: string;
  completedWorkload: number;
  totalWorkload: number;
  percentage: number;
  currentBatch: number;
  totalBatches: number;
  error?: string;
}

export interface UniqueTextGroup {
  key: string; // normalized text
  sampleId: string;
  originalText: string;
  category: FeedbackCategory;
  recordIds: string[];
  occurrenceCount: number;
}

/**
 * Deduplicates and prepares records for efficient batch analysis.
 * Step 1 - Step 3 of the analysis pipeline.
 */
export function groupRecordsForAnalysis(records: FeedbackRecord[]): UniqueTextGroup[] {
  const groupMap = new Map<string, UniqueTextGroup>();

  for (const record of records) {
    const trimmed = record.text.trim();
    if (!trimmed) continue;
    const normKey = `${record.category}:::${trimmed.toLowerCase()}`;

    const existing = groupMap.get(normKey);
    if (existing) {
      existing.recordIds.push(record.id);
      existing.occurrenceCount += 1;
    } else {
      groupMap.set(normKey, {
        key: normKey,
        sampleId: `grp-${groupMap.size + 1}`,
        originalText: trimmed,
        category: record.category,
        recordIds: [record.id],
        occurrenceCount: 1,
      });
    }
  }

  return Array.from(groupMap.values());
}

/**
 * Executes the full batch analysis pipeline with real-time progress callbacks.
 */
export async function executeFeedbackAnalysisPipeline(
  records: FeedbackRecord[],
  datasetName: string,
  provider: 'gemini-3.8-flash' | 'baseline-rules',
  onProgress: (data: ProgressCallbackData) => void,
  existingAnalyses?: Map<string, AnalysisOutputItem>
): Promise<{
  updatedRecords: FeedbackRecord[];
  insights: AggregateInsights;
  runMeta: AnalysisRunRecord;
}> {
  const runId = `run-${Date.now()}`;
  const startedAt = new Date().toISOString();

  onProgress({
    status: 'preparing',
    message: 'Validating records and identifying unique feedback statements...',
    completedWorkload: 0,
    totalWorkload: records.length,
    percentage: 5,
    currentBatch: 0,
    totalBatches: 0,
  });

  // Group unique texts to avoid sending thousands of identical requests
  const groups = groupRecordsForAnalysis(records);
  const totalUnique = groups.length;

  if (totalUnique === 0) {
    throw new Error('No valid feedback records found in current workspace to analyze.');
  }

  // Filter groups that need analysis vs cached
  const toAnalyze: UniqueTextGroup[] = [];
  const resultMap = new Map<string, AnalysisOutputItem>();

  groups.forEach(g => {
    if (existingAnalyses && existingAnalyses.has(g.key)) {
      resultMap.set(g.key, existingAnalyses.get(g.key)!);
    } else {
      toAnalyze.push(g);
    }
  });

  const BATCH_SIZE = 25; // Clean batch size of unique reviews
  const totalBatches = Math.ceil(toAnalyze.length / BATCH_SIZE);
  let completedWorkload = groups.length - toAnalyze.length;
  let failedCount = 0;

  // Process in batches
  for (let b = 0; b < totalBatches; b++) {
    const batchIndex = b + 1;
    const batchGroups = toAnalyze.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);

    onProgress({
      status: 'analyzing',
      message: `Analyzing batch ${batchIndex} of ${totalBatches} (${batchGroups.length} unique statements) via ${
        provider === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Baseline Lexicon'
      }...`,
      completedWorkload,
      totalWorkload: totalUnique,
      percentage: Math.round((completedWorkload / totalUnique) * 85) + 5,
      currentBatch: batchIndex,
      totalBatches,
    });

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: batchGroups.map(bg => ({
            id: bg.sampleId,
            text: bg.originalText,
            category: bg.category,
          })),
          provider,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status} from analysis server.`);
      }

      const resData = await response.json();
      const batchResults: AnalysisOutputItem[] = resData.results || [];

      // Map back to groups
      const idToResult = new Map<string, AnalysisOutputItem>();
      batchResults.forEach(r => idToResult.set(r.id, r));

      batchGroups.forEach(bg => {
        const res = idToResult.get(bg.sampleId);
        if (res) {
          resultMap.set(bg.key, res);
          completedWorkload++;
        } else {
          failedCount++;
        }
      });
    } catch (err: any) {
      console.warn(`Batch ${batchIndex} encountered an issue:`, err);
      // If gemini fails with api key or network, fail explicitly
      if (err.message && err.message.includes('GEMINI_API_KEY')) {
        throw err;
      }
      failedCount += batchGroups.length;
    }
  }

  onProgress({
    status: 'aggregating',
    message: 'Synthesizing topic frequencies, complaint clusters, and sentiment distributions...',
    completedWorkload: totalUnique - failedCount,
    totalWorkload: totalUnique,
    percentage: 95,
    currentBatch: totalBatches,
    totalBatches,
  });

  // Map results back to ALL original records
  const now = new Date().toISOString();
  const updatedRecords = records.map(record => {
    const key = `${record.category}:::${record.text.trim().toLowerCase()}`;
    const analysis = resultMap.get(key);

    if (analysis) {
      return {
        ...record,
        analysis: {
          analysisId: `an-${record.id}`,
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          explanation: analysis.explanation,
          evidenceQuote: analysis.evidenceQuote,
          topicLabel: analysis.topicLabel,
          topicDescription: analysis.topicDescription,
          complaintTitle: analysis.complaintTitle,
          complaintExplanation: analysis.complaintExplanation,
          method: analysis.method,
          status: 'completed' as const,
          analyzedAt: now,
        },
      };
    }

    return record;
  });

  // Calculate aggregate insights across all occurrences
  const insights = calculateAggregateInsights(updatedRecords);

  const runMeta: AnalysisRunRecord = {
    runId,
    datasetName,
    datasetFingerprint: `${datasetName}-${records.length}`,
    startedAt,
    completedAt: now,
    status: failedCount === 0 ? 'completed' : failedCount < totalUnique ? 'partial' : 'failed',
    totalWorkload: totalUnique,
    completedWorkload: totalUnique - failedCount,
    failedWorkload: failedCount,
    provider,
    errorSummary: failedCount > 0 ? `${failedCount} unique items failed analysis` : undefined,
  };

  insights.runMeta = runMeta;

  onProgress({
    status: 'completed',
    message: `Analysis completed successfully: ${insights.analyzedRecords.toLocaleString()} occurrences categorized!`,
    completedWorkload: totalUnique - failedCount,
    totalWorkload: totalUnique,
    percentage: 100,
    currentBatch: totalBatches,
    totalBatches,
  });

  return { updatedRecords, insights, runMeta };
}

/**
 * Computes deep sentiment, topic clustering, and complaint aggregations.
 * Strictly uses analyzed occurrences as denominator.
 */
export function calculateAggregateInsights(records: FeedbackRecord[]): AggregateInsights {
  const totalRecords = records.length;
  let analyzedRecords = 0;
  let unanalyzedRecords = 0;
  let failedRecords = 0;

  const sentimentCounts: Record<SentimentType, number> = {
    Positive: 0,
    Neutral: 0,
    Negative: 0,
    Mixed: 0,
  };

  const categorySentiment: Record<FeedbackCategory, Record<SentimentType, number>> = {
    'Operational Issues': { Positive: 0, Neutral: 0, Negative: 0, Mixed: 0 },
    'Fraud and Scam': { Positive: 0, Neutral: 0, Negative: 0, Mixed: 0 },
    'Product Feedback': { Positive: 0, Neutral: 0, Negative: 0, Mixed: 0 },
    'Customer Service': { Positive: 0, Neutral: 0, Negative: 0, Mixed: 0 },
  };

  // Maps for topics and complaints
  const topicMap = new Map<
    string,
    {
      label: string;
      description: string;
      occurrenceCount: number;
      distinctTexts: Set<string>;
      categoryCounts: Map<FeedbackCategory, number>;
      sentimentCounts: Record<SentimentType, number>;
      examples: Set<string>;
      recordIds: string[];
    }
  >();

  const complaintMap = new Map<
    string,
    {
      title: string;
      explanation: string;
      occurrenceCount: number;
      distinctTexts: Set<string>;
      categoryCounts: Map<FeedbackCategory, number>;
      examples: Set<string>;
      recordIds: string[];
    }
  >();

  for (const record of records) {
    if (!record.analysis || record.analysis.status !== 'completed') {
      unanalyzedRecords++;
      continue;
    }

    analyzedRecords++;
    const a = record.analysis;
    sentimentCounts[a.sentiment] += 1;
    categorySentiment[record.category][a.sentiment] += 1;

    // Aggregate Topics
    const topicLabel = a.topicLabel || 'General Feedback';
    let tEntry = topicMap.get(topicLabel);
    if (!tEntry) {
      tEntry = {
        label: topicLabel,
        description: a.topicDescription || 'Customer feedback cluster',
        occurrenceCount: 0,
        distinctTexts: new Set(),
        categoryCounts: new Map(),
        sentimentCounts: { Positive: 0, Neutral: 0, Negative: 0, Mixed: 0 },
        examples: new Set(),
        recordIds: [],
      };
      topicMap.set(topicLabel, tEntry);
    }
    tEntry.occurrenceCount += 1;
    tEntry.distinctTexts.add(record.text);
    tEntry.sentimentCounts[a.sentiment] += 1;
    tEntry.recordIds.push(record.id);
    const catCount = tEntry.categoryCounts.get(record.category) || 0;
    tEntry.categoryCounts.set(record.category, catCount + 1);
    if (tEntry.examples.size < 4) {
      tEntry.examples.add(record.text);
    }

    // Aggregate Complaints (Negative and Mixed reviews with complaint title)
    if ((a.sentiment === 'Negative' || a.sentiment === 'Mixed') && a.complaintTitle) {
      const cTitle = a.complaintTitle;
      let cEntry = complaintMap.get(cTitle);
      if (!cEntry) {
        cEntry = {
          title: cTitle,
          explanation: a.complaintExplanation || a.explanation,
          occurrenceCount: 0,
          distinctTexts: new Set(),
          categoryCounts: new Map(),
          examples: new Set(),
          recordIds: [],
        };
        complaintMap.set(cTitle, cEntry);
      }
      cEntry.occurrenceCount += 1;
      cEntry.distinctTexts.add(record.text);
      cEntry.recordIds.push(record.id);
      const cCatCount = cEntry.categoryCounts.get(record.category) || 0;
      cEntry.categoryCounts.set(record.category, cCatCount + 1);
      if (cEntry.examples.size < 4) {
        cEntry.examples.add(record.text);
      }
    }
  }

  // Calculate sentiment percentages with analyzedRecords as denominator
  const sentimentPercentages: Record<SentimentType, number> = {
    Positive: 0,
    Neutral: 0,
    Negative: 0,
    Mixed: 0,
  };

  if (analyzedRecords > 0) {
    VALID_SENTIMENTS.forEach(s => {
      sentimentPercentages[s] = Math.round((sentimentCounts[s] / analyzedRecords) * 1000) / 10;
    });
  }

  // Convert topics
  const topics: TopicRecord[] = Array.from(topicMap.values())
    .map(t => ({
      id: `top-${t.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label: t.label,
      description: t.description,
      occurrenceCount: t.occurrenceCount,
      distinctCount: t.distinctTexts.size,
      categories: Array.from(t.categoryCounts.entries()).map(([cat, count]) => ({
        category: cat,
        count,
      })),
      sentimentBreakdown: t.sentimentCounts,
      representativeExamples: Array.from(t.examples),
      recordIds: t.recordIds,
    }))
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount);

  // Convert complaints
  const complaints: ComplaintGroupRecord[] = Array.from(complaintMap.values())
    .map(c => ({
      id: `cmp-${c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: c.title,
      explanation: c.explanation,
      occurrenceCount: c.occurrenceCount,
      distinctCount: c.distinctTexts.size,
      categories: Array.from(c.categoryCounts.entries()).map(([cat, count]) => ({
        category: cat,
        count,
      })),
      representativeExamples: Array.from(c.examples),
      recordIds: c.recordIds,
    }))
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount);

  const coveragePercentage = totalRecords > 0
    ? Math.round((analyzedRecords / totalRecords) * 1000) / 10
    : 0;

  return {
    totalRecords,
    analyzedRecords,
    unanalyzedRecords,
    failedRecords,
    coveragePercentage,
    sentimentCounts,
    sentimentPercentages,
    categorySentiment,
    topics,
    complaints,
  };
}
