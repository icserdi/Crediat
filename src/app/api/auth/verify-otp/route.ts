import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/auth/otp';
import { inferRole } from '@/lib/auth/domain';
import { logAuditEvent } from '@/lib/db';

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Email y OTP requeridos' }, { status: 400 });
    }

    const valid = verifyOtp(email, otp);

    if (!valid) {
      await logAuditEvent({
        eventType: 'login_failed',
        severity: 'warning',
        actor: email,
        description: `OTP inválido o expirado para ${email}`,
        metadata: { email },
      });
      return NextResponse.json({ error: 'INVALID_OTP', message: 'Código inválido o expirado' }, { status: 401 });
    }

    const role = inferRole(email);

    await logAuditEvent({
      eventType: 'login',
      severity: 'success',
      actor: email,
      actorRole: role,
      description: `Inicio de sesión exitoso: ${email} (${role})`,
      metadata: { email, role },
    });

    return NextResponse.json({
      success: true,
      role,
      email,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Error al verificar OTP' },
      { status: 500 }
    );
  }
}