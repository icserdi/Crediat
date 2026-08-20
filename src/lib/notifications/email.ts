'server-only';

import { logger } from '@/lib/logger';

const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@crediat.app';
const FROM_NAME = process.env.BREVO_FROM_NAME || 'Crediat';

/** Envía un email transaccional genérico vía Brevo. */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY || '';
  if (!apiKey) {
    logger.warn('BREVO_API_KEY no configurada. Simulando envío de email.', { to: input.to });
    return true;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error('Brevo error al enviar email', {
        status: response.status,
        response: text,
        to: input.to,
      });
      return false;
    }
    return true;
  } catch (error) {
    logger.error('Error enviando email por Brevo', {
      to: input.to,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/** Plantilla base de email con el branding de Crediat. */
function layout(title: string, body: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <div style="background: #353585; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #FA9319; margin: 0; font-size: 20px;">Crediat</h1>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        <h2 style="color: #353585; margin-top: 0;">${title}</h2>
        ${body}
      </div>
    </div>
  `;
}

/** Notifica la creación de una cuenta de crédito (inicio de autorización). */
export async function notifyCreditAccountCreated(input: {
  to: string;
  accountNumber: string;
  requestedAmount: number;
}): Promise<boolean> {
  return sendEmail({
    to: input.to,
    subject: `Solicitud de crédito ${input.accountNumber} en revisión`,
    html: layout(
      'Solicitud de crédito recibida',
      `<p style="color:#6b7280;">Su solicitud de crédito <strong>${input.accountNumber}</strong> por <strong>$${input.requestedAmount.toLocaleString()}</strong> ha sido registrada y está en proceso de autorización.</p>
       <p style="color:#9ca3af;font-size:12px;">Le notificaremos cuando haya una actualización.</p>`
    ),
  });
}

/** Notifica la autorización del crédito. */
export async function notifyCreditAuthorized(input: {
  to: string;
  accountNumber: string;
  approvedAmount: number;
}): Promise<boolean> {
  return sendEmail({
    to: input.to,
    subject: `Crédito ${input.accountNumber} autorizado`,
    html: layout(
      '¡Crédito autorizado!',
      `<p style="color:#6b7280;">Su crédito <strong>${input.accountNumber}</strong> ha sido <strong>autorizado</strong> por un monto de <strong>$${input.approvedAmount.toLocaleString()}</strong>.</p>
       <p style="color:#9ca3af;font-size:12px;">Nuestro equipo se pondrá en contacto para los siguientes pasos.</p>`
    ),
  });
}

/** Notifica el rechazo del crédito. */
export async function notifyCreditRejected(input: {
  to: string;
  accountNumber: string;
  reason?: string;
}): Promise<boolean> {
  return sendEmail({
    to: input.to,
    subject: `Crédito ${input.accountNumber} no aprobado`,
    html: layout(
      'Crédito no aprobado',
      `<p style="color:#6b7280;">Lamentablemente su solicitud de crédito <strong>${input.accountNumber}</strong> no fue aprobada.</p>
       ${input.reason ? `<p style="color:#6b7280;">Motivo: ${input.reason}</p>` : ''}
       <p style="color:#9ca3af;font-size:12px;">Puede contactarnos para más información.</p>`
    ),
  });
}

/** Notifica la vigencia próxima a expirar de un documento del expediente. */
export async function notifyDocumentExpiring(input: {
  to: string;
  documentName: string;
  expiresAt: string;
}): Promise<boolean> {
  return sendEmail({
    to: input.to,
    subject: `Documento por vencer: ${input.documentName}`,
    html: layout(
      'Documento por vencer',
      `<p style="color:#6b7280;">El documento <strong>${input.documentName}</strong> de su expediente de crédito vence el <strong>${new Date(input.expiresAt).toLocaleDateString()}</strong>.</p>
       <p style="color:#9ca3af;font-size:12px;">Por favor renueve el documento para mantener su expediente al día.</p>`
    ),
  });
}
