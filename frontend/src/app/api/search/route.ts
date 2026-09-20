import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { AiEngine } from '@/lib/ai-engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query string is required' }, { status: 400 });
    }

    const candidates = store.getAllCandidates();
    const evidence = candidates.flatMap(c => store.getEvidenceByCandidateId(c.id));
    const roles = store.getRoles();
    const requirements = roles.flatMap(r => r.requirements || []).filter((r): r is import('@/lib/types').Requirement => !!r);

    const searchResults = AiEngine.searchCandidates(query, candidates, evidence, requirements);

    store.addAuditEvent({
      user: 'Recruiter',
      action: 'SEARCH',
      entityType: 'SEARCH',
      entityId: 'nl-search',
      details: `Executed natural language search: "${query}" (found ${searchResults.length} matches)`
    });

    return NextResponse.json({
      query,
      results: searchResults
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 });
  }
}
