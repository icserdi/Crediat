import { NextRequest, NextResponse } from 'next/server';
import { getSapClient, isSapConfigured, isSapServiceLayerError } from '@/lib/sap';
import { getSapCompaniesStore } from '@/lib/sap/companies-store';
import { query, initializeDb, logAuditEvent } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

/**
 * POST /api/sap/write
 * Escribe campos UDF en SAP Business Partner o crea interacción.
 * Body: { companyId, cardCode, type, data }
 *   type: 'promise' | 'contact' | 'risk'
 *   data: { paymentPromise?: string, lastContact?: string, riskScore?: number }
 */
export async function POST(request: NextRequest) {
  if (!isSapConfigured()) {
    return NextResponse.json(
      { error: 'SAP_CONFIG_MISSING', message: 'SAP no configurado.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { companyId, cardCode, type, data } = body;

    if (!companyId || !cardCode || !type || !data) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Faltan campos requeridos: companyId, cardCode, type, data',
        },
        { status: 400 }
      );
    }

    // Resolver CompanyDB
    const store = getSapCompaniesStore();
    const company = store.getCompanyById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'COMPANY_NOT_FOUND', message: 'Empresa no encontrada' },
        { status: 404 }
      );
    }
    const companyDb = company.companyDb;

    const client = getSapClient();

    // Construir payload PATCH para SAP
    const patchBody: Record<string, unknown> = {};

    if (data.paymentPromise) {
      patchBody.U_Cred_PaymentPromise = data.paymentPromise;
    }
    if (data.lastContact) {
      patchBody.U_Cred_LastContact = data.lastContact;
    }
    if (data.riskScore !== undefined) {
      patchBody.U_Cred_RiskScore = data.riskScore;
    }

    // Intentar PATCH en SAP
    let sapResult: { ok: boolean; udfError?: string } = { ok: false };

    try {
      await client.request({
        path: `/BusinessPartners('${encodeURIComponent(cardCode)}')`,
        method: 'PATCH',
        companyDb,
        body: patchBody,
        retryable: false,
      });
      sapResult = { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Si el error es por UDF inexistente, no es bloqueante
      if (msg.includes('U_Cred_') || msg.includes('Invalid query')) {
        sapResult = {
          ok: false,
          udfError:
            'Los campos U_Cred_* no existen en SAP. Deben crearse en SAP Business One antes de escribir.',
        };
      } else {
        throw err;
      }
    }

    // Registrar la interacción en BD local
    await ensureDb();

    const now = new Date().toISOString();
    let content = '';

    switch (type) {
      case 'promise':
        content = `Promesa de pago registrada para ${data.paymentPromise || 'fecha por definir'}.`;
        break;
      case 'contact':
        content = `Contacto IA registrado: ${data.lastContact || now}`;
        break;
      case 'risk':
        content = `Score de riesgo actualizado a ${data.riskScore}`;
        break;
      default:
        content = `Gestión registrada: ${JSON.stringify(data)}`;
    }

    await query(
      `INSERT INTO interactions (company_db, debtor_id, debtor_name, type, content, direction, assigned_to, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        companyDb,
        cardCode,
        body.debtorName || cardCode,
        'WhatsApp',
        content,
        'outbound',
        'Sistema IA',
        JSON.stringify({ type, ...data, sapWritten: sapResult.ok }),
      ]
    );

    // Registrar auditoría
    await logAuditEvent({
      eventType: `write_${type}`,
      severity: sapResult.ok ? 'success' : 'info',
      actor: 'Sistema',
      entityType: 'BusinessPartner',
      entityId: cardCode,
      description: sapResult.ok
        ? `Escritura UDF exitosa: ${type} - ${JSON.stringify(data)}`
        : `Intento de escritura UDF: ${type}. Los campos U_Cred_* no existen en SAP.`,
      metadata: { type, ...data, sapWritten: sapResult.ok },
      companyDb,
    });

    return NextResponse.json({
      success: true,
      sapWritten: sapResult.ok,
      udfError: sapResult.udfError,
      message: sapResult.ok
        ? 'Datos escritos en SAP correctamente'
        : 'Interacción registrada en BD local. La escritura en SAP requiere crear los campos U_Cred_* en SAP Business One.',
    });
  } catch (error) {
    if (isSapServiceLayerError(error)) {
      return NextResponse.json(
        { error: error.code, message: error.message, details: error.details },
        { status: error.code === 'SAP_AUTH_FAILED' ? 401 : 502 }
      );
    }
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error inesperado',
      },
      { status: 500 }
    );
  }
}
