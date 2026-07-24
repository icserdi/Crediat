import { NextRequest, NextResponse } from 'next/server';
import { query, initializeDb } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

type InteractionRow = {
  id: string;
  company_db: string;
  debtor_id: string;
  debtor_name: string;
  type: string;
  content: string;
  direction: string;
  status: string;
  assigned_to: string;
  user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function GET(request: NextRequest) {
  try {
    await ensureDb();

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const debtorId = searchParams.get('debtorId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let sql = 'SELECT * FROM interactions WHERE 1=1';
    const params: unknown[] = [];

    if (companyId) {
      sql += ` AND company_db = $${params.length + 1}`;
      params.push(companyId);
    }
    if (debtorId) {
      sql += ` AND debtor_id = $${params.length + 1}`;
      params.push(debtorId);
    }

    sql += ' ORDER BY created_at DESC';
    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const rows = await query<InteractionRow>(sql, params);
    return NextResponse.json({ interactions: rows });
  } catch (error) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Error al obtener interacciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDb();

    const body = await request.json();
    const { companyDb, debtorId, debtorName, type, content, direction, assignedTo, userId } = body;

    if (!companyDb || !debtorId || !debtorName || !content) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Faltan campos requeridos: companyDb, debtorId, debtorName, content' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO interactions (company_db, debtor_id, debtor_name, type, content, direction, assigned_to, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const rows = await query<InteractionRow>(sql, [
      companyDb, debtorId, debtorName,
      type || 'WhatsApp', content,
      direction || 'outbound',
      assignedTo || 'Sistema IA',
      userId || null,
    ]);

    return NextResponse.json({ interaction: rows[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Error al crear interacción' },
      { status: 500 }
    );
  }
}