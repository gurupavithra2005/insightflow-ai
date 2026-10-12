import {
  FeedbackCategory,
  SentimentType,
  PriorityBand,
  PriorityScoreExplanation,
  CategoryRelevanceConfig,
  PriorityBandThresholds,
  FactorScoreBreakdown,
} from '../types/feedback';

export const DEFAULT_CATEGORY_RELEVANCE: CategoryRelevanceConfig = {
  'Fraud and Scam': 95, // High regulatory, legal, and financial risk
  'Operational Issues': 85, // Core operational service disruption
  'Customer Service': 70, // Direct customer support and relationship friction
  'Product Feedback': 65, // Usability, feature requests, and UX ergonomics
};

export const DEFAULT_PRIORITY_THRESHOLDS: PriorityBandThresholds = {
  critical: 80,
  high: 60,
  medium: 35,
  low: 0,
};

export interface PriorityScoringContext {
  maxOccurrenceInDataset: number;
  maxDistinctInDataset: number;
  categoryRelevanceConfig?: CategoryRelevanceConfig;
  thresholds?: PriorityBandThresholds;
}

export interface IssueScoringInput {
  occurrenceCount: number;
  distinctCount: number;
  categoryDistribution: { category: FeedbackCategory; count: number }[];
  sentimentDistribution?: Record<SentimentType, number>;
  averageConfidence?: number; // 0.0 to 1.0
  isAnalyzed: boolean;
}

/**
 * Calculates deterministic, explainable priority score (0-100)
 * with documented logarithmic scaling and transparent weight renormalization.
 */
