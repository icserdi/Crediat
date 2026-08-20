import { describe, it, expect, afterEach } from 'vitest';
import { computeValidity, getExpiryWarningDays } from './expediente';

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

describe('computeValidity', () => {
  afterEach(() => {
    delete process.env.EXPEDIENTE_WARNING_DAYS;
  });

  it('marca como vigente un documento con expiración lejana', () => {
    expect(computeValidity(daysFromNow(90))).toBe('vigente');
  });

  it('marca como por_vencer dentro de la ventana de alerta', () => {
    expect(computeValidity(daysFromNow(15))).toBe('por_vencer');
  });

  it('marca como vencido un documento expirado', () => {
    expect(computeValidity(daysFromNow(-1))).toBe('vencido');
  });

  it('respeta la ventana de alerta configurada', () => {
    process.env.EXPEDIENTE_WARNING_DAYS = '7';
    expect(computeValidity(daysFromNow(10))).toBe('vigente');
    expect(computeValidity(daysFromNow(5))).toBe('por_vencer');
  });
});

describe('getExpiryWarningDays', () => {
  it('retorna el valor por defecto de 30 días', () => {
    delete process.env.EXPEDIENTE_WARNING_DAYS;
    expect(getExpiryWarningDays()).toBe(30);
  });

  it('retorna el valor configurado', () => {
    process.env.EXPEDIENTE_WARNING_DAYS = '15';
    expect(getExpiryWarningDays()).toBe(15);
    delete process.env.EXPEDIENTE_WARNING_DAYS;
  });
});
