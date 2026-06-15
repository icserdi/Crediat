# Roadmap Recupera AI Pro — hacia el MVP

Este documento define **sprints** orientados a un **MVP** usable en producción: cobranza con datos confiables, trazabilidad mínima y base para IA. La prioridad acordada es **alimentar cada módulo con datos reales desde SAP Business One** (vía capa intermedia alineada a `sap-integration-spec.md`).

---

## Alcance del MVP (definición breve)

- Usuarios autenticados (dominios corporativos + MFA real) operando sobre **cartera, facturas y gestiones** sincronizadas con **SAP B1**.
- **KPIs del tablero** calculados a partir de datos reales (o precomputados en backend con la misma fuente).
- **Registro de gestiones / promesas** persistido y, cuando aplique, **escritura hacia SAP** (campos UDF acordados).
- Mensajería transaccional para cobranza: **email** y **WhatsApp** vía **Brevo** (mínimo: envío + tracking básico de estado).
- **Auditoría** de accesos y acciones críticas con historial consultable (origen: app + integración).
- Despliegue estable (on‑prem o nube híbrida según conectividad a Service Layer), con secretos y logs básicos.

Lo que puede quedar **post‑MVP**: optimización avanzada de modelos IA, multicanal completo (WhatsApp/SMS), reglas de cobranza muy elaboradas, reporting ejecutivo extendido.

---

## Sprint 0 — Fundamentos de integración y arquitectura

**Objetivo:** Tener un camino seguro y repetible entre SAP B1 y la app antes de llenar pantallas.

| Entregable | Detalle |
|------------|---------|
| API intermedia (BFF) | Servicio (puede vivir como Route Handlers + capa de servicio o API separada) que concentra llamadas a **SAP Service Layer**: auth (sesión/token), reintentos, límites de tasa, errores tipados. |
| Contratos de datos | DTOs alineados a `sap-integration-spec.md` (deudores, facturas, POST/PATCH promesas). Versionar respuestas. |
| Configuración | Variables de entorno para URL Service Layer, compañía SAP, credenciales vía almacén seguro (no en repo). |
| Multi‑empresa | Mapeo `activeCompanyId` (UI) → **CompanyDB** / contexto SAP coherente en cada request. |
| Catálogo de unidades de negocio (admin) | Lista configurable por administrador: **qué CompanyDB (schemas) de SAP** están habilitadas, **nombres amigables**, y **asignación a usuarios** (qué unidades ve cada usuario). |
| Automatización (opcional) | Considerar **n8n autohospedado** para orquestar procesos (sincronizaciones programadas, avisos, escalaciones), manteniendo trazabilidad/auditoría. |

**Criterio de hecho:** Healthcheck del conector + una consulta de lectura real (p. ej. un `BusinessPartner` o lista acotada) desde entorno de pruebas.

---

## Sprint 1 — Cartera de deudores (datos reales SAP)

**Objetivo:** `/debtors` y `/debtors/[id]` muestran **solo** información proveniente de SAP (maestro + saldos según spec).

| Entregable | Detalle |
|------------|---------|
| Listado | `CardCode`, `CardName`, contacto, `CreditLine`, `Balance`, segmentación por `GroupCode`. |
| Detalle | Misma fuente; enlaces a facturas del cliente; estado derivado de antigüedad (cuando exista en Sprint 2). |
| UX | Carga, vacíos, errores de SAP; paginación o filtros mínimos si el volumen lo exige. |

**Criterio de hecho:** Navegación de cartera sin datos mock para campos definidos en spec.

---

## Sprint 2 — Libro de facturas (datos reales SAP)

**Objetivo:** `/invoices` refleja documentos abiertos / historial según negocio, con montos y fechas de SAP.

| Entregable | Detalle |
|------------|---------|
| Lectura | `DocEntry`/`DocNum`, `CardCode`, fechas, `DocTotal`, `PaidToDate`, saldo pendiente, `DocCur`. |
| Relación | Filtro por deudor coherente con Sprint 1. |
| Antigüedad | Buckets (ej. 0–30, 31–60…) calculados en backend a partir de `DocDueDate` y saldo. |

**Criterio de hecho:** Detalle de deudor y libro de facturas cuadran con SAP para una muestra validada en UAT.

---

## Sprint 3 — Tablero de control (KPIs reales)

**Objetivo:** `/` deja de usar series estáticas; **DSO**, morosidad, recuperación, etc. se calculan con las mismas reglas de negocio acordadas, sobre datos de Sprints 1–2.

| Entregable | Detalle |
|------------|---------|
| Motor de métricas | Funciones o job que consolidan cartera + facturas (y límites de fecha). |
| Visualización | Gráficos y tarjetas enlazados a esos endpoints; tooltips con definición de métrica. |
| Rendimiento | Si el volumen es alto: agregados en backend o materialización periódica (sin bloquear el MVP inicial). |

**Criterio de hecho:** Reconciliación manual de al menos un KPI frente a SAP o reporte contable de referencia.

---

