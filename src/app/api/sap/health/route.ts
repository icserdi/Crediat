import { NextRequest, NextResponse } from 'next/server';
import { getSapClient, isSapConfigured, isSapServiceLayerError } from '@/lib/sap';
import { getSapCompaniesStore } from '@/lib/sap/companies-store';

/**
 * GET /api/sap/health?companyDb=SBO_DEMO&companyId=uuid
 * Verifica login + lectura mínima contra Service Layer.
 * Acepta companyDb (nombre real de BD) o companyId (UUID interno).
 */
export async function GET(request: NextRequest) {
  if (!isSapConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        code: 'SAP_CONFIG_MISSING',
        message: 'SAP no configurado. Defina SAP_SERVICE_LAYER_* en variables de entorno.',
      },
      { status: 503 }
    );
  }

  const companyId = request.nextUrl.searchParams.get('companyId');
  const companyDbParam = request.nextUrl.searchParams.get('companyDb');

  // Resolver CompanyDB: si viene companyId (UUID), buscar en el store
  let companyDb: string | undefined = companyDbParam ?? undefined;
  if (!companyDb && companyId) {
    const store = getSapCompaniesStore();
    const company = store.getCompanyById(companyId);
    if (company) {
      companyDb = company.companyDb;
    }
  }

  try {
    const client = getSapClient();
    const result = await client.healthCheck(companyDb);
    return NextResponse.json(result);
  } catch (error) {
    if (isSapServiceLayerError(error)) {
      const status =
        error.code === 'SAP_CONFIG_MISSING'
          ? 503
          : error.code === 'SAP_AUTH_FAILED' || error.code === 'SAP_SESSION_EXPIRED'
            ? 401
            : error.retryable
              ? 502
              : 400;

      return NextResponse.json(
        {
          ok: false,
          code: error.code,
          message: error.message,
          details: error.details,
          retryable: error.retryable,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: 'SAP_UNKNOWN',
        message: error instanceof Error ? error.message : 'Error inesperado en healthcheck SAP',
      },
      { status: 500 }
    );
  }
}
