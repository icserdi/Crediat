import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSapCompaniesStore } from '@/lib/sap/companies-store';

const setAssignmentSchema = z.object({
  userId: z.string().min(1, 'ID de usuario es requerido'),
  companyIds: z.array(z.string().uuid()),
  assignedBy: z.string().min(1, 'ID de quien asigna es requerido'),
});

/**
 * GET /api/admin/sap-companies/assignments
 * Lista todas las asignaciones de usuarios a empresas.
 */
export async function GET() {
  try {
    const store = getSapCompaniesStore();
    // Por ahora, el store no tiene un método para listar todas las asignaciones
    // Implementaremos esto más adelante cuando tengamos una base de datos real
    return NextResponse.json({
      assignments: [],
      note: 'Listado completo de asignaciones requiere base de datos',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message:
          error instanceof Error ? error.message : 'Error al listar asignaciones',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sap-companies/assignments
 * Crea o actualiza una asignación de usuario a empresas.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = setAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const store = getSapCompaniesStore();
    const assignment = store.setUserAssignment(
      parsed.data.userId,
      parsed.data.companyIds,
      parsed.data.assignedBy
    );

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al crear asignación';

    if (message.includes('no existe')) {
      return NextResponse.json(
        { error: 'COMPANY_NOT_FOUND', message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message },
      { status: 500 }
    );
  }
}
