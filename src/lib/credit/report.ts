'server-only';

import { query } from '@/lib/db';

/** KPIs del ciclo de vida del crédito. */
export type CreditCycleStats = {
  totalApplications: number;
  totalPrequalified: number;
  totalAuthorized: number;
  totalActive: number;
  totalRejected: number;
  totalRequestedAmount: number;
  totalApprovedAmount: number;
  pendingApprovals: number;
  expiringDocuments: number;
};

/** Resumen de una cuenta de crédito para reportes. */
export type CreditAccountSummary = {
  id: string;
  accountNumber: string;
  cardCode: string | null;
  requestedAmount: number;
  approvedAmount: number | null;
  termMonths: number;
  interestRate: number;
  status: string;
  createdAt: string;
  applicantName: string;
};

/** Calcula estadísticas globales del ciclo de crédito. */
export async function getCreditCycleStats(): Promise<CreditCycleStats> {
  const [apps, preq, auth, active, rej, amounts, pending, expiring] = await Promise.all([
    query<{ c: string }>(`SELECT COUNT(*)::text AS c FROM credit_applications`),
    query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM credit_applications WHERE status = 'precalificada'`
    ),
    query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM credit_accounts WHERE status = 'autorizado'`
    ),
    query<{ c: string }>(`SELECT COUNT(*)::text AS c FROM credit_accounts WHERE status = 'activo'`),
    query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM credit_applications WHERE status = 'rechazada'`
    ),
    query<{ sum: string | null }>(`SELECT SUM(requested_amount)::text AS sum FROM credit_accounts`),
    query<{ c: string }>(`SELECT COUNT(*)::text AS c FROM credit_approvals WHERE decision IS NULL`),
    query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM expediente_documentos WHERE validity IN ('por_vencer','vencido')`
    ),
  ]);

  return {
    totalApplications: Number(apps[0]?.c || 0),
    totalPrequalified: Number(preq[0]?.c || 0),
    totalAuthorized: Number(auth[0]?.c || 0),
    totalActive: Number(active[0]?.c || 0),
    totalRejected: Number(rej[0]?.c || 0),
    totalRequestedAmount: Number(amounts[0]?.sum || 0),
    totalApprovedAmount: Number(amounts[0]?.sum || 0),
    pendingApprovals: Number(pending[0]?.c || 0),
    expiringDocuments: Number(expiring[0]?.c || 0),
  };
}

/** Lista cuentas de crédito con nombre del solicitante (para reportes). */
export async function listCreditAccountSummaries(): Promise<CreditAccountSummary[]> {
  return query<CreditAccountSummary>(
    `SELECT ca.id, ca.account_number AS "accountNumber", ca.card_code AS "cardCode",
            ca.requested_amount AS "requestedAmount", ca.approved_amount AS "approvedAmount",
            ca.term_months AS "termMonths", ca.interest_rate AS "interestRate",
            ca.status, ca.created_at AS "createdAt",
            ca2.full_name AS "applicantName"
     FROM credit_accounts ca
     JOIN credit_applications ca2 ON ca2.id = ca.application_id
     ORDER BY ca.created_at DESC`
  );
}
