import { NextRequest, NextResponse } from 'next/server';
import { getSapClient, isSapConfigured, isSapServiceLayerError } from '@/lib/sap';
import { getSapCompaniesStore } from '@/lib/sap/companies-store';
import type { SapInvoiceDto, SapODataListResponse } from '@/lib/sap/types';

/**
 * GET /api/invoices?companyId=uuid&skip=0&top=50&filter=...
 * Obtiene facturas desde SAP B1 Service Layer.
 * Acepta companyId (UUID interno) o companyDb (nombre real de BD).
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

    let path = '/Invoices';

    const odataFilter = filter ? `(${filter})` : "DocumentStatus eq 'bost_Open'";

    const queryParts = [
      `$filter=${encodeURIComponent(odataFilter)}`,
      `$select=${encodeURIComponent('DocEntry,DocNum,CardCode,CardName,DocDate,DocDueDate,DocTotal,DocCurrency,DocumentStatus,DocTotalFc,DocTotalSys')}`,
      `$orderby=${encodeURIComponent('DocDueDate desc')}`,
    ];

    if (skip > 0) queryParts.push(`$skip=${skip}`);
    if (top > 0) queryParts.push(`$top=${Math.min(top, 100)}`);

    path += `?${queryParts.join('&')}`;

    const response = await client.request<SapODataListResponse<SapInvoiceDto>>({
      path,
      companyDb,
      method: 'GET',
    });

    return NextResponse.json({
      invoices: response.value,
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
        message: error instanceof Error ? error.message : 'Error inesperado al obtener facturas',
      },
      { status: 500 }
    );
  }
}
