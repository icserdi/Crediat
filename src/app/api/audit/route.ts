import { NextRequest, NextResponse } from 'next/server';
import { query, initializeDb } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

type AuditRow = {
  id: string;
  event_type: string;
  severity: string;
  actor: string;
  actor_role: string | null;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown>;
  company_db: string | null;
  ip_address: string | null;
  created_at: string;
};

export async function GET(request: NextRequest) {
  try {
    await ensureDb();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const eventType = searchParams.get('eventType');
    const actor = searchParams.get('actor');
    const companyDb = searchParams.get('companyDb');

    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: unknown[] = [];

    if (eventType) {
      sql += ` AND event_type = $${params.length + 1}`;
      params.push(eventType);
    }
    if (actor) {
      sql += ` AND actor ILIKE $${params.length + 1}`;
      params.push(`%${actor}%`);
    }
    if (companyDb) {
      sql += ` AND company_db = $${params.length + 1}`;
      params.push(companyDb);
    }

    sql += ' ORDER BY created_at DESC';
    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const rows = await query<AuditRow>(sql, params);

    // Summary stats
    const statsSql = `
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'login') as logins,
        COUNT(*) FILTER (WHERE event_type = 'logout') as logouts,
        COUNT(*) FILTER (WHERE event_type ILIKE '%ia%' OR event_type ILIKE '%ai%') as ia_invocations,
        COUNT(*) FILTER (WHERE event_type ILIKE '%promise%' OR event_type ILIKE '%udf%' OR event_type ILIKE '%write%') as writes
      FROM audit_logs
    `;
    const stats = await query<{
      logins: string;
      logouts: string;
      ia_invocations: string;
      writes: string;
    }>(statsSql);

    return NextResponse.json({
      logs: rows,
      stats: {
        logins: parseInt(stats[0]?.logins || '0', 10),
        logouts: parseInt(stats[0]?.logouts || '0', 10),
        iaInvocations: parseInt(stats[0]?.ia_invocations || '0', 10),
        writes: parseInt(stats[0]?.writes || '0', 10),
      },
      total: rows.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al obtener auditoría',
      },
      { status: 500 }
    );
  }
}
