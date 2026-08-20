# Crediat: Gestión Inteligente de Crédito y Cobranza

[![CI](https://github.com/icserdi/Crediat/actions/workflows/ci.yml/badge.svg)](https://github.com/icserdi/Crediat/actions/workflows/ci.yml)

Sistema de Gestión de Cobranza con IA para la recuperación de cartera de alto rendimiento.

## Requerimientos de Seguridad y Acceso (v1.1)

### 1. Control de Dominios

El acceso está restringido exclusivamente a colaboradores con correos de los siguientes dominios:

- `serdi.com.mx`
- `heliequiposindustriales.com`
- `merkaaceros.com`

### 2. Autenticación Multifactor (MFA)

- Inicio de sesión mediante código de validación enviado por correo electrónico (OTP).
- Opción de recuperación de credenciales vía email.

### 3. Trazabilidad Inmutable

Todas las acciones de autenticación se registran automáticamente en el Ledger de Auditoría:

- Inicios de sesión exitosos y fallidos.
- Cierres de sesión.
- Solicitudes de recuperación de contraseña.

### 4. Integración ERP (SAP B1)

El sistema requiere conexión con SAP Business One v9.2 for HANA. Consultar el archivo `sap-integration-spec.md` en la raíz para detalles técnicos de la API.

**Notas de integración actualizadas (Jun 2026):**

- Healthcheck usa `BusinessPartners?$top=0` (no `UsersService_GetCurrentUser` que no existe en v9.2)
- Filtro de clientes: `CardType eq 'cCustomer'` (enum `BoCardTypes`)
- Campos reales de respuesta: `EmailAddress`, `CreditLimit`, `CurrentAccountBalance` (no `E_Mail`, `CreditLine`, `Balance`)
- Query string OData: usar `%20` para espacios (no `+`)

### 5. Comunicaciones Transaccionales (Brevo)

- Envío de **email transaccional** (OTP, recuperación, notificaciones de cobranza).
- Envío de **WhatsApp** para gestiones de cobranza (plantillas y tracking básico).
- Proveedor sugerido: **Brevo**.

### 6. Automatización (Opcional)

- Se puede usar **n8n (autohospedado)** para automatizar procesos como: sincronizaciones programadas, recordatorios, escalaciones, y flujos de notificación.

### 7. Unidades de Negocio (Multi‑empresa SAP)

- El selector de empresa debe corresponder a las **empresas/CompanyDB (schemas) disponibles en SAP B1**.
- Debe ser **configurable por un administrador**: elegir qué empresas se muestran, asignarlas a usuarios, y definir **nombres amigables**.

## Tecnología

- **Frontend**: Next.js 15+, Tailwind CSS, Shadcn UI
- **IA**: Vercel AI SDK + OpenRouter (multi-modelo) / Microsoft Foundry (Azure AI Foundry)
- **Integración**: SAP Service Layer (REST API)
- **Seguridad**: Validación de dominios y Logs de Auditoría Inmutables.
- **Contenedores**: Docker + Docker Compose (PostgreSQL + pgvector, Redis, MinIO, Next.js standalone)

## Configuración de IA

La capa de IA usa [Vercel AI SDK](https://sdk.vercel.ai) y soporta dos proveedores configurables vía `AI_PROVIDER`:

## Documentación de API

La especificación completa de la API (OpenAPI 3.0) está en [`docs/api-openapi.yaml`](docs/api-openapi.yaml).
Incluye autenticación OTP, datos SAP (deudores, facturas, KPIs), administración de empresas, interacciones, auditoría y endpoints de IA.

### OpenRouter (default)

Multi-modelo: acceso a cientos de modelos (Claude, GPT, Llama, DeepSeek, etc.) con una sola API key.

```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openrouter/auto   # o un modelo específico, ej. openai/gpt-4o-mini
```

Obtén tu key en https://openrouter.ai/settings/keys

### Microsoft Foundry (Azure AI Foundry)

Usa modelos desplegados en tu proyecto de Azure AI Foundry.

```bash
AI_PROVIDER=foundry
AZURE_FOUNDRY_BASE_URL=https://<proyecto>.services.ai.azure.com
AZURE_FOUNDRY_API_KEY=<clave-del-modelo>
AZURE_FOUNDRY_DEPLOYMENT=<nombre-del-deployment>
```

### Endpoints de IA

Los flujos de IA se exponen como rutas API:

| Endpoint                         | Descripción                                                  |
| -------------------------------- | ------------------------------------------------------------ |
| `POST /api/ai/predict-cash-flow` | Predice el flujo de caja futuro a partir de datos históricos |
| `POST /api/ai/generate-message`  | Genera un mensaje de cobranza personalizado por IA           |

## Despliegue Local con Docker

```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales reales (OPENROUTER_API_KEY, SAP_SERVICE_LAYER_*)

# 2. Levantar servicios
docker compose up -d --build

# 3. Verificar
curl http://localhost:3000/api/sap/health?companyId=<uuid>
# {"ok":true,"companyDb":"ATNPRUEBAS",...}

# Servicios disponibles:
# - App (Next.js): http://localhost:3000
# - PostgreSQL + pgvector: localhost:5432
# - Redis: localhost:6379
# - MinIO (S3): http://localhost:9000 (API) / http://localhost:9001 (Console)
```

## Operación de desarrollo

- `development-log.md`: bitácora de cambios validados.
- `development-backlog.md`: avance contra roadmap + próximos pasos.
- `release-and-deploy-flow.md`: estrategia Gitea/GitHub + Coolify/Dokploy.
- `roadmap.md`: plan de sprints hacia MVP.
- `docs/credit-lifecycle-plan.md`: ciclo de vida del crédito implementado (solicitud → pre-calificación → otorgamiento → expediente → alertas → reportes).
- `docs/credit-application.md`: criterios y funcionamiento del módulo de solicitud de crédito.
- `docs/api-openapi.yaml`: especificación OpenAPI de la API.
- `docs/secrets-management.md`: gestión de secretos en producción.

Para registrar automáticamente validaciones técnicas:

```bash
npm run validate:tracked
```

Para instalar hook local `post-commit` (actualiza checkpoint automáticamente tras cada commit):

```bash
npm run hooks:install
```
