'server-only';

import { query } from '@/lib/db';
import { logAuditEvent } from '@/lib/db';

/** Roles que participan en la autorización de crédito. */
export type ApprovalRole = 'cobrador' | 'supervisor' | 'admin';

/** Estados de una cuenta de crédito. */
export type CreditAccountStatus = 'pendiente_autorizacion' | 'autorizado' | 'rechazado' | 'activo';

/** Decisión de una aprobación. */
export type ApprovalDecision = 'aprobado' | 'rechazado';

/** Datos para otorgar un crédito. */
export type CreditGrantInput = {
  applicationId: string;
  /** CardCode del deudor en SAP (para relacionar el crédito con la cartera). */
  cardCode?: string;
  requestedAmount: number;
  termMonths: number;
  interestRate: number;
  conditions?: string;
};

export type CreditAccount = {
  id: string;
  applicationId: string;
  accountNumber: string;
  cardCode: string | null;
  requestedAmount: number;
  approvedAmount: number | null;
  termMonths: number;
  interestRate: number;
  conditions: string | null;
  status: CreditAccountStatus;
  createdAt: string;
  updatedAt: string;
};

export type Approval = {
  id: string;
  creditAccountId: string;
  level: number;
  role: ApprovalRole;
  approvedBy: string | null;
  decision: ApprovalDecision | null;
  comments: string | null;
  createdAt: string;
  decidedAt: string | null;
};

/**
 * Reglas de autorización por nivel y monto.
 * Nivel 1: cobrador (hasta 100k). Nivel 2: supervisor (hasta 500k). Nivel 3: admin (sin límite).
 */
export type ApprovalRules = {
  levels: { level: number; role: ApprovalRole; maxAmount: number }[];
};

export const DEFAULT_APPROVAL_RULES: ApprovalRules = {
  levels: [
    { level: 1, role: 'cobrador', maxAmount: 100000 },
    { level: 2, role: 'supervisor', maxAmount: 500000 },
    { level: 3, role: 'admin', maxAmount: Number.MAX_SAFE_INTEGER },
  ],
};

/** Determina cuántos niveles de aprobación requiere un monto. */
export function requiredApprovalLevels(
  amount: number,
  rules: ApprovalRules = DEFAULT_APPROVAL_RULES
): number {
  const sorted = [...rules.levels].sort((a, b) => a.level - b.level);
  let levels = 1;
  for (const lvl of sorted) {
    if (amount > lvl.maxAmount) {
      levels = lvl.level + 1;
    }
  }
  return levels;
}

/** Genera un número de cuenta de crédito secuencial. */
function generateAccountNumber(seq: number): string {
  return `CR-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
}

/** Crea una cuenta de crédito y sus niveles de aprobación pendientes. */
export async function createCreditAccount(input: CreditGrantInput): Promise<CreditAccount> {
  const levels = requiredApprovalLevels(input.requestedAmount);

  // Generar número de cuenta secuencial
  const seqRows = await query<{ seq: number }>(`SELECT COUNT(*)::int AS seq FROM credit_accounts`);
  const seq = (seqRows[0]?.seq || 0) + 1;
  const accountNumber = generateAccountNumber(seq);

  const rows = await query<CreditAccount>(
    `INSERT INTO credit_accounts
       (application_id, account_number, card_code, requested_amount, term_months, interest_rate, conditions, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente_autorizacion')
     RETURNING id, application_id AS "applicationId", account_number AS "accountNumber",
               card_code AS "cardCode", requested_amount AS "requestedAmount", approved_amount AS "approvedAmount",
               term_months AS "termMonths", interest_rate AS "interestRate", conditions,
               status, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [
      input.applicationId,
      accountNumber,
      input.cardCode || null,
      input.requestedAmount,
      input.termMonths,
      input.interestRate,
      input.conditions || null,
    ]
  );

  const account = rows[0];

  // Crear los niveles de aprobación
  const rules = DEFAULT_APPROVAL_RULES;
  const sorted = [...rules.levels].sort((a, b) => a.level - b.level).slice(0, levels);
  for (const lvl of sorted) {
    await query(
      `INSERT INTO credit_approvals (credit_account_id, level, role)
       VALUES ($1, $2, $3)`,
      [account.id, lvl.level, lvl.role]
    );
  }

  await logAuditEvent({
    eventType: 'credit_account_created',
    severity: 'info',
    entityType: 'credit_account',
    entityId: account.id,
    description: `Cuenta de crédito ${accountNumber} creada (${levels} nivel(es) de aprobación).`,
    metadata: { applicationId: input.applicationId, requestedAmount: input.requestedAmount },
  });

  return account;
}

