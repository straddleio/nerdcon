interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info('[DEBUG]', message, context || '');
    }
  }

  info(message: string, context?: LogContext): void {
    console.info('[INFO]', message, context || '');
  }

  warn(message: string, context?: LogContext): void {
    console.warn('[WARN]', message, context || '');
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    console.error('[ERROR]', message, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
      ...context,
    });
  }
}

export const logger = new Logger();
