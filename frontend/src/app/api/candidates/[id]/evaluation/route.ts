import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const evaluation = store.getEvaluationByCandidateId(id);
  return NextResponse.json({ evaluation });
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
  const {
    interviewers,
    requirementCoverage,
    relevantEvidence,
    validationGaps,
    unansweredAreas,
    contradictions,
    humanEvaluation,
    humanRecommendation,
    humanDecidedBy
  } = body;

  if (!humanEvaluation || !humanRecommendation) {
    return NextResponse.json({ error: 'Human evaluation and recommendation are required' }, { status: 400 });
  }

  const savedEval = store.saveEvaluation({
    candidateId: id,
    roleId: candidate.roleId,
    interviewers: interviewers || ['Hiring Manager'],
    requirementCoverage: requirementCoverage || {
      total: 0,
      supported: 0,
      partiallySupported: 0,
      notFound: 0,
      unclear: 0
    },
    relevantEvidence: relevantEvidence || [],
    validationGaps: validationGaps || [],
    unansweredAreas: unansweredAreas || [],
    contradictions: contradictions || [],
    humanEvaluation,
    humanRecommendation,
    humanDecidedBy: humanDecidedBy || 'Reviewer',
    decidedAt: new Date().toISOString()
  });

  // Update candidate status based on human recommendation
  let nextStatus: any = 'EVALUATED';
  if (humanRecommendation === 'ADVANCE') nextStatus = 'OFFERED';
  else if (humanRecommendation === 'HOLD') nextStatus = 'ON_HOLD';
  store.updateCandidateStatus(id, nextStatus);

  return NextResponse.json({ evaluation: savedEval }, { status: 201 });
}