/** Lista las aprobaciones pendientes de una cuenta. */
export async function listApprovals(creditAccountId: string): Promise<Approval[]> {
  return query<Approval>(
    `SELECT id, credit_account_id AS "creditAccountId", level, role,
            approved_by AS "approvedBy", decision, comments,
            created_at AS "createdAt", decided_at AS "decidedAt"
     FROM credit_approvals
     WHERE credit_account_id = $1
     ORDER BY level ASC`,
    [creditAccountId]
  );
}

/** Decide una aprobación y, si todas se completan, autoriza la cuenta. */
export async function decideApproval(
  approvalId: string,
  decision: ApprovalDecision,
  approvedBy: string,
  comments?: string
): Promise<{ account: CreditAccount; allApproved: boolean }> {
  const rows = await query<Approval>(
    `UPDATE credit_approvals
     SET decision = $2, approved_by = $3, comments = $4, decided_at = NOW()
     WHERE id = $1
     RETURNING id, credit_account_id AS "creditAccountId", level, role,
               approved_by AS "approvedBy", decision, comments,
               created_at AS "createdAt", decided_at AS "decidedAt"`,
    [approvalId, decision, approvedBy, comments || null]
  );

  const approval = rows[0];
  if (!approval) throw new Error('Aprobación no encontrada.');

  const accountId = approval.creditAccountId;

  // Si se rechaza en cualquier nivel, la cuenta se rechaza
  if (decision === 'rechazado') {
    await query(
      `UPDATE credit_accounts SET status = 'rechazado', updated_at = NOW() WHERE id = $1`,
      [accountId]
    );
    await logAuditEvent({
      eventType: 'credit_approval_rejected',
      severity: 'warning',
      entityType: 'credit_account',
      entityId: accountId,
      description: `Crédito rechazado en nivel ${approval.level} por ${approvedBy}.`,
      metadata: { comments },
    });
    const account = await getCreditAccount(accountId);
    return { account: account!, allApproved: false };
  }

  // Verificar si quedan aprobaciones pendientes
  const pending = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM credit_approvals
     WHERE credit_account_id = $1 AND decision IS NULL`,
    [accountId]
  );

  const allApproved = Number(pending[0]?.count || 0) === 0;

  if (allApproved) {
    await query(
      `UPDATE credit_accounts
       SET status = 'autorizado', approved_amount = requested_amount, updated_at = NOW()
       WHERE id = $1`,
      [accountId]
    );
    await logAuditEvent({
      eventType: 'credit_authorized',
      severity: 'success',
      entityType: 'credit_account',
      entityId: accountId,
      description: `Crédito autorizado por ${approvedBy}.`,
      metadata: { comments },
    });
  }

  const account = await getCreditAccount(accountId);
  return { account: account!, allApproved };
}

/** Obtiene una cuenta de crédito por ID. */
export async function getCreditAccount(id: string): Promise<CreditAccount | null> {
  const rows = await query<CreditAccount>(
    `SELECT id, application_id AS "applicationId", account_number AS "accountNumber",
            card_code AS "cardCode", requested_amount AS "requestedAmount", approved_amount AS "approvedAmount",
            term_months AS "termMonths", interest_rate AS "interestRate", conditions,
            status, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM credit_accounts WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

/** Lista cuentas de crédito. */
export async function listCreditAccounts(limit = 100): Promise<CreditAccount[]> {
  return query<CreditAccount>(
    `SELECT id, application_id AS "applicationId", account_number AS "accountNumber",
            card_code AS "cardCode", requested_amount AS "requestedAmount", approved_amount AS "approvedAmount",
            term_months AS "termMonths", interest_rate AS "interestRate", conditions,
            status, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM credit_accounts
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
}
