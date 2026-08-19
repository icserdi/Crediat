import { describe, it, expect } from 'vitest';
import {
  computePrequalificationScore,
  resolvePrequalificationResult,
  DEFAULT_RULES,
} from './prequalification';

describe('computePrequalificationScore', () => {
  it('otorga score alto a una solicitud completa y dentro de rango', () => {
    const { score, reasons } = computePrequalificationScore({
      applicationId: 'a',
      personType: 'fisica',
      rfc: 'GARC840101HDF',
      declaredIncome: 50000,
      requestedAmount: 200000,
    });
    expect(score).toBeGreaterThanOrEqual(70);
    expect(reasons).toHaveLength(0);
  });

  it('penaliza la falta de RFC', () => {
    const { score, reasons } = computePrequalificationScore({
      applicationId: 'a',
      personType: 'fisica',
      declaredIncome: 50000,
      requestedAmount: 200000,
    });
    expect(reasons.some((r) => r.includes('RFC'))).toBe(true);
    // Sin RFC: base 50 + ingreso 10 + monto 10 + física 5 = 75
    expect(score).toBe(75);
  });

  it('penaliza la falta de ingreso declarado', () => {
    const { reasons } = computePrequalificationScore({
      applicationId: 'a',
      personType: 'fisica',
      rfc: 'GARC840101HDF',
      requestedAmount: 200000,
    });
    expect(reasons.some((r) => r.includes('ingreso'))).toBe(true);
  });

  it('penaliza el monto fuera de rango', () => {
    const { reasons } = computePrequalificationScore({
      applicationId: 'a',
      personType: 'fisica',
      rfc: 'GARC840101HDF',
      declaredIncome: 50000,
      requestedAmount: 99999999,
    });
    expect(reasons.some((r) => r.includes('rango'))).toBe(true);
  });

  it('penaliza la antigüedad insuficiente en persona moral', () => {
    const { reasons } = computePrequalificationScore({
      applicationId: 'a',
      personType: 'moral',
      rfc: 'SER930101XXX',
      declaredIncome: 100000,
      requestedAmount: 500000,
      businessAgeYears: 0,
    });
    expect(reasons.some((r) => r.includes('Antigüedad'))).toBe(true);
  });

  it('no penaliza la antigüedad en persona física', () => {
    const { reasons } = computePrequalificationScore({
      applicationId: 'a',
      personType: 'fisica',
      rfc: 'GARC840101HDF',
      declaredIncome: 50000,
      requestedAmount: 200000,
    });
    expect(reasons.some((r) => r.includes('Antigüedad'))).toBe(false);
  });
});

describe('resolvePrequalificationResult', () => {
  it('aprueba con score alto', () => {
    expect(resolvePrequalificationResult(85, DEFAULT_RULES)).toBe('aprobado');
  });

  it('condiciona con score medio', () => {
    expect(resolvePrequalificationResult(50, DEFAULT_RULES)).toBe('condicionado');
  });

  it('rechaza con score bajo', () => {
    expect(resolvePrequalificationResult(20, DEFAULT_RULES)).toBe('rechazado');
  });
});
