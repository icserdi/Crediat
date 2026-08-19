'use client';

import { useState, useCallback, useEffect } from 'react';
import type { CreditApplication, CreditApplicationInput } from '@/lib/credit/application';

/**
 * Hook que encapsula la carga y creación de solicitudes de crédito.
 */
export function useCreditApplications() {
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/credit/applications');
      const data = await response.json();
      if (response.ok) {
        setApplications(data.applications);
      } else {
        setError(data.message || 'Error al cargar solicitudes');
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

  const create = useCallback(
    async (input: CreditApplicationInput): Promise<{ ok: boolean; message?: string }> => {
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/credit/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await response.json();
        if (response.ok) {
          await load();
          return { ok: true };
        }
        return { ok: false, message: data.message || 'Error al crear solicitud' };
      } catch {
        return { ok: false, message: 'Error de conexión al servidor' };
      } finally {
        setIsSubmitting(false);
      }
    },
    [load]
  );

  return { applications, isLoading, error, isSubmitting, reload: load, create };
}
