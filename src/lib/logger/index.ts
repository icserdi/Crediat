'server-only';

/**
 * Logger estructurado en JSON para la aplicación.
 *
 * Emite logs como líneas JSON (estándar en producción y compatible con
 * agregadores como Loki, Datadog, ELK). En desarrollo emite texto legible.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];

function currentLevel(): LogLevel {
  const configured = process.env.LOG_LEVEL as LogLevel | undefined;
  return LEVELS.includes(configured as LogLevel) ? (configured as LogLevel) : 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel()];
}

function emit(level: LogLevel, message: string, context: LogContext = {}): void {
  if (!shouldLog(level)) return;

  const isProd = process.env.NODE_ENV === 'production';
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  if (isProd) {
    // JSON estructurado para producción
    const line = JSON.stringify(entry);
    if (level === 'error') process.stderr.write(line + '\n');
    else process.stdout.write(line + '\n');
  } else {
    // Texto legible para desarrollo
    const ctx = Object.keys(context).length ? ` ${JSON.stringify(context)}` : '';
    const output = `[${entry.timestamp}] ${level.toUpperCase()} ${message}${ctx}`;
    if (level === 'error') process.stderr.write(output + '\n');
    else process.stdout.write(output + '\n');
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, context?: LogContext) => emit('error', message, context),
};

/** Objeto de contexto con el logger para uso en librerías que esperan un pino-like. */
export default logger;
