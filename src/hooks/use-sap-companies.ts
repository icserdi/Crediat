'use client';

import { useState, useCallback, useEffect } from 'react';
import type { SapCompany } from '@/lib/sap/types';

export type CompanyFormData = {
  companyDb: string;
  friendlyName: string;
  description: string;
  isActive: boolean;
};

/**
 * Hook que encapsula el CRUD de empresas SAP (admin).
 */
export function useSapCompanies() {
  const [companies, setCompanies] = useState<SapCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/sap-companies');
      const data = await response.json();
      if (response.ok) {
        setCompanies(data.companies);
      }
    } catch {
      // El error se maneja en la UI vía toast
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const create = useCallback(
    async (formData: CompanyFormData): Promise<{ ok: boolean; message?: string }> => {
      try {
        const response = await fetch('/api/admin/sap-companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (response.ok) await load();
        return { ok: response.ok, message: data.message };
      } catch {
        return { ok: false, message: 'Error de conexión' };
      }
    },
    [load]
  );

  const update = useCallback(
    async (id: string, formData: CompanyFormData): Promise<{ ok: boolean; message?: string }> => {
      try {
        const response = await fetch(`/api/admin/sap-companies/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (response.ok) await load();
        return { ok: response.ok, message: data.message };
      } catch {
        return { ok: false, message: 'Error de conexión' };
      }
    },
    [load]
  );

  const remove = useCallback(
    async (id: string): Promise<{ ok: boolean; message?: string }> => {
      try {
        const response = await fetch(`/api/admin/sap-companies/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) await load();
        else {
          const data = await response.json();
          return { ok: false, message: data.message };
        }
        return { ok: true };
      } catch {
        return { ok: false, message: 'Error de conexión' };
      }
    },
    [load]
  );

  const assign = useCallback(
    async (userId: string, companyIds: string[]): Promise<{ ok: boolean; message?: string }> => {
      try {
        const response = await fetch('/api/admin/sap-companies/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            companyIds,
            assignedBy: 'admin',
          }),
        });
        const data = await response.json();
        return { ok: response.ok, message: data.message };
      } catch {
        return { ok: false, message: 'Error de conexión' };
      }
    },
    []
  );

  return { companies, isLoading, reload: load, create, update, remove, assign };
}
