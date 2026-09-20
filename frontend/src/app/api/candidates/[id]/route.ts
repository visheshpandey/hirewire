import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const candidate = store.getCandidateById(id);
  if (!candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
  }

  const role = store.getRoleById(candidate.roleId);
  const evidence = store.getEvidenceByCandidateId(id);
  const mappings = store.getMappingsByCandidateId(id);
  const summary = store.getSummaryByCandidateId(id);
  const interviews = store.getInterviewsByCandidateId(id);
  const evaluation = store.getEvaluationByCandidateId(id);
  const requirements = role ? store.getRequirementsByRoleId(role.id) : [];

  return NextResponse.json({
    candidate,
    role,
    requirements,
    evidence,
    mappings,
    summary,
    interviews,
    evaluation
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status) {
    return NextResponse.json({ error: 'Status is required' }, { status: 400 });
  }

  const updated = store.updateCandidateStatus(id, status);
  return NextResponse.json({ candidate: updated });
}
