import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { AiEngine } from '@/lib/ai-engine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get('roleId');
  
  const candidates = roleId 
    ? store.getCandidatesByRoleId(roleId)
    : store.getAllCandidates();

  return NextResponse.json({ candidates });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roleId, resumeText, fileName, manualCandidate } = body;

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    let parsedCandidateData;
    let extractedEvidence: any[] = [];

    if (resumeText) {
      const parsed = AiEngine.parseResume(resumeText, fileName || 'Resume.pdf');
      parsedCandidateData = parsed.candidate;
      extractedEvidence = parsed.evidence;
    } else if (manualCandidate) {
      parsedCandidateData = manualCandidate;
    } else {
      return NextResponse.json({ error: 'Resume text or candidate data is required' }, { status: 400 });
    }

    // Save candidate
    const candidate = store.addCandidate({
      ...parsedCandidateData,
      roleId
    });

    // Save extracted evidence
    let savedEvidence: any[] = [];
    if (extractedEvidence.length > 0) {
      savedEvidence = store.addEvidence(
        extractedEvidence.map(e => ({
          ...e,
          candidateId: candidate.id
        }))
      );
    }

    // Automatically map candidate evidence to role requirements
    const roleRequirements = store.getRequirementsByRoleId(roleId);
    let savedMappings: any[] = [];
    if (roleRequirements.length > 0) {
      const rawMappings = AiEngine.mapRequirements(candidate, roleRequirements, savedEvidence);
      savedMappings = store.setMappings(candidate.id, rawMappings);

      // Generate Candidate Intelligence Summary
      const summary = AiEngine.generateCandidateSummary(candidate, roleRequirements, savedMappings, savedEvidence);
      store.setSummary(summary);
    }

    return NextResponse.json({
      candidate,
      evidence: savedEvidence,
      mappings: savedMappings,
      message: 'Candidate parsed, evidence extracted, and requirements mapped successfully'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process candidate' }, { status: 500 });
  }
}
