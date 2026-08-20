import { NextRequest, NextResponse } from 'next/server';
import { createCreditAccount, listCreditAccounts, type CreditGrantInput } from '@/lib/credit/grant';
import { initializeDb } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

/** GET /api/credit/accounts — Lista cuentas de crédito. */
export async function GET() {
  try {
    await ensureDb();
    const accounts = await listCreditAccounts();
    return NextResponse.json({ accounts });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al listar cuentas',
      },
      { status: 500 }
    );
  }
}

/** POST /api/credit/accounts — Crea una cuenta de crédito (inicia autorización). */
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = (await request.json()) as CreditGrantInput;

    if (!body.applicationId || !body.requestedAmount || !body.termMonths) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'applicationId, requestedAmount y termMonths son requeridos.',
        },
        { status: 400 }
      );
    }

    const account = await createCreditAccount(body);
    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al crear cuenta de crédito',
      },
      { status: 500 }
    );
  }
}
