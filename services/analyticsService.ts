import { FeedbackCategory, FeedbackRecord, DatasetMetrics, VALID_CATEGORIES } from '../types/feedback';

/**
 * Calculates genuine metrics dynamically from the active feedback records.
 * Never hardcodes numbers or invents non-existent properties.
 */
export function calculateDatasetMetrics(records: FeedbackRecord[]): DatasetMetrics {
  const totalFeedback = records.length;

  if (totalFeedback === 0) {
    return {
      totalFeedback: 0,
      uniqueFeedbackCount: 0,
      categoryCount: 0,
      repeatedEntriesCount: 0,
      categoryBreakdown: VALID_CATEGORIES.map(category => ({
        category,
        count: 0,
        percentage: 0,
      })),
      topRecurring: [],
    };
  }

  // Count exact text occurrences
  const textCountMap = new Map<string, { count: number; category: FeedbackCategory }>();
  // Category counts
  const categoryCountMap = new Map<FeedbackCategory, number>();
  VALID_CATEGORIES.forEach(cat => categoryCountMap.set(cat, 0));

  for (const record of records) {
    // Normalise text slightly for exact match (trimmed)
    const key = record.text.trim();
    const existing = textCountMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      textCountMap.set(key, { count: 1, category: record.category });
    }

    const currentCatCount = categoryCountMap.get(record.category) || 0;
    categoryCountMap.set(record.category, currentCatCount + 1);
  }

  const uniqueFeedbackCount = textCountMap.size;
  // Repeated feedback entries is the number of records beyond their first unique instance
  const repeatedEntriesCount = totalFeedback - uniqueFeedbackCount;

  // Active categories with >0 items
  let activeCategories = 0;
  categoryCountMap.forEach(count => {
    if (count > 0) activeCategories++;
  });

  // Category breakdown
  const categoryBreakdown = VALID_CATEGORIES.map(cat => {
    const count = categoryCountMap.get(cat) || 0;
    const percentage = totalFeedback > 0 ? Math.round((count / totalFeedback) * 1000) / 10 : 0;
    return {
      category: cat,
      count,
      percentage,
    };
  }).sort((a, b) => b.count - a.count);

  // Top recurring entries (entries that appear more than once, sorted by count desc)
  const topRecurring: { text: string; count: number; category: FeedbackCategory }[] = [];
  textCountMap.forEach((val, key) => {
    if (val.count > 1) {
      topRecurring.push({
        text: key,
        count: val.count,
        category: val.category,
      });
    }
  });

  topRecurring.sort((a, b) => b.count - a.count);

  return {
    totalFeedback,
    uniqueFeedbackCount,
    categoryCount: activeCategories,
    repeatedEntriesCount,
    categoryBreakdown,
    topRecurring: topRecurring.slice(0, 8),
  };
}

/**
 * Computes frequency for a specific feedback text across the dataset.
 */
export function getFeedbackOccurrenceCount(records: FeedbackRecord[], text: string): number {
  const target = text.trim();
  let count = 0;
  for (const r of records) {
    if (r.text.trim() === target) {
      count++;
    }
  }
  return count;
}
