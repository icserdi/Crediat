import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSapCompaniesStore } from '@/lib/sap/companies-store';

const createCompanySchema = z.object({
  companyDb: z.string().min(1, 'CompanyDB es requerido'),
  friendlyName: z.string().min(1, 'Nombre amigable es requerido'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/admin/sap-companies
 * Lista todas las empresas SAP configuradas.
 */
export async function GET() {
  try {
    const store = getSapCompaniesStore();
    const companies = store.listCompanies();
    return NextResponse.json({ companies });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message:
          error instanceof Error ? error.message : 'Error al listar empresas',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sap-companies
 * Crea una nueva empresa SAP.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createCompanySchema.safeParse(body);

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
    const company = store.createCompany(parsed.data);

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al crear empresa';

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
