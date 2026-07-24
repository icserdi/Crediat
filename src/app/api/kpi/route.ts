import { NextRequest, NextResponse } from 'next/server';
import { getSapClient, isSapConfigured, isSapServiceLayerError } from '@/lib/sap';
import { getSapCompaniesStore } from '@/lib/sap/companies-store';
import type { SapBusinessPartnerDto, SapInvoiceDto, SapODataListResponse } from '@/lib/sap/types';

type KpiResult = {
  dso: { value: number; description: string };
  morosidad: { value: number; description: string };
  recuperacion: { value: number; description: string };
  rotacion: { value: number; description: string };
  riesgo: {
    alto: number;
    medio: number;
    bajo: number;
  };
  totalAr: number;
  totalDebtors: number;
  openInvoices: number;
  companyDb: string;
};

export async function GET(request: NextRequest) {
  if (!isSapConfigured()) {
    return NextResponse.json(
      { error: 'SAP_CONFIG_MISSING', message: 'SAP no configurado.' },
      { status: 503 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('companyId');
  const companyDbParam = searchParams.get('companyDb');

  let companyDb: string | undefined = companyDbParam || undefined;
  if (!companyDb && companyId) {
    const store = getSapCompaniesStore();
    const company = store.getCompanyById(companyId);
    if (company) companyDb = company.companyDb;
  }

  try {
    const client = getSapClient();
    const resolvedDb = companyDb;

    // Fetch all customers (debtors)
    const debtorPath = '/BusinessPartners' +
      `?$filter=${encodeURIComponent("CardType eq 'cCustomer'")}` +
      `&$select=${encodeURIComponent('CardCode,CardName,CreditLimit,CurrentAccountBalance')}` +
      `&$top=1000`;

    const debtors = await client.request<SapODataListResponse<SapBusinessPartnerDto>>({
      path: debtorPath,
      companyDb: resolvedDb,
      method: 'GET',
    });

    // Fetch open invoices
    const openInvoicePath = '/Invoices' +
      `?$filter=${encodeURIComponent("DocumentStatus eq 'bost_Open'")}` +
      `&$select=${encodeURIComponent('DocEntry,DocNum,DocDueDate,DocTotal,DocCurrency')}` +
      `&$orderby=${encodeURIComponent('DocDueDate desc')}` +
      `&$top=1000`;

    const openInvoices = await client.request<SapODataListResponse<SapInvoiceDto>>({
      path: openInvoicePath,
      companyDb: resolvedDb,
      method: 'GET',
    });

    // Fetch closed invoices (last 500 for recovery calc)
    const closedInvoicePath = '/Invoices' +
      `?$filter=${encodeURIComponent("DocumentStatus eq 'bost_Close'")}` +
      `&$select=${encodeURIComponent('DocTotal')}` +
      `&$top=500`;

    const closedInvoices = await client.request<SapODataListResponse<SapInvoiceDto>>({
      path: closedInvoicePath,
      companyDb: resolvedDb,
      method: 'GET',
    });

    // --- Calculate KPIs ---

    const customers = debtors.value || [];
    const openInv = openInvoices.value || [];
    const closedInv = closedInvoices.value || [];

    const totalAr = openInv.reduce((sum, inv) => sum + inv.DocTotal, 0);
    const totalCreditSales = closedInv.reduce((sum, inv) => sum + inv.DocTotal, 0) + totalAr;

    // Risk segmentation
    let alto = 0, medio = 0, bajo = 0;
    for (const c of customers) {
      if (c.CreditLimit && c.CreditLimit > 0) {
        const ratio = (c.CurrentAccountBalance || 0) / c.CreditLimit;
        if (ratio > 0.8) alto++;
        else if (ratio > 0.5) medio++;
        else bajo++;
      } else {
        bajo++;
      }
    }

    const totalCustomers = customers.length;

    // DSO simplified: (Total AR / Total Credit Sales) * 30
    const dsoValue = totalCreditSales > 0
      ? Math.round((totalAr / totalCreditSales) * 30 * 10) / 10
      : 0;

    // Morosidad: % high risk debtors
    const morosidadValue = totalCustomers > 0
      ? Math.round((alto / totalCustomers) * 1000) / 10
      : 0;

    // Recuperación: closed / (open + closed) by amount
    const totalRecovered = closedInv.reduce((sum, inv) => sum + inv.DocTotal, 0);
    const totalRecoverable = totalAr + totalRecovered;
    const recuperacionValue = totalRecoverable > 0
      ? Math.round((totalRecovered / totalRecoverable) * 1000) / 10
      : 0;

    // Rotación: total credit sales / avg AR (simplified with current AR)
    const rotacionValue = totalAr > 0
      ? Math.round((totalCreditSales / totalAr) * 10) / 10
      : 0;

    const result: KpiResult = {
      dso: { value: dsoValue, description: 'Días promedio venta a cobro' },
      morosidad: { value: morosidadValue, description: 'Exposición riesgo crítico' },
      recuperacion: { value: recuperacionValue, description: 'Eficiencia de cartera' },
      rotacion: { value: rotacionValue, description: 'Veces que rota la cartera al año' },
      riesgo: { alto, medio, bajo },
      totalAr: Math.round(totalAr * 100) / 100,
      totalDebtors: totalCustomers,
      openInvoices: openInv.length,
      companyDb: resolvedDb || 'default',
    };

    return NextResponse.json(result);
  } catch (error) {
    if (isSapServiceLayerError(error)) {
      return NextResponse.json(
        { error: error.code, message: error.message, details: error.details },
        { status: error.code === 'SAP_AUTH_FAILED' ? 401 : 502 }
      );
    }
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Error inesperado' },
      { status: 500 }
    );
  }
}