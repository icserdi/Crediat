import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SapServiceLayerClient } from './client';
import { SapServiceLayerError } from './errors';
import type { SapConfig } from './config';

const config: SapConfig = {
  baseUrl: 'https://sap.example.com:50000/b1s/v1',
  userName: 'user',
  password: 'pass',
  defaultCompanyDb: 'ATNPRUEBAS',
  timeoutMs: 5000,
  maxRetries: 2,
  sessionTtlMs: 1800000,
  retryBaseDelayMs: 1,
};

/** Construye una Response de fetch con cookies y cuerpo. */
function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
): Response {
  const headers = new Headers(init.headers);
  if (init.status === undefined || init.status < 400) {
    headers.set('Content-Type', 'application/json');
  }
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}

describe('SapServiceLayerClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('login y sesión', () => {
    it('hace login y reutiliza la sesión para llamadas posteriores', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(
            { SessionId: 'abc', SessionTimeout: 30 },
            { headers: { 'set-cookie': 'B1SESSION=abc123; Path=/; HttpOnly' } }
          )
        )
        .mockResolvedValueOnce(jsonResponse({ value: [{ CardCode: 'C1' }] }));

      const client = new SapServiceLayerClient(config);
      const result = await client.request<{ value: { CardCode: string }[] }>({
        path: '/BusinessPartners',
        method: 'GET',
      });

      expect(result.value[0].CardCode).toBe('C1');
      // 1 login + 1 request
      expect(fetchMock).toHaveBeenCalledTimes(2);

      // La segunda llamada reutiliza la sesión (sin nuevo login)
      fetchMock.mockResolvedValueOnce(jsonResponse({ value: [] }));
      await client.request({ path: '/BusinessPartners', method: 'GET' });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('lanza SAP_AUTH_FAILED si el login falla con 401', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ error: { message: 'Invalid' } }, { status: 401 })
      );

      const client = new SapServiceLayerClient(config);
      await expect(
        client.request({ path: '/BusinessPartners', method: 'GET' })
      ).rejects.toMatchObject({ code: 'SAP_AUTH_FAILED' });
    });
  });

  describe('healthCheck', () => {
    it('retorna ok con versión cuando la respuesta es válida', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({}, { headers: { 'set-cookie': 'B1SESSION=s1; Path=/' } })
        )
        .mockResolvedValueOnce(jsonResponse({ Version: '9.2' }));

      const client = new SapServiceLayerClient(config);
      const result = await client.healthCheck();

      expect(result.ok).toBe(true);
      expect(result.companyDb).toBe('ATNPRUEBAS');
      expect(result.version).toBe('9.2');
    });

    it('mapea error HTTP a SapServiceLayerError', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({}, { headers: { 'set-cookie': 'B1SESSION=s1; Path=/' } })
        )
        .mockResolvedValueOnce(
          jsonResponse({ error: { message: { value: 'Not found' } } }, { status: 404 })
        );

      const client = new SapServiceLayerClient(config);
      await expect(client.healthCheck()).rejects.toMatchObject({ code: 'SAP_NOT_FOUND' });
    });
  });

  describe('request', () => {
    it('envía cookies de sesión en el request', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({}, { headers: { 'set-cookie': 'B1SESSION=abc123; Path=/' } })
        )
        .mockResolvedValueOnce(jsonResponse({ value: [] }));

      const client = new SapServiceLayerClient(config);
      await client.request({ path: '/BusinessPartners', method: 'GET' });

      const requestCall = fetchMock.mock.calls[1];
      const headers = requestCall[1]?.headers as Record<string, string>;
      expect(headers.Cookie).toContain('B1SESSION=abc123');
    });

    it('serializa el body como JSON para POST', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({}, { headers: { 'set-cookie': 'B1SESSION=s1; Path=/' } })
        )
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const client = new SapServiceLayerClient(config);
      await client.request({
        path: '/BusinessPartners',
        method: 'POST',
        body: { CardCode: 'C1' },
      });

      const requestCall = fetchMock.mock.calls[1];
      expect(requestCall[1]?.body).toBe(JSON.stringify({ CardCode: 'C1' }));
    });

    it('retorna undefined para respuestas 204', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({}, { headers: { 'set-cookie': 'B1SESSION=s1; Path=/' } })
        )
        .mockResolvedValueOnce(new Response(null, { status: 204 }));

      const client = new SapServiceLayerClient(config);
      const result = await client.request({ path: '/x', method: 'DELETE' });
      expect(result).toBeUndefined();
    });

    it('mapea 429 a SAP_RATE_LIMITED', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({}, { headers: { 'set-cookie': 'B1SESSION=s1; Path=/' } })
        )
        .mockResolvedValueOnce(jsonResponse({ error: { message: 'Too many' } }, { status: 429 }));

      const client = new SapServiceLayerClient(config);
      await expect(
        client.request({ path: '/x', method: 'GET', maxRetries: 0 })
      ).rejects.toMatchObject({ code: 'SAP_RATE_LIMITED' });
    });
  });

  describe('reintentos', () => {
    it('reintenta en errores de red y tiene éxito', async () => {
      const netError = Object.assign(new TypeError('fetch failed'), { code: 'ECONNRESET' });
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({}, { headers: { 'set-cookie': 'B1SESSION=s1; Path=/' } })
        )
        .mockRejectedValueOnce(netError)
        .mockResolvedValueOnce(
          jsonResponse({}, { headers: { 'set-cookie': 'B1SESSION=s2; Path=/' } })
        )
        .mockResolvedValueOnce(jsonResponse({ value: [{ CardCode: 'C1' }] }));

      const client = new SapServiceLayerClient(config);
      const result = await client.request<{ value: { CardCode: string }[] }>({
        path: '/BusinessPartners',
        method: 'GET',
      });

      expect(result.value[0].CardCode).toBe('C1');
      // login + request fallido + re-login + request exitoso
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('no reintenta en llamadas no idempotentes (POST)', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({}, { headers: { 'set-cookie': 'B1SESSION=s1; Path=/' } })
        )
        .mockRejectedValueOnce(new TypeError('fetch failed'));

      const client = new SapServiceLayerClient(config);
      await expect(client.request({ path: '/x', method: 'POST', body: {} })).rejects.toBeInstanceOf(
        SapServiceLayerError
      );
      // login + 1 solo intento del POST
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('logout', () => {
    it('llama a /Logout y limpia la sesión', async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({}, { headers: { 'set-cookie': 'B1SESSION=s1; Path=/' } })
        )
        .mockResolvedValueOnce(jsonResponse({ value: [] }))
        .mockResolvedValueOnce(jsonResponse({}));

      const client = new SapServiceLayerClient(config);
      // Establecer sesión primero
      await client.request({ path: '/BusinessPartners', method: 'GET' });
      await client.logout();

      expect(fetchMock).toHaveBeenCalledTimes(3);
      const logoutCall = fetchMock.mock.calls[2];
      expect(String(logoutCall[0])).toContain('/Logout');
    });
  });
});
