'server-only';

import { query } from '@/lib/db';
import { logAuditEvent } from '@/lib/db';
import { uploadFile } from '@/lib/storage/minio';
import { notifyDocumentExpiring } from '@/lib/notifications/email';
import {
  computeValidity,
  getExpiryWarningDays,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
  type ExpedienteAlerta,
  type ExpedienteDocumento,
} from './expediente-types';

export {
  type DocumentValidity,
  type DocumentType,
  type ExpedienteDocumento,
  type ExpedienteAlerta,
  getExpiryWarningDays,
  computeValidity,
  DOCUMENT_TYPE_LABELS,
} from './expediente-types';

/** Obtiene el email del solicitante de una cuenta de crédito. */
async function getAccountApplicantEmail(creditAccountId: string): Promise<string | null> {
  const rows = await query<{ email: string }>(
    `SELECT ca2.email
     FROM credit_accounts ca
     JOIN credit_applications ca2 ON ca2.id = ca.application_id
     WHERE ca.id = $1`,
    [creditAccountId]
  );
  return rows[0]?.email || null;
}

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

  // Notificar si el documento está por vencer o vencido
  if (validity !== 'vigente') {
    const applicantEmail = await getAccountApplicantEmail(input.creditAccountId);
    if (applicantEmail) {
      await notifyDocumentExpiring({
        to: applicantEmail,
        documentName: DOCUMENT_TYPE_LABELS[input.documentType],
        expiresAt: input.expiresAt,
      });
    }
  }

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

/** Lista alertas (por vencer/vencidos) con datos del solicitante y la cuenta. */
export async function listExpiringDocumentsWithDetails(): Promise<ExpedienteAlerta[]> {
  const warningDays = getExpiryWarningDays();
  return query<ExpedienteAlerta>(
    `SELECT ed.id, ed.credit_account_id AS "creditAccountId", ed.document_type AS "documentType",
            ed.file_name AS "fileName", ed.file_key AS "fileKey", ed.issued_at AS "issuedAt",
            ed.expires_at AS "expiresAt", ed.validity, ed.created_at AS "createdAt", ed.updated_at AS "updatedAt",
            ca2.full_name AS "applicantName", ca.account_number AS "accountNumber"
     FROM expediente_documentos ed
     JOIN credit_accounts ca ON ca.id = ed.credit_account_id
     JOIN credit_applications ca2 ON ca2.id = ca.application_id
     WHERE ed.expires_at <= NOW() + ($1 || ' days')::interval
     ORDER BY ed.expires_at ASC`,
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
