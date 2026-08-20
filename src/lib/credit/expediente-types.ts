/**
 * Tipos y constantes puras del expediente de crédito.
 * Este archivo NO importa `pg` ni dependencias de servidor,
 * por lo que puede importarse desde componentes cliente.
 */

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

/** Alerta de expediente con información del solicitante y cuenta. */
export type ExpedienteAlerta = ExpedienteDocumento & {
  applicantName: string;
  accountNumber: string;
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
