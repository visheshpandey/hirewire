import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { AiEngine } from '@/lib/ai-engine';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const interviews = store.getInterviewsByCandidateId(id);
  return NextResponse.json({ interviews });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const candidate = store.getCandidateById(id);
  if (!candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
  }

  const body = await request.json();
  const { interviewerName, scheduledDate } = body;

  const interview = store.createInterview({
    candidateId: id,
    roleId: candidate.roleId,
    interviewerName: interviewerName || 'Engineering Hiring Manager',
    scheduledDate: scheduledDate || new Date().toISOString(),
    status: 'SCHEDULED'
  });

  // Automatically generate structured interview questions targeting evidence & gaps
  const role = store.getRoleById(candidate.roleId);
  const requirements = role ? store.getRequirementsByRoleId(role.id) : [];
  const mappings = store.getMappingsByCandidateId(id);

  const generatedQuestions = AiEngine.generateInterviewQuestions(candidate, requirements, mappings);
  const savedQuestions = store.setInterviewQuestions(interview.id, generatedQuestions);

  // Update candidate status to INTERVIEW_SCHEDULED
  store.updateCandidateStatus(id, 'INTERVIEW_SCHEDULED');

  return NextResponse.json({
    interview: { ...interview, questions: savedQuestions },
    message: 'Interview scheduled and candidate-specific questions generated'
  }, { status: 201 });
}
