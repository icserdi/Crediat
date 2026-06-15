import { NextRequest, NextResponse } from 'next/server';
import { getSapCompaniesStore } from '@/lib/sap/companies-store';

/**
 * GET /api/admin/sap-companies/assignments/[userId]
 * Obtiene la asignación de empresas para un usuario específico.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const store = getSapCompaniesStore();
    const assignment = store.getUserAssignment(params.userId);

    if (!assignment) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Asignación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message:
          error instanceof Error ? error.message : 'Error al obtener asignación',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sap-companies/assignments/[userId]
 * Elimina la asignación de un usuario.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const store = getSapCompaniesStore();
    const deleted = store.deleteUserAssignment(params.userId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Asignación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message:
          error instanceof Error ? error.message : 'Error al eliminar asignación',
      },
      { status: 500 }
    );
  }
}
