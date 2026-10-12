import {
  FeedbackRecord,
  DatasetMetrics,
  WorkspaceMetadata,
  AggregateInsights,
  IssueRecord,
  RecommendationRecord,
  IssueNote,
  IssueStatusHistory,
  ReportRecord,
  ReportType,
  ReportFilterScope,
  ReportFormat,
  SentimentType,
} from '../types/feedback';
import Papa from 'papaparse';

/**
 * Filters feedback records based on report scope.
 */
export function filterRecordsForReport(
  records: FeedbackRecord[],
  scope: ReportFilterScope
): FeedbackRecord[] {
  return records.filter(record => {
    if (scope.category !== 'all' && record.category !== scope.category) return false;
    if (scope.sentiment !== 'all') {
      const recordSent = record.analysis?.sentiment || 'Unanalyzed';
      if (recordSent !== scope.sentiment) return false;
    }
    return true;
  });
}

/**
 * Filters issues based on report scope.
 */
export function filterIssuesForReport(
  issues: IssueRecord[],
  scope: ReportFilterScope
): IssueRecord[] {
  return issues.filter(issue => {
    if (scope.category !== 'all') {
      const hasCat = issue.categoryDistribution.some(c => c.category === scope.category);
      if (!hasCat) return false;
    }
    if (scope.priority !== 'all' && issue.priorityBand !== scope.priority) return false;
    if (scope.issueStatus !== 'all' && issue.status !== scope.issueStatus) return false;
    return true;
  });
}

/**
 * Builds a structured report snapshot.
 */
export function generateReportSnapshot(
  title: string,
  reportType: ReportType,
  scope: ReportFilterScope,
  includedSections: string[],
  records: FeedbackRecord[],
  insights: AggregateInsights,
  metrics: DatasetMetrics,
  issues: IssueRecord[],
  recommendations: RecommendationRecord[],
  format: ReportFormat = 'pdf'
): ReportRecord {
  const filteredRecs = filterRecordsForReport(records, scope);
  const filteredIss = filterIssuesForReport(issues, scope);
  const filteredRecIds = new Set(filteredIss.map(i => i.id));
  const filteredRecommendations = recommendations.filter(r => filteredRecIds.has(r.issueId));

  const isAnalyzed = insights.analyzedRecords > 0;
  const criticalCount = filteredIss.filter(i => i.priorityBand === 'Critical').length;
  const highCount = filteredIss.filter(i => i.priorityBand === 'High').length;
  const openCount = filteredIss.filter(i => i.status === 'Open').length;
  const resolvedCount = filteredIss.filter(i => i.status === 'Resolved').length;
  const approvedCount = filteredRecommendations.filter(r => r.status === 'Approved').length;

  const limitations: string[] = [];
  if (!isAnalyzed) {
    limitations.push('AI semantic sentiment and topic analysis has not been executed on this dataset. Findings reflect exact repeated customer statements.');
  }
  if (scope.dateRange === undefined) {
    limitations.push('Source dataset contains no transaction timestamps. Chronological trends and time-series comparisons are excluded.');
  }
  if (filteredRecs.length < records.length) {
    limitations.push(`Report filtered by scope: category "${scope.category}", sentiment "${scope.sentiment}", priority "${scope.priority}".`);
  }

  const methodology = isAnalyzed
    ? 'Multi-stage decision support pipeline: 1) Deduplication & cluster identification; 2) Gemini 3.8 Flash inference with structured schema; 3) 5-factor logarithmic priority score; 4) Human-in-the-loop issue triage.'
    : 'Deterministic baseline pipeline: Exact-text recurrence frequency and rule-based category risk weighting without synthetic inference.';

  return {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    reportType,
    datasetName: scope.datasetName,
    createdAt: new Date().toISOString(),
    filters: scope,
    includedSections,
    summaryMetrics: {
      totalFeedback: filteredRecs.length,
      analyzedFeedback: filteredRecs.filter(r => r.analysis?.status === 'completed').length,
      coveragePercentage: filteredRecs.length > 0
        ? Math.round((filteredRecs.filter(r => r.analysis?.status === 'completed').length / filteredRecs.length) * 1000) / 10
        : 0,
      sentimentDistribution: isAnalyzed ? insights.sentimentCounts : undefined,
      criticalIssuesCount: criticalCount,
      highIssuesCount: highCount,
      openIssuesCount: openCount,
      resolvedIssuesCount: resolvedCount,
      approvedRecommendationsCount: approvedCount,
    },
    issuesIncluded: filteredIss.length,
    recommendationsIncluded: filteredRecommendations.length,
    status: 'Generated',
    generatedFormat: format,
    methodology,
    limitations,
  };
}

