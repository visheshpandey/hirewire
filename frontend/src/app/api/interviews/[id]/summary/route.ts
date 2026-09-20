import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const interview = store.getInterviewById(id);
  if (!interview) {
    return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
  }

  const notes = interview.notes;
  const validatedNotes = notes.filter(n => n.validationStatus === 'VALIDATED');
  const partiallyValidated = notes.filter(n => n.validationStatus === 'PARTIALLY_VALIDATED');
  const contradictions = notes.filter(n => n.validationStatus === 'CONTRADICTORY');

  const summary = {
    interviewId: id,
    keyEvidence: notes.map(n => n.evidenceSnippet).filter(Boolean),
    requirementsValidated: validatedNotes.map(n => n.area),
    partiallyValidated: partiallyValidated.map(n => n.area),
    unansweredAreas: interview.questions
      .filter(q => !notes.some(n => n.questionId === q.id))
      .map(q => q.area),
    contradictions: contradictions.map(n => `Flagged in ${n.area}: ${n.interviewerComments}`),
    additionalValidationAreas: partiallyValidated.map(n => `Follow-up needed on: ${n.area}`)
  };

  store.updateInterviewSummary(id, summary);
  store.updateCandidateStatus(interview.candidateId, 'INTERVIEWED');

  return NextResponse.json({ summary });
}
