# Gestión de Secretos (Producción)

Este documento describe cómo gestionar los secretos de la aplicación en producción.

## Principios

- **Nunca** versionar secretos en el repositorio (`.env`, `.env.local`, etc. están en `.gitignore`).
- El acceso a secretos está centralizado en `src/lib/secrets/index.ts`.
- En **desarrollo/CI** los secretos se cargan desde el archivo `.env` (no versionado).
- En **producción** los secretos se inyectan como variables de entorno por el proveedor de despliegue.

## Secretos requeridos en producción

| Secret                                 | Uso                    |
| -------------------------------------- | ---------------------- |
| `DATABASE_URL`                         | Conexión a PostgreSQL  |
| `SAP_SERVICE_LAYER_BASE_URL`           | Endpoint Service Layer |
| `SAP_SERVICE_LAYER_USER`               | Usuario SAP            |
| `SAP_SERVICE_LAYER_PASSWORD`           | Contraseña SAP         |
| `SAP_SERVICE_LAYER_DEFAULT_COMPANY_DB` | CompanyDB por defecto  |
| `BREVO_API_KEY`                        | Email transaccional    |
| `OPENROUTER_API_KEY`                   | IA (OpenRouter)        |

## Configuración por proveedor de despliegue

### Coolify (TEST/STAGING) y Dokploy (PROD)

Ambos permiten definir variables de entorno por entorno y aplicación:

1. En el panel del servicio, ve a **Environment Variables**.
2. Añade cada secret con su valor real (nunca el de `.env.example`).
3. Guarda y redeploya.

### GitHub Actions / CI

Los secretos del CI se configuran en el repositorio:
`Settings → Secrets and variables → Actions → New repository secret`.

### Proveedor externo (opcional, a futuro)

Si se requiere mayor aislamiento, se puede leer desde un gestor de secretos dedicado
(AWS Secrets Manager, HashiCorp Vault, Azure Key Vault) inyectando sus valores como
variables de entorno en el proceso antes de arrancar la app.

## Verificación

La función `assertSecretsConfigured()` de `src/lib/secrets/index.ts` valida al arrancar
en producción que todos los secretos requeridos estén presentes y lanza un error claro
si falta alguno.
