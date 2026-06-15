import { z } from 'zod';
import { SapServiceLayerError } from './errors';

const sapConfigSchema = z.object({
  baseUrl: z.string().url(),
  userName: z.string().min(1),
  password: z.string().min(1),
  defaultCompanyDb: z.string().min(1),
  timeoutMs: z.coerce.number().int().positive().default(30_000),
  maxRetries: z.coerce.number().int().min(0).max(10).default(3),
  sessionTtlMs: z.coerce.number().int().positive().default(1_800_000),
  retryBaseDelayMs: z.coerce.number().int().positive().default(500),
});

export type SapConfig = z.infer<typeof sapConfigSchema>;

let cachedConfig: SapConfig | null = null;

/**
 * Carga configuración desde variables de entorno (solo servidor).
 * No cachea fallos de validación para permitir hot-reload en dev.
 */
export function loadSapConfig(): SapConfig {
  if (cachedConfig) return cachedConfig;

  const raw = {
    baseUrl: process.env.SAP_SERVICE_LAYER_BASE_URL,
    userName: process.env.SAP_SERVICE_LAYER_USER,
    password: process.env.SAP_SERVICE_LAYER_PASSWORD,
    defaultCompanyDb: process.env.SAP_SERVICE_LAYER_DEFAULT_COMPANY_DB,
    timeoutMs: process.env.SAP_SERVICE_LAYER_TIMEOUT_MS,
    maxRetries: process.env.SAP_SERVICE_LAYER_MAX_RETRIES,
    sessionTtlMs: process.env.SAP_SERVICE_LAYER_SESSION_TTL_MS,
    retryBaseDelayMs: process.env.SAP_SERVICE_LAYER_RETRY_BASE_DELAY_MS,
  };

  const parsed = sapConfigSchema.safeParse(raw);
  if (!parsed.success) {
    throw new SapServiceLayerError(
      'SAP_CONFIG_MISSING',
      'Configuración SAP incompleta. Revise SAP_SERVICE_LAYER_* en el entorno.',
      { cause: parsed.error.flatten() }
    );
  }

  cachedConfig = {
    ...parsed.data,
    baseUrl: parsed.data.baseUrl.replace(/\/$/, ''),
  };
  return cachedConfig;
}

export function isSapConfigured(): boolean {
  return Boolean(
    process.env.SAP_SERVICE_LAYER_BASE_URL &&
      process.env.SAP_SERVICE_LAYER_USER &&
      process.env.SAP_SERVICE_LAYER_PASSWORD &&
      process.env.SAP_SERVICE_LAYER_DEFAULT_COMPANY_DB
  );
}

/** Limpia caché (útil en tests). */
export function resetSapConfigCache(): void {
  cachedConfig = null;
}
