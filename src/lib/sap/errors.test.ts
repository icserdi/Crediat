import { describe, it, expect } from 'vitest';
import { SapServiceLayerError, mapHttpStatusToSapError, isSapServiceLayerError } from './errors';

describe('SapServiceLayerError', () => {
  it('crea un error con código y detalles', () => {
    const err = new SapServiceLayerError('SAP_NOT_FOUND', 'No encontrado', {
      httpStatus: 404,
      path: '/BusinessPartners',
    });
    expect(err.name).toBe('SapServiceLayerError');
    expect(err.code).toBe('SAP_NOT_FOUND');
    expect(err.message).toBe('No encontrado');
    expect(err.details.httpStatus).toBe(404);
    expect(err.retryable).toBe(false);
  });

  it('serializa a JSON con los campos relevantes', () => {
    const err = new SapServiceLayerError('SAP_TIMEOUT', 'Timeout', {}, { retryable: true });
    const json = err.toJSON();
    expect(json.code).toBe('SAP_TIMEOUT');
    expect(json.retryable).toBe(true);
    expect(json.message).toBe('Timeout');
  });
});

describe('mapHttpStatusToSapError', () => {
  it('mapea 401 a SAP_AUTH_FAILED retryable', () => {
    const err = mapHttpStatusToSapError(401, 'No autorizado', {});
    expect(err.code).toBe('SAP_AUTH_FAILED');
    expect(err.retryable).toBe(true);
    expect(err.details.httpStatus).toBe(401);
  });

  it('mapea 404 a SAP_NOT_FOUND no retryable', () => {
    const err = mapHttpStatusToSapError(404, 'No encontrado', {});
    expect(err.code).toBe('SAP_NOT_FOUND');
    expect(err.retryable).toBe(false);
  });

  it('mapea 409 a SAP_CONFLICT', () => {
    const err = mapHttpStatusToSapError(409, 'Conflicto', {});
    expect(err.code).toBe('SAP_CONFLICT');
  });

  it('mapea 429 a SAP_RATE_LIMITED retryable', () => {
    const err = mapHttpStatusToSapError(429, 'Rate limit', {});
    expect(err.code).toBe('SAP_RATE_LIMITED');
    expect(err.retryable).toBe(true);
  });

  it('mapea 4xx genérico a SAP_VALIDATION', () => {
    const err = mapHttpStatusToSapError(422, 'Validación', {});
    expect(err.code).toBe('SAP_VALIDATION');
    expect(err.retryable).toBe(false);
  });

  it('mapea 5xx a SAP_SERVER_ERROR retryable', () => {
    const err = mapHttpStatusToSapError(500, 'Error interno', {});
    expect(err.code).toBe('SAP_SERVER_ERROR');
    expect(err.retryable).toBe(true);
  });

  it('mapea otros códigos a SAP_UNKNOWN', () => {
    const err = mapHttpStatusToSapError(200, 'OK', {});
    expect(err.code).toBe('SAP_UNKNOWN');
  });
});

describe('isSapServiceLayerError', () => {
  it('reconoce instancias de SapServiceLayerError', () => {
    const err = new SapServiceLayerError('SAP_UNKNOWN', 'x');
    expect(isSapServiceLayerError(err)).toBe(true);
  });

  it('rechaza errores genéricos', () => {
    expect(isSapServiceLayerError(new Error('x'))).toBe(false);
    expect(isSapServiceLayerError('string')).toBe(false);
    expect(isSapServiceLayerError(null)).toBe(false);
  });
});
