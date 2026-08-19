import { NextResponse } from 'next/server';
import { validateSecrets, assertSecretsConfigured } from '@/lib/secrets';

/**
 * GET /api/health
 * Healthcheck general que verifica la configuración de secretos.
 * En producción, retorna qué secretos faltan (sin exponer sus valores).
 */
export async function GET() {
  const missing = validateSecrets();
  const isProd = process.env.NODE_ENV === 'production';

  try {
    assertSecretsConfigured();
    return NextResponse.json({
      ok: true,
      environment: isProd ? 'production' : 'development',
      secretsConfigured: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        environment: isProd ? 'production' : 'development',
        secretsConfigured: false,
        missingSecrets: missing,
        message: error instanceof Error ? error.message : 'Secretos incompletos',
      },
      { status: 500 }
    );
  }
}
