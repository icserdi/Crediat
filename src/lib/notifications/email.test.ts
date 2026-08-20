import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendEmail, notifyCreditAuthorized } from './email';

describe('sendEmail', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env.BREVO_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.BREVO_API_KEY;
  });

  it('envía un email correctamente', async () => {
    fetchMock.mockResolvedValueOnce(new Response('ok', { status: 200 }));
    const ok = await sendEmail({ to: 'a@b.com', subject: 'Hola', html: '<p>Hola</p>' });
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retorna false si Brevo responde con error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('error', { status: 500 }));
    const ok = await sendEmail({ to: 'a@b.com', subject: 'Hola', html: '<p>Hola</p>' });
    expect(ok).toBe(false);
  });

  it('simula el envío si no hay API key', async () => {
    delete process.env.BREVO_API_KEY;
    const ok = await sendEmail({ to: 'a@b.com', subject: 'Hola', html: '<p>Hola</p>' });
    expect(ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('notifyCreditAuthorized', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env.BREVO_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.BREVO_API_KEY;
  });

  it('envía la notificación de crédito autorizado', async () => {
    fetchMock.mockResolvedValueOnce(new Response('ok', { status: 200 }));
    const ok = await notifyCreditAuthorized({
      to: 'cliente@serdi.com.mx',
      accountNumber: 'CR-2026-00001',
      approvedAmount: 200000,
    });
    expect(ok).toBe(true);

    // Verificar el payload enviado a Brevo
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('api.brevo.com');
    const body = JSON.parse(init.body as string);
    expect(body.to[0].email).toBe('cliente@serdi.com.mx');
    expect(body.subject).toContain('CR-2026-00001');
  });
});
