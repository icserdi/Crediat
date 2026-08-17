'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook que gestiona la empresa activa seleccionada por el usuario.
 * Se sincroniza con localStorage y reacciona a cambios desde otros
 * componentes (p. ej. el selector de empresa del sidebar).
 */
export function useActiveCompany() {
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');

  useEffect(() => {
    const id = localStorage.getItem('activeCompanyId') || '';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveCompanyId(id);

    const handler = () => {
      const newId = localStorage.getItem('activeCompanyId') || '';
      setActiveCompanyId(newId);
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const refresh = useCallback(() => {
    const id = localStorage.getItem('activeCompanyId') || '';
    setActiveCompanyId(id);
  }, []);

  return { activeCompanyId, setActiveCompanyId, refresh };
}
