'use client';

import { useState, useCallback, useEffect } from 'react';

export type Interaction = {
  id: string;
  company_db: string;
  debtor_id: string;
  debtor_name: string;
  type: string;
  content: string;
  direction: string;
  status: string;
  assigned_to: string;
  user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

/**
 * Hook que encapsula la carga y envío de interacciones (bandeja unificada).
 */
export function useInteractions(companyId: string) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const load = useCallback(async (companyIdArg?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (companyIdArg) params.append('companyId', companyIdArg);
      params.append('limit', '50');

      const response = await fetch(`/api/interactions?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setInteractions(data.interactions);
      } else {
        setError(data.message || 'Error al cargar interacciones');
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

  /** Envía una nueva interacción. Retorna true si tuvo éxito. */
  const send = useCallback(
    async (content: string): Promise<boolean> => {
      if (!content.trim() || !companyId) return false;

      setIsSending(true);
      try {
        const response = await fetch('/api/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyDb: companyId,
            debtorId: 'manual',
            debtorName: 'Manual',
            type: 'WhatsApp',
            content: content.trim(),
            direction: 'outbound',
            assignedTo: 'Sistema IA',
          }),
        });

        if (response.ok) {
          await load(companyId);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [companyId, load]
  );

  return { interactions, isLoading, error, isSending, reload: () => load(companyId), send };
}
