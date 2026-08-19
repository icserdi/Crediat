import { NextRequest, NextResponse } from 'next/server';
import {
  updateCreditApplicationStatus,
  getCreditApplication,
  type CreditApplicationStatus,
} from '@/lib/credit/application';
import { initializeDb } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

/** GET /api/credit/applications/[id] — Detalle de una solicitud. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDb();
    const { id } = await params;
    const application = await getCreditApplication(id);

    if (!application) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Solicitud no encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al obtener solicitud',
      },
      { status: 500 }
    );
  }
}

/** PATCH /api/credit/applications/[id] — Actualiza el estatus (con motivo opcional). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDb();
    const { id } = await params;
    const body = (await request.json()) as { status: CreditApplicationStatus; reason?: string };

    if (!body.status) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Estatus requerido.' },
        { status: 400 }
      );
    }

    const application = await updateCreditApplicationStatus(id, body.status, {
      reason: body.reason,
    });
    if (!application) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Solicitud no encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al actualizar solicitud',
      },
      { status: 500 }
    );
  }
}
