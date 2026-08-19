'use client';

import { useState, useCallback } from 'react';
import type { Prequalification, PrequalificationInput } from '@/lib/credit/prequalification';

/**
 * Hook que encapsula la ejecución de la pre-calificación de una solicitud.
 */
export function usePrequalification() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<Prequalification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (input: PrequalificationInput): Promise<{ ok: boolean; message?: string }> => {
      setIsRunning(true);
      setError(null);
      try {
        const response = await fetch('/api/credit/prequalify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await response.json();
        if (response.ok) {
          setResult(data.prequalification);
          return { ok: true };
        }
        setError(data.message || 'Error al pre-calificar');
        return { ok: false, message: data.message };
      } catch {
        setError('Error de conexión al servidor');
        return { ok: false, message: 'Error de conexión al servidor' };
      } finally {
        setIsRunning(false);
      }
    },
    []
  );

  return { isRunning, result, error, run };
}
