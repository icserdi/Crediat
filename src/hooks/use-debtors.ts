'use client';

import { useState, useCallback, useEffect } from 'react';
import type { SapBusinessPartnerDto } from '@/lib/sap/types';

export type Debtor = {
  id: string;
  name: string;
  email: string | null;
  balance: number;
  risk: string;
  score: number;
  status: string;
  phone: string | null;
  cellular: string | null;
  creditLine: number | null;
  groupCode: number | null;
};

/** Transforma un Business Partner de SAP al formato interno del módulo. */
export function transformDebtor(bp: SapBusinessPartnerDto): Debtor {
  const balance = bp.CurrentAccountBalance || 0;
  const creditLine = bp.CreditLimit || 0;

  let risk = 'Bajo';
  let score = 0;
  let status = 'Activo';

  if (balance > creditLine * 0.8 && creditLine > 0) {
    risk = 'Alto';
    score = 0.85;
    status = 'Vencido';
  } else if (balance > creditLine * 0.5 && creditLine > 0) {
    risk = 'Moderado';
    score = 0.5;
    status = 'Activo';
  } else if (balance === 0) {
    risk = 'Bajo';
    score = 0.05;
    status = 'Liquidado';
  } else {
    risk = 'Bajo';
    score = 0.15;
    status = 'Activo';
  }

  return {
    id: bp.CardCode,
    name: bp.CardName,
    email: bp.EmailAddress || null,
    balance,
    risk,
    score,
    status,
    phone: bp.Phone1 || null,
    cellular: bp.Cellular || null,
    creditLine,
    groupCode: bp.GroupCode || null,
  };
}

/**
 * Hook que encapsula la carga y transformación de deudores desde SAP.
 */
export function useDebtors(companyId: string) {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (companyIdArg?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (companyIdArg) params.append('companyId', companyIdArg);
      params.append('top', '100');

      const response = await fetch(`/api/debtors?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        const transformedDebtors: Debtor[] = data.debtors.map(transformDebtor);
        setDebtors(transformedDebtors);
      } else {
        setError(data.message || 'Error al cargar deudores');
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

  return { debtors, isLoading, error, reload: () => load(companyId) };
}
