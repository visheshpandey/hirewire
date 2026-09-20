import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const reason = body.reason || 'Candidate submitted Right-to-Erasure request under GDPR Article 17.';

    const anonymized = store.anonymizeCandidate(id, reason);
    if (!anonymized) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, candidate: anonymized });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to anonymize candidate' }, { status: 500 });
  }
}
