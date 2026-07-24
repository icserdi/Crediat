# Especificación Técnica: Integración Recupera AI Pro <> SAP Business One (HANA v9.2)

Esta especificación detalla los requerimientos de datos para la API intermedia que conectará la Service Layer de SAP B1 con el sistema Recupera AI Pro.

**Actualizado Jun 2026** — Campos corregidos según respuesta real de Service Layer v9.2.

## 1. Endpoint: Sincronización de Deudores (Business Partners)
**Propósito:** Obtener la información maestra de clientes para el análisis de riesgo.

### Datos Requeridos de SAP (GET):
- `CardCode`: Identificador único del cliente.
- `CardName`: Nombre o Razón Social.
- `EmailAddress`: Correo electrónico de cobranza/facturación (no `E_Mail`).
- `Phone1` / `Cellular`: Contactos para WhatsApp/Llamadas.
- `CreditLimit`: Límite de crédito autorizado (no `CreditLine`).
- `CurrentAccountBalance`: Saldo actual en SAP (no `Balance`).
- `GroupCode`: Para segmentación por tipo de cliente.

### Detalles técnicos:
- **Healthcheck**: `GET /BusinessPartners?$top=0` (no `UsersService_GetCurrentUser` — no existe en v9.2)
- **Filtro clientes**: `CardType eq 'cCustomer'` (enum `BoCardTypes`: cCustomer, cSupplier, cLid)
- **Query string**: usar `encodeURIComponent()` → `%20` para espacios (no `+` de URLSearchParams)

---

## 2. Endpoint: Sincronización de Facturas (Invoices)
**Propósito:** Alimentar el Ledger de Facturación y la antigüedad de saldos.

### Datos Requeridos de SAP (GET):
- `DocEntry` / `DocNum`: Identificadores de la factura.
- `CardCode` / `CardName`: Relación con el deudor.
- `DocDate`: Fecha de emisión.
- `DocDueDate`: Fecha de vencimiento.
- `DocTotal`: Monto total de la factura.
- `DocCurrency`: Moneda (MXN/USD) — no `DocCur`.
- `DocumentStatus`: Estado (`bost_Open`, `bost_Close`, `bost_Delivered`).

### Notas:
- No existe el campo `PaidToDate` en el endpoint `Invoices` de Service Layer v9.2. El saldo pendiente se calcula contrastando con `IncomingPayments`.
- El filtro por defecto es `DocumentStatus eq 'bost_Open'` (facturas abiertas/pendientes).

---

## 3. Endpoint: Registro de Promesas/Pagos (POST/PATCH)
**Propósito:** Notificar a SAP sobre gestiones realizadas o reportar pagos identificados.

### Datos a enviar desde Recupera AI Pro:
- `U_AI_LastContact`: Fecha de última gestión IA.
- `U_AI_RiskScore`: Score de riesgo calculado por la IA.
- `U_AI_PaymentPromise`: Fecha de promesa de pago acordada.

---

## Requerimientos de Conectividad
- **Protocolo:** HTTPS / REST.
- **Autenticación:** API Key o JWT (Service Layer Token).
- **Formato:** JSON (UTF-8).
- **Entorno:** Servidor On-Premise con visibilidad al nodo de SAP HANA.
