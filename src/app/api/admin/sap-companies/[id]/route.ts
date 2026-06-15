import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSapCompaniesStore } from '@/lib/sap/companies-store';

const updateCompanySchema = z.object({
  companyDb: z.string().min(1).optional(),
  friendlyName: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/sap-companies/[id]
 * Obtiene una empresa SAP por ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const store = getSapCompaniesStore();
    const company = store.getCompanyById(params.id);

    if (!company) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ company });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message:
          error instanceof Error ? error.message : 'Error al obtener empresa',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/sap-companies/[id]
 * Actualiza una empresa SAP existente.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = updateCompanySchema.safeParse(body);

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
    const company = store.updateCompany(params.id, parsed.data);

    if (!company) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ company });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al actualizar empresa';

    if (message.includes('Ya existe una empresa')) {
      return NextResponse.json(
        { error: 'DUPLICATE_COMPANYDB', message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sap-companies/[id]
 * Elimina una empresa SAP.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const store = getSapCompaniesStore();
    const deleted = store.deleteCompany(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message:
          error instanceof Error ? error.message : 'Error al eliminar empresa',
      },
      { status: 500 }
    );
  }
}