/**
 * Downloads a structured CSV export for specific data domains.
 */
export function exportDomainToCsv(
  domain: 'feedback' | 'sentiment' | 'topics' | 'complaints' | 'issues' | 'recommendations' | 'tracking',
  records: FeedbackRecord[],
  insights: AggregateInsights,
  issues: IssueRecord[],
  recommendations: RecommendationRecord[],
  notes: IssueNote[],
  statusHistory: IssueStatusHistory[],
  customFilename?: string
) {
  let rows: any[] = [];
  const filename = customFilename || `InsightFlow_${domain}_${Date.now()}.csv`;

  if (domain === 'feedback') {
    rows = records.map(r => ({
      ID: r.id,
      FeedbackText: r.text,
      Category: r.category,
      Source: r.source,
      CreatedAt: r.createdAt || 'N/A',
      Sentiment: r.analysis?.sentiment || 'Unanalyzed',
      Confidence: r.analysis?.confidence !== undefined ? `${Math.round(r.analysis.confidence * 100)}%` : '',
      Topic: r.analysis?.topicLabel || '',
      Complaint: r.analysis?.complaintTitle || '',
    }));
  } else if (domain === 'sentiment') {
    rows = records
      .filter(r => r.analysis?.status === 'completed')
      .map(r => ({
        RecordID: r.id,
        FeedbackText: r.text,
        Category: r.category,
        Sentiment: r.analysis?.sentiment,
        Confidence: `${Math.round((r.analysis?.confidence || 0) * 100)}%`,
        Explanation: r.analysis?.explanation,
        EvidenceQuote: r.analysis?.evidenceQuote,
        Method: r.analysis?.method,
      }));
  } else if (domain === 'topics') {
    rows = insights.topics.map(t => ({
      TopicID: t.id,
      Label: t.label,
      Description: t.description,
      TotalOccurrences: t.occurrenceCount,
      DistinctStatements: t.distinctCount,
      PositiveCount: t.sentimentBreakdown.Positive,
      NeutralCount: t.sentimentBreakdown.Neutral,
      NegativeCount: t.sentimentBreakdown.Negative,
      MixedCount: t.sentimentBreakdown.Mixed,
      AffectedCategories: t.categories.map(c => `${c.category} (${c.count})`).join('; '),
      SampleQuote: t.representativeExamples[0] || '',
    }));
  } else if (domain === 'complaints') {
    rows = insights.complaints.map(c => ({
      ComplaintID: c.id,
      Title: c.title,
      Explanation: c.explanation,
      TotalOccurrences: c.occurrenceCount,
      DistinctStatements: c.distinctCount,
      AffectedCategories: c.categories.map(cat => `${cat.category} (${cat.count})`).join('; '),
      SampleQuote: c.representativeExamples[0] || '',
    }));
  } else if (domain === 'issues') {
    rows = issues.map(i => ({
      IssueID: i.id,
      Title: i.title,
      Description: i.description,
      PriorityScore: i.priorityScore,
      PriorityBand: i.priorityBand,
      Status: i.status,
      Owner: i.owner || 'Unassigned',
      DueDate: i.dueDate || 'None',
      Occurrences: i.occurrenceCount,
      DistinctStatements: i.distinctCount,
      DominantCategory: i.categoryDistribution[0]?.category || 'N/A',
      SuggestedNextAction: i.suggestedNextAction,
      SampleVerbatimEvidence: i.representativeExamples[0] || '',
    }));
  } else if (domain === 'recommendations') {
    rows = recommendations.map(r => ({
      RecommendationID: r.id,
      LinkedIssueID: r.issueId,
      IssueTitle: r.issueTitle,
      ActionTitle: r.actionTitle,
      ActionDescription: r.actionDescription,
      Status: r.status,
      ExpectedOutcome: r.expectedOperationalOutcome,
      ImmediateNextStep: r.recommendedNextStep,
      GenerationMethod: r.generationMethod,
      ConfidenceProfile: r.confidenceOrUncertainty,
      SampleEvidence: r.supportingQuotes[0] || '',
    }));
  } else if (domain === 'tracking') {
    rows = statusHistory.map(h => ({
      AuditID: h.id,
      IssueID: h.issueId,
      PreviousStatus: h.previousStatus,
      NewStatus: h.newStatus,
      Timestamp: h.timestamp,
      Actor: h.actor,
      Reason: h.reason || '',
    }));
  }

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a full structured JSON export of the validated report snapshot.
 */
export function exportReportToJson(
  report: ReportRecord,
  records: FeedbackRecord[],
  insights: AggregateInsights,
  issues: IssueRecord[],
  recommendations: RecommendationRecord[]
) {
  const payload = {
    reportMetadata: report,
    summaryMetrics: report.summaryMetrics,
    scopeFilters: report.filters,
    issues: issues.slice(0, 25).map(i => ({
      id: i.id,
      title: i.title,
      description: i.description,
      priorityScore: i.priorityScore,
      priorityBand: i.priorityBand,
      status: i.status,
      occurrences: i.occurrenceCount,
      distinctStatements: i.distinctCount,
      priorityFactors: i.priorityExplanation.factors,
      suggestedAction: i.suggestedNextAction,
      evidenceQuotes: i.representativeExamples,
    })),
    recommendations: recommendations.slice(0, 25).map(r => ({
      id: r.id,
      issueId: r.issueId,
      actionTitle: r.actionTitle,
      actionDescription: r.actionDescription,
      expectedOutcome: r.expectedOperationalOutcome,
      nextStep: r.recommendedNextStep,
      status: r.status,
      generationMethod: r.generationMethod,
      supportingQuotes: r.supportingQuotes,
    })),
    topics: insights.topics.slice(0, 15).map(t => ({
      label: t.label,
      occurrences: t.occurrenceCount,
      distinctCount: t.distinctCount,
      sentimentBreakdown: t.sentimentBreakdown,
      categories: t.categories,
    })),
    dataMethodology: report.methodology,
    dataLimitations: report.limitations,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a self-contained, publication-ready executive HTML report
 * that opens cleanly in any browser and can be saved to PDF with Ctrl+P / Cmd+P.
 */
export function downloadExecutivePrintableReport(
  report: ReportRecord,
  records: FeedbackRecord[],
  insights: AggregateInsights,
  issues: IssueRecord[],
  recommendations: RecommendationRecord[]
) {
  const isAnalyzed = insights.analyzedRecords > 0;
  const topIssues = issues.slice(0, 10);
  const topRecs = recommendations.slice(0, 10);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${report.title} — InsightFlow Business Intelligence</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; font-size: 11pt; color: #1e293b; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      a { text-decoration: none; color: inherit; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 30px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 20px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand { font-size: 13px; font-weight: 800; color: #4f46e5; letter-spacing: 0.05em; text-transform: uppercase; }
    .title { font-size: 24px; font-weight: 800; margin: 4px 0; color: #0f172a; }
    .meta { font-size: 12px; color: #64748b; }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .badge-critical { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .badge-high { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-medium { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-low { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 25px;
    }
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
    }
    .metric-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .metric-val { font-size: 20px; font-weight: 800; color: #0f172a; font-family: monospace; margin-top: 4px; }
    h2 { font-size: 16px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 25px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 8px 10px; text-align: left; font-weight: 700; color: #334155; }
    td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; color: #1e293b; }
    blockquote {
      background: #f8fafc;
      border-left: 3px solid #6366f1;
      margin: 8px 0;
      padding: 8px 12px;
      font-style: italic;
      font-size: 12px;
      color: #334155;
    }
    .footer { margin-top: 35px; pt: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
    .print-bar {
      margin-bottom: 20px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .btn {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="print-bar no-print">
      <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <div class="header">
      <div>
        <div class="brand">InsightFlow — Decision Intelligence</div>
        <div class="title">${report.title}</div>
        <div class="meta">
          Dataset: <strong>${report.datasetName}</strong> • Generated: ${new Date(report.createdAt).toLocaleString()}
        </div>
      </div>
      <div style="text-align: right;">
        <span class="badge ${isAnalyzed ? 'badge-high' : 'badge-low'}">
          ${isAnalyzed ? 'AI-Analyzed Intelligence' : 'Exact Recurrence Baseline'}
        </span>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Report ID: ${report.id}</div>
      </div>
    </div>

    <!-- Executive Metrics Grid -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Feedback Volume</div>
        <div class="metric-val">${report.summaryMetrics.totalFeedback.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Analysis Coverage</div>
        <div class="metric-val">${report.summaryMetrics.coveragePercentage}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Critical Issues</div>
        <div class="metric-val" style="color: #b91c1c;">${report.summaryMetrics.criticalIssuesCount}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Open Issues</div>
        <div class="metric-val" style="color: #4f46e5;">${report.summaryMetrics.openIssuesCount}</div>
      </div>
    </div>

    <!-- Sentiment Breakdown (if available) -->
    ${
      isAnalyzed && report.summaryMetrics.sentimentDistribution
        ? `
    <h2>Customer Sentiment Polarity Distribution</h2>
    <table>
      <thead>
        <tr>
          <th>Sentiment Polarity</th>
          <th style="text-align: right;">Occurrences</th>
          <th style="text-align: right;">Share of Analyzed (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong style="color: #047857;">Positive</strong></td>
          <td style="text-align: right; font-family: monospace;">${report.summaryMetrics.sentimentDistribution.Positive.toLocaleString()}</td>
          <td style="text-align: right; font-family: monospace;">${((report.summaryMetrics.sentimentDistribution.Positive / Math.max(1, report.summaryMetrics.analyzedFeedback)) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td><strong style="color: #475569;">Neutral</strong></td>
          <td style="text-align: right; font-family: monospace;">${report.summaryMetrics.sentimentDistribution.Neutral.toLocaleString()}</td>
          <td style="text-align: right; font-family: monospace;">${((report.summaryMetrics.sentimentDistribution.Neutral / Math.max(1, report.summaryMetrics.analyzedFeedback)) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td><strong style="color: #b91c1c;">Negative</strong></td>
          <td style="text-align: right; font-family: monospace;">${report.summaryMetrics.sentimentDistribution.Negative.toLocaleString()}</td>
          <td style="text-align: right; font-family: monospace;">${((report.summaryMetrics.sentimentDistribution.Negative / Math.max(1, report.summaryMetrics.analyzedFeedback)) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td><strong style="color: #b45309;">Mixed</strong></td>
          <td style="text-align: right; font-family: monospace;">${report.summaryMetrics.sentimentDistribution.Mixed.toLocaleString()}</td>
          <td style="text-align: right; font-family: monospace;">${((report.summaryMetrics.sentimentDistribution.Mixed / Math.max(1, report.summaryMetrics.analyzedFeedback)) * 100).toFixed(1)}%</td>
        </tr>
      </tbody>
    </table>
    `
        : ''
    }

    <!-- Prioritized Issues -->
    <h2>Prioritized Problem Themes (Highest Urgency First)</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Problem Theme / Friction Description</th>
          <th>Category</th>
          <th style="text-align: right;">Occurrences</th>
          <th style="text-align: right;">Priority Score</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${topIssues
          .map(
            (issue, i) => `
          <tr>
            <td style="font-family: monospace; color: #64748b;">${i + 1}</td>
            <td>
              <strong>${issue.title}</strong>
              <div style="font-size: 11px; color: #64748b;">${issue.description}</div>
              ${issue.representativeExamples[0] ? `<blockquote>&ldquo;${issue.representativeExamples[0]}&rdquo;</blockquote>` : ''}
            </td>
            <td>${issue.categoryDistribution[0]?.category || 'N/A'}</td>
            <td style="text-align: right; font-family: monospace; font-weight: 700;">${issue.occurrenceCount.toLocaleString()}</td>
            <td style="text-align: right;">
              <span class="badge ${
                issue.priorityBand === 'Critical'
                  ? 'badge-critical'
                  : issue.priorityBand === 'High'
                  ? 'badge-high'
                  : issue.priorityBand === 'Medium'
                  ? 'badge-medium'
                  : 'badge-low'
              }">
                ${issue.priorityBand} (${issue.priorityScore})
              </span>
            </td>
            <td><strong>${issue.status}</strong></td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <!-- Action Recommendations -->
    <h2>Synthesized Remediation Recommendations</h2>
    <table>
      <thead>
        <tr>
          <th>Issue</th>
          <th>Recommended Action Plan</th>
          <th>Expected Outcome</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${topRecs
          .map(
            rec => `
          <tr>
            <td><strong>${rec.issueTitle}</strong></td>
            <td>
              <strong>${rec.actionTitle}</strong>
              <div style="font-size: 11px; color: #475569; margin-top: 2px;">${rec.actionDescription}</div>
              <div style="font-size: 10px; color: #6366f1; margin-top: 2px;">Next Step: ${rec.recommendedNextStep}</div>
            </td>
            <td style="font-size: 11px; color: #047857;">${rec.expectedOperationalOutcome}</td>
            <td><span class="badge badge-medium">${rec.status}</span></td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <!-- Methodology & Limitations -->
    <h2>Audit Methodology & Data Limitations</h2>
    <div style="font-size: 11px; color: #475569; line-height: 1.6;">
      <p><strong>Calculation Methodology:</strong> ${report.methodology}</p>
      <ul>
        ${report.limitations.map(lim => `<li>${lim}</li>`).join('')}
      </ul>
      <p><em>Notice: Priority scores represent transparent decision-support rankings based on customer volume, dissatisfaction proportion, and category risk index. They do not constitute objective financial loss measurements.</em></p>
    </div>

    <div class="footer">
      Generated automatically by InsightFlow Platform • Evaluated across ${report.summaryMetrics.totalFeedback.toLocaleString()} customer reports.
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
