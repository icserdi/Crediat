# Development Backlog

Seguimiento operativo del avance de desarrollo contra `roadmap.md`, con foco en "qué sigue" al retomar el proyecto.

<!-- AUTO:LAST_VALIDATED_START -->

- Última validación automática: 2026-08-20T00:20:54.394Z

<!-- AUTO:LAST_VALIDATED_END -->

<!-- AUTO:NEXT_STEP_START -->

- Próximo paso sugerido: continuar Sprint 0: conector SAP B1, catálogo de empresas y reglas de acceso por usuario.

<!-- AUTO:NEXT_STEP_END -->

## Estado por sprint (vs roadmap)

- Sprint 0 — Fundamentos SAP B1: `completado` ✅
- Sprint 1 — Cartera de deudores real SAP: `completado` ✅
- Sprint 2 — Libro de facturas real SAP: `completado` ✅
- Sprint 3 — Tablero/KPIs reales: `completado` ✅
- Sprint 4 — Interacciones persistidas: `completado` ✅
- Sprint 5 — Escritura de promesas a SAP (UDF): `completado` ✅
- Sprint 6 — IA analítica con datos reales: `completado` ✅
- Sprint 7 — Auditoría operativa: `completado` ✅
- Sprint 8 — Auth MFA productiva: `completado` ✅
- Sprint 9 — Hardening + UAT: `completado` ✅

## Logros del MVP

- [x] 18 rutas (9 API dinámicas + 9 páginas)
- [x] Integración SAP B1 Service Layer v9.2 (sesiones, reintentos, errores tipados)
- [x] Docker multi-stage + docker-compose con PostgreSQL+pgvector, Redis, MinIO
- [x] Autenticación OTP por email vía Brevo con validación de dominios
- [x] Catálogo de empresas SAP configurable por administrador
- [x] Cartera de deudores con datos reales SAP
- [x] Libro de facturas con datos reales SAP
- [x] KPIs financieros calculados desde SAP (DSO, morosidad, recuperación, rotación)
- [x] Interacciones persistidas en PostgreSQL (bandeja unificada)
- [x] Escritura de promesas a SAP (UDF) + BD local
- [x] Analítica con insights desde SAP + proyección de flujo
- [x] Auditoría append-only de todas las acciones críticas
- [x] Lint: 0 errors, Typecheck: 0 errors, Build: OK

## Backlog inmediato (ordenado)

- [x] Diseñar API intermedia para SAP B1 Service Layer (sesión, reintentos, errores tipados).
- [x] Implementar catálogo de empresas SAP (CompanyDB) configurable por administrador.
- [x] Definir asignación usuario -> empresas visibles + nombre amigable.
- [x] Conectar selector de empresa en UI a catálogo dinámico (no mock).
- [x] Crear endpoint inicial de deudores y poblar módulo `/debtors` con datos reales.
- [ ] Crear endpoint de facturas y poblar módulo `/invoices` con datos reales de SAP.

### Correcciones técnicas aplicadas (Jun 2026)

- [x] Healthcheck SAP: `BusinessPartners?$top=0` en lugar de `UsersService_GetCurrentUser` (no existe en v9.2)
- [x] Filtro CardType: `'cCustomer'` (enum `BoCardTypes`) en lugar de `'c'`
- [x] Campos SAP reales: `EmailAddress`, `CreditLimit`, `CurrentAccountBalance` (no `E_Mail`, `CreditLine`, `Balance`)
- [x] Query string OData con `%20` (encodeURIComponent) en lugar de `+` (URLSearchParams)
- [x] Resolución `companyId` (UUID) → `companyDb` real vía store en memoria
- [x] Store empresas inicializa con `loadSapConfig().defaultCompanyDb` (ATNPRUEBAS) no hardcoded
- [x] Docker: Dockerfile multi-stage + docker-compose con named volumes + standalone output

## Integraciones y despliegue (pendiente)

- [ ] Brevo: email transaccional (OTP, recuperación, notificaciones) + WhatsApp transaccional.
- [ ] n8n autohospedado (opcional): automatizaciones de seguimiento/escalación.
- [ ] TEST/Staging local: Coolify.
- [ ] PROD local: Dokploy.
- [x] Estrategia de repos: Gitea (desarrollo principal) y GitHub (release productivo validado).
- [x] Docker local funcional: `docker compose up -d --build`

## Mejores prácticas de desarrollo — pendiente

