'use client';

import { useState, useCallback } from 'react';

export type AuthStep = 1 | 2;

/**
 * Hook que encapsula la lógica de autenticación OTP (enviar código y verificar).
 * Separa la lógica de negocio del componente de presentación del login.
 */
export function useAuth() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<AuthStep>(1);
  const [isLoading, setIsLoading] = useState(false);

  const sendCode = useCallback(async (): Promise<{ ok: boolean; message?: string; status?: number }> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setStep(2);
      }
      return { ok: response.ok, message: data.message, status: response.status };
    } catch {
      return { ok: false, message: 'No se pudo conectar con el servidor' };
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  const verifyCode = useCallback(async (): Promise<{ ok: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userEmail', data.email);
      }
      return { ok: response.ok, message: data.message };
    } catch {
      return { ok: false, message: 'No se pudo conectar con el servidor' };
    } finally {
      setIsLoading(false);
    }
  }, [email, code]);

  const goBack = useCallback(() => setStep(1), []);

  return { email, setEmail, code, setCode, step, isLoading, sendCode, verifyCode, goBack };
}
