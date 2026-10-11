import Papa from 'papaparse';
import { FeedbackCategory, FeedbackRecord, VALID_CATEGORIES, CsvValidationSummary } from '../types/feedback';

export interface CsvParseResult {
  summary: CsvValidationSummary;
  records: FeedbackRecord[];
  rawHeaders: string[];
  rawRows: Record<string, string>[];
}

/**
 * Normalizes user category strings to canonical FeedbackCategory.
 */
export function normalizeCategory(val: string): FeedbackCategory | null {
  if (!val) return null;
  const clean = val.trim().toLowerCase();

  for (const cat of VALID_CATEGORIES) {
    if (cat.toLowerCase() === clean) {
      return cat;
    }
  }

  // Common aliases
  if (clean.includes('operation') || clean.includes('bug') || clean.includes('issue') || clean.includes('technical')) {
    return 'Operational Issues';
  }
  if (clean.includes('fraud') || clean.includes('scam') || clean.includes('phish') || clean.includes('security')) {
    return 'Fraud and Scam';
  }
  if (clean.includes('product') || clean.includes('feature') || clean.includes('ui') || clean.includes('ux') || clean.includes('request')) {
    return 'Product Feedback';
  }
  if (clean.includes('customer') || clean.includes('service') || clean.includes('support') || clean.includes('agent')) {
    return 'Customer Service';
  }

  return null;
}

/**
 * Parses and validates CSV string content with defensive error handling.
 */
export function parseAndValidateCsv(
  csvContent: string,
  userReviewCol?: string,
  userCategoryCol?: string
): CsvParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: h => h.trim(),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    // Only capture critical parsing errors, ignore mild row delimiter notes
    parsed.errors.forEach(err => {
      if (err.type !== 'Delimiter') {
        warnings.push(`Row ${err.row || '?'}: ${err.message}`);
      }
    });
  }

  const rawRows = parsed.data || [];
  const rawHeaders = parsed.meta.fields || [];

  if (rawHeaders.length === 0 || rawRows.length === 0) {
    return {
      summary: {
        isValid: false,
        totalRowsDetected: 0,
        validRowsCount: 0,
        invalidRowsCount: 0,
        detectedHeaders: rawHeaders,
        mappedReviewColumn: null,
        mappedCategoryColumn: null,
        previewRows: [],
        categoryStats: {},
        errors: ['The uploaded CSV file is empty or contains no readable rows.'],
        warnings: [],
      },
      records: [],
      rawHeaders,
      rawRows: [],
    };
  }

  // Detect or apply review column
  let reviewCol: string | null = userReviewCol || null;
  if (!reviewCol) {
    const candidates = ['review', 'feedback', 'comment', 'text', 'message', 'description', 'content'];
    reviewCol = rawHeaders.find(h => candidates.includes(h.toLowerCase())) || null;
    if (!reviewCol && rawHeaders.length > 0) {
      // Fallback to first column if no candidate matches
      reviewCol = rawHeaders[0];
    }
  }

  // Detect or apply category column
  let categoryCol: string | null = userCategoryCol || null;
  if (!categoryCol) {
    const candidates = ['category', 'category_label', 'topic', 'tag', 'type', 'class', 'label'];
    categoryCol = rawHeaders.find(h => candidates.includes(h.toLowerCase())) || null;
    if (!categoryCol && rawHeaders.length > 1) {
      // Fallback to second column if exists
      categoryCol = rawHeaders[1];
    }
  }

  if (!reviewCol) {
    errors.push('Could not detect a feedback/review text column. Please specify column mapping.');
  }
  if (!categoryCol) {
    errors.push('Could not detect a category column. Please specify column mapping.');
  }

  const previewRows: CsvValidationSummary['previewRows'] = [];
  const categoryStats: Record<string, number> = {};
  const validRecords: FeedbackRecord[] = [];
  let invalidCount = 0;

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const rawText = reviewCol ? (row[reviewCol] || '').trim() : '';
    const rawCat = categoryCol ? (row[categoryCol] || '').trim() : '';

    const normalizedCat = normalizeCategory(rawCat);
    const isValidRow = rawText.length > 0 && normalizedCat !== null;

    if (normalizedCat) {
      categoryStats[normalizedCat] = (categoryStats[normalizedCat] || 0) + 1;
    } else if (rawCat.length > 0) {
      categoryStats[`[Unrecognized: ${rawCat.slice(0, 20)}]`] =
        (categoryStats[`[Unrecognized: ${rawCat.slice(0, 20)}]`] || 0) + 1;
    }

    if (idx < 10) {
      previewRows.push({
        rowNumber: rowNum,
        review: rawText || '(Empty)',
        category: rawCat || '(Missing)',
        isValidCategory: normalizedCat !== null,
      });
    }

    if (isValidRow) {
      validRecords.push({
        id: `import-${rowNum}-${Date.now()}-${idx}`,
        text: rawText,
        category: normalizedCat!,
        source: 'import',
        rowNumber: rowNum,
      });
    } else {
      invalidCount++;
      if (invalidCount <= 5) {
        if (!rawText) {
          warnings.push(`Row ${rowNum}: review text is empty.`);
        } else if (!normalizedCat) {
          warnings.push(`Row ${rowNum}: unrecognized category "${rawCat || 'empty'}".`);
        }
      }
    }
  });

  if (invalidCount > 5) {
    warnings.push(`...and ${invalidCount - 5} additional rows had missing text or unrecognized categories.`);
  }

  const isValid = errors.length === 0 && validRecords.length > 0;

  return {
    summary: {
      isValid,
      totalRowsDetected: rawRows.length,
      validRowsCount: validRecords.length,
      invalidRowsCount: invalidCount,
      detectedHeaders: rawHeaders,
      mappedReviewColumn: reviewCol,
      mappedCategoryColumn: categoryCol,
      previewRows,
      categoryStats,
      errors,
      warnings,
    },
    records: validRecords,
    rawHeaders,
    rawRows,
  };
}
