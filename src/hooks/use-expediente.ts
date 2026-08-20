'use client';

import { useState } from 'react';
import type { ExpedienteDocumento, ExpedienteAlerta, DocumentType } from '@/lib/credit/expediente';

/**
 * Hook que encapsula la gestión del expediente de crédito (documentos y alertas).
 */
export function useExpediente() {
  const [documentos, setDocumentos] = useState<ExpedienteDocumento[]>([]);
  const [alertas, setAlertas] = useState<ExpedienteAlerta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAlertas, setIsLoadingAlertas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertasError, setAlertasError] = useState<string | null>(null);

  const load = async (accountId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/credit/expedientes/${accountId}`);
      const data = await response.json();
      if (response.ok) setDocumentos(data.documentos);
      else setError(data.message || 'Error al cargar expediente');
    } catch {
      setError('Error de conexión al servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlertas = async () => {
    setIsLoadingAlertas(true);
    setAlertasError(null);
    try {
      const response = await fetch('/api/credit/expedientes/alertas');
      const data = await response.json();
      if (response.ok) setAlertas(data.documentos);
      else setAlertasError(data.message || 'Error al cargar alertas');
    } catch {
      setAlertasError('Error de conexión al servidor');
    } finally {
      setIsLoadingAlertas(false);
    }
  };

  const add = async (
    accountId: string,
    input: { documentType: DocumentType; issuedAt: string; expiresAt: string; file: File }
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const formData = new FormData();
      formData.append('documentType', input.documentType);
      formData.append('issuedAt', input.issuedAt);
      formData.append('expiresAt', input.expiresAt);
      formData.append('file', input.file, input.file.name);

      const response = await fetch(`/api/credit/expedientes/${accountId}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        await load(accountId);
        return { ok: true };
      }
      return { ok: false, message: data.message || 'Error al agregar documento' };
    } catch {
      return { ok: false, message: 'Error de conexión al servidor' };
    }
  };

  return {
    documentos,
    alertas,
    isLoading,
    isLoadingAlertas,
    error,
    alertasError,
    load,
    loadAlertas,
    add,
  };
}
