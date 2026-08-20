'server-only';

import { query } from '@/lib/db';
import { logAuditEvent } from '@/lib/db';
import { validateRfcFormat } from './rfc';
import {
  STATUS_TRANSITIONS,
  STATUS_LABELS,
  type CreditApplication,
  type CreditApplicationInput,
  type CreditApplicationStatus,
} from './constants';

export {
  type PersonType,
  type CreditApplicationStatus,
  type CreditApplicationInput,
  type CreditApplication,
  STATUS_TRANSITIONS,
  STATUS_LABELS,
  REQUIRED_DOCUMENTS,
} from './constants';

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
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'solicitud_enviada', $9)
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

/** Actualiza el estatus de una solicitud validando las transiciones del workflow. */
export async function updateCreditApplicationStatus(
  id: string,
  status: CreditApplicationStatus,
  opts: { reason?: string; actor?: string } = {}
): Promise<CreditApplication | null> {
  const allowed = Object.keys(STATUS_TRANSITIONS) as CreditApplicationStatus[];
  if (!allowed.includes(status)) {
    throw new Error('Estatus inválido.');
  }

  // Leer estatus actual para validar transición
  const currentRows = await query<{ status: CreditApplicationStatus }>(
    `SELECT status FROM credit_applications WHERE id = $1`,
    [id]
  );
  const current = currentRows[0]?.status;
  if (!current) return null;

  const validTransitions = STATUS_TRANSITIONS[current] || [];
  if (status !== current && !validTransitions.includes(status)) {
    throw new Error(`Transición inválida: ${STATUS_LABELS[current]} → ${STATUS_LABELS[status]}.`);
  }

  // Si se rechaza, exigir motivo
  if (status === 'rechazada' && !opts.reason?.trim()) {
    throw new Error('Debe indicar el motivo del rechazo.');
  }

  const rows = await query<CreditApplication>(
    `UPDATE credit_applications
     SET status = $2, updated_at = NOW(),
         metadata = metadata || $3::jsonb
     WHERE id = $1
     RETURNING id, person_type AS "personType", full_name AS "fullName", city, state, advisor,
               email, phone, rfc, status, metadata, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [
      id,
      status,
      JSON.stringify({
        lastReview: {
          status,
          reason: opts.reason?.trim() || null,
          reviewedBy: opts.actor || null,
          at: new Date().toISOString(),
        },
      }),
    ]
  );

  if (rows[0]) {
    await logAuditEvent({
      eventType: 'credit_application_status',
      severity: status === 'rechazada' ? 'warning' : 'info',
      entityType: 'credit_application',
      entityId: id,
      actor: opts.actor || 'Sistema',
      description: `Solicitud ${id} cambió a estatus ${STATUS_LABELS[status]}${
        opts.reason ? ` (motivo: ${opts.reason})` : ''
      }`,
      metadata: { status, reason: opts.reason || null },
    });
  }

  return rows[0] || null;
}

/** Obtiene una solicitud por ID. */
export async function getCreditApplication(id: string): Promise<CreditApplication | null> {
  const rows = await query<CreditApplication>(
    `SELECT id, person_type AS "personType", full_name AS "fullName", city, state, advisor,
            email, phone, rfc, status, metadata, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM credit_applications
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}
