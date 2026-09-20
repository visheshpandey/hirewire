import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const config = store.getRoleScoringConfig(id);
    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch scoring config' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = store.updateRoleScoringConfig(id, body);
    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update scoring config' }, { status: 500 });
  }
}
