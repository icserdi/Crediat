/**
 * Tipos y constantes puros del módulo de crédito.
 * Este archivo NO importa `pg` ni ninguna dependencia de servidor,
 * por lo que puede importarse desde componentes cliente sin arrastrar
 * el bundle de PostgreSQL al navegador.
 */

/** Tipo de persona en la solicitud de crédito. */
export type PersonType = 'fisica' | 'moral';

/** Estados de una solicitud de crédito (workflow del ciclo de vida). */
export type CreditApplicationStatus =
  'solicitud_enviada' | 'en_revision' | 'precalificada' | 'aprobada' | 'rechazada';

/** Transiciones válidas entre estatus. */
export const STATUS_TRANSITIONS: Record<CreditApplicationStatus, CreditApplicationStatus[]> = {
  solicitud_enviada: ['en_revision', 'rechazada'],
  en_revision: ['precalificada', 'rechazada'],
  precalificada: ['aprobada', 'rechazada'],
  aprobada: [],
  rechazada: [],
};

/** Etiquetas legibles de cada estatus. */
export const STATUS_LABELS: Record<CreditApplicationStatus, string> = {
  solicitud_enviada: 'Solicitud enviada',
  en_revision: 'En revisión',
  precalificada: 'Pre-calificada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

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
  metadata?: {
    attachments?: string[];
    lastReview?: {
      status: CreditApplicationStatus;
      reason?: string | null;
      reviewedBy?: string | null;
      at?: string;
    };
    [key: string]: unknown;
  };
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
