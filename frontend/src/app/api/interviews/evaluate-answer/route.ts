import { NextRequest, NextResponse } from 'next/server';
import { AiEngine } from '@/lib/ai-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionText, answerText, resumeEvidenceSnippet } = body;

    const evaluation = AiEngine.evaluateAnswerDepth(
      questionText || '',
      answerText || '',
      resumeEvidenceSnippet
    );

    return NextResponse.json({ evaluation });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to evaluate answer depth' }, { status: 500 });
  }
}
