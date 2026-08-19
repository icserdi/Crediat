'server-only';

import { query } from '@/lib/db';
import { logAuditEvent } from '@/lib/db';
import { validateRfcFormat } from './rfc';

/** Tipo de persona en la solicitud de crédito. */
export type PersonType = 'fisica' | 'moral';

/** Estados de una solicitud de crédito. */
export type CreditApplicationStatus = 'recibida' | 'en_revision' | 'aprobada' | 'rechazada';

export type CreditApplicationInput = {
  personType: PersonType;
  fullName: string;
  city: string;
  state: string;
  advisor: string;
  email: string;
  phone: string;
  /** RFC del solicitante (opcional; se valida formato y opcionalmente fiscal). */
  rfc?: string;
  /** Archivos a subir (solo en el cliente). */
  files?: File[];
  /** Claves de los archivos ya subidos a MinIO (uso interno). */
  attachments?: string[];
};

export type CreditApplication = CreditApplicationInput & {
  id: string;
  status: CreditApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * Requisitos documentales según el tipo de persona.
 * Fuente: https://serdiaceros.com.mx/solicitud-de-credito/
 */
export const REQUIRED_DOCUMENTS: Record<PersonType, string[]> = {
  fisica: [
    'Pagaré firmado por el solicitante (por el frente)',
    'Copia de identificación oficial (INE / Pasaporte)',
    'Copia de la CURP',
    'Copia del alta en hacienda (registro SAT)',
    'Copia de comprobante de domicilio a nombre del solicitante (agua o predial)',
    'Copia de situación fiscal del SAT',
    'Copia de declaración anual 2023 y parciales 2024',
    'Datos del contador (nombre, teléfono y correo electrónico)',
    'Carátulas de los 3 últimos estados de cuenta',
    'Aviso de privacidad firmado por el solicitante',
  ],
  moral: [
    'Pagaré firmado por el representante legal (por frente y por atrás)',
    'Copia de acta constitutiva y última modificación',
    'Copia de identificación oficial del representante legal (INE / Pasaporte)',
    'Copia de la CURP',
    'Copia de situación fiscal del SAT',
    'Copia del alta en hacienda (registro SAT)',
    'Copia de comprobante de domicilio a nombre de la empresa (agua o Comisión Federal)',
    'Copia de declaración anual 2023 y parciales 2024',
    'Datos del contador (nombre, teléfono y correo electrónico)',
    'Carátulas de los 3 últimos estados de cuenta',
    'Aviso de privacidad firmado por el representante legal',
  ],
};

/** Valida que el correo tenga formato básico. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Valida que el teléfono tenga formato razonable (10-15 dígitos). */
function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s().-]{10,15}$/.test(phone);
}

/** Valida una solicitud y retorna lista de errores (vacía si es válida). */
export function validateCreditApplication(input: CreditApplicationInput): string[] {
  const errors: string[] = [];

  if (!input.personType || !['fisica', 'moral'].includes(input.personType)) {
    errors.push('Tipo de persona inválido.');
  }
  if (!input.fullName?.trim()) errors.push('El nombre completo o razón social es requerido.');
  if (!input.city?.trim()) errors.push('La ciudad es requerida.');
  if (!input.state?.trim()) errors.push('El estado es requerido.');
  if (!input.advisor?.trim()) errors.push('El asesor que atiende es requerido.');
  if (!isValidEmail(input.email)) errors.push('Correo electrónico inválido.');
  if (!isValidPhone(input.phone)) errors.push('Teléfono inválido (10-15 dígitos).');
  if (input.rfc && !validateRfcFormat(input.rfc, input.personType)) {
    errors.push('El RFC no tiene un formato válido.');
  }

  return errors;
}

/** Crea una solicitud de crédito en la BD y registra auditoría. */
export async function createCreditApplication(
  input: CreditApplicationInput
): Promise<CreditApplication> {
  const errors = validateCreditApplication(input);
  if (errors.length > 0) {
    throw new Error(`Solicitud inválida: ${errors.join(' ')}`);
  }

  const rows = await query<CreditApplication>(
    `INSERT INTO credit_applications
       (person_type, full_name, city, state, advisor, email, phone, rfc, status, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'recibida', $9)
     RETURNING id, person_type AS "personType", full_name AS "fullName", city, state,
               advisor, email, phone, rfc, status, metadata, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [
      input.personType,
      input.fullName.trim(),
      input.city.trim(),
      input.state.trim(),
      input.advisor.trim(),
      input.email.trim(),
      input.phone.trim(),
      input.rfc?.trim().toUpperCase() || null,
      JSON.stringify({ attachments: input.attachments || [] }),
    ]
  );

  const app = rows[0];
  await logAuditEvent({
    eventType: 'credit_application_created',
    severity: 'info',
    entityType: 'credit_application',
    entityId: app.id,
    description: `Nueva solicitud de crédito de tipo ${app.personType} para ${app.fullName}`,
    metadata: { email: input.email, personType: input.personType },
  });

  return app;
}

/** Lista solicitudes de crédito. */
export async function listCreditApplications(limit = 100): Promise<CreditApplication[]> {
  return query<CreditApplication>(
    `SELECT id, person_type AS "personType", full_name AS "fullName", city, state, advisor,
            email, phone, rfc, status, metadata, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM credit_applications
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
}

/** Actualiza el estatus de una solicitud. */
export async function updateCreditApplicationStatus(
  id: string,
  status: CreditApplicationStatus
): Promise<CreditApplication | null> {
  const allowed: CreditApplicationStatus[] = ['recibida', 'en_revision', 'aprobada', 'rechazada'];
  if (!allowed.includes(status)) {
    throw new Error('Estatus inválido.');
  }

  const rows = await query<CreditApplication>(
    `UPDATE credit_applications
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, person_type AS "personType", full_name AS "fullName", city, state, advisor,
               email, phone, rfc, status, metadata, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [id, status]
  );

  if (rows[0]) {
    await logAuditEvent({
      eventType: 'credit_application_status',
      severity: 'info',
      entityType: 'credit_application',
      entityId: id,
      description: `Solicitud de crédito ${id} cambió a estatus ${status}`,
      metadata: { status },
    });
  }

  return rows[0] || null;
}
