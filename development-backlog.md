# Development Backlog

Seguimiento operativo del avance de desarrollo contra `roadmap.md`, con foco en "qué sigue" al retomar el proyecto.

<!-- AUTO:LAST_VALIDATED_START -->
- Última validación automática: 2026-06-15T23:35:00.000Z
<!-- AUTO:LAST_VALIDATED_END -->

<!-- AUTO:NEXT_STEP_START -->
- Próximo paso sugerido: crear endpoint de facturas y poblar módulo `/invoices` con datos reales de SAP.
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
- [ ] Estrategia de repos: Gitea (desarrollo principal) y GitHub (release productivo validado).
- [ ] Activar hooks locales cuando exista repo Git en la ruta: `npm run hooks:install`.
- [ ] TEST/Staging local: Coolify.
- [ ] PROD local: Dokploy.
- [x] Docker local funcional: `docker compose up -d --build`
