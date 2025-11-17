import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type to include tracing IDs
declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
    correlationId: string;
    idempotencyKey?: string;
    startTime: number;
  }
}

/**
 * Middleware to add request tracing headers
 * - Request-Id: UUID for individual request
 * - Correlation-Id: UUID for related requests
 * - Idempotency-Key: UUID for POST/PATCH operations (10-40 chars)
 */
export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Generate or use existing tracing IDs
  req.requestId = req.headers['request-id'] as string || uuidv4();
  req.correlationId = req.headers['correlation-id'] as string || uuidv4();

  // Generate idempotency key for POST/PATCH requests
  if (['POST', 'PATCH'].includes(req.method)) {
    req.idempotencyKey = req.headers['idempotency-key'] as string || uuidv4();
  }

  // Track request start time for latency measurement
  req.startTime = Date.now();

  // Add tracing headers to response
  res.setHeader('Request-Id', req.requestId);
  res.setHeader('Correlation-Id', req.correlationId);
  if (req.idempotencyKey) {
    res.setHeader('Idempotency-Key', req.idempotencyKey);
  }

  // REMOVED: Response body interception (no longer needed)
  // REMOVED: Application-level request logging
  // Terminal API logs now show ONLY Straddle API requests
  // These are logged via logStraddleCall() in route handlers

  next();
}

/**
 * Get tracing headers for Straddle SDK calls
 */
export function getTracingHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Request-Id': req.requestId,
    'Correlation-Id': req.correlationId,
  };

  if (req.idempotencyKey) {
    headers['Idempotency-Key'] = req.idempotencyKey;
  }

  return headers;
}
