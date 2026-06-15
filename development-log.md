# Development Log

Registro cronológico de cambios validados para retomar el proyecto sin perder contexto.

## Convención de uso

- Registrar entradas automáticas al ejecutar `npm run validate:tracked`.
- Opcional: definir `DEV_LOG_NOTE` para describir qué se validó.
- Solo se registran cambios cuando la validación técnica termina correctamente.

## 2026-05-06T00:00:00.000Z

- Estado: INICIAL
- Autor: sistema
- Branch: n/a
- Commit base: n/a
- Nota: Se habilita esquema de bitácora automática para cambios validados.

## 2026-05-06T05:45:33.320Z

- Estado: VALIDADO
- Autor: ICASTRO
- Branch: n/a
- Commit base: n/a
- Nota: Configuración inicial de tracking de desarrollo y flujo de repos/despliegue.

## 2026-06-15T23:35:00.000Z

- Estado: VALIDADO
- Autor: ICASTRO
- Branch: main
- Commit base: n/a (pre-git)
- Nota: Sprint 0 y 1 completados - Docker local funcional + integración SAP B1 real
  - Docker: Dockerfile multi-stage (standalone), docker-compose.yml con named volumes, next.config.ts output:standalone
  - SAP Healthcheck: BusinessPartners?$top=0 (UsersService_GetCurrentUser no existe en v9.2)
  - API /debtors: filtro CardType eq 'cCustomer', campos reales EmailAddress/CreditLimit/CurrentAccountBalance
  - Query string OData con encodeURIComponent (%20 para espacios)
  - Resolución companyId (UUID) → companyDb real via companies-store
  - Store empresas usa loadSapConfig().defaultCompanyDb (ATNPRUEBAS) no hardcoded SBO_DEMO
  - Verificado: healthcheck OK, debtors API devuelve 5 registros desde ATNPRUEBAS