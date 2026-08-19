import { logAuditEvent } from '@/lib/db';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@crediat.app';
const FROM_NAME = process.env.BREVO_FROM_NAME || 'Crediat';

export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.warn('BREVO_API_KEY no configurada. Simulando envío de OTP.');
    return true;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email }],
        subject: `Código de Validación — Crediat`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <div style="background: #353585; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #FA9319; margin: 0; font-size: 20px;">Crediat</h1>
            </div>
            <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
              <h2 style="color: #353585; margin-top: 0;">Código de Validación</h2>
              <p style="color: #6b7280;">Usa el siguiente código para acceder al sistema:</p>
              <div style="background: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #353585; margin: 16px 0;">
                ${otp}
              </div>
              <p style="color: #9ca3af; font-size: 12px;">Este código expira en 10 minutos.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Brevo error:', response.status, text);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error enviando OTP por Brevo:', error);
    await logAuditEvent({
      eventType: 'email_failure',
      severity: 'error',
      description: `Fallo al enviar OTP a ${email}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      metadata: { email },
    });
    return false;
  }
}
