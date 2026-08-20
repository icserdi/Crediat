'use client';

import { useState, useCallback, useEffect } from 'react';
import type { CreditCycleStats, CreditAccountSummary } from '@/lib/credit/report';

/**
 * Hook que encapsula la carga del reporte del ciclo de crédito.
 */
export function useCreditReport() {
  const [stats, setStats] = useState<CreditCycleStats | null>(null);
  const [accounts, setAccounts] = useState<CreditAccountSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/credit/report');
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
        setAccounts(data.accounts);
      } else {
        setError(data.message || 'Error al cargar reporte');
      }
    } catch {
      setError('Error de conexión al servidor');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { stats, accounts, isLoading, error, reload: load };
}
