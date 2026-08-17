'use client';

import { useState, useCallback, useEffect } from 'react';

export type Interaction = {
  id: string;
  content: string;
  type: string;
  assigned_to: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

/**
 * Hook que encapsula la carga de interacciones y el registro de promesas
 * de pago para el detalle de un deudor.
 */
export function useDebtorDetail(companyId: string, debtorId: string) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadInteractions = useCallback(async () => {
    if (!companyId || !debtorId) return;
    try {
      const response = await fetch(
        `/api/interactions?companyId=${companyId}&debtorId=${debtorId}&limit=20`
      );
      const data = await response.json();
      if (data.interactions) setInteractions(data.interactions);
    } catch {
      // Silencioso: la UI no depende de esto para funcionar
    }
  }, [companyId, debtorId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInteractions();
  }, [loadInteractions]);

  const registerPromise = useCallback(
    async (promiseDate: string): Promise<{ ok: boolean; message?: string; sapWritten?: boolean }> => {
      if (!promiseDate || !companyId) {
        return { ok: false, message: 'Seleccione una fecha de promesa.' };
      }

      setIsSaving(true);
      try {
        const response = await fetch('/api/sap/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId,
            cardCode: debtorId,
            debtorName: debtorId,
            type: 'promise',
            data: { paymentPromise: promiseDate },
          }),
        });

        const result = await response.json();
        if (response.ok) {
          await loadInteractions();
          return { ok: true, message: result.message, sapWritten: result.sapWritten };
        }
        return { ok: false, message: result.message };
      } catch {
        return { ok: false, message: 'No se pudo conectar con el servidor' };
      } finally {
        setIsSaving(false);
      }
    },
    [companyId, debtorId, loadInteractions]
  );

  return { interactions, isSaving, registerPromise };
}
