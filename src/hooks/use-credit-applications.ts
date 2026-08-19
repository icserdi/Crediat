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
        const formData = new FormData();

        Object.entries(input).forEach(([key, value]) => {
          if (key === 'files') {
            const files = value as unknown as File[];
            files.forEach((file) => {
              formData.append('files', file, file.name);
            });
          } else if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        const response = await fetch('/api/credit/applications', {
          method: 'POST',
          body: formData,
          // No fijar Content-Type manualmente: fetch define el multipart boundary
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

  /** Obtiene una solicitud por ID. */
  const get = useCallback(async (id: string) => {
    const response = await fetch(`/api/credit/applications/${id}`);
    const data = await response.json();
    return data.application ?? null;
  }, []);

  /** Actualiza el estatus de una solicitud. */
  const updateStatus = useCallback(
    async (
      id: string,
      status: CreditApplication['status'],
      reason?: string
    ): Promise<{ ok: boolean; message?: string }> => {
      try {
        const response = await fetch(`/api/credit/applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, reason }),
        });
        const data = await response.json();
        if (response.ok) {
          await load();
          return { ok: true };
        }
        return { ok: false, message: data.message || 'Error al actualizar estatus' };
      } catch {
        return { ok: false, message: 'Error de conexión al servidor' };
      }
    },
    [load]
  );

  return {
    applications,
    isLoading,
    error,
    isSubmitting,
    reload: load,
    create,
    get,
    updateStatus,
  };
}
