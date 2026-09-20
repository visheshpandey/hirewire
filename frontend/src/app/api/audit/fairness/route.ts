import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const fairness = store.getFairnessMetrics();
    return NextResponse.json({ fairness });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fairness metrics' }, { status: 500 });
  }
}
