import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { AiEngine } from '@/lib/ai-engine';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const candidate = store.getCandidateById(id);
  if (!candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
  }

  const role = store.getRoleById(candidate.roleId);
  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  const requirements = store.getRequirementsByRoleId(role.id);
  const evidence = store.getEvidenceByCandidateId(id);

  const newMappings = AiEngine.mapRequirements(candidate, requirements, evidence);
  const savedMappings = store.setMappings(id, newMappings);

  // Refresh summary
  const summary = AiEngine.generateCandidateSummary(candidate, requirements, savedMappings, evidence);
  store.setSummary(summary);

  return NextResponse.json({ mappings: savedMappings, summary });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json();
  const { mappingId, humanOverride, humanNotes } = body;

  if (!mappingId) {
    return NextResponse.json({ error: 'mappingId is required' }, { status: 400 });
  }

  const updated = store.updateMappingOverride(mappingId, humanOverride, humanNotes);
  return NextResponse.json({ mapping: updated });
}
