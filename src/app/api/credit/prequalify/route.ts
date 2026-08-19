import { NextRequest, NextResponse } from 'next/server';
import { prequalifyApplication, type PrequalificationInput } from '@/lib/credit/prequalification';
import { initializeDb } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

/** POST /api/credit/prequalify — Ejecuta la pre-calificación de una solicitud. */
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = (await request.json()) as PrequalificationInput;

    if (!body.applicationId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'applicationId requerido.' },
        { status: 400 }
      );
    }

    const prequalification = await prequalifyApplication(body);
    return NextResponse.json({ prequalification }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al pre-calificar',
      },
      { status: 500 }
    );
  }
}
