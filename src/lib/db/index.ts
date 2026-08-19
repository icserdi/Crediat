import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function initializeDb(): Promise<void> {
  const createInteractions = `
    CREATE TABLE IF NOT EXISTS interactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_db VARCHAR(50) NOT NULL,
      debtor_id VARCHAR(50) NOT NULL,
      debtor_name VARCHAR(200) NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'WhatsApp',
      content TEXT NOT NULL,
      direction VARCHAR(10) NOT NULL DEFAULT 'outbound',
      status VARCHAR(30) NOT NULL DEFAULT 'Enviado',
      assigned_to VARCHAR(100) NOT NULL DEFAULT 'Sistema IA',
      user_id VARCHAR(100),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_interactions_company_db ON interactions(company_db);
    CREATE INDEX IF NOT EXISTS idx_interactions_debtor_id ON interactions(debtor_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at DESC);
  `;

  const createAuditLogs = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type VARCHAR(50) NOT NULL,
      severity VARCHAR(20) NOT NULL DEFAULT 'info',
      actor VARCHAR(200) NOT NULL DEFAULT 'Sistema',
      actor_role VARCHAR(50),
      entity_type VARCHAR(50),
      entity_id VARCHAR(100),
      description TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      company_db VARCHAR(50),
      ip_address VARCHAR(50),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor);
  `;

  const createCreditApplications = `
    CREATE TABLE IF NOT EXISTS credit_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      person_type VARCHAR(20) NOT NULL CHECK (person_type IN ('fisica', 'moral')),
      full_name VARCHAR(200) NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      advisor VARCHAR(200) NOT NULL,
      email VARCHAR(200) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      rfc VARCHAR(13),
      status VARCHAR(30) NOT NULL DEFAULT 'solicitud_enviada',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE credit_applications ADD COLUMN IF NOT EXISTS rfc VARCHAR(13);

    CREATE INDEX IF NOT EXISTS idx_credit_applications_created_at ON credit_applications(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_credit_applications_status ON credit_applications(status);
    CREATE INDEX IF NOT EXISTS idx_credit_applications_email ON credit_applications(email);
  `;

  const createPrequalifications = `
    CREATE TABLE IF NOT EXISTS prequalifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL REFERENCES credit_applications(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      result VARCHAR(20) NOT NULL CHECK (result IN ('aprobado', 'condicionado', 'rechazado')),
      reasons JSONB DEFAULT '[]',
      details JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_prequalifications_application ON prequalifications(application_id);
  `;

  await query(createInteractions);
  await query(createAuditLogs);
  await query(createCreditApplications);
  await query(createPrequalifications);
}

export async function logAuditEvent(params: {
  eventType: string;
  severity?: string;
  actor?: string;
  actorRole?: string;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  companyDb?: string;
  ipAddress?: string;
}): Promise<void> {
  await query(
    `INSERT INTO audit_logs (event_type, severity, actor, actor_role, entity_type, entity_id, description, metadata, company_db, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      params.eventType,
      params.severity || 'info',
      params.actor || 'Sistema',
      params.actorRole || null,
      params.entityType || null,
      params.entityId || null,
      params.description,
      JSON.stringify(params.metadata || {}),
      params.companyDb || null,
      params.ipAddress || null,
    ]
  );
}
