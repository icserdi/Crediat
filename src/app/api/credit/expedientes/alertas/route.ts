import { NextResponse } from 'next/server';
import { listExpiringDocumentsWithDetails, refreshValidity } from '@/lib/credit/expediente';
import { initializeDb } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

/** GET /api/credit/expedientes/alertas — Documentos por vencer o vencidos. */
export async function GET() {
  try {
    await ensureDb();
    await refreshValidity();
    const documentos = await listExpiringDocumentsWithDetails();
    return NextResponse.json({ documentos });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al listar alertas',
      },
      { status: 500 }
    );
  }
}
