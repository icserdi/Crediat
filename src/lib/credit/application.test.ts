import { describe, it, expect } from 'vitest';
import {
  validateCreditApplication,
  REQUIRED_DOCUMENTS,
  STATUS_TRANSITIONS,
  STATUS_LABELS,
} from './application';

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

describe('Workflow de estatus', () => {
  it('define el estatus inicial como solicitud_enviada', () => {
    expect(STATUS_LABELS.solicitud_enviada).toBe('Solicitud enviada');
  });

  it('permite el flujo normal solicitado → revisión → precalificada → aprobada', () => {
    expect(STATUS_TRANSITIONS.solicitud_enviada).toContain('en_revision');
    expect(STATUS_TRANSITIONS.en_revision).toContain('precalificada');
    expect(STATUS_TRANSITIONS.precalificada).toContain('aprobada');
  });

  it('permite rechazar desde los estados no terminales', () => {
    expect(STATUS_TRANSITIONS.solicitud_enviada).toContain('rechazada');
    expect(STATUS_TRANSITIONS.en_revision).toContain('rechazada');
    expect(STATUS_TRANSITIONS.precalificada).toContain('rechazada');
  });

  it('los estados terminales no tienen transiciones', () => {
    expect(STATUS_TRANSITIONS.aprobada).toEqual([]);
    expect(STATUS_TRANSITIONS.rechazada).toEqual([]);
  });

  it('no permite saltos de etapa (ej. enviada → aprobada)', () => {
    expect(STATUS_TRANSITIONS.solicitud_enviada).not.toContain('aprobada');
    expect(STATUS_TRANSITIONS.en_revision).not.toContain('aprobada');
  });
});
