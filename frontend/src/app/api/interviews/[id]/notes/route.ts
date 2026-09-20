import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { area, questionId, candidateAnswer, interviewerComments, evidenceSnippet, validationStatus } = body;

  if (!candidateAnswer) {
    return NextResponse.json({ error: 'Candidate answer is required' }, { status: 400 });
  }

  const note = store.addInterviewNote({
    interviewId: id,
    area: area || 'Technical Deep Dive',
    questionId,
    candidateAnswer,
    interviewerComments: interviewerComments || '',
    evidenceSnippet: evidenceSnippet || '',
    validationStatus: validationStatus || 'VALIDATED'
  });

  return NextResponse.json({ note }, { status: 201 });
}
