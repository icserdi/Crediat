import { NextResponse } from 'next/server';
import { getCreditCycleStats, listCreditAccountSummaries } from '@/lib/credit/report';
import { initializeDb } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

/** GET /api/credit/report — Estadísticas y reporte del ciclo de crédito. */
export async function GET() {
  try {
    await ensureDb();
    const stats = await getCreditCycleStats();
    const accounts = await listCreditAccountSummaries();
    return NextResponse.json({ stats, accounts });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al generar reporte',
      },
      { status: 500 }
    );
  }
}
