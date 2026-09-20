import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const duplicates = store.getDuplicateQueue();
    return NextResponse.json({ duplicates });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch duplicate queue' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, notes } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
    }

    const resolved = store.resolveDuplicate(id, action, notes);
    if (!resolved) {
      return NextResponse.json({ error: 'Duplicate record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, record: resolved });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve duplicate' }, { status: 500 });
  }
}
