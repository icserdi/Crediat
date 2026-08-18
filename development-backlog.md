# Development Backlog

Seguimiento operativo del avance de desarrollo contra `roadmap.md`, con foco en "qué sigue" al retomar el proyecto.

<!-- AUTO:LAST_VALIDATED_START -->
- Última validación automática: 2026-08-18T16:58:06.677Z
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
- [ ] Integrar Husky + lint-staged para que el pre-commit solo valide archivos modificados (rápido).
- [ ] Formalizar Conventional Commits con commitlint + generación de changelog automático.
- [ ] Agregar Prettier como formateador consistente (no hay config actualmente).

### Seguridad y secretos
- [x] Eliminar credenciales hardcodeadas de `docker-compose.yml` (`password123`, `minioadminpassword`) y moverlas a variables de entorno / secrets.
- [x] Mitigar vulnerabilidades de `npm audit` eliminando genkit (62 transitivas resueltas). Quedan 3 altas de `sharp` (dependencia de Next.js), con fix vía `next@16` (breaking change) pendiente.
- [ ] Evaluar gestor de secretos para producción (no exponer `.env` ni claves en el repo).

### Migración de IA (genkit → Vercel AI SDK)
- [x] Migrar `src/ai/` de genkit a Vercel AI SDK + OpenRouter (proveedor multi-modelo). Eliminó las vulnerabilidades transitivas de genkit.
- [ ] Agregar soporte de Microsoft Foundry (Azure AI Foundry) como segundo proveedor vía `@ai-sdk/azure`.
- [ ] Conectar los flujos de IA (predictCashFlow, generateCollectionMessage) a rutas API para uso real desde la UI.
- [ ] Documentar configuración de OpenRouter/Foundry en README (OPENROUTER_API_KEY, OPENROUTER_MODEL).

### Pruebas
- [ ] Agregar cobertura de código con `@vitest/coverage-v8` y umbral mínimo (ej. 80%) sobre la lógica crítica.
- [ ] Pruebas de integración para el cliente SAP (`src/lib/sap/client.ts`) con `fetch` mockeado.
- [ ] Pruebas E2E con Playwright/Cypress para flujos críticos (login OTP, navegación, dashboard).

### Infraestructura y observabilidad
- [ ] Agregar `healthcheck` a los servicios de `docker-compose.yml` (db, redis, minio, app).
- [ ] Logging estructurado, métricas y tracing (OpenTelemetry) para producción.
- [ ] Documentación de API con OpenAPI/Swagger para los endpoints.

### Desacoplamiento UI ↔ código funcional
- [x] Refactorizar páginas hacia separación contenedor/presentación: componentes de presentación puros que reciban datos por props, y hooks de datos separados (fetch/estado fuera del JSX).
- [ ] Extraer clases utilitarias repetidas en las páginas hacia componentes/tokens reutilizables (hoy hay `rounded-3xl`, `shadow-2xl`, `text-[10px]`, etc. hardcodeados).
- [ ] Centralizar el diseño en tokens de tema (ya hay variables CSS para colores/fuentes) para que un rediseño no toque código funcional.
- [x] Mover lógica de negocio (fetch, localStorage, autenticación) fuera de los componentes de página hacia capas/servicios dedicados.

## Post-MVP — Funcionalidades a evaluar

### Validación de RFC (para módulo de crédito)
No implementada porque la validación fiscal se realiza en sucursal/punto de venta antes del registro del cliente. Queda como referencia para futura integración:

| API | URL | Descripción |
|-----|-----|-------------|
| CS Facturación | https://developers.csfacturacion.com/verifica-rfc | Validación de RFC + estatus fiscal |
| Origoid | https://origoid.com | Validación de identidad y RFC |
| API Market | https://apimarket.mx/ | Marketplace de APIs, incluye validación SAT |
| SAT Go | https://sat-go.com/informacion-fiscal-rfc | Consulta de información fiscal |
| Facturo por Ti | https://developers.facturoporti.com.mx/reference/validar-listas-negras-efos-sat | Validación contra listas negras EFOS/SAT |
