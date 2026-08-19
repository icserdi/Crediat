import { z } from 'zod';
import { type SapCompany, type SapCompanyAssignment } from './types';
import { loadSapConfig } from './config';

const sapCompanySchema = z.object({
  id: z.string().uuid(),
  companyDb: z.string().min(1),
  friendlyName: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const sapCompanyAssignmentSchema = z.object({
  userId: z.string(),
  companyIds: z.array(z.string().uuid()),
  assignedAt: z.string(),
  assignedBy: z.string(),
});

/**
 * Almacenamiento en memoria para empresas SAP (MVP).
 * En producción esto debería migrarse a una base de datos real.
 */
class SapCompaniesStore {
  private companies: Map<string, SapCompany> = new Map();
  private assignments: Map<string, SapCompanyAssignment> = new Map();

  constructor() {
    // Inicializar con datos de ejemplo si está vacío
    if (this.companies.size === 0) {
      this.initializeDemoData();
    }
  }

  private initializeDemoData(): void {
    const now = new Date().toISOString();
    const config = loadSapConfig();
    const demoCompany: SapCompany = {
      id: crypto.randomUUID(),
      companyDb: config.defaultCompanyDb,
      friendlyName: 'Empresa Demo',
      description: 'Base de datos de demostración SAP B1',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.companies.set(demoCompany.id, demoCompany);
  }

  /** Lista todas las empresas SAP. */
  listCompanies(): SapCompany[] {
    return Array.from(this.companies.values()).sort((a, b) =>
      a.friendlyName.localeCompare(b.friendlyName)
    );
  }

  /** Obtiene una empresa por ID. */
  getCompanyById(id: string): SapCompany | null {
    return this.companies.get(id) ?? null;
  }

  /** Obtiene una empresa por CompanyDB. */
  getCompanyByDb(companyDb: string): SapCompany | null {
    return Array.from(this.companies.values()).find((c) => c.companyDb === companyDb) ?? null;
  }

  /** Crea una nueva empresa SAP. */
  createCompany(data: Omit<SapCompany, 'id' | 'createdAt' | 'updatedAt'>): SapCompany {
    const now = new Date().toISOString();
    const company: SapCompany = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    // Validar que no exista otra empresa con el mismo CompanyDB
    const existing = this.getCompanyByDb(data.companyDb);
    if (existing) {
      throw new Error(`Ya existe una empresa con CompanyDB "${data.companyDb}"`);
    }

    const parsed = sapCompanySchema.parse(company);
    this.companies.set(parsed.id, parsed);
    return parsed;
  }

  /** Actualiza una empresa SAP existente. */
  updateCompany(
    id: string,
    data: Partial<Omit<SapCompany, 'id' | 'createdAt' | 'updatedAt'>>
  ): SapCompany | null {
    const existing = this.companies.get(id);
    if (!existing) return null;

    // Si se cambia el CompanyDB, validar que no exista otra empresa con ese valor
    if (data.companyDb && data.companyDb !== existing.companyDb) {
      const duplicate = this.getCompanyByDb(data.companyDb);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Ya existe una empresa con CompanyDB "${data.companyDb}"`);
      }
    }

    const updated: SapCompany = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const parsed = sapCompanySchema.parse(updated);
    this.companies.set(id, parsed);
    return parsed;
  }

  /** Elimina una empresa SAP. */
  deleteCompany(id: string): boolean {
    return this.companies.delete(id);
  }

  /** Lista empresas activas. */
  listActiveCompanies(): SapCompany[] {
    return this.listCompanies().filter((c) => c.isActive);
  }

  /** Obtiene asignación de empresas para un usuario. */
  getUserAssignment(userId: string): SapCompanyAssignment | null {
    return this.assignments.get(userId) ?? null;
  }

  /** Asigna empresas a un usuario. */
  setUserAssignment(
    userId: string,
    companyIds: string[],
    assignedBy: string
  ): SapCompanyAssignment {
    // Validar que todas las empresas existan
    for (const companyId of companyIds) {
      if (!this.companies.has(companyId)) {
        throw new Error(`Empresa con ID "${companyId}" no existe`);
      }
    }

    const assignment: SapCompanyAssignment = {
      userId,
      companyIds,
      assignedAt: new Date().toISOString(),
      assignedBy,
    };

    const parsed = sapCompanyAssignmentSchema.parse(assignment);
    this.assignments.set(userId, parsed);
    return parsed;
  }

  /** Elimina asignación de un usuario. */
  deleteUserAssignment(userId: string): boolean {
    return this.assignments.delete(userId);
  }

  /** Obtiene empresas visibles para un usuario. */
  getVisibleCompaniesForUser(userId: string): SapCompany[] {
    const assignment = this.getUserAssignment(userId);
    if (!assignment || assignment.companyIds.length === 0) {
      // Sin asignación, no ve ninguna empresa
      return [];
    }

    return assignment.companyIds
      .map((id) => this.getCompanyById(id))
      .filter((c): c is SapCompany => c !== null && c.isActive);
  }
}

// Singleton del store
let storeInstance: SapCompaniesStore | null = null;

export function getSapCompaniesStore(): SapCompaniesStore {
  if (!storeInstance) {
    storeInstance = new SapCompaniesStore();
  }
  return storeInstance;
}

export function resetSapCompaniesStore(): void {
  storeInstance = null;
}
