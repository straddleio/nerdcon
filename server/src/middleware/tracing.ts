import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logRequest } from '../domain/logs.js';

// Extend Express Request type to include tracing IDs
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      correlationId: string;
      idempotencyKey?: string;
      startTime: number;
    }
  }
}

/**
 * Middleware to add request tracing headers
 * - Request-Id: UUID for individual request
 * - Correlation-Id: UUID for related requests
 * - Idempotency-Key: UUID for POST/PATCH operations (10-40 chars)
 */
export function tracingMiddleware(req: Request, res: Response, next: NextFunction) {
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

  // Intercept response methods to capture body
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let responseBody: any;

  res.json = function(body: any) {
    responseBody = body;
    return originalJson(body);
  };

  res.send = function(body: any) {
    try {
      responseBody = typeof body === 'string' ? JSON.parse(body) : body;
    } catch {
      responseBody = body;
    }
    return originalSend(body);
  };

  // REMOVED: Application-level request log entries (duplicate of Straddle SDK logs)
  // Only logRequest() calls remain to populate API logs in terminal

  // Log request completion
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;

    // Only log API routes (skip static assets, health checks, logs endpoint itself, etc.)
    if (req.path.startsWith('/api/') &&
        req.path !== '/api/events/stream' &&
        req.path !== '/api/logs' &&
        req.path !== '/api/log-stream') {
      console.log(`[TRACE] Logging request: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);

      try {
        // Log to request logs (for Light Logs panel)
        logRequest({
          requestId: req.requestId,
          correlationId: req.correlationId,
          idempotencyKey: req.idempotencyKey,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date().toISOString(),
          requestBody: req.body,
          responseBody,
        });

        // REMOVED: Response log stream entries (duplicate of Straddle SDK logs)
        // Only logRequest() above remains to populate API logs in terminal

        console.log(`[DEBUG] Request logged successfully`);
      } catch (error) {
        console.error(`[ERROR] Failed to log request:`, error);
      }
    }
  });

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
