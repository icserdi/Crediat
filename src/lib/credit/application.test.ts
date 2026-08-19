import { describe, it, expect } from 'vitest';
import { validateCreditApplication, REQUIRED_DOCUMENTS } from './application';

describe('validateCreditApplication', () => {
  it('acepta una solicitud válida', () => {
    const errors = validateCreditApplication({
      personType: 'fisica',
      fullName: 'Juan Pérez',
      city: 'Culiacán',
      state: 'Sinaloa',
      advisor: 'SERDI',
      email: 'juan@serdi.com.mx',
      phone: '6671234567',
    });
    expect(errors).toEqual([]);
  });

  it('rechaza un tipo de persona inválido', () => {
    const errors = validateCreditApplication({
      personType: 'otro',
      fullName: 'Juan',
      email: 'a@b.com',
      phone: '6671234567',
    } as never);
    expect(errors.some((e) => e.includes('Tipo de persona'))).toBe(true);
  });

  it('exige nombre, ciudad, estado y asesor', () => {
    const errors = validateCreditApplication({
      personType: 'moral',
      fullName: '',
      city: '',
      state: '',
      advisor: '',
      email: 'a@b.com',
      phone: '6671234567',
    });
    expect(errors).toContain('El nombre completo o razón social es requerido.');
    expect(errors).toContain('La ciudad es requerida.');
    expect(errors).toContain('El estado es requerido.');
    expect(errors).toContain('El asesor que atiende es requerido.');
  });

  it('rechaza email inválido', () => {
    const errors = validateCreditApplication({
      personType: 'fisica',
      fullName: 'Juan',
      city: 'Culiacán',
      state: 'Sinaloa',
      advisor: 'XXX',
      email: 'correo-invalido',
      phone: '6671234567',
    });
    expect(errors.some((e) => e.includes('Correo'))).toBe(true);
  });

  it('rechaza teléfono inválido', () => {
    const errors = validateCreditApplication({
      personType: 'fisica',
      fullName: 'Juan',
      city: 'Culiacán',
      state: 'Sinaloa',
      advisor: 'XXX',
      email: 'a@b.com',
      phone: '123',
    });
    expect(errors.some((e) => e.includes('Teléfono'))).toBe(true);
  });
});

describe('REQUIRED_DOCUMENTS', () => {
  it('contiene documentos para persona física', () => {
    expect(REQUIRED_DOCUMENTS.fisica.length).toBeGreaterThan(0);
    expect(REQUIRED_DOCUMENTS.fisica.some((d) => d.includes('Pagaré'))).toBe(true);
  });

  it('contiene documentos para persona moral', () => {
    expect(REQUIRED_DOCUMENTS.moral.length).toBeGreaterThan(0);
    expect(REQUIRED_DOCUMENTS.moral.some((d) => d.includes('acta constitutiva'))).toBe(true);
  });

  it('persona moral requiere el pagaré por frente y por atrás', () => {
    expect(REQUIRED_DOCUMENTS.moral.some((d) => d.includes('frente y por atrás'))).toBe(true);
  });
});
