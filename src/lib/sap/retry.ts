import { SapServiceLayerError, isSapServiceLayerError } from './errors';

export type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  /** Si retorna true, se reintenta tras backoff. */
  shouldRetry: (error: unknown, attempt: number) => boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      const canRetry = attempt < options.maxAttempts && options.shouldRetry(error, attempt);

      if (!canRetry) break;

      const delay = options.baseDelayMs * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError;
}

export function defaultShouldRetry(error: unknown): boolean {
  if (isSapServiceLayerError(error)) {
    return error.retryable;
  }
  if (error instanceof Error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (
      code === 'ECONNRESET' ||
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' ||
      code === 'ENOTFOUND' ||
      /timeout/i.test(error.message)
    ) {
      return true;
    }
  }
  return false;
}

export function wrapNetworkError(error: unknown, path: string): SapServiceLayerError {
  if (isSapServiceLayerError(error)) return error;

  const nodeError = error as NodeJS.ErrnoException;
  if (nodeError?.name === 'AbortError' || nodeError?.code === 'ABORT_ERR') {
    return new SapServiceLayerError(
      'SAP_TIMEOUT',
      `Tiempo de espera agotado al llamar SAP: ${path}`,
      { path, cause: error },
      { retryable: true, cause: error }
    );
  }

  if (
    nodeError?.code === 'ECONNRESET' ||
    nodeError?.code === 'ECONNREFUSED' ||
    nodeError?.code === 'ETIMEDOUT'
  ) {
    return new SapServiceLayerError(
      'SAP_NETWORK',
      `Error de red al conectar con SAP: ${nodeError.message}`,
      { path, cause: error },
      { retryable: true, cause: error }
    );
  }

  return new SapServiceLayerError(
    'SAP_UNKNOWN',
    error instanceof Error ? error.message : 'Error desconocido en SAP',
    { path, cause: error }
  );
}
