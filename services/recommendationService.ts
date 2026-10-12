import {
  IssueRecord,
  RecommendationRecord,
  FeedbackCategory,
} from '../types/feedback';

/**
 * Generates a high-fidelity, deterministic rule-based recommendation
 * grounded directly in the issue's verified data, quotes, and categories.
 * Explicitly labeled as rule-based heuristic.
 */
export function generateRuleBasedRecommendation(issue: IssueRecord): RecommendationRecord {
  const dominantCategory = issue.categoryDistribution[0]?.category || 'Operational Issues';
  const quotes = issue.representativeExamples.slice(0, 3);
  const now = new Date().toISOString();

  let actionTitle = '';
  let actionDescription = '';
  let reason = '';
  let expectedOutcome = '';
  let nextStep = '';

  const lower = issue.title.toLowerCase();

  if (dominantCategory === 'Fraud and Scam' || lower.includes('phish') || lower.includes('scam') || lower.includes('fraud') || lower.includes('stolen')) {
    actionTitle = `Deploy Account Protection Protocols & Threat Review for ${issue.title}`;
    actionDescription = `Audit authentication and session logs for compromised accounts, initiate automated security review of reported scam patterns, and send targeted security advisories to at-risk accounts.`;
    reason = `Backed by ${issue.occurrenceCount.toLocaleString('en-US')} customer reports alleging unauthorized access and fraudulent contact. High priority risk score of ${issue.priorityScore}/100.`;
    expectedOutcome = `Prevent account takeover incidents, eliminate credential theft vulnerability, and re-establish user trust.`;
    nextStep = `Review transaction/login audit logs for affected accounts and deploy anti-phishing in-app warning banners.`;
  } else if (lower.includes('payment') || lower.includes('charge') || lower.includes('bill') || lower.includes('refund') || lower.includes('checkout') || lower.includes('card')) {
    actionTitle = `Investigate Gateway Error Codes & Implement Fallback Processing`;
    actionDescription = `Audit merchant processor API timeout rates, inspect gateway response webhooks, and add a resilient retry flow with clear customer error messaging.`;
    reason = `Identified across ${issue.occurrenceCount.toLocaleString('en-US')} customer occurrences (${issue.distinctCount} distinct statements) detailing payment friction.`;
    expectedOutcome = `Reduce checkout abandonment, decrease payment support ticket escalations, and protect successful transaction throughput.`;
    nextStep = `Replicate failure scenarios in staging environment against the payment gateway sandbox and monitor failure error distribution.`;
  } else if (lower.includes('login') || lower.includes('password') || lower.includes('lock') || lower.includes('2fa') || lower.includes('auth')) {
    actionTitle = `Streamline Identity Verification & Recovery Flow`;
    actionDescription = `Evaluate session expiration timeouts, audit lockout thresholds, and provide an accelerated self-service verification channel for legitimate users.`;
    reason = `${issue.occurrenceCount.toLocaleString('en-US')} customers reported being locked out or encountering repetitive credential challenges.`;
    expectedOutcome = `Restore user access promptly without compromising security guardrails, reducing tier-1 help desk load.`;
    nextStep = `Map user friction drop-off points in authentication flow and verify 2FA SMS/authenticator delivery metrics.`;
  } else if (lower.includes('slow') || lower.includes('latency') || lower.includes('crash') || lower.includes('timeout') || lower.includes('down')) {
    actionTitle = `Optimize Database Queries & Deploy Latency Tracing`;
    actionDescription = `Profile backend query execution plans, configure distributed tracing on heavy endpoints, and implement Redis/in-memory caching for frequently accessed read paths.`;
    reason = `Severe responsiveness complaints reported ${issue.occurrenceCount.toLocaleString('en-US')} times, driving customer frustration.`;
    expectedOutcome = `Restore p95 response times to within target SLAs and prevent server crash loops during traffic spikes.`;
    nextStep = `Inspect server APM traces during peak usage hours and identify top 3 slowest database queries for indexing.`;
  } else if (dominantCategory === 'Customer Service' || lower.includes('support') || lower.includes('agent') || lower.includes('ticket')) {
    actionTitle = `Audit Support Queue Routing & Deploy Canned Playbooks`;
    actionDescription = `Review tier-1 ticket escalation criteria, train agents on specific friction themes identified in this cluster, and publish self-service support documentation.`;
    reason = `Customer reports highlight prolonged wait times and unhelpful ticket resolution across ${issue.occurrenceCount.toLocaleString('en-US')} instances.`;
    expectedOutcome = `Shorten average first-response time and improve first-contact resolution rates for recurring complaints.`;
    nextStep = `Analyze agent queue routing logic and schedule targeted training workshop with frontline support team.`;
  } else {
    actionTitle = `Product Remediation & Backlog Triage for ${issue.title}`;
    actionDescription = `Review workflow requirements with design and engineering teams, prioritize fix in current development sprint, and validate solution with affected user segment.`;
    reason = `Documented by ${issue.occurrenceCount.toLocaleString('en-US')} customer feedback records across ${issue.categoryDistribution.map(c => c.category).join(', ')}.`;
    expectedOutcome = `Resolve usability roadblocks and enhance customer workflow satisfaction.`;
    nextStep = `Create engineering ticket linked to feedback evidence quotes and schedule sprint planning review.`;
  }

  // Calculate negative/mixed percentage if available
  let negativeMixedPct: number | undefined;
  if (issue.sentimentDistribution) {
    const neg = issue.sentimentDistribution.Negative || 0;
    const mix = issue.sentimentDistribution.Mixed || 0;
    const total = (issue.sentimentDistribution.Positive || 0) + (issue.sentimentDistribution.Neutral || 0) + neg + mix;
    if (total > 0) {
      negativeMixedPct = Math.round(((neg + mix) / total) * 1000) / 10;
    }
  }

  return {
    id: `rec-${issue.id}-${Date.now()}`,
    issueId: issue.id,
    issueTitle: issue.title,
    actionTitle,
    actionDescription,
    reason,
    expectedOperationalOutcome: expectedOutcome,
    supportingQuotes: quotes,
    relevantMetrics: {
      occurrenceCount: issue.occurrenceCount,
      distinctCount: issue.distinctCount,
      priorityScore: issue.priorityScore,
      dominantCategory,
      negativeMixedPercentage: negativeMixedPct,
    },
    confidenceOrUncertainty: issue.sourceType === 'exact_recurrence'
      ? 'Deterministic rule-based recommendation derived from exact customer statement recurrence pattern (no AI inference used).'
      : `High deterministic certainty grounded in ${issue.occurrenceCount.toLocaleString('en-US')} verified customer occurrences and ${issue.priorityScore}/100 priority index.`,
    recommendedNextStep: nextStep,
    generationMethod: 'rule-based-heuristic',
    status: 'Proposed',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Attempts server-side AI recommendation synthesis via Gemini 3.8 Flash;
 * safely falls back to transparent rule-based heuristic if key missing or unconfigured.
 */
export async function generateRecommendationForIssue(
  issue: IssueRecord,
  preferAi = true
): Promise<RecommendationRecord> {
  const dominantCategory = issue.categoryDistribution[0]?.category || 'Operational Issues';
  const quotes = issue.representativeExamples.slice(0, 3);
  const now = new Date().toISOString();

  let negativeMixedPct: number | undefined;
  if (issue.sentimentDistribution) {
    const neg = issue.sentimentDistribution.Negative || 0;
    const mix = issue.sentimentDistribution.Mixed || 0;
    const total = (issue.sentimentDistribution.Positive || 0) + (issue.sentimentDistribution.Neutral || 0) + neg + mix;
    if (total > 0) {
      negativeMixedPct = Math.round(((neg + mix) / total) * 1000) / 10;
    }
  }

  if (preferAi) {
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueTitle: issue.title,
          issueDescription: issue.description,
          category: dominantCategory,
          occurrenceCount: issue.occurrenceCount,
          distinctCount: issue.distinctCount,
          priorityScore: issue.priorityScore,
          negativeCount: issue.sentimentDistribution?.Negative || 0,
          mixedCount: issue.sentimentDistribution?.Mixed || 0,
          verbatimQuotes: quotes,
          provider: 'gemini-3.8-flash',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.available && data.recommendation) {
          const r = data.recommendation;
          return {
            id: `rec-ai-${issue.id}-${Date.now()}`,
            issueId: issue.id,
            issueTitle: issue.title,
            actionTitle: r.actionTitle || `Remediate ${issue.title}`,
            actionDescription: r.actionDescription || issue.description,
            reason: r.reason || `Derived from ${issue.occurrenceCount} customer reports.`,
            expectedOperationalOutcome: r.expectedOperationalOutcome || 'Improve system reliability and customer retention.',
            supportingQuotes: quotes,
            relevantMetrics: {
              occurrenceCount: issue.occurrenceCount,
              distinctCount: issue.distinctCount,
              priorityScore: issue.priorityScore,
              dominantCategory,
              negativeMixedPercentage: negativeMixedPct,
            },
            confidenceOrUncertainty: r.confidenceOrUncertainty || 'AI-synthesized from verified customer evidence quotes.',
            recommendedNextStep: r.recommendedNextStep || 'Review logs and schedule remediation sprint.',
            generationMethod: 'gemini-3.8-flash',
            status: 'Proposed',
            createdAt: now,
            updatedAt: now,
          };
        }
      }
    } catch (e) {
      console.warn('AI recommendation synthesis failed, falling back to rule-based engine:', e);
    }
  }

  // Deterministic rule-based fallback
  return generateRuleBasedRecommendation(issue);
}

/**
 * Initializes default recommendations for a list of candidate issues if not already present.
 */
export function buildInitialRecommendations(issues: IssueRecord[]): RecommendationRecord[] {
  return issues.map(issue => generateRuleBasedRecommendation(issue));
}
