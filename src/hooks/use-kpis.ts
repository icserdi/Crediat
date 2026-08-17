'use client';

import { useState, useCallback, useEffect } from 'react';

export type KpiData = {
  dso: { value: number; description: string };
  morosidad: { value: number; description: string };
  recuperacion: { value: number; description: string };
  rotacion: { value: number; description: string };
  riesgo: { alto: number; medio: number; bajo: number };
  totalAr: number;
  totalDebtors: number;
  openInvoices: number;
  companyDb: string;
};

/**
 * Hook que encapsula la carga de KPIs del dashboard desde la API.
 * Separa la lógica de datos del componente de presentación.
 */
export function useKpis(companyId: string) {
  const [data, setData] = useState<KpiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (companyIdArg?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (companyIdArg) params.append('companyId', companyIdArg);

      const response = await fetch(`/api/kpi?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        setError(result.message || 'Error al cargar KPIs');
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

  return { data, isLoading, error, reload: () => load(companyId) };
}
