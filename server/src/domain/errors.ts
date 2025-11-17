export interface StraddleAPIError {
  error: {
    type: string;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  status?: number;
}

export interface ExpressError extends Error {
  status?: number;
  code?: string;
}

export function isStraddleError(error: unknown): error is StraddleAPIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as StraddleAPIError).error === 'object'
  );
}

export function toExpressError(error: unknown): ExpressError {
  if (error instanceof Error) {
    return error as ExpressError;
  }

  if (isStraddleError(error)) {
    const err = new Error(error.error.message) as ExpressError;
    err.status = error.status || 500;
    err.code = error.error.code;
    return err;
  }

  return new Error('Unknown error occurred') as ExpressError;
}
