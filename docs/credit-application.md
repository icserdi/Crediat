# Módulo de Solicitud de Crédito

Criterios de solicitud de crédito integrados desde el sitio oficial de SERDI:
https://serdiaceros.com.mx/solicitud-de-credito/

## Tipo de persona

El solicitante debe indicar si es **Persona Física** o **Persona Moral**. Los requisitos
documentales varían según el tipo.

## Campos del formulario

| Campo                          | Requerido | Descripción                             |
| ------------------------------ | --------- | --------------------------------------- |
| Tipo de persona                | Sí        | Física o Moral                          |
| Nombre completo o Razón Social | Sí        |                                         |
| Ciudad                         | Sí        |                                         |
| Estado                         | Sí        |                                         |
| Asesor(a) que atiende          | Sí        |                                         |
| Correo electrónico             | Sí        | Formato válido                          |
| Teléfono                       | Sí        | 10–15 dígitos                           |
| Archivos adjuntos              | Sí        | Escaneados; varios archivos o .zip/.rar |

## Requisitos documentales

### Persona Física

1. Pagaré firmado por el solicitante (por el frente).
2. Copia de identificación oficial (INE / Pasaporte).
3. Copia de la CURP.
4. Copia del alta en hacienda (registro SAT).
5. Copia de comprobante de domicilio a nombre del solicitante (agua o predial).
6. Copia de situación fiscal del SAT.
7. Copia de declaración anual 2023 y parciales 2024.
8. Datos del contador (nombre, teléfono y correo electrónico).
9. Carátulas de los 3 últimos estados de cuenta.
10. Aviso de privacidad firmado por el solicitante.

### Persona Moral

1. Pagaré firmado por el representante legal (por frente y por atrás).
2. Copia de acta constitutiva y última modificación.
3. Copia de identificación oficial del representante legal (INE / Pasaporte).
4. Copia de la CURP.
5. Copia de situación fiscal del SAT.
6. Copia del alta en hacienda (registro SAT).
7. Copia de comprobante de domicilio a nombre de la empresa (agua o Comisión Federal).
8. Copia de declaración anual 2023 y parciales 2024.
9. Datos del contador (nombre, teléfono y correo electrónico).
10. Carátulas de los 3 últimos estados de cuenta.
11. Aviso de privacidad firmado por el representante legal.

## Reglas de negocio

- Si falta algún campo o no se adjuntan los archivos, la solicitud **será rechazada**.
- Los requisitos y la validación están implementados en `src/lib/credit/application.ts`.
- Las solicitudes se persisten en la tabla `credit_applications` (ver `src/lib/db/index.ts`).
- Cada creación/cambio de estatus registra un evento en el Ledger de Auditoría.
- Los archivos adjuntos se suben a **MinIO** (capa `src/lib/storage/minio.ts`) al bucket `crediat`,
  en la carpeta `credit-applications/`. El bucket se crea automáticamente al levantar docker
  (servicio `minio-init`). Si MinIO no está configurado, la solicitud se guarda sin archivos.

## Endpoints

| Endpoint                        | Método | Descripción          |
| ------------------------------- | ------ | -------------------- |
| `/api/credit/applications`      | GET    | Lista solicitudes    |
| `/api/credit/applications`      | POST   | Crea una solicitud   |
| `/api/credit/applications/[id]` | PATCH  | Actualiza el estatus |

## UI

- Formulario público: `/credit/apply`
- Listado/revisión (admin/supervisor): `/credit/applications`
