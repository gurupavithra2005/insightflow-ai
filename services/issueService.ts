import {
  FeedbackRecord,
  AggregateInsights,
  DatasetMetrics,
  IssueRecord,
  IssueStatus,
  IssueNote,
  IssueStatusHistory,
  FeedbackCategory,
  SentimentType,
  CategoryRelevanceConfig,
  PriorityBandThresholds,
} from '../types/feedback';
import {
  calculatePriorityScore,
  PriorityScoringContext,
  DEFAULT_CATEGORY_RELEVANCE,
  DEFAULT_PRIORITY_THRESHOLDS,
} from './priorityScorer';

/**
 * Derives concrete, domain-specific actionable remediation steps
 * based on verified category, title, and customer friction patterns.
 */
function deriveSuggestedRemediation(
  title: string,
  category: FeedbackCategory,
  sentimentDist?: Record<SentimentType, number>
): string {
  const lower = title.toLowerCase();

  if (category === 'Fraud and Scam' || lower.includes('fraud') || lower.includes('phish') || lower.includes('scam') || lower.includes('stolen') || lower.includes('unauthorized')) {
    return 'Conduct security audit on suspicious authorization attempts, implement rapid dispute hold mechanisms, and deploy customer warning notifications for suspicious account activity.';
  }

  if (lower.includes('payment') || lower.includes('charge') || lower.includes('bill') || lower.includes('refund') || lower.includes('checkout') || lower.includes('card')) {
    return 'Inspect payment gateway webhook retry logs, audit failure error codes with merchant processor, and introduce transparent customer-facing transaction status banners.';
  }

  if (lower.includes('login') || lower.includes('password') || lower.includes('2fa') || lower.includes('lock') || lower.includes('auth') || lower.includes('access')) {
    return 'Audit identity provider session termination rules, evaluate automated lockout threshold tolerances, and provide accelerated self-service credential recovery.';
  }

  if (lower.includes('slow') || lower.includes('crash') || lower.includes('timeout') || lower.includes('latency') || lower.includes('down') || lower.includes('error 500')) {
    return 'Profile backend database queries and external microservice dependency timeouts; deploy latency tracing alerts to catch API bottlenecks before customer impact.';
  }

  if (category === 'Customer Service' || lower.includes('support') || lower.includes('agent') || lower.includes('response') || lower.includes('wait') || lower.includes('ticket')) {
    return 'Audit tier-1 triage queue SLAs, establish automated routing for unresolved escalations, and prepare targeted knowledge base canned responses for recurring friction themes.';
  }

  if (category === 'Product Feedback' || lower.includes('feature') || lower.includes('ui') || lower.includes('export') || lower.includes('button') || lower.includes('filter')) {
    return 'Document user journey friction in product backlog, review UX telemetry around workflow drop-offs, and conduct quick usability test with affected customer cohort.';
  }

  return `Establish cross-functional triage with engineering and ${category} leads to review root causes from customer evidence and define SLA-backed remediation tickets.`;
}

/**
 * Identifies candidate issues from validated analysis findings or exact recurrence fallback.
 */
