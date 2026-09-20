import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { AiEngine } from '@/lib/ai-engine';

export async function GET() {
  const roles = store.getRoles();
  return NextResponse.json({ roles });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, department, location, rawJd } = body;

    if (!title || !rawJd) {
      return NextResponse.json({ error: 'Title and Job Description are required' }, { status: 400 });
    }

    const newRole = store.addRole({
      title,
      department: department || 'Engineering',
      location: location || 'Remote',
      rawJd,
      status: 'ACTIVE'
    });

    // Automatically extract structured requirements using AI
    const extractedReqs = AiEngine.extractRequirements(rawJd);
    const savedReqs = store.setRequirements(newRole.id, extractedReqs);

    return NextResponse.json({ 
      role: { ...newRole, requirements: savedReqs },
      message: 'Role created and requirements extracted successfully'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create role' }, { status: 500 });
  }
}
