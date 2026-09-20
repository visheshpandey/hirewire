import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { AiEngine } from '@/lib/ai-engine';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requirements = store.getRequirementsByRoleId(id);
  return NextResponse.json({ requirements });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const role = store.getRoleById(id);
  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  const extracted = AiEngine.extractRequirements(role.rawJd);
  const requirements = store.setRequirements(id, extracted);
  return NextResponse.json({ requirements });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await reqBody(request);
  const { requirementId } = body;
  if (!requirementId) {
    return NextResponse.json({ error: 'Requirement ID is required' }, { status: 400 });
  }

  const updated = store.toggleRequirementApproval(requirementId);
  return NextResponse.json({ requirement: updated });
}

async function reqBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
