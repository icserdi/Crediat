/**
 * Instrumentación de OpenTelemetry para Next.js.
 * Se ejecuta una vez al iniciar el servidor (Node runtime).
 *
 * Para activar el tracing, define:
 *   OTEL_EXPORTER_OTLP_ENDPOINT=<endpoint del collector>
 *   OTEL_SERVICE_NAME=crediat
 *
 * Si no hay endpoint configurado, la inicialización se omite
 * (sin impacto en desarrollo o en entornos sin observabilidad).
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } =
      await import('@opentelemetry/auto-instrumentations-node');

    const sdk = new NodeSDK({
      serviceName: process.env.OTEL_SERVICE_NAME || 'crediat',
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
  }
}
