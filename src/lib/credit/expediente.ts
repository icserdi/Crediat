'server-only';

import { query } from '@/lib/db';
import { logAuditEvent } from '@/lib/db';
import { uploadFile } from '@/lib/storage/minio';

/** Estado de vigencia de un documento. */
export type DocumentValidity = 'vigente' | 'por_vencer' | 'vencido';

/** Tipos de documento del expediente de crédito. */
export type DocumentType =
  | 'ine'
  | 'curp'
  | 'rfc'
  | 'acta_constitutiva'
  | 'comprobante_domicilio'
  | 'situacion_fiscal'
  | 'declaracion'
  | 'estados_cuenta'
  | 'aviso_privacidad'
  | 'otro';

export type ExpedienteDocumento = {
  id: string;
  creditAccountId: string;
  documentType: DocumentType;
  fileName: string;
  fileKey: string;
  issuedAt: string;
  expiresAt: string;
  validity: DocumentValidity;
  createdAt: string;
  updatedAt: string;
};

/** Días antes de la expiración para marcar "por vencer". */
export function getExpiryWarningDays(): number {
  return parseInt(process.env.EXPEDIENTE_WARNING_DAYS || '30', 10);
}

/** Determina la vigencia de un documento según su fecha de expiración. */
export function computeValidity(expiresAt: string): DocumentValidity {
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const warningMs = getExpiryWarningDays() * 24 * 60 * 60 * 1000;

  if (expiry < now) return 'vencido';
  if (expiry - now <= warningMs) return 'por_vencer';
  return 'vigente';
}

/** Tipos de documento con descripción. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ine: 'Identificación oficial (INE)',
  curp: 'CURP',
  rfc: 'Situación fiscal / RFC',
  acta_constitutiva: 'Acta constitutiva',
  comprobante_domicilio: 'Comprobante de domicilio',
  situacion_fiscal: 'Situación fiscal SAT',
  declaracion: 'Declaración anual',
  estados_cuenta: 'Estados de cuenta',
  aviso_privacidad: 'Aviso de privacidad',
  otro: 'Otro',
};

/** Registra un documento del expediente y lo sube a MinIO. */
export async function addExpedienteDocumento(input: {
  creditAccountId: string;
  documentType: DocumentType;
  issuedAt: string;
  expiresAt: string;
  file: File;
}): Promise<ExpedienteDocumento> {
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const fileKey = await uploadFile(
    buffer,
    input.file.name,
    input.file.type || 'application/octet-stream',
    `expedientes/${input.creditAccountId}`
  );

  const validity = computeValidity(input.expiresAt);

  const rows = await query<ExpedienteDocumento>(
    `INSERT INTO expediente_documentos
       (credit_account_id, document_type, file_name, file_key, issued_at, expires_at, validity)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, credit_account_id AS "creditAccountId", document_type AS "documentType",
               file_name AS "fileName", file_key AS "fileKey", issued_at AS "issuedAt",
               expires_at AS "expiresAt", validity, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [
      input.creditAccountId,
      input.documentType,
      input.file.name,
      fileKey,
      input.issuedAt,
      input.expiresAt,
      validity,
    ]
  );

  const doc = rows[0];
  await logAuditEvent({
    eventType: 'expediente_documento_added',
    severity: 'info',
    entityType: 'credit_account',
    entityId: input.creditAccountId,
    description: `Documento ${DOCUMENT_TYPE_LABELS[input.documentType]} agregado al expediente.`,
    metadata: { documentType: input.documentType, expiresAt: input.expiresAt },
  });

  return doc;
}

/** Lista los documentos del expediente de una cuenta de crédito. */
export async function listExpediente(creditAccountId: string): Promise<ExpedienteDocumento[]> {
  return query<ExpedienteDocumento>(
    `SELECT id, credit_account_id AS "creditAccountId", document_type AS "documentType",
            file_name AS "fileName", file_key AS "fileKey", issued_at AS "issuedAt",
            expires_at AS "expiresAt", validity, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM expediente_documentos
     WHERE credit_account_id = $1
     ORDER BY expires_at ASC`,
    [creditAccountId]
  );
}

/** Lista documentos por vencer o vencidos (para alertas). */
export async function listExpiringDocuments(): Promise<ExpedienteDocumento[]> {
  const warningDays = getExpiryWarningDays();
  return query<ExpedienteDocumento>(
    `SELECT id, credit_account_id AS "creditAccountId", document_type AS "documentType",
            file_name AS "fileName", file_key AS "fileKey", issued_at AS "issuedAt",
            expires_at AS "expiresAt", validity, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM expediente_documentos
     WHERE expires_at <= NOW() + ($1 || ' days')::interval
     ORDER BY expires_at ASC`,
    [warningDays]
  );
}

/** Marca los documentos vencidos (mantiene la vigencia actualizada). */
export async function refreshValidity(): Promise<void> {
  await query(
    `UPDATE expediente_documentos
     SET validity = CASE
       WHEN expires_at < NOW() THEN 'vencido'
       WHEN expires_at <= NOW() + ($1 || ' days')::interval THEN 'por_vencer'
       ELSE 'vigente'
     END,
     updated_at = NOW()`,
    [getExpiryWarningDays()]
  );
}