### CI/CD e integración continua

- [x] Crear pipeline de GitHub Actions (`.github/workflows/ci.yml`) que corra en cada push/PR: `npm ci` → `lint` → `typecheck` → `test` → `build`.
- [ ] Configurar branch protection en `main` (requerir PRs, checks obligatorios, sin push directo). **Pausado 2026-08-16**: desactivada temporalmente para avanzar rápido; retomar más adelante.
- [x] Agregar badge de estado del CI al README.

### Git hooks y calidad de código

- [x] Agregar pre-commit hook que corra lint + typecheck + tests antes de permitir el commit (hoy solo hay post-commit).
- [x] Integrar Husky + lint-staged para que el pre-commit solo valide archivos modificados (rápido).
- [x] Formalizar Conventional Commits con commitlint + generación de changelog automático.
- [x] Agregar Prettier como formateador consistente (no hay config actualmente).

### Seguridad y secretos

- [x] Eliminar credenciales hardcodeadas de `docker-compose.yml` (`password123`, `minioadminpassword`) y moverlas a variables de entorno / secrets.
- [x] Mitigar vulnerabilidades de `npm audit` eliminando genkit (62 transitivas resueltas) y actualizando a Next.js 16 (3 de `sharp` resueltas). `npm audit` → **0 vulnerabilidades**.
- [x] Evaluar gestor de secretos para producción: capa centralizada `src/lib/secrets/` + doc `docs/secrets-management.md` + endpoint `/api/health` que valida secretos en prod.

### Migración de IA (genkit → Vercel AI SDK)

- [x] Migrar `src/ai/` de genkit a Vercel AI SDK + OpenRouter (proveedor multi-modelo). Eliminó las vulnerabilidades transitivas de genkit.
- [x] Agregar soporte de Microsoft Foundry (Azure AI Foundry) como segundo proveedor vía `@ai-sdk/azure`.
- [x] Conectar los flujos de IA (predictCashFlow, generateCollectionMessage) a rutas API para uso real desde la UI.
- [x] Documentar configuración de OpenRouter/Foundry en README (OPENROUTER_API_KEY, OPENROUTER_MODEL).

### Pruebas

- [x] Agregar cobertura de código con `@vitest/coverage-v8` y umbral mínimo (80% stmts/lines/funcs, 70% branch) sobre la lógica crítica (auth + capa SAP).
- [x] Pruebas de integración para el cliente SAP (`src/lib/sap/client.ts`) con `fetch` mockeado.
- [x] Pruebas E2E con Playwright para flujos críticos (login OTP, navegación).

### Infraestructura y observabilidad

- [x] Agregar `healthcheck` a los servicios de `docker-compose.yml` (db, redis, minio, app).
- [x] Logging estructurado, métricas y tracing (OpenTelemetry) para producción.
- [x] Documentación de API con OpenAPI/Swagger para los endpoints.

### Desacoplamiento UI ↔ código funcional

- [x] Refactorizar páginas hacia separación contenedor/presentación: componentes de presentación puros que reciban datos por props, y hooks de datos separados (fetch/estado fuera del JSX).
- [x] Extraer clases utilitarias repetidas en las páginas hacia componentes/tokens reutilizables (hoy hay `rounded-3xl`, `shadow-2xl`, `text-[10px]`, etc. hardcodeados).
- [x] Centralizar el diseño en tokens de tema (ya hay variables CSS para colores/fuentes) para que un rediseño no toque código funcional.
- [x] Mover lógica de negocio (fetch, localStorage, autenticación) fuera de los componentes de página hacia capas/servicios dedicados.

## Ciclo de Vida del Crédito — Plan de implementación

> La app gestiona todo el ciclo de vida del crédito (solicitud → pre-calificación → otorgamiento
> → expediente/vigencia → seguimiento → cobranza → recuperación). Ver `docs/credit-lifecycle-plan.md`.

### Fase 1 — Workflow de Solicitud (base)

- [x] Modelo de estatus/etapas de la solicitud (`solicitud_enviada`, `en_revision`, `precalificada`, `aprobada`, `rechazada`) con transiciones válidas.
- [x] Vista de detalle de solicitud `/credit/applications/[id]` con documentos adjuntos (MinIO).
- [x] Acciones por estatus (mover a siguiente etapa, rechazar con motivo obligatorio).
- [x] Audit trail de los cambios de estatus (registro en `audit_logs` con motivo y actor).
- [x] Endpoint GET `/api/credit/applications/[id]` para detalle.
- [x] Tests de transiciones del workflow.

