import { describe, it, expect } from 'vitest';
import { validateDomain, inferRole } from './domain';

describe('validateDomain', () => {
  it('acepta dominios permitidos', () => {
    expect(validateDomain('user@serdi.com.mx')).toBe(true);
    expect(validateDomain('user@heliequiposindustriales.com')).toBe(true);
    expect(validateDomain('user@merkaaceros.com')).toBe(true);
  });

  it('rechaza dominios no permitidos', () => {
    expect(validateDomain('user@gmail.com')).toBe(false);
    expect(validateDomain('user@serdi.com')).toBe(false);
    expect(validateDomain('user@sub.serdi.com.mx')).toBe(false);
  });

  it('rechaza emails sin dominio', () => {
    expect(validateDomain('usuario')).toBe(false);
    expect(validateDomain('')).toBe(false);
  });
});

describe('inferRole', () => {
  it('asigna admin cuando el email contiene "admin"', () => {
    expect(inferRole('admin@serdi.com.mx')).toBe('admin');
    expect(inferRole('juan.admin@serdi.com.mx')).toBe('admin');
  });

  it('asigna supervisor cuando el email contiene "supervisor"', () => {
    expect(inferRole('supervisor@serdi.com.mx')).toBe('supervisor');
    expect(inferRole('ana.supervisor@serdi.com.mx')).toBe('supervisor');
  });

  it('asigna cobrador por defecto', () => {
    expect(inferRole('cobrador1@serdi.com.mx')).toBe('cobrador');
    expect(inferRole('pedro@serdi.com.mx')).toBe('cobrador');
  });
});
