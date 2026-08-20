'use client';

import { useState, useCallback, useEffect } from 'react';
import type { CreditAccount, Approval, CreditGrantInput } from '@/lib/credit/grant';

/**
 * Hook que encapsula la creación de cuentas de crédito y la gestión de aprobaciones.
 */
export function useCreditAccounts() {
  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/credit/accounts');
      const data = await response.json();
      if (response.ok) {
        setAccounts(data.accounts);
      } else {
        setError(data.message || 'Error al cargar cuentas');
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
    async (
      input: CreditGrantInput
    ): Promise<{ ok: boolean; message?: string; account?: CreditAccount }> => {
      try {
        const response = await fetch('/api/credit/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await response.json();
        if (response.ok) {
          await load();
          return { ok: true, account: data.account };
        }
        return { ok: false, message: data.message || 'Error al crear cuenta' };
      } catch {
        return { ok: false, message: 'Error de conexión al servidor' };
      }
    },
    [load]
  );

  const getApprovals = useCallback(async (accountId: string): Promise<Approval[]> => {
    const response = await fetch(`/api/credit/accounts/${accountId}/approvals`);
    const data = await response.json();
    return data.approvals ?? [];
  }, []);

  const decide = useCallback(
    async (
      accountId: string,
      approvalId: string,
      decision: 'aprobado' | 'rechazado',
      approvedBy: string,
      comments?: string
    ): Promise<{ ok: boolean; message?: string; allApproved?: boolean }> => {
      try {
        const response = await fetch(`/api/credit/accounts/${accountId}/approvals/${approvalId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision, approvedBy, comments }),
        });
        const data = await response.json();
        if (response.ok) {
          await load();
          return { ok: true, allApproved: data.allApproved };
        }
        return { ok: false, message: data.message || 'Error al decidir' };
      } catch {
        return { ok: false, message: 'Error de conexión al servidor' };
      }
    },
    [load]
  );

  return { accounts, isLoading, error, reload: load, create, getApprovals, decide };
}
