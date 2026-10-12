import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      issueTitle,
      issueDescription,
      category,
      occurrenceCount,
      distinctCount,
      priorityScore,
      negativeCount,
      mixedCount,
      verbatimQuotes = [],
      provider = 'gemini-3.8-flash',
    } = body;

    if (!issueTitle) {
      return NextResponse.json({ error: 'Issue title is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim().length === 0 || provider === 'rule-based-heuristic') {
      return NextResponse.json({
        available: false,
        message: 'GEMINI_API_KEY is not configured or rule baseline requested. Use rule-based recommendation synthesis.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are a principal enterprise customer operations and product strategist.
Your task is to take a validated customer problem issue and synthesize a concrete, actionable, evidence-grounded business recommendation.
CRITICAL CONSTRAINTS:
1. Do not invent fake revenue numbers, fake percentage improvements, or fabricated metrics.
2. Ground the recommendation specifically in the customer quotes and friction described.
3. Provide an operational outcome stated qualitatively (e.g. "Reduce ticket escalation volume and eliminate checkout payment drop-offs").
4. Provide a concrete, immediate next step.
5. Formulate an action title, clear action description, and explain why this action directly resolves the customer evidence.`;

    const promptText = `Customer Problem Issue:
Title: "${issueTitle}"
Description: "${issueDescription}"
Category: "${category}"
Total Customer Reports: ${occurrenceCount}
Distinct Feedback Variations: ${distinctCount}
Calculated Priority Score: ${priorityScore}/100
Negative Reviews: ${negativeCount || 0}, Mixed Reviews: ${mixedCount || 0}
Actual Customer Quotes:
${verbatimQuotes.slice(0, 4).map((q: string, i: number) => `${i + 1}. "${q}"`).join('\n')}

Synthesize a professional recommendation object.`;

    let response;
    try {
      response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                actionTitle: { type: Type.STRING },
                actionDescription: { type: Type.STRING },
                reason: { type: Type.STRING },
                expectedOperationalOutcome: { type: Type.STRING },
                confidenceOrUncertainty: { type: Type.STRING },
                recommendedNextStep: { type: Type.STRING },
              },
              required: [
                'actionTitle',
                'actionDescription',
                'reason',
                'expectedOperationalOutcome',
                'confidenceOrUncertainty',
                'recommendedNextStep',
              ],
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Recommendation generation timeout')), 15000)
        ),
      ]);
    } catch (aiErr: any) {
      console.warn('Gemini recommendation generation error:', aiErr?.message);
      return NextResponse.json({
        available: false,
        message: `AI recommendation unavailable (${aiErr?.message || 'timeout'}), using evidence-backed rule synthesis.`,
      });
    }

    const raw = response.text || '{}';
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      available: true,
      provider: 'gemini-3.5-flash',
      recommendation: parsed,
    });
  } catch (error: any) {
    console.error('Recommendations route error:', error);
    return NextResponse.json(
      {
        available: false,
        error: error.message || 'Failed to generate AI recommendation',
      },
      { status: 500 }
    );
  }
}
