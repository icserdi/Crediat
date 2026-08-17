import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSapCompaniesStore,
  resetSapCompaniesStore,
} from './companies-store';
import { resetSapConfigCache } from './config';

// El store inicializa datos demo usando loadSapConfig(), que requiere
// variables de entorno. Configuramos un entorno válido para los tests.
const ENV = {
  SAP_SERVICE_LAYER_BASE_URL: 'https://sap.example.com:50000/b1s/v1',
  SAP_SERVICE_LAYER_USER: 'user',
  SAP_SERVICE_LAYER_PASSWORD: 'pass',
  SAP_SERVICE_LAYER_DEFAULT_COMPANY_DB: 'ATNPRUEBAS',
};

describe('SapCompaniesStore', () => {
  beforeEach(() => {
    vi.stubEnv('SAP_SERVICE_LAYER_BASE_URL', ENV.SAP_SERVICE_LAYER_BASE_URL);
    vi.stubEnv('SAP_SERVICE_LAYER_USER', ENV.SAP_SERVICE_LAYER_USER);
    vi.stubEnv('SAP_SERVICE_LAYER_PASSWORD', ENV.SAP_SERVICE_LAYER_PASSWORD);
    vi.stubEnv('SAP_SERVICE_LAYER_DEFAULT_COMPANY_DB', ENV.SAP_SERVICE_LAYER_DEFAULT_COMPANY_DB);
    resetSapConfigCache();
    resetSapCompaniesStore();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetSapCompaniesStore();
  });

  it('inicializa con una empresa demo', () => {
    const store = getSapCompaniesStore();
    const companies = store.listCompanies();
    expect(companies.length).toBe(1);
    expect(companies[0].companyDb).toBe('ATNPRUEBAS');
    expect(companies[0].isActive).toBe(true);
  });

  it('crea una empresa nueva', () => {
    const store = getSapCompaniesStore();
    const created = store.createCompany({
      companyDb: 'EMPRESA2',
      friendlyName: 'Empresa Dos',
      isActive: true,
    });
    expect(created.id).toBeTruthy();
    expect(store.getCompanyById(created.id)?.friendlyName).toBe('Empresa Dos');
  });

  it('rechaza crear una empresa con CompanyDB duplicado', () => {
    const store = getSapCompaniesStore();
    expect(() =>
      store.createCompany({
        companyDb: 'ATNPRUEBAS',
        friendlyName: 'Duplicada',
        isActive: true,
      })
    ).toThrow(/Ya existe una empresa con CompanyDB/);
  });

  it('actualiza una empresa existente', () => {
    const store = getSapCompaniesStore();
    const existing = store.listCompanies()[0];
    const updated = store.updateCompany(existing.id, { isActive: false });
    expect(updated?.isActive).toBe(false);
    expect(store.getCompanyById(existing.id)?.isActive).toBe(false);
  });

  it('retorna null al actualizar una empresa inexistente', () => {
    const store = getSapCompaniesStore();
    expect(store.updateCompany('no-existe', { isActive: false })).toBeNull();
  });

  it('elimina una empresa', () => {
    const store = getSapCompaniesStore();
    const existing = store.listCompanies()[0];
    expect(store.deleteCompany(existing.id)).toBe(true);
    expect(store.getCompanyById(existing.id)).toBeNull();
  });

  it('lista solo empresas activas', () => {
    const store = getSapCompaniesStore();
    const created = store.createCompany({
      companyDb: 'INACTIVA',
      friendlyName: 'Inactiva',
      isActive: false,
    });
    expect(created.isActive).toBe(false);
    const active = store.listActiveCompanies();
    expect(active.every((c) => c.isActive)).toBe(true);
  });

  it('asigna empresas a un usuario y calcula las visibles', () => {
    const store = getSapCompaniesStore();
    const company = store.listCompanies()[0];
    store.setUserAssignment('user-1', [company.id], 'admin');
    const visible = store.getVisibleCompaniesForUser('user-1');
    expect(visible.map((c) => c.id)).toContain(company.id);
  });

  it('un usuario sin asignación no ve empresas', () => {
    const store = getSapCompaniesStore();
    expect(store.getVisibleCompaniesForUser('sin-asignacion')).toEqual([]);
  });

  it('rechaza asignar empresas inexistentes', () => {
    const store = getSapCompaniesStore();
    expect(() =>
      store.setUserAssignment('user-1', ['no-existe'], 'admin')
    ).toThrow(/no existe/);
  });
});
