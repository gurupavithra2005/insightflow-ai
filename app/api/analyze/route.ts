import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { BatchAnalysisInputItem, AnalysisOutputItem, analyzeWithRuleBaseline } from '../../../services/baselineAnalyzer';
import { SentimentType } from '../../../types/feedback';

export const maxDuration = 60; // 60 seconds maximum execution for batch inference

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: BatchAnalysisInputItem[] = body.items || [];
    const requestedProvider = body.provider || 'gemini-3.8-flash';

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided for analysis', results: [] }, { status: 400 });
    }

    // Limit batch size to 35 items per request for high reliability and fast response
    if (items.length > 50) {
      return NextResponse.json(
        { error: 'Batch size exceeds maximum limit of 50 items per request' },
        { status: 400 }
      );
    }

    // Check if user requested transparent rule baseline
    if (requestedProvider === 'baseline-rules') {
      const baselineResults = analyzeWithRuleBaseline(items);
      return NextResponse.json({
        results: baselineResults,
        provider: 'baseline-rules',
        count: baselineResults.length,
      });
    }

    // Check Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY is not configured in the server environment. You can run transparent Baseline Analysis or configure your API key in Secrets.',
          configured: false,
          results: [],
        },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Prepare structured prompt for the model
    const inputPayload = items.map(item => ({
      id: item.id,
      category: item.category,
      feedback: item.text,
    }));

    const systemInstruction = `You are an expert customer feedback intelligence analyst for an enterprise B2B platform.
Your task is to analyze customer feedback statements and extract:
1. Sentiment: Exactly one of ["Positive", "Neutral", "Negative", "Mixed"].
   - Positive: Satisfaction, gratitude, praise.
   - Neutral: Factual statements, inquiries, neutral observations.
   - Negative: Dissatisfaction, errors, bugs, security incidents, delays, frustrations.
   - Mixed: Both distinct positive and negative sentiments in one review.
2. Confidence: A decimal number between 0.50 and 1.00 indicating your confidence in the classification.
3. Explanation: A concise 1-2 sentence rationale explaining why this sentiment was chosen.
4. Evidence Quote: An exact verbatim phrase extracted from the customer's statement that supports your finding.
5. Topic Label: A business-readable topic name (e.g., "Payment Processing Failures", "Phishing & Credential Theft", "Account Lockout", "Customer Support Response Lag", "Feature Customization Requests", "Billing Dispute", "Database Connection Timeouts").
6. Topic Description: A concise 1-sentence description of the topic.
7. Complaint Title: If sentiment is Negative or Mixed, provide a concise complaint title summarizing the issue; otherwise empty string.
8. Complaint Explanation: If sentiment is Negative or Mixed, explain what customer friction occurred; otherwise empty string.

You must return a valid JSON array containing one object for every input item matching its ID.`;

    const promptText = `Analyze the following customer feedback items:\n\n${JSON.stringify(inputPayload, null, 2)}`;

    let parsed: any[] = [];
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `${systemInstruction}\n\n${promptText}`,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout after 15 seconds')), 15000)
        ),
      ]);

      const rawText = response.text || '';
      // Extract JSON array from Markdown code fence or raw array
      const jsonMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(rawText);
      }
    } catch (aiErr: any) {
      console.warn('Gemini inference unavailable, transparently applying rule baseline:', aiErr?.message);
      const fallback = analyzeWithRuleBaseline(items);
      return NextResponse.json({
        results: fallback,
        provider: 'baseline-rules',
        count: fallback.length,
        notice: `Fell back to rule baseline: ${aiErr?.message || 'Inference delay'}`,
      });
    }

    const resultMap = new Map<string, any>();
    if (Array.isArray(parsed)) {
      parsed.forEach(item => {
        if (item && item.id) {
          resultMap.set(String(item.id), item);
        }
      });
    }

    const results: AnalysisOutputItem[] = [];
    const partialFailures: string[] = [];

    items.forEach(input => {
      const modelOut = resultMap.get(input.id);
      if (modelOut) {
        // Validate and normalize sentiment
        let sentiment: SentimentType = 'Negative';
        const s = String(modelOut.sentiment || '').toLowerCase();
        if (s.includes('pos')) sentiment = 'Positive';
        else if (s.includes('mix')) sentiment = 'Mixed';
        else if (s.includes('neu')) sentiment = 'Neutral';

        const conf = typeof modelOut.confidence === 'number'
          ? Math.max(0.1, Math.min(1.0, modelOut.confidence))
          : 0.85;

        results.push({
          id: input.id,
          sentiment,
          confidence: Math.round(conf * 100) / 100,
          explanation: modelOut.explanation || 'Analyzed via Gemini 3.8 Flash model inference.',
          evidenceQuote: modelOut.evidenceQuote || input.text.slice(0, 60),
          topicLabel: modelOut.topicLabel || 'General Feedback',
          topicDescription: modelOut.topicDescription || 'Customer feedback topic cluster.',
          complaintTitle: modelOut.complaintTitle || (sentiment === 'Negative' || sentiment === 'Mixed' ? modelOut.topicLabel : undefined),
          complaintExplanation: modelOut.complaintExplanation || (sentiment === 'Negative' || sentiment === 'Mixed' ? modelOut.explanation : undefined),
          method: 'gemini-3.8-flash',
        });
      } else {
        partialFailures.push(input.id);
      }
    });

    return NextResponse.json({
      results,
      partialFailures,
      provider: 'gemini-3.8-flash',
      count: results.length,
    });
  } catch (error: any) {
    console.error('Gemini API analysis route error:', error);
    return NextResponse.json(
      {
        error: error.message || 'An error occurred during AI analysis',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
