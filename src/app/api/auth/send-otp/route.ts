import { NextRequest, NextResponse } from 'next/server';
import { validateDomain } from '@/lib/auth/domain';
import { generateOtp } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/auth/email';
import { logAuditEvent, initializeDb } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

/**
 * POST /api/auth/send-otp
 * Body: { email }
 */
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Email requerido' },
        { status: 400 }
      );
    }

    if (!validateDomain(email)) {
      await logAuditEvent({
        eventType: 'login_blocked',
        severity: 'warning',
        actor: email,
        description: `Intento de acceso desde dominio no autorizado: ${email}`,
        metadata: { email, reason: 'dominio_no_autorizado' },
      });
      return NextResponse.json(
        { error: 'DOMAIN_NOT_ALLOWED', message: 'Dominio no autorizado' },
        { status: 403 }
      );
    }

    const otp = generateOtp(email);
    const sent = await sendOtpEmail(email, otp);

    await logAuditEvent({
      eventType: 'otp_sent',
      severity: 'info',
      actor: email,
      description: `OTP enviado a ${email} (entrega: ${sent ? 'exitosa' : 'simulada'})`,
      metadata: { email, delivered: sent },
    });

    return NextResponse.json({
      success: true,
      message: `Código enviado a ${email}`,
      // En producción, quitar otp de la respuesta
      ...(process.env.NODE_ENV === 'development' ? { debugOtp: otp } : {}),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al enviar OTP',
      },
      { status: 500 }
    );
  }
}
