/**
 * Contratos de datos alineados a sap-integration-spec.md
 * y respuestas típicas de SAP B1 Service Layer.
 */

/** Respuesta OData genérica con lista de valores. */
export type SapODataListResponse<T> = {
  '@odata.context'?: string;
  '@odata.nextLink'?: string;
  value: T[];
};

/** Payload de login Service Layer. */
export type SapLoginRequest = {
  CompanyDB: string;
  UserName: string;
  Password: string;
};

export type SapLoginResponse = {
  SessionId?: string;
  SessionTimeout?: number;
  Version?: string;
};

/** Estructura de error estándar Service Layer. */
export type SapServiceLayerErrorBody = {
  error?: {
    code?: number;
    message?: { lang?: string; value?: string } | string;
  };
};

/** Deudor (Business Partner) — lectura según spec. */
export type SapBusinessPartnerDto = {
  CardCode: string;
  CardName: string;
  EmailAddress?: string | null;
  Phone1?: string | null;
  Cellular?: string | null;
  CreditLimit?: number;
  CurrentAccountBalance?: number;
  GroupCode?: number;
};

/** Factura — lectura según spec. */
export type SapInvoiceDto = {
  DocEntry: number;
  DocNum: number;
  CardCode: string;
  DocDate: string;
  DocDueDate: string;
  DocTotal: number;
  PaidToDate?: number;
  DocCur: string;
};

/** Campos UDF para escritura de promesas/gestiones. */
export type SapAiUdfPatch = {
  U_AI_LastContact?: string;
  U_AI_RiskScore?: number;
  U_AI_PaymentPromise?: string;
};

export type SapSessionCookies = {
  B1SESSION: string;
  ROUTEID?: string;
};

export type SapSessionRecord = {
  companyDb: string;
  cookies: SapSessionCookies;
  expiresAt: number;
};

export type SapRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Ruta relativa al base URL (ej. `/BusinessPartners`). */
  path: string;
  companyDb?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** Sobrescribe reintentos del cliente para esta llamada. */
  maxRetries?: number;
};

export type SapHealthResult = {
  ok: boolean;
  companyDb: string;
  latencyMs: number;
  version?: string;
  sessionTimeout?: number;
  checkedAt: string;
};

/** Empresa SAP (CompanyDB) configurada en el sistema. */
export type SapCompany = {
  id: string;
  companyDb: string;
  friendlyName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Asignación de usuario a empresas SAP visibles. */
export type SapCompanyAssignment = {
  userId: string;
  companyIds: string[];
  assignedAt: string;
  assignedBy: string;
};
