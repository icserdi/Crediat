'use client';

import { useState, useCallback, useEffect } from 'react';

export type AuditEvent = {
  id: string;
  event_type: string;
  severity: string;
  actor: string;
  actor_role: string | null;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown>;
  company_db: string | null;
  ip_address: string | null;
  created_at: string;
};

export type AuditStats = {
  logins: number;
  logouts: number;
  iaInvocations: number;
  writes: number;
};

/**
 * Hook que encapsula la carga de logs de auditoría.
 */
export function useAudit() {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    logins: 0,
    logouts: 0,
    iaInvocations: 0,
    writes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/audit?limit=100');
      const data = await response.json();
      if (response.ok) {
        setLogs(data.logs);
        setStats(data.stats);
      } else {
        setError(data.message || 'Error al cargar auditoría');
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

  return { logs, stats, isLoading, error, reload: load };
}
