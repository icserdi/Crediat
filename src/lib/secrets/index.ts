'server-only';

/**
 * Acceso centralizado y tipado a secretos de la aplicación.
 *
 * Fuente de secretos según entorno:
 * - Desarrollo / CI: variables de entorno (archivo `.env`).
 * - Producción: variables de entorno inyectadas por el gestor de secretos
 *   del proveedor de despliegue (Coolify/Dokploy/K8s), o un proveedor
 *   externo (Vault, AWS Secrets Manager, etc.).
 *
 * No incluir nunca secretos en código ni en el repositorio.
 */

export type SecretsConfig = {
  /** Nombre del secret (para mensajes de error). */
  name: string;
  /** Requerido en producción. */
  requiredInProd?: boolean;
  /** Requerido siempre (incl. desarrollo). */
  required?: boolean;
};

const REQUIRED_SECRETS: SecretsConfig[] = [
  { name: 'DATABASE_URL', requiredInProd: true },
  { name: 'SAP_SERVICE_LAYER_BASE_URL', requiredInProd: true },
  { name: 'SAP_SERVICE_LAYER_USER', requiredInProd: true },
  { name: 'SAP_SERVICE_LAYER_PASSWORD', requiredInProd: true },
  { name: 'SAP_SERVICE_LAYER_DEFAULT_COMPANY_DB', requiredInProd: true },
  { name: 'BREVO_API_KEY', requiredInProd: true },
  { name: 'OPENROUTER_API_KEY', requiredInProd: true },
];

/** Retorna el valor de un secret o undefined si no está configurado. */
export function getSecret(name: string): string | undefined {
  return process.env[name];
}

/** True si el entorno actual es producción. */
function inProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Valida que los secretos requeridos estén presentes en el entorno actual. */
export function validateSecrets(): string[] {
  const missing: string[] = [];
  const prod = inProduction();

  for (const { name, required, requiredInProd } of REQUIRED_SECRETS) {
    if (required || (prod && requiredInProd)) {
      if (!process.env[name]) missing.push(name);
    }
  }

  return missing;
}

/** Lanza un error listando los secretos faltantes en producción. */
export function assertSecretsConfigured(): void {
  if (!inProduction()) return;
  const missing = validateSecrets();
  if (missing.length > 0) {
    throw new Error(
      `Secretos de producción faltantes: ${missing.join(', ')}. ` +
        `Configúrelos en el gestor de secretos del proveedor de despliegue.`
    );
  }
}
