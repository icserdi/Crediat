'use client';

import { useState, useCallback, useEffect } from 'react';

export type AnalyticsData = {
  kpi: {
    morosidad: number;
    recuperacion: number;
    rotacion: number;
  };
  cashFlowProjection: {
    day: string;
    actual: number;
    projected: number;
  }[];
  monthlyTrend: {
    month: string;
    recovery: number;
    morbidity: number;
  }[];
  insights: {
    title: string;
    description: string;
    type: 'info' | 'warning' | 'success';
  }[];
  totalDebtors: number;
  totalAr: number;
  asOf: string;
};

/**
 * Hook que encapsula la carga de datos de analítica desde la API.
 */
export function useAnalytics(companyId: string) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (companyIdArg?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (companyIdArg) params.append('companyId', companyIdArg);
      const response = await fetch(`/api/analytics/data?${params.toString()}`);
      const result = await response.json();
      if (response.ok) setData(result);
      else setError(result.message || 'Error al cargar analítica');
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
