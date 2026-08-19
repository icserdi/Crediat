import { NextRequest, NextResponse } from 'next/server';
import { getSapClient, isSapConfigured, isSapServiceLayerError } from '@/lib/sap';
import { getSapCompaniesStore } from '@/lib/sap/companies-store';
import type { SapBusinessPartnerDto, SapODataListResponse } from '@/lib/sap/types';

/**
 * GET /api/debtors?companyDb=SBO_DEMO&skip=0&top=50&filter=...
 * Obtiene lista de deudores (Business Partners) desde SAP B1 Service Layer.
 * Acepta companyDb (nombre real de BD) o companyId (UUID interno).
 */
export async function GET(request: NextRequest) {
  if (!isSapConfigured()) {
    return NextResponse.json(
      {
        error: 'SAP_CONFIG_MISSING',
        message: 'SAP no configurado. Defina SAP_SERVICE_LAYER_* en variables de entorno.',
      },
      { status: 503 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('companyId');
  const companyDbParam = searchParams.get('companyDb');
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const top = parseInt(searchParams.get('top') || '50', 10);
  const filter = searchParams.get('filter') || undefined;

  // Resolver CompanyDB: si viene companyId (UUID), buscar en el store
  let companyDb: string | undefined = companyDbParam || undefined;
  if (!companyDb && companyId) {
    const store = getSapCompaniesStore();
    const company = store.getCompanyById(companyId);
    if (company) {
      companyDb = company.companyDb;
    }
  }

  try {
    const client = getSapClient();

    // Construir la query OData manualmente para usar %20 en lugar de + para espacios
    let path = '/BusinessPartners';

    // Filtrar solo clientes (CardType = 'cCustomer')
    const odataFilter = filter
      ? `(${filter}) and CardType eq 'cCustomer'`
      : "CardType eq 'cCustomer'";

    const queryParts = [
      `$filter=${encodeURIComponent(odataFilter)}`,
      `$select=${encodeURIComponent('CardCode,CardName,EmailAddress,Phone1,Cellular,CreditLimit,CurrentAccountBalance,GroupCode')}`,
      `$orderby=${encodeURIComponent('CardName asc')}`,
    ];

    if (skip > 0) queryParts.push(`$skip=${skip}`);
    if (top > 0) queryParts.push(`$top=${Math.min(top, 100)}`);

    path += `?${queryParts.join('&')}`;

    const response = await client.request<SapODataListResponse<SapBusinessPartnerDto>>({
      path,
      companyDb,
      method: 'GET',
    });

    return NextResponse.json({
      debtors: response.value,
      total: response.value.length,
      skip,
      top,
      companyDb: companyDb || 'default',
    });
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
          error: error.code,
          message: error.message,
          details: error.details,
          retryable: error.retryable,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error inesperado al obtener deudores',
      },
      { status: 500 }
    );
  }
}