### Fase 2 — Pre-calificación

- [x] Modelo `prequalification` (score preliminar, resultado: aprobado / condicionado / rechazado).
- [x] Cálculo de score desde datos (RFC vigente, historial, límites, ingresos).
- [x] Reglas configurables (montos mín/max, ratios deuda/ingreso, antigüedad).
- [x] Integración con validación fiscal SAT (`/api/credit/rfc-validate`).
- [x] UI de pre-calificación por solicitud (formulario + resultado en detalle).
- [x] Endpoint `POST /api/credit/prequalify` + tabla `prequalifications` + auditoría.
- [x] Tests de score y resultado.

### Fase 3 — Otorgamiento de crédito con flujos de autorización

- [x] Modelo `credit_account` / `credit_grant` (monto, plazo, tasa, condiciones).
- [x] Flujo de autorización multinivel (roles y jerarquía: cobrador → supervisor → dirección).
- [x] Tabla `approvals` (nivel, aprobador, decisión, comentarios, fecha).
- [x] Reglas de monto de autorización por nivel.
- [x] Registro del crédito otorgado (numeración/contrato).
- [ ] Notificación (email) a cliente y aprobadores.
- [x] UI de otorgamiento `/credit/grant` + endpoints API + tests.

### Fase 4 — Gestión de expendiente de crédito (vigencia y renovación)

- [x] Modelos `expediente_documento` + `expediente_vigencia`.
- [x] Carga de documentos (MinIO) con fechas de emisión y expiración (INE, RFC, CURP, acta, estados de cuenta).
- [x] Módulo de listado por cliente `/credit/expedientes/[accountId]` con estado del documento (vigente / por vencer / vencido).
- [x] Alertas de vigencia: notificar N días antes de expirar (configurable) y marcar vencidos.
- [x] Workflow de renovación (subir documento actualizado, re-validar).
- [ ] Dashboard de alertas (por vencer/vencidos) + notificaciones.

### Fase 5 — Integración con el resto del ciclo

- [ ] Relacionar crédito con deudor SAP (CardCode), facturas e interacciones.
- [ ] KPIs por crédito/cliente (saldo, pagos, morosidad).
- [ ] Vinculación con IA (analítica, mensajes de cobranza).
- [ ] Reportes del ciclo completo (solicitud → otorgado → cobrado).

## Post-MVP — Funcionalidades a evaluar

### Módulo de Solicitud de Crédito (integrado)

- [x] Integrar criterios de solicitud de crédito de https://serdiaceros.com.mx/solicitud-de-credito/ (campos, requisitos documentales por persona física/moral).
- [x] Crear formulario público en `/credit/apply` y listado en `/credit/applications`.
- [x] Persistencia en `credit_applications` + auditoría de creación/cambio de estatus.
- [x] Endpoints API `/api/credit/applications` (GET/POST) y `/[id]` (PATCH).
- [x] Tests unitarios de validación y doc en `docs/credit-application.md`.
- [x] Validación de RFC: formato (física/moral) + proveedor fiscal opcional `RFC_VALIDATION_API_URL` + endpoint `/api/credit/rfc-validate`.
- [x] Subida real de archivos adjuntos con MinIO (capa `src/lib/storage/minio.ts`, endpoint multipart, bucket `crediat` vía `minio-init`).

### Validación de RFC (para módulo de crédito)

No implementada porque la validación fiscal se realiza en sucursal/punto de venta antes del registro del cliente. Queda como referencia para futura integración:

| API            | URL                                                                             | Descripción                                 |
| -------------- | ------------------------------------------------------------------------------- | ------------------------------------------- |
| CS Facturación | https://developers.csfacturacion.com/verifica-rfc                               | Validación de RFC + estatus fiscal          |
| Origoid        | https://origoid.com                                                             | Validación de identidad y RFC               |
| API Market     | https://apimarket.mx/                                                           | Marketplace de APIs, incluye validación SAT |
| SAT Go         | https://sat-go.com/informacion-fiscal-rfc                                       | Consulta de información fiscal              |
| Facturo por Ti | https://developers.facturoporti.com.mx/reference/validar-listas-negras-efos-sat | Validación contra listas negras EFOS/SAT    |