export function calculatePriorityScore(
  input: IssueScoringInput,
  context: PriorityScoringContext
): PriorityScoreExplanation {
  const categoryConfig = context.categoryRelevanceConfig || DEFAULT_CATEGORY_RELEVANCE;
  const thresholds = context.thresholds || DEFAULT_PRIORITY_THRESHOLDS;

  // 1. Recurrence Factor (30% raw weight)
  // Logarithmic scaling ensures high volume is prioritized while preventing a single dominant complaint from suppressing all others.
  const maxOcc = Math.max(context.maxOccurrenceInDataset, 1);
  const occNorm = Math.log(input.occurrenceCount + 1) / Math.log(maxOcc + 1);
  const recurrenceScore = Math.min(100, Math.max(0, Math.round(occNorm * 100)));

  // 2. Sentiment Severity Factor (30% raw weight)
  let sentimentAvailable = false;
  let sentimentScore = 0;
  let negativeCount = 0;
  let mixedCount = 0;
  let totalEvaluatedSentiment = 0;

  if (input.isAnalyzed && input.sentimentDistribution) {
    negativeCount = input.sentimentDistribution.Negative || 0;
    mixedCount = input.sentimentDistribution.Mixed || 0;
    const positiveCount = input.sentimentDistribution.Positive || 0;
    const neutralCount = input.sentimentDistribution.Neutral || 0;
    totalEvaluatedSentiment = negativeCount + mixedCount + positiveCount + neutralCount;

    if (totalEvaluatedSentiment > 0) {
      sentimentAvailable = true;
      // Negative weighted 1.0, Mixed weighted 0.6, Neutral/Positive weighted 0.0
      const severityRatio = (negativeCount * 1.0 + mixedCount * 0.6) / totalEvaluatedSentiment;
      sentimentScore = Math.min(100, Math.max(0, Math.round(severityRatio * 100)));
    }
  }

  // 3. Category Relevance Factor (15% raw weight)
  let categoryScore = 0;
  let totalCategoryItems = 0;
  let totalWeightedCategory = 0;

  input.categoryDistribution.forEach(cd => {
    const rel = categoryConfig[cd.category] ?? 70;
    totalWeightedCategory += cd.count * rel;
    totalCategoryItems += cd.count;
  });

  if (totalCategoryItems > 0) {
    categoryScore = Math.min(100, Math.max(0, Math.round(totalWeightedCategory / totalCategoryItems)));
  } else {
    categoryScore = 70;
  }
  const categoryAvailable = true;

  // 4. Distinct Supporting Statements Factor (15% raw weight)
  const maxDist = Math.max(context.maxDistinctInDataset, 1);
  const distNorm = Math.log(input.distinctCount + 1) / Math.log(maxDist + 1);
  const distinctScore = Math.min(100, Math.max(0, Math.round(distNorm * 100)));
  const distinctAvailable = true;

  // 5. Analysis Confidence Factor (10% raw weight)
  let confidenceAvailable = false;
  let confidenceScore = 0;
  if (input.isAnalyzed && input.averageConfidence !== undefined && input.averageConfidence > 0) {
    confidenceAvailable = true;
    confidenceScore = Math.min(100, Math.max(0, Math.round(input.averageConfidence * 100)));
  }

  // Define raw factor weights
  const RAW_WEIGHTS = {
    recurrence: 0.30,
    sentimentSeverity: 0.30,
    categoryRelevance: 0.15,
    distinctEvidence: 0.15,
    analysisConfidence: 0.10,
  };

  // Determine available factors & calculate sum of available weights
  let sumAvailableWeights = RAW_WEIGHTS.recurrence + RAW_WEIGHTS.categoryRelevance + RAW_WEIGHTS.distinctEvidence;
  if (sentimentAvailable) sumAvailableWeights += RAW_WEIGHTS.sentimentSeverity;
  if (confidenceAvailable) sumAvailableWeights += RAW_WEIGHTS.analysisConfidence;

  // Renormalize weights so sum(normalizedWeights) === 1.0 (100%)
  const normWeightRecurrence = RAW_WEIGHTS.recurrence / sumAvailableWeights;
  const normWeightCategory = RAW_WEIGHTS.categoryRelevance / sumAvailableWeights;
  const normWeightDistinct = RAW_WEIGHTS.distinctEvidence / sumAvailableWeights;
  const normWeightSentiment = sentimentAvailable ? RAW_WEIGHTS.sentimentSeverity / sumAvailableWeights : 0;
  const normWeightConfidence = confidenceAvailable ? RAW_WEIGHTS.analysisConfidence / sumAvailableWeights : 0;

  const contribRecurrence = recurrenceScore * normWeightRecurrence;
  const contribCategory = categoryScore * normWeightCategory;
  const contribDistinct = distinctScore * normWeightDistinct;
  const contribSentiment = sentimentScore * normWeightSentiment;
  const contribConfidence = confidenceScore * normWeightConfidence;

  const rawTotal = contribRecurrence + contribCategory + contribDistinct + contribSentiment + contribConfidence;
  const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal * 10) / 10));

  // Determine priority band based on configurable thresholds
  let priorityBand: PriorityBand = 'Low';
  if (totalScore >= thresholds.critical) {
    priorityBand = 'Critical';
  } else if (totalScore >= thresholds.high) {
    priorityBand = 'High';
  } else if (totalScore >= thresholds.medium) {
    priorityBand = 'Medium';
  } else {
    priorityBand = 'Low';
  }

  const missingFactorNames: string[] = [];
  const limitations: string[] = [];

  if (!sentimentAvailable) {
    missingFactorNames.push('Sentiment Severity (30% base weight)');
    limitations.push('Sentiment analysis not executed or empty. 30% weight was redistributed proportionally across recurrence, category relevance, and distinct evidence factors.');
  }

  if (!confidenceAvailable) {
    missingFactorNames.push('Analysis Confidence (10% base weight)');
    limitations.push('Model confidence scores unavailable. 10% weight was redistributed proportionally across remaining active factors.');
  }

  const factors: {
    recurrence: FactorScoreBreakdown;
    sentimentSeverity: FactorScoreBreakdown;
    categoryRelevance: FactorScoreBreakdown;
    distinctEvidence: FactorScoreBreakdown;
    analysisConfidence: FactorScoreBreakdown;
  } = {
    recurrence: {
      score: recurrenceScore,
      rawWeight: RAW_WEIGHTS.recurrence,
      normalizedWeight: Math.round(normWeightRecurrence * 1000) / 1000,
      weightedContribution: Math.round(contribRecurrence * 10) / 10,
      available: true,
      explanation: `${input.occurrenceCount.toLocaleString('en-US')} total feedback occurrences (normalized logarithmically against dataset max of ${maxOcc.toLocaleString('en-US')}).`,
      metrics: {
        occurrenceCount: input.occurrenceCount,
        maxDatasetOccurrences: maxOcc,
        logNormalizedRatio: Math.round(occNorm * 100) / 100,
      },
    },
    sentimentSeverity: {
      score: sentimentScore,
      rawWeight: RAW_WEIGHTS.sentimentSeverity,
      normalizedWeight: Math.round(normWeightSentiment * 1000) / 1000,
      weightedContribution: Math.round(contribSentiment * 10) / 10,
      available: sentimentAvailable,
      explanation: sentimentAvailable
        ? `${negativeCount} negative and ${mixedCount} mixed reviews out of ${totalEvaluatedSentiment} evaluated (${Math.round(((negativeCount + mixedCount) / totalEvaluatedSentiment) * 100)}% dissatisfaction rate).`
        : 'Sentiment analysis has not been conducted for this dataset yet.',
      metrics: {
        available: sentimentAvailable,
        negativeCount,
        mixedCount,
        totalEvaluated: totalEvaluatedSentiment,
      },
    },
    categoryRelevance: {
      score: categoryScore,
      rawWeight: RAW_WEIGHTS.categoryRelevance,
      normalizedWeight: Math.round(normWeightCategory * 1000) / 1000,
      weightedContribution: Math.round(contribCategory * 10) / 10,
      available: categoryAvailable,
      explanation: `Weighted category risk index calculated across ${input.categoryDistribution.map(c => `${c.category} (${c.count})`).join(', ')}.`,
      metrics: {
        calculatedScore: categoryScore,
        categoryCount: input.categoryDistribution.length,
      },
    },
    distinctEvidence: {
      score: distinctScore,
      rawWeight: RAW_WEIGHTS.distinctEvidence,
      normalizedWeight: Math.round(normWeightDistinct * 1000) / 1000,
      weightedContribution: Math.round(contribDistinct * 10) / 10,
      available: distinctAvailable,
      explanation: `${input.distinctCount} distinct feedback phrasing variations supporting this issue (logarithmically scaled against max ${maxDist}).`,
      metrics: {
        distinctCount: input.distinctCount,
        maxDatasetDistinct: maxDist,
      },
    },
    analysisConfidence: {
      score: confidenceScore,
      rawWeight: RAW_WEIGHTS.analysisConfidence,
      normalizedWeight: Math.round(normWeightConfidence * 1000) / 1000,
      weightedContribution: Math.round(contribConfidence * 10) / 10,
      available: confidenceAvailable,
      explanation: confidenceAvailable
        ? `Validated average classification confidence of ${Math.round(confidenceScore)}% across supporting feedback items.`
        : 'Model confidence metric unavailable in current analysis state.',
      metrics: {
        available: confidenceAvailable,
        confidenceScore,
      },
    },
  };

  const applicableFactorsCount = Object.values(factors).filter(f => f.available).length;
  const missingFactorsCount = Object.values(factors).filter(f => !f.available).length;

  return {
    totalScore,
    priorityBand,
    applicableFactorsCount,
    missingFactorsCount,
    factors,
    missingFactorNames,
    normalizationMethod: 'Logarithmic scaling with proportional renormalization for absent factors (sum of active normalized weights = 100%)',
    limitations,
  };
}
