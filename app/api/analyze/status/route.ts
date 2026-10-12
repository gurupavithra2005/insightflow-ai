import { NextResponse } from 'next/server';

export async function GET() {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);

  return NextResponse.json({
    configured: hasKey,
    defaultModel: 'gemini-3.5-flash',
    supportedProviders: [
      {
        id: 'gemini-3.5-flash',
        name: 'Gemini 3.5 Flash (AI Model)',
        description: 'Deep neural sentiment, semantic topic discovery, and evidence-backed complaint synthesis.',
        available: hasKey,
      },
      {
        id: 'baseline-rules',
        name: 'Transparent Baseline (Rule-Based)',
        description: 'Deterministic heuristic lexicon and taxonomy rules. Clearly labeled as non-AI baseline.',
        available: true,
      },
    ],
  });
}
