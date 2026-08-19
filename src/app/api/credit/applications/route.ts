import { NextRequest, NextResponse } from 'next/server';
import {
  createCreditApplication,
  listCreditApplications,
  validateCreditApplication,
  type CreditApplicationInput,
} from '@/lib/credit/application';
import { initializeDb } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

/** GET /api/credit/applications — Lista solicitudes. */
export async function GET() {
  try {
    await ensureDb();
    const applications = await listCreditApplications();
    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al listar solicitudes',
      },
      { status: 500 }
    );
  }
}

/** POST /api/credit/applications — Crea una solicitud. */
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = (await request.json()) as CreditApplicationInput;

    const errors = validateCreditApplication(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: errors.join(' ') },
        { status: 400 }
      );
    }

    const application = await createCreditApplication(body);
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al crear solicitud',
      },
      { status: 500 }
    );
  }
}
