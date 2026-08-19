import { NextRequest, NextResponse } from 'next/server';
import { createRfcValidator, type RfcKind } from '@/lib/credit/rfc';

/**
 * POST /api/credit/rfc-validate
 * Body: { rfc, tipo: 'fisica' | 'moral' }
 * Valida el formato y, si hay proveedor fiscal configurado (RFC_VALIDATION_API_URL),
 * consulta el estatus en el SAT.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { rfc?: string; tipo?: RfcKind };
    const rfc = (body.rfc || '').trim().toUpperCase();
    const tipo = body.tipo || 'fisica';

    if (!rfc) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'RFC requerido.' },
        { status: 400 }
      );
    }

    if (!['fisica', 'moral'].includes(tipo)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Tipo inválido (use fisica o moral).' },
        { status: 400 }
      );
    }

    const validator = createRfcValidator();
    const result = await validator.validate(rfc, tipo as RfcKind);
    return NextResponse.json({ rfc, tipo, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al validar RFC',
      },
      { status: 500 }
    );
  }
}
