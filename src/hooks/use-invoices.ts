'use client';

import { useState, useCallback, useEffect } from 'react';
import type { SapInvoiceDto } from '@/lib/sap/types';

export type Invoice = {
  docEntry: number;
  docNum: number;
  cardCode: string;
  cardName: string;
  date: string;
  dueDate: string;
  total: number;
  currency: string;
  status: string;
  daysOverdue: number;
};

/** Transforma una factura de SAP al formato interno del módulo. */
export function transformInvoice(inv: SapInvoiceDto): Invoice {
  const dueDate = new Date(inv.DocDueDate);
  const today = new Date();
  const diffTime = today.getTime() - dueDate.getTime();
  const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  let status = 'Pagada';
  if (inv.DocumentStatus === 'bost_Open') {
    status = daysOverdue > 0 ? 'Vencida' : 'Pendiente';
  } else if (inv.DocumentStatus === 'bost_Delivered') {
    status = 'Parcial';
  }

  return {
    docEntry: inv.DocEntry,
    docNum: inv.DocNum,
    cardCode: inv.CardCode,
    cardName: inv.CardName,
    date: inv.DocDate,
    dueDate: inv.DocDueDate,
    total: inv.DocTotal,
    currency: inv.DocCurrency,
    status,
    daysOverdue,
  };
}

/**
 * Hook que encapsula la carga y transformación de facturas desde SAP.
 */
export function useInvoices(companyId: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (companyIdArg?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (companyIdArg) params.append('companyId', companyIdArg);
      params.append('top', '100');

      const response = await fetch(`/api/invoices?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        const transformed: Invoice[] = data.invoices.map(transformInvoice);
        setInvoices(transformed);
      } else {
        setError(data.message || 'Error al cargar facturas');
      }
    } catch {
      setError('Error de conexión al servidor');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (companyId) load(companyId);
    else setIsLoading(false);
  }, [companyId, load]);

  return { invoices, isLoading, error, reload: () => load(companyId) };
}
