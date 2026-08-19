import { describe, it, expect, vi, afterEach } from 'vitest';
import { withRetry, defaultShouldRetry, wrapNetworkError } from './retry';
import { SapServiceLayerError } from './errors';

describe('withRetry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna el resultado si la función tiene éxito al primer intento', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      shouldRetry: () => true,
    });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('reintenta hasta tener éxito', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('recovered');
    const result = await withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      shouldRetry: () => true,
    });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('lanza el último error si se agotan los intentos', async () => {
    const error = new Error('boom');
    const fn = vi.fn().mockRejectedValue(error);
    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        baseDelayMs: 1,
        shouldRetry: () => true,
      })
    ).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('no reintenta cuando shouldRetry retorna false', async () => {
    const error = new Error('boom');
    const fn = vi.fn().mockRejectedValue(error);
    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        baseDelayMs: 1,
        shouldRetry: () => false,
      })
    ).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('defaultShouldRetry', () => {
  it('retorna true para errores SAP retryable', () => {
    const err = new SapServiceLayerError('SAP_TIMEOUT', 'x', {}, { retryable: true });
    expect(defaultShouldRetry(err)).toBe(true);
  });

  it('retorna false para errores SAP no retryable', () => {
    const err = new SapServiceLayerError('SAP_NOT_FOUND', 'x');
    expect(defaultShouldRetry(err)).toBe(false);
  });

  it('retorna true para errores de red', () => {
    const err = new Error('boom') as NodeJS.ErrnoException;
    err.code = 'ECONNRESET';
    expect(defaultShouldRetry(err)).toBe(true);
  });

  it('retorna true para mensajes con timeout', () => {
    const err = new Error('request timeout exceeded');
    expect(defaultShouldRetry(err)).toBe(true);
  });

  it('retorna false para errores genéricos', () => {
    expect(defaultShouldRetry(new Error('algo salió mal'))).toBe(false);
  });
});

describe('wrapNetworkError', () => {
  it('retorna el mismo error si ya es SapServiceLayerError', () => {
    const sapErr = new SapServiceLayerError('SAP_NOT_FOUND', 'x');
    expect(wrapNetworkError(sapErr, '/path')).toBe(sapErr);
  });

  it('mapea AbortError a SAP_TIMEOUT retryable', () => {
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';
    const err = wrapNetworkError(abortErr, '/path');
    expect(err.code).toBe('SAP_TIMEOUT');
    expect(err.retryable).toBe(true);
  });

  it('mapea errores de red a SAP_NETWORK retryable', () => {
    const netErr = new Error('conn refused') as NodeJS.ErrnoException;
    netErr.code = 'ECONNREFUSED';
    const err = wrapNetworkError(netErr, '/path');
    expect(err.code).toBe('SAP_NETWORK');
    expect(err.retryable).toBe(true);
  });

  it('mapea errores desconocidos a SAP_UNKNOWN', () => {
    const err = wrapNetworkError(new Error('raro'), '/path');
    expect(err.code).toBe('SAP_UNKNOWN');
    expect(err.retryable).toBe(false);
  });
});
