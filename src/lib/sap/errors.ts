/**
 * Errores tipados de la capa intermedia SAP B1 Service Layer.
 */

export type SapErrorCode =
  | 'SAP_CONFIG_MISSING'
  | 'SAP_AUTH_FAILED'
  | 'SAP_SESSION_EXPIRED'
  | 'SAP_RATE_LIMITED'
  | 'SAP_VALIDATION'
  | 'SAP_NOT_FOUND'
  | 'SAP_CONFLICT'
  | 'SAP_SERVER_ERROR'
  | 'SAP_NETWORK'
  | 'SAP_TIMEOUT'
  | 'SAP_UNKNOWN';

export type SapErrorDetails = {
  companyDb?: string;
  httpStatus?: number;
  sapCode?: number;
  sapMessage?: string;
  path?: string;
  cause?: unknown;
};

export class SapServiceLayerError extends Error {
  readonly code: SapErrorCode;
  readonly details: SapErrorDetails;
  readonly retryable: boolean;

  constructor(
    code: SapErrorCode,
    message: string,
    details: SapErrorDetails = {},
    options?: { retryable?: boolean; cause?: unknown }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'SapServiceLayerError';
    this.code = code;
    this.details = details;
    this.retryable = options?.retryable ?? false;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

export function mapHttpStatusToSapError(
  status: number,
  message: string,
  details: SapErrorDetails
): SapServiceLayerError {
  if (status === 401) {
    return new SapServiceLayerError(
      'SAP_AUTH_FAILED',
      message,
      { ...details, httpStatus: status },
      { retryable: true }
    );
  }
  if (status === 404) {
    return new SapServiceLayerError('SAP_NOT_FOUND', message, {
      ...details,
      httpStatus: status,
    });
  }
  if (status === 409) {
    return new SapServiceLayerError('SAP_CONFLICT', message, {
      ...details,
      httpStatus: status,
    });
  }
  if (status === 429) {
    return new SapServiceLayerError(
      'SAP_RATE_LIMITED',
      message,
      { ...details, httpStatus: status },
      { retryable: true }
    );
  }
  if (status >= 400 && status < 500) {
    return new SapServiceLayerError('SAP_VALIDATION', message, {
      ...details,
      httpStatus: status,
    });
  }
  if (status >= 500) {
    return new SapServiceLayerError(
      'SAP_SERVER_ERROR',
      message,
      { ...details, httpStatus: status },
      { retryable: true }
    );
  }
  return new SapServiceLayerError('SAP_UNKNOWN', message, {
    ...details,
    httpStatus: status,
  });
}

export function isSapServiceLayerError(
  error: unknown
): error is SapServiceLayerError {
  return error instanceof SapServiceLayerError;
}
