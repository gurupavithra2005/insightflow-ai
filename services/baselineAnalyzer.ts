import { FeedbackCategory, SentimentType } from '../types/feedback';

export interface BatchAnalysisInputItem {
  id: string;
  text: string;
  category: FeedbackCategory;
}

export interface AnalysisOutputItem {
  id: string;
  sentiment: SentimentType;
  confidence: number;
  explanation: string;
  evidenceQuote: string;
  topicLabel: string;
  topicDescription: string;
  complaintTitle?: string;
  complaintExplanation?: string;
  method: 'gemini-3.8-flash' | 'baseline-rules';
}

/**
 * Transparent, deterministic rule-based baseline analysis.
 * Explicitly labeled as 'baseline-rules' - never disguised as AI output.
 */
export function analyzeWithRuleBaseline(items: BatchAnalysisInputItem[]): AnalysisOutputItem[] {
  return items.map(item => {
    const lower = item.text.toLowerCase();

    // Sentiment detection via domain lexicon
    const negativeKeywords = [
      'timed out', 'charged', 'fails', 'failing', 'bad gateway', '502', '500', 'delayed', 'error',
      'corrupted', 'crash', 'crashes', 'expired', 'spike', 'deadlock', 'stuck', 'freeze',
      'phishing', 'brute force', 'unrecognized', 'unauthorized', 'stolen', 'counterfeit',
      'scam', 'ransom', 'malicious', 'compromised', 'attacker', 'trojan', 'fraud',
      'too low', 'awkward', 'disappears', 'missing', 'unreviewed', 'broken', 'rude', 'defensive',
      'unreachable', 'disconnected', 'conflict', 'refused', 'blamed', 'slow', 'leak', 'loss'
    ];

    const positiveKeywords = [
      'love', 'great', 'excellent', 'fast', 'helpful', 'improved', 'smooth', 'appreciate',
      'intuitive', 'useful', 'resolved quickly', 'satisfied'
    ];

    const mixedKeywords = [
      'but', 'however', 'although', 'except', 'despite'
    ];

    let hasNeg = negativeKeywords.some(kw => lower.includes(kw));
    let hasPos = positiveKeywords.some(kw => lower.includes(kw));
    let hasMixed = hasNeg && (hasPos || mixedKeywords.some(kw => lower.includes(kw)));

    let sentiment: SentimentType = 'Negative'; // Most customer feedback complaints in support datasets are negative
    let confidence = 0.85;
    let rationale = 'Identified customer friction keywords within the statement.';

    if (hasMixed) {
      sentiment = 'Mixed';
      confidence = 0.78;
      rationale = 'Contains contrasting satisfaction and friction indicators.';
    } else if (hasPos && !hasNeg) {
      sentiment = 'Positive';
      confidence = 0.90;
      rationale = 'Identified favorable customer sentiment expressions.';
    } else if (!hasPos && !hasNeg) {
      // Check if neutral request or question
      sentiment = 'Neutral';
      confidence = 0.75;
      rationale = 'Informational inquiry or standard workflow comment without strong emotional polarity.';
    }

    // Extract evidence quote (first 80 chars or prominent clause)
    let evidenceQuote = item.text.slice(0, 80);
    if (item.text.length > 80) evidenceQuote += '...';

    // Topic discovery heuristics based on category and vocabulary
    let topicLabel = 'General System Operations';
    let topicDescription = 'Operational issues affecting system availability or transactions.';

    if (lower.includes('checkout') || lower.includes('payment') || lower.includes('charged') || lower.includes('billing') || lower.includes('credit card') || lower.includes('invoice')) {
      topicLabel = 'Billing & Payment Processing';
      topicDescription = 'Friction during credit card checkout, billing cycles, or invoice generation.';
    } else if (lower.includes('phishing') || lower.includes('brute force') || lower.includes('login') || lower.includes('2fa') || lower.includes('credential') || lower.includes('unauthorized') || lower.includes('scam') || lower.includes('stolen')) {
      topicLabel = 'Account Security & Fraud Alerts';
      topicDescription = 'Suspicious logins, credential stuffing, phishing lures, and unauthorized access attempts.';
    } else if (lower.includes('webhook') || lower.includes('api') || lower.includes('rate limit') || lower.includes('graphql') || lower.includes('sso') || lower.includes('oauth') || lower.includes('502') || lower.includes('database')) {
      topicLabel = 'API, Webhooks & Infrastructure';
      topicDescription = 'Backend service latency, gateway timeouts, database locks, and webhook delivery lag.';
    } else if (lower.includes('support') || lower.includes('agent') || lower.includes('ticket') || lower.includes('chat') || lower.includes('phone') || lower.includes('representative') || lower.includes('help desk') || lower.includes('documentation')) {
      topicLabel = 'Customer Support & Resolution Quality';
      topicDescription = 'Delays in support ticket responses, agent escalation bottlenecks, and help documentation gaps.';
    } else if (lower.includes('filter') || lower.includes('export') || lower.includes('dark mode') || lower.includes('keyboard') || lower.includes('search') || lower.includes('table') || lower.includes('ui') || lower.includes('ux')) {
      topicLabel = 'Interface Usability & Feature Requests';
      topicDescription = 'Product feedback regarding data export formats, keyboard navigation, and UI density controls.';
    }

    // Complaint identification if Negative or Mixed
    let complaintTitle: string | undefined = undefined;
    let complaintExplanation: string | undefined = undefined;

    if (sentiment === 'Negative' || sentiment === 'Mixed') {
      complaintTitle = topicLabel;
      complaintExplanation = `Customer reported: ${evidenceQuote}`;
    }

    return {
      id: item.id,
      sentiment,
      confidence,
      explanation: rationale,
      evidenceQuote,
      topicLabel,
      topicDescription,
      complaintTitle,
      complaintExplanation,
      method: 'baseline-rules',
    };
  });
}