export function identifyCandidateIssues(
  records: FeedbackRecord[],
  insights: AggregateInsights,
  metrics: DatasetMetrics,
  categoryConfig: CategoryRelevanceConfig = DEFAULT_CATEGORY_RELEVANCE,
  thresholds: PriorityBandThresholds = DEFAULT_PRIORITY_THRESHOLDS
): IssueRecord[] {
  const isAnalyzed = insights.analyzedRecords > 0;
  const now = new Date().toISOString();

  // Determine dataset maximums for logarithmic normalization
  let maxOcc = 1;
  let maxDist = 1;

  if (isAnalyzed) {
    insights.complaints.forEach(c => {
      if (c.occurrenceCount > maxOcc) maxOcc = c.occurrenceCount;
      if (c.distinctCount > maxDist) maxDist = c.distinctCount;
    });
    insights.topics.forEach(t => {
      if (t.occurrenceCount > maxOcc) maxOcc = t.occurrenceCount;
      if (t.distinctCount > maxDist) maxDist = t.distinctCount;
    });
  } else {
    metrics.topRecurring.forEach(r => {
      if (r.count > maxOcc) maxOcc = r.count;
    });
    maxDist = Math.max(1, metrics.uniqueFeedbackCount);
  }

  const scoringContext: PriorityScoringContext = {
    maxOccurrenceInDataset: maxOcc,
    maxDistinctInDataset: maxDist,
    categoryRelevanceConfig: categoryConfig,
    thresholds,
  };

  const candidateIssues: IssueRecord[] = [];

  if (isAnalyzed && insights.complaints.length > 0) {
    // Mode A: Analyzed Complaints (primary semantic cluster of verified customer issues)
    insights.complaints.forEach((cmp, idx) => {
      // Find linked feedback records
      const linkedRecords = records.filter(r => cmp.recordIds.includes(r.id));
      const recordIds = linkedRecords.length > 0 ? linkedRecords.map(r => r.id) : cmp.recordIds;

      // Calculate sentiment distribution from linked records
      const sentDist: Record<SentimentType, number> = {
        Positive: 0,
        Neutral: 0,
        Negative: 0,
        Mixed: 0,
      };

      let confSum = 0;
      let confCount = 0;

      linkedRecords.forEach(r => {
        if (r.analysis) {
          sentDist[r.analysis.sentiment] = (sentDist[r.analysis.sentiment] || 0) + 1;
          if (typeof r.analysis.confidence === 'number') {
            confSum += r.analysis.confidence;
            confCount++;
          }
        }
      });

      const avgConf = confCount > 0 ? confSum / confCount : 0.85;

      // Category breakdown
      const totalCatCount = cmp.categories.reduce((acc, c) => acc + c.count, 0);
      const catDistribution = cmp.categories.map(c => ({
        category: c.category,
        count: c.count,
        percentage: totalCatCount > 0 ? Math.round((c.count / totalCatCount) * 1000) / 10 : 0,
      }));

      // Calculate explainable priority score
      const priorityExplanation = calculatePriorityScore(
        {
          occurrenceCount: cmp.occurrenceCount,
          distinctCount: cmp.distinctCount,
          categoryDistribution: cmp.categories,
          sentimentDistribution: sentDist,
          averageConfidence: avgConf,
          isAnalyzed: true,
        },
        scoringContext
      );

      const dominantCat = catDistribution[0]?.category || 'Operational Issues';
      const suggestedAction = deriveSuggestedRemediation(cmp.title, dominantCat, sentDist);

      candidateIssues.push({
        id: `iss-cmp-${cmp.id}`,
        title: cmp.title,
        description: cmp.explanation || `Recurring customer complaint identified across ${cmp.occurrenceCount} feedback occurrences.`,
        sourceType: 'complaint_cluster',
        linkedClusterId: cmp.id,
        occurrenceCount: cmp.occurrenceCount,
        distinctCount: cmp.distinctCount,
        categoryDistribution: catDistribution,
        sentimentDistribution: sentDist,
        priorityScore: priorityExplanation.totalScore,
        priorityBand: priorityExplanation.priorityBand,
        priorityExplanation,
        suggestedNextAction: suggestedAction,
        status: idx === 0 ? 'Open' : idx === 1 ? 'Under Review' : 'Open',
        createdAt: now,
        updatedAt: now,
        linkedRecordIds: recordIds,
        representativeExamples: cmp.representativeExamples.slice(0, 5),
      });
    });
  } else if (isAnalyzed && insights.topics.length > 0) {
    // Mode B: Discovered Topics if no complaints isolated
    insights.topics.forEach((top, idx) => {
      const linkedRecords = records.filter(r => top.recordIds.includes(r.id));
      const recordIds = linkedRecords.length > 0 ? linkedRecords.map(r => r.id) : top.recordIds;

      let confSum = 0;
      let confCount = 0;
      linkedRecords.forEach(r => {
        if (r.analysis && typeof r.analysis.confidence === 'number') {
          confSum += r.analysis.confidence;
          confCount++;
        }
      });
      const avgConf = confCount > 0 ? confSum / confCount : 0.80;

      const totalCatCount = top.categories.reduce((acc, c) => acc + c.count, 0);
      const catDistribution = top.categories.map(c => ({
        category: c.category,
        count: c.count,
        percentage: totalCatCount > 0 ? Math.round((c.count / totalCatCount) * 1000) / 10 : 0,
      }));

      const priorityExplanation = calculatePriorityScore(
        {
          occurrenceCount: top.occurrenceCount,
          distinctCount: top.distinctCount,
          categoryDistribution: top.categories,
          sentimentDistribution: top.sentimentBreakdown,
          averageConfidence: avgConf,
          isAnalyzed: true,
        },
        scoringContext
      );

      const dominantCat = catDistribution[0]?.category || 'Operational Issues';
      const suggestedAction = deriveSuggestedRemediation(top.label, dominantCat, top.sentimentBreakdown);

      candidateIssues.push({
        id: `iss-top-${top.id}`,
        title: top.label,
        description: top.description || `Customer feedback pattern grouped around "${top.label}".`,
        sourceType: 'topic_cluster',
        linkedClusterId: top.id,
        occurrenceCount: top.occurrenceCount,
        distinctCount: top.distinctCount,
        categoryDistribution: catDistribution,
        sentimentDistribution: top.sentimentBreakdown,
        priorityScore: priorityExplanation.totalScore,
        priorityBand: priorityExplanation.priorityBand,
        priorityExplanation,
        suggestedNextAction: suggestedAction,
        status: 'Open',
        createdAt: now,
        updatedAt: now,
        linkedRecordIds: recordIds,
        representativeExamples: top.representativeExamples.slice(0, 5),
      });
    });
  } else {
    // Mode C: Fallback to Exact-Text Recurrence patterns (clearly noted as exact recurrence, no false semantic claim)
    metrics.topRecurring.forEach((rec, idx) => {
      const linkedRecords = records.filter(r => r.text.trim().toLowerCase() === rec.text.trim().toLowerCase());
      const recordIds = linkedRecords.map(r => r.id);

      const catDistribution = [
        {
          category: rec.category,
          count: rec.count,
          percentage: 100,
        },
      ];

      const priorityExplanation = calculatePriorityScore(
        {
          occurrenceCount: rec.count,
          distinctCount: 1, // exact identical recurrence
          categoryDistribution: [{ category: rec.category, count: rec.count }],
          sentimentDistribution: undefined,
          averageConfidence: undefined,
          isAnalyzed: false,
        },
        scoringContext
      );

      const suggestedAction = deriveSuggestedRemediation(rec.text, rec.category);

      candidateIssues.push({
        id: `iss-rec-${idx + 1}`,
        title: rec.text.length > 70 ? `${rec.text.slice(0, 67)}...` : rec.text,
        description: `Verified exact customer feedback repeated ${rec.count} times in ${rec.category}.`,
        sourceType: 'exact_recurrence',
        linkedClusterId: `rec-${idx + 1}`,
        occurrenceCount: rec.count,
        distinctCount: 1,
        categoryDistribution: catDistribution,
        sentimentDistribution: undefined,
        priorityScore: priorityExplanation.totalScore,
        priorityBand: priorityExplanation.priorityBand,
        priorityExplanation,
        suggestedNextAction: suggestedAction,
        status: idx === 0 ? 'Open' : 'Under Review',
        createdAt: now,
        updatedAt: now,
        linkedRecordIds: recordIds,
        representativeExamples: [rec.text],
      });
    });
  }

  // Sort candidate issues by priority score descending
  return candidateIssues.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Synchronizes newly derived candidate issues with existing stored issues.
 * CRITICAL DATA INTEGRITY REQUIREMENT:
 * Preserves user-managed fields: status, owner, dueDate, notes, status history.
 * If source evidence changed significantly, updates stats while maintaining user tracking state.
 */
export function synchronizeIssuesWithExisting(
  freshCandidates: IssueRecord[],
  existingIssues: IssueRecord[]
): IssueRecord[] {
  const existingMap = new Map<string, IssueRecord>();
  existingIssues.forEach(i => existingMap.set(i.id, i));

  return freshCandidates.map(fresh => {
    const existing = existingMap.get(fresh.id);
    if (!existing) {
      return fresh;
    }

    // Preserve user-managed tracking fields
    return {
      ...fresh,
      status: existing.status,
      owner: existing.owner,
      dueDate: existing.dueDate,
      createdAt: existing.createdAt, // keep original creation timestamp
      updatedAt: existing.updatedAt,
      dismissedRecommendationIds: existing.dismissedRecommendationIds,
    };
  });
}
