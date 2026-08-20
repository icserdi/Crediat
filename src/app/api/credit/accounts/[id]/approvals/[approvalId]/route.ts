import { NextRequest, NextResponse } from 'next/server';
import { decideApproval, listApprovals, type ApprovalDecision } from '@/lib/credit/grant';
import { initializeDb } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

/** GET /api/credit/accounts/[id]/approvals — Lista aprobaciones de la cuenta. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDb();
    const { id } = await params;
    const approvals = await listApprovals(id);
    return NextResponse.json({ approvals });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al listar aprobaciones',
      },
      { status: 500 }
    );
  }
}

/** POST /api/credit/accounts/[id]/approvals/[approvalId] — Decide una aprobación. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; approvalId: string }> }
) {
  try {
    await ensureDb();
    const { approvalId } = await params;
    const body = (await request.json()) as {
      decision: ApprovalDecision;
      approvedBy: string;
      comments?: string;
    };

    if (!body.decision || !['aprobado', 'rechazado'].includes(body.decision)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Decisión inválida.' },
        { status: 400 }
      );
    }
    if (!body.approvedBy) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'approvedBy requerido.' },
        { status: 400 }
      );
    }

    const result = await decideApproval(approvalId, body.decision, body.approvedBy, body.comments);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al decidir aprobación',
      },
      { status: 500 }
    );
  }
}