## Sprint 4 — Bandeja unificada / interacciones (gestiones reales)

**Objetivo:** `/interactions` lista **gestiones** registradas en la app (y opcionalmente resumen de canales); creación de notas / promesas **persistidas en BD propia**.

| Entregable | Detalle |
|------------|---------|
| Modelo de datos | Tablas (o colección) de interacciones: deudor, usuario, tipo, texto, timestamps. |
| UI | Lista filtrable; alta de gestión desde contexto de deudor/factura. |
| Enlace SAP (lectura) | Mostrar datos maestros y saldo actual al contexto de la gestión (solo lectura en este sprint si el write va después). |

**Criterio de hecho:** Ciclo completo “ver cartera → registrar gestión → verla en bandeja” sin mocks.

---

## Sprint 5 — Escritura hacia SAP (promesas y campos UDF)

**Objetivo:** Cumplir el flujo **POST/PATCH** de `sap-integration-spec.md` (`U_AI_*`) cuando el negocio valide mapeos en SAP.

| Entregable | Detalle |
|------------|---------|
| Mapeo UDF | Campos creados/validados en SAP; contrato estable con la API intermedia. |
| Idempotencia / errores | Reintentos seguros; registro de fallos para soporte. |
| Auditoría | Cada envío a SAP genera evento en log (Sprint 7 puede centralizar visualización). |

**Criterio de hecho:** Promesa registrada en app reflejada en SAP en entorno de pruebas.

---

## Sprint 6 — IA analítica (datos reales, valor acotado)

**Objetivo:** `/analytics` y flujos Genkit consumen **resúmenes o datasets** derivados de SAP + gestiones (no texto inventado).

| Entregable | Detalle |
|------------|---------|
| Insumos | Queries/agregados que alimentan prompts o herramientas (riesgo, concentración, tendencia DSO). |
| Coste y límites | API keys, cuotas, fallback si IA no disponible. |
| Explicabilidad | Copys que indiquen “basado en datos al …” y fuente. |

**Criterio de hecho:** Al menos un insight o flujo de IA verificable contra números del tablero/deudores.

---

## Sprint 7 — Logs de auditoría y seguridad operativa

**Objetivo:** `/audit` muestra eventos **reales** (login, logout, cambios sensibles, errores de integración relevantes).

| Entregable | Detalle |
|------------|---------|
| Eventos | Inmutabilidad lógica (append‑only); quién, cuándo, qué, empresa SAP/contexto. |
| Retención | Política mínima acordada con cumplimiento. |
| RBAC | Alineado con roles ya presentes en UI (`admin`, `supervisor`, `cobrador`). |

**Criterio de hecho:** Auditor puede reconstruir una sesión de trabajo y una promesa enviada a SAP.

---

## Sprint 8 — Autenticación y perfil de producción

**Objetivo:** Sustituir login demo por **MFA por correo (OTP)** y política de dominios; sesiones seguras.

| Entregable | Detalle |
|------------|---------|
| OTP | Proveedor de email; expiración; intentos limitados. |
| Sesiones | Cookies/httpOnly o JWT con refresh según decisión de arquitectura. |
| `/settings` | Preferencias reales donde aplique (perfil, notificaciones básicas). |

**Criterio de hecho:** Pen test básico o checklist OWASP para rutas críticas.

---

## Sprint 9 — MVP endurecido: despliegue, observabilidad, UAT

**Objetivo:** Cierre de MVP listo para operación controlada.

| Entregable | Detalle |
|------------|---------|
| Despliegue | Pipeline documentado; `docker-compose` o equivalente **coherente** con Dockerfile y volúmenes de entorno. |
| Monitoreo | Logs estructurados, alertas mínimas en fallos Service Layer. |
| UAT | Script de pruebas con datos SAP de calidad; firma de negocio. |
| Runbook | Conectividad VPN/firewall hacia Service Layer, rotación de secretos. |

**Criterio de hecho:** Go‑live acotado (una compañía o piloto) con plan de rollback.

---

## Orden lógico (resumen)

1. **Sprint 0** — Conector y contratos SAP  
2. **Sprint 1** — Deudores  
3. **Sprint 2** — Facturas  
4. **Sprint 3** — Tablero / KPIs  
5. **Sprint 4** — Interacciones persistidas  
6. **Sprint 5** — Escritura SAP (UDF)  
7. **Sprint 6** — IA sobre datos reales  
8. **Sprint 7** — Auditoría  
9. **Sprint 8** — Auth producción  
10. **Sprint 9** — Hardening y UAT  

Los sprints **4 y 5** pueden intercambiarse parcialmente si el negocio prioriza primero reflejar promesas en SAP antes de pulir la bandeja; lo habitual es **persistir en app primero** y luego **sincronizar a SAP** para reducir riesgo.

---

## Mantenimiento del roadmap

- Revisar este archivo al **cierre de cada sprint** (qué se movió, dependencias nuevas).
- Toda desviación de `sap-integration-spec.md` debe documentarse aquí o en el spec, no solo en código.
