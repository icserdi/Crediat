import { NextRequest, NextResponse } from 'next/server';
import { addExpedienteDocumento, listExpediente, type DocumentType } from '@/lib/credit/expediente';
import { initializeDb } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

/** GET /api/credit/expedientes/[accountId] — Lista documentos del expediente. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    await ensureDb();
    const { accountId } = await params;
    const documentos = await listExpediente(accountId);
    return NextResponse.json({ documentos });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al listar expediente',
      },
      { status: 500 }
    );
  }
}

/** POST /api/credit/expedientes/[accountId] — Agrega un documento (multipart). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    await ensureDb();
    const { accountId } = await params;
    const formData = await request.formData();

    const documentType = formData.get('documentType') as DocumentType;
    const issuedAt = String(formData.get('issuedAt') || '');
    const expiresAt = String(formData.get('expiresAt') || '');
    const file = formData.get('file') as File | null;

    if (!documentType || !issuedAt || !expiresAt || !file) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'documentType, issuedAt, expiresAt y file son requeridos.',
        },
        { status: 400 }
      );
    }

    const documento = await addExpedienteDocumento({
      creditAccountId: accountId,
      documentType,
      issuedAt,
      expiresAt,
      file,
    });

    return NextResponse.json({ documento }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al agregar documento',
      },
      { status: 500 }
    );
  }
}
