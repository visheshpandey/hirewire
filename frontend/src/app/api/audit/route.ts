import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const auditEvents = store.getAuditEvents();
  return NextResponse.json({ auditEvents });
}
