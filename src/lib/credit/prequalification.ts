'server-only';

import { query } from '@/lib/db';
import { logAuditEvent } from '@/lib/db';
import { createRfcValidator } from './rfc';
import type { PersonType } from './application';

/** Resultado de la pre-calificación. */
export type PrequalificationResult = 'aprobado' | 'condicionado' | 'rechazado';

/** Datos de entrada para pre-calificar una solicitud. */
export type PrequalificationInput = {
  applicationId: string;
  personType: PersonType;
  rfc?: string;
  /** Ingreso mensual declarado (para persona física) o ventas (moral). */
  declaredIncome?: number;
  /** Monto de crédito solicitado. */
  requestedAmount?: number;
  /** Antigüedad del negocio/empresa en años (moral). */
  businessAgeYears?: number;
};

export type Prequalification = {
  id: string;
  applicationId: string;
  score: number;
  result: PrequalificationResult;
  reasons: string[];
  details: Record<string, unknown>;
  createdAt: string;
};

/** Reglas configurables de pre-calificación (valores por defecto). */
export type PrequalificationRules = {
  minScore: number;
  /** Ratio máximo deuda/ingreso (0-1). */
  maxDebtToIncome: number;
  /** Monto mínimo solicitado. */
  minAmount: number;
  /** Monto máximo solicitado. */
  maxAmount: number;
  /** Antigüedad mínima del negocio (años) para persona moral. */
  minBusinessAgeYears: number;
};

export const DEFAULT_RULES: PrequalificationRules = {
  minScore: 60,
  maxDebtToIncome: 0.4,
  minAmount: 10000,
  maxAmount: 5000000,
  minBusinessAgeYears: 1,
};

/** Carga reglas desde variables de entorno (configurables). */
export function loadPrequalificationRules(): PrequalificationRules {
  return {
    minScore: parseInt(process.env.PREQUAL_MIN_SCORE || '60', 10),
    maxDebtToIncome: parseFloat(process.env.PREQUAL_MAX_DEBT_TO_INCOME || '0.4'),
    minAmount: parseInt(process.env.PREQUAL_MIN_AMOUNT || '10000', 10),
    maxAmount: parseInt(process.env.PREQUAL_MAX_AMOUNT || '5000000', 10),
    minBusinessAgeYears: parseInt(process.env.PREQUAL_MIN_BUSINESS_AGE || '1', 10),
  };
}

/**
 * Calcula el score preliminar (0-100) a partir de los datos de la solicitud.
 * Es una función pura (testeable) que pondera varios factores.
 */
export function computePrequalificationScore(
  input: PrequalificationInput,
  rules: PrequalificationRules = DEFAULT_RULES
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 50; // base neutral

  // RFC vigente (formato) suma puntos
  if (input.rfc && input.rfc.trim().length >= 12) {
    score += 10;
  } else {
    reasons.push('RFC ausente o incompleto.');
  }

  // Ingreso declarado
  if (input.declaredIncome && input.declaredIncome > 0) {
    score += 10;
  } else {
    reasons.push('No se declaró ingreso.');
  }

  // Monto solicitado dentro de rango
  if (input.requestedAmount) {
    if (input.requestedAmount >= rules.minAmount && input.requestedAmount <= rules.maxAmount) {
      score += 10;
    } else {
      reasons.push(`Monto solicitado fuera de rango (${rules.minAmount} - ${rules.maxAmount}).`);
    }
  }

  // Antigüedad del negocio (persona moral)
  if (input.personType === 'moral') {
    if (input.businessAgeYears && input.businessAgeYears >= rules.minBusinessAgeYears) {
      score += 10;
    } else {
      reasons.push(`Antigüedad del negocio insuficiente (mín. ${rules.minBusinessAgeYears} años).`);
    }
  } else {
    // Persona física: se asume un punto base por perfil
    score += 5;
  }

  return { score: Math.min(100, Math.max(0, score)), reasons };
}

/** Determina el resultado según el score y las reglas. */
export function resolvePrequalificationResult(
  score: number,
  rules: PrequalificationRules = DEFAULT_RULES
): PrequalificationResult {
  if (score >= rules.minScore) return 'aprobado';
  if (score >= rules.minScore - 20) return 'condicionado';
  return 'rechazado';
}

/** Ejecuta la pre-calificación completa (score + validación fiscal + persistencia). */
export async function prequalifyApplication(
  input: PrequalificationInput
): Promise<Prequalification> {
  const rules = loadPrequalificationRules();
  const { score, reasons } = computePrequalificationScore(input, rules);

  // Validación fiscal (si hay RFC y proveedor configurado)
  let fiscalValid = true;
  let fiscalDetail: Record<string, unknown> = {};
  if (input.rfc) {
    const validator = createRfcValidator();
    const fiscal = await validator.validate(input.rfc, input.personType);
    fiscalValid = fiscal.valid;
    fiscalDetail = { fiscalSource: fiscal.source, fiscalMessage: fiscal.message };
    if (!fiscalValid) {
      reasons.push('RFC no vigente según validación fiscal.');
    }
  }

  const result = resolvePrequalificationResult(score, rules);

  const rows = await query<Prequalification>(
    `INSERT INTO prequalifications
       (application_id, score, result, reasons, details)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, application_id AS "applicationId", score, result, reasons,
               details, created_at AS "createdAt"`,
    [
      input.applicationId,
      score,
      result,
      JSON.stringify(reasons),
      JSON.stringify({
        ...fiscalDetail,
        requestedAmount: input.requestedAmount,
        declaredIncome: input.declaredIncome,
      }),
    ]
  );

  const preq = rows[0];

  // Actualizar estatus de la solicitud a 'precalificada' si el resultado no es rechazo
  if (result !== 'rechazado') {
    await query(
      `UPDATE credit_applications SET status = 'precalificada', updated_at = NOW() WHERE id = $1`,
      [input.applicationId]
    );
  }

  await logAuditEvent({
    eventType: 'credit_prequalification',
    severity: result === 'rechazado' ? 'warning' : 'info',
    entityType: 'credit_application',
    entityId: input.applicationId,
    description: `Pre-calificación de solicitud ${input.applicationId}: ${result} (score ${score}).`,
    metadata: { score, result, reasons },
  });

  return preq;
}

/** Lista pre-calificaciones de una solicitud. */
export async function listPrequalifications(applicationId: string): Promise<Prequalification[]> {
  return query<Prequalification>(
    `SELECT id, application_id AS "applicationId", score, result, reasons, details,
            created_at AS "createdAt"
     FROM prequalifications
     WHERE application_id = $1
     ORDER BY created_at DESC`,
    [applicationId]
  );
}
