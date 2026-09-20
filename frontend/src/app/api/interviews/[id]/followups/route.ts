import { NextResponse } from 'next/server';
import { AiEngine } from '@/lib/ai-engine';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json();
  const { area, currentQuestion, candidateNotes } = body;

  const followup = AiEngine.generateDynamicFollowup(
    area || 'General',
    currentQuestion || '',
    candidateNotes || ''
  );

  return NextResponse.json({ followup });
}
