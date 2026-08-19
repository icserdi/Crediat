import { loadSapConfig, type SapConfig } from './config';
import { SapServiceLayerError, isSapServiceLayerError, mapHttpStatusToSapError } from './errors';
import { SapSessionManager } from './session-manager';
import { defaultShouldRetry, withRetry, wrapNetworkError } from './retry';
import type { SapHealthResult, SapRequestOptions, SapServiceLayerErrorBody } from './types';

const IDEMPOTENT_METHODS = new Set(['GET', 'PUT', 'DELETE']);

let singletonClient: SapServiceLayerClient | null = null;

export function getSapClient(): SapServiceLayerClient {
  if (!singletonClient) {
    singletonClient = new SapServiceLayerClient(loadSapConfig());
  }
  return singletonClient;
}

export function resetSapClient(): void {
  singletonClient = null;
}

/**
 * Cliente HTTP para SAP B1 Service Layer con sesión, reintentos y errores tipados.
 */
export class SapServiceLayerClient {
  private readonly sessions: SapSessionManager;

  constructor(private readonly config: SapConfig) {
    this.sessions = new SapSessionManager(config);
  }

  async request<T>(options: SapRequestOptions): Promise<T> {
    const companyDb = this.sessions.resolveCompanyDb(options.companyDb);
    const maxAttempts = (options.maxRetries ?? this.config.maxRetries) + 1;

    const method = options.method ?? 'GET';
    const allowRetry = options.retryable ?? IDEMPOTENT_METHODS.has(method);
    const retryOptions = allowRetry
      ? {
          maxAttempts,
          baseDelayMs: this.config.retryBaseDelayMs,
          shouldRetry: (error: unknown) => defaultShouldRetry(error),
        }
      : {
          maxAttempts: 1,
          baseDelayMs: this.config.retryBaseDelayMs,
          shouldRetry: () => false,
        };

    return withRetry(async (attempt) => {
      try {
        return await this.executeRequest<T>(options, companyDb, attempt > 1);
      } catch (error) {
        if (
          isSapServiceLayerError(error) &&
          (error.code === 'SAP_AUTH_FAILED' || error.code === 'SAP_SESSION_EXPIRED')
        ) {
          this.sessions.invalidate(companyDb);
        }
        throw error;
      }
    }, retryOptions);
  }

  async healthCheck(companyDb?: string): Promise<SapHealthResult> {
    const db = this.sessions.resolveCompanyDb(companyDb);
    const started = Date.now();

    const session = await this.sessions.getSession(db);
    const response = await fetch(`${this.config.baseUrl}/BusinessPartners?$top=0`, {
      method: 'GET',
      headers: this.sessions.cookieHeaders(session.cookies),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const { message } = await parseSapErrorBody(response);
      throw mapHttpStatusToSapError(response.status, message, {
        companyDb: db,
        httpStatus: response.status,
        path: '/BusinessPartners?$top=0',
      });
    }

    let version: string | undefined;
    try {
      const payload = (await response.json()) as { Version?: string };
      version = payload?.Version;
    } catch {
      // Respuesta vacía no invalida el healthcheck si el status fue 200.
    }

    return {
      ok: true,
      companyDb: db,
      latencyMs: Date.now() - started,
      version,
      checkedAt: new Date().toISOString(),
    };
  }

  async logout(companyDb?: string): Promise<void> {
    await this.sessions.logout(companyDb);
  }

  private async executeRequest<T>(
    options: SapRequestOptions,
    companyDb: string,
    forceNewSession: boolean
  ): Promise<T> {
    if (forceNewSession) {
      this.sessions.invalidate(companyDb);
    }

    const session = await this.sessions.getSession(companyDb);
    const path = options.path.startsWith('/') ? options.path : `/${options.path}`;
    const url = `${this.config.baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers: {
          ...this.sessions.cookieHeaders(session.cookies),
          ...options.headers,
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (response.status === 401) {
        throw new SapServiceLayerError(
          'SAP_SESSION_EXPIRED',
          'Sesión SAP expirada o inválida',
          { companyDb, httpStatus: 401, path },
          { retryable: true }
        );
      }

      if (!response.ok) {
        const { message, sapCode } = await parseSapErrorBody(response);
        throw mapHttpStatusToSapError(response.status, message, {
          companyDb,
          httpStatus: response.status,
          sapCode,
          sapMessage: message,
          path,
        });
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const text = await response.text();
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    } catch (error) {
      if (isSapServiceLayerError(error)) throw error;
      throw wrapNetworkError(error, path);
    }
  }
}

async function parseSapErrorBody(
  response: Response
): Promise<{ message: string; sapCode?: number }> {
  const text = await response.text();
  if (!text) {
    return { message: `HTTP ${response.status}` };
  }
  try {
    const body = JSON.parse(text) as SapServiceLayerErrorBody;
    const msg = body.error?.message;
    const message =
      typeof msg === 'object' && msg?.value
        ? msg.value
        : typeof msg === 'string'
          ? msg
          : body.error?.code
            ? `SAP error ${body.error.code}`
            : text;
    return { message, sapCode: body.error?.code };
  } catch {
    return { message: text };
  }
}
