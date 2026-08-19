'server-only';

/**
 * Validación de RFC (Registro Federal de Contribuyentes).
 *
 * Dos niveles:
 * 1. `validateRfcFormat`: validación de formato (determinista, sin red).
 *    - Persona física: 13 caracteres (4 letras + 6 dígitos + 3 homoclave).
 *    - Persona moral: 12 caracteres (3 letras + 6 dígitos + 3 homoclave).
 * 2. `validateRfcFiscal`: validación fiscal contra un proveedor externo (SAT),
 *    configurable vía `RFC_VALIDATION_API_URL`. Si no hay proveedor configurado,
 *    retorna el resultado de la validación de formato.
 */

/** Tipo de RFC según persona. */
export type RfcKind = 'fisica' | 'moral';

/** Resultado de la validación de RFC. */
export type RfcValidationResult = {
  valid: boolean;
  /** 'formato' si solo se validó el formato; 'fiscal' si se validó contra SAT. */
  source: 'formato' | 'fiscal';
  message: string;
  /** Datos fiscales (solo si el proveedor los devuelve). */
  data?: {
    razonSocial?: string;
    situacion?: string;
    nombreCompleto?: string;
  };
};

const RFC_FISICA = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;
const RFC_MORAL = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;

/** Valida el formato de un RFC según el tipo de persona. */
export function validateRfcFormat(rfc: string, kind: RfcKind): boolean {
  const normalized = rfc.trim().toUpperCase();
  return kind === 'fisica' ? RFC_FISICA.test(normalized) : RFC_MORAL.test(normalized);
}

/** Cliente para el proveedor externo de validación fiscal. */
export type RfcValidationProvider = {
  validate: (rfc: string, kind: RfcKind) => Promise<RfcValidationResult>;
};

/**
 * Proveedor de validación fiscal configurable.
 * Usa `RFC_VALIDATION_API_URL` si está definida; de lo contrario solo formato.
 */
export function createRfcValidator(): RfcValidationProvider {
  const endpoint = process.env.RFC_VALIDATION_API_URL;

  return {
    validate: async (rfc, kind) => {
      const normalized = rfc.trim().toUpperCase();

      if (!validateRfcFormat(normalized, kind)) {
        return {
          valid: false,
          source: 'formato',
          message: 'El RFC no tiene un formato válido.',
        };
      }

      // Sin proveedor externo: solo validación de formato
      if (!endpoint) {
        return {
          valid: true,
          source: 'formato',
          message: 'Formato de RFC válido.',
        };
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rfc: normalized, tipo: kind }),
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          return {
            valid: false,
            source: 'fiscal',
            message: `El proveedor de validación fiscal respondió con error (HTTP ${response.status}).`,
          };
        }

        const body = (await response.json()) as {
          valido?: boolean;
          situacion?: string;
          razonSocial?: string;
          nombreCompleto?: string;
        };

        return {
          valid: body.valido !== false,
          source: 'fiscal',
          message: body.valido === false ? 'RFC no vigente según el SAT.' : 'RFC vigente.',
          data: {
            razonSocial: body.razonSocial,
            situacion: body.situacion,
            nombreCompleto: body.nombreCompleto,
          },
        };
      } catch (error) {
        return {
          valid: false,
          source: 'fiscal',
          message: `No se pudo consultar el RFC: ${error instanceof Error ? error.message : 'error desconocido'}.`,
        };
      }
    },
  };
}
