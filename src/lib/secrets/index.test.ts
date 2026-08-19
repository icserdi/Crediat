import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSecret, validateSecrets, assertSecretsConfigured } from './index';

describe('secrets', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getSecret', () => {
    it('retorna el valor de una variable de entorno', () => {
      vi.stubEnv('MY_SECRET', 'valor-secreto');
      expect(getSecret('MY_SECRET')).toBe('valor-secreto');
    });

    it('retorna undefined si no está configurada', () => {
      expect(getSecret('NO_EXISTE')).toBeUndefined();
    });
  });

  describe('validateSecrets', () => {
    it('en desarrollo no exige los secretos de producción', () => {
      vi.stubEnv('NODE_ENV', 'development');
      expect(validateSecrets()).toEqual([]);
    });

    it('en producción reporta los secretos faltantes', () => {
      vi.stubEnv('NODE_ENV', 'production');
      // Limpiar todos los secrets
      const missing = validateSecrets();
      expect(missing).toContain('DATABASE_URL');
      expect(missing).toContain('SAP_SERVICE_LAYER_PASSWORD');
      expect(missing).toContain('OPENROUTER_API_KEY');
    });

    it('en producción no reporta secretos que sí están configurados', () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('DATABASE_URL', 'postgres://user:pass@host/db');
      vi.stubEnv('SAP_SERVICE_LAYER_BASE_URL', 'https://sap');
      vi.stubEnv('SAP_SERVICE_LAYER_USER', 'user');
      vi.stubEnv('SAP_SERVICE_LAYER_PASSWORD', 'pass');
      vi.stubEnv('SAP_SERVICE_LAYER_DEFAULT_COMPANY_DB', 'DB');
      vi.stubEnv('BREVO_API_KEY', 'key');
      vi.stubEnv('OPENROUTER_API_KEY', 'key');

      expect(validateSecrets()).toEqual([]);
    });
  });

  describe('assertSecretsConfigured', () => {
    it('no lanza en desarrollo aunque falten secretos', () => {
      vi.stubEnv('NODE_ENV', 'development');
      expect(() => assertSecretsConfigured()).not.toThrow();
    });

    it('lanza en producción si faltan secretos', () => {
      vi.stubEnv('NODE_ENV', 'production');
      expect(() => assertSecretsConfigured()).toThrow(/Secretos de producción faltantes/);
    });
  });
});
