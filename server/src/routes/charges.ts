import { Router, Request, Response } from 'express';
import straddleClient from '../sdk.js';
import { stateManager } from '../domain/state.js';
import { DemoCharge } from '../domain/types.js';
import { addLogEntry } from '../domain/log-stream.js';
import { logStraddleCall } from '../domain/logs.js';
import { toExpressError } from '../domain/errors.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * Get current date in Denver/Mountain Time (America/Denver)
 * Automatically handles MST/MDT transitions
 */
function getTodayInDenver(): string {
  const now = new Date();

  // Convert to Denver time using Intl.DateTimeFormat
  const denverDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  // Format is MM/DD/YYYY, convert to YYYY-MM-DD
  const [month, day, year] = denverDate.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * POST /api/charges
 * Create a charge (Pay by Bank payment)
 */
router.post('/', (req: Request, res: Response): void => {
  const body = req.body as Record<string, unknown>;
  const amount = typeof body.amount === 'number' ? body.amount : undefined;
  const paykey = typeof body.paykey === 'string' ? body.paykey : undefined;
  const currency = typeof body.currency === 'string' ? body.currency : undefined;
  const payment_date = typeof body.payment_date === 'string' ? body.payment_date : undefined;
  const outcome = typeof body.outcome === 'string' ? body.outcome : undefined;
  const description = typeof body.description === 'string' ? body.description : undefined;
  const consent_type = typeof body.consent_type === 'string' ? body.consent_type : undefined;

  // Validate required fields
  if (!paykey) {
    res.status(400).json({ error: 'paykey is required' });
    return;
  }

  // Generate unique external_id
  const external_id = `charge_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Validate consent_type
  const validConsentType =
    consent_type === 'internet' || consent_type === 'signed' ? consent_type : 'internet';

  // Default charge data
  const chargeData = {
    amount: amount || 10000, // $100.00 in cents
    paykey,
    currency: currency || 'USD',
    external_id, // Unique identifier for this charge
    description: description || 'Demo charge payment',
    consent_type: validConsentType as 'internet' | 'signed',
    device: { ip_address: req.ip || '192.168.1.1' },
    payment_date: payment_date || getTodayInDenver(), // Use Denver Mountain Time
    config: {
      balance_check: 'enabled' as const,
      sandbox_outcome: (outcome === 'failed' ? 'failed_insufficient_funds' : outcome || 'paid') as
        | 'paid'
        | 'failed_insufficient_funds'
        | 'reversed_insufficient_funds'
        | 'on_hold_daily_limit'
        | 'cancelled_for_fraud_risk',
    },
  };

  // Log outbound Straddle request to stream
  addLogEntry({
    timestamp: new Date().toISOString(),
    type: 'straddle-req',
    method: 'POST',
    path: '/charges',
    requestBody: chargeData,
    requestId: req.requestId,
  });

  // Use async IIFE to handle promises properly
  void (async (): Promise<void> => {
    const startTime = Date.now();

    try {
      // Create charge via Straddle SDK
      const charge = await straddleClient.charges.create(chargeData);
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: charge.data,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        'charges',
        'POST',
        200,
        duration,
        chargeData,
        charge.data
      );

      // Debug: Log the actual charge response
      logger.debug('Straddle charge response (create)', {
        chargeId: charge.data.id,
        status: charge.data.status,
        amount: charge.data.amount,
      });

      // Map to demo charge format (Straddle wraps response in .data)
      const chargeResponse = charge.data as unknown as Record<string, unknown>;
      const demoCharge: DemoCharge = {
        id: typeof chargeResponse.id === 'string' ? chargeResponse.id : '',
        customer_id: undefined, // Charges are linked via paykey, not customer_id
        paykey: typeof chargeResponse.paykey === 'string' ? chargeResponse.paykey : '',
        amount: typeof chargeResponse.amount === 'number' ? chargeResponse.amount : 0,
        currency: typeof chargeResponse.currency === 'string' ? chargeResponse.currency : 'USD',
        status: typeof chargeResponse.status === 'string' ? chargeResponse.status : 'unknown',
        payment_date:
          typeof chargeResponse.payment_date === 'string' ? chargeResponse.payment_date : '',
        created_at:
          typeof chargeResponse.created_at === 'string'
            ? chargeResponse.created_at
            : new Date().toISOString(),
        scheduled_at:
          typeof chargeResponse.scheduled_at === 'string' ? chargeResponse.scheduled_at : undefined,
        completed_at:
          typeof chargeResponse.completed_at === 'string' ? chargeResponse.completed_at : undefined,
        failure_reason:
          typeof chargeResponse.failure_reason === 'string'
            ? chargeResponse.failure_reason
            : undefined,
        status_history: Array.isArray(chargeResponse.status_history)
          ? chargeResponse.status_history.map((h: unknown) => {
              const history = h as Record<string, unknown>;
              return {
                status: typeof history.status === 'string' ? history.status : '',
                timestamp: typeof history.changed_at === 'string' ? history.changed_at : '', // Map changed_at to timestamp
                reason: typeof history.reason === 'string' ? history.reason : '',
                message: typeof history.message === 'string' ? history.message : '', // Include the message!
                source: typeof history.source === 'string' ? history.source : '',
              };
            })
          : undefined,
        sandbox_outcome: outcome,
        payment_rail:
          typeof chargeResponse.payment_rail === 'string' ? chargeResponse.payment_rail : undefined,
        consent_type:
          typeof chargeResponse.consent_type === 'string' ? chargeResponse.consent_type : '',
      };

      // Update demo state
      stateManager.setCharge(demoCharge);

      res.status(201).json(demoCharge);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error creating charge', err);

      const duration = Date.now() - startTime;
      const statusCode = err.status || 500;
      const errorResponse = {
        error: err.message || 'Failed to create charge',
        details: err.code || null,
      };

      // Log error response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode,
        responseBody: errorResponse,
        duration,
        requestId: req.requestId,
      });

      // Log failed Straddle call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        'charges',
        'POST',
        statusCode,
        duration,
        chargeData,
        errorResponse
      );

      res.status(statusCode).json(errorResponse);
    }
  })();
});

/**
 * GET /api/charges/:id
 * Get charge details with full lifecycle status history
 */
router.get('/:id', (req: Request, res: Response): void => {
  void (async (): Promise<void> => {
    try {
      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'GET',
        path: `/charges/${req.params.id}`,
        requestId: req.requestId,
      });

      const startTime = Date.now();
      const charge = await straddleClient.charges.get(req.params.id);
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: charge.data,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `charges/${req.params.id}`,
        'GET',
        200,
        duration,
        undefined,
        charge.data
      );

      // Debug: Log the actual charge response
      logger.debug('Straddle charge response (get)', {
        chargeId: charge.data.id,
        status: charge.data.status,
      });

      // Map to demo charge format (Straddle wraps response in .data)
      const chargeResponse = charge.data as unknown as Record<string, unknown>;
      const demoCharge: DemoCharge = {
        id: typeof chargeResponse.id === 'string' ? chargeResponse.id : '',
        customer_id: undefined, // Charges are linked via paykey, not customer_id
        paykey: typeof chargeResponse.paykey === 'string' ? chargeResponse.paykey : '',
        amount: typeof chargeResponse.amount === 'number' ? chargeResponse.amount : 0,
        currency: typeof chargeResponse.currency === 'string' ? chargeResponse.currency : 'USD',
        status: typeof chargeResponse.status === 'string' ? chargeResponse.status : 'unknown',
        payment_date:
          typeof chargeResponse.payment_date === 'string' ? chargeResponse.payment_date : '',
        created_at:
          typeof chargeResponse.created_at === 'string'
            ? chargeResponse.created_at
            : new Date().toISOString(),
        scheduled_at:
          typeof chargeResponse.scheduled_at === 'string' ? chargeResponse.scheduled_at : undefined,
        completed_at:
          typeof chargeResponse.completed_at === 'string' ? chargeResponse.completed_at : undefined,
        failure_reason:
          typeof chargeResponse.failure_reason === 'string'
            ? chargeResponse.failure_reason
            : undefined,
        status_history: Array.isArray(chargeResponse.status_history)
          ? chargeResponse.status_history.map((h: unknown) => {
              const history = h as Record<string, unknown>;
              return {
                status: typeof history.status === 'string' ? history.status : '',
                timestamp: typeof history.changed_at === 'string' ? history.changed_at : '', // Map changed_at to timestamp
                reason: typeof history.reason === 'string' ? history.reason : '',
                message: typeof history.message === 'string' ? history.message : '', // Include the message!
                source: typeof history.source === 'string' ? history.source : '',
              };
            })
          : undefined,
        payment_rail:
          typeof chargeResponse.payment_rail === 'string' ? chargeResponse.payment_rail : undefined,
        consent_type:
          typeof chargeResponse.consent_type === 'string' ? chargeResponse.consent_type : '',
      };

      res.json(demoCharge);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error getting charge', err);
      res.status(err.status || 500).json({
        error: err.message || 'Failed to get charge',
      });
    }
  })();
});

/**
 * POST /api/charges/:id/cancel
 * Cancel a charge
 */
router.post('/:id/cancel', (req: Request, res: Response): void => {
  void (async (): Promise<void> => {
    try {
      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'POST',
        path: `/charges/${req.params.id}/cancel`,
        requestId: req.requestId,
      });

      const startTime = Date.now();
      const charge = await straddleClient.charges.cancel(req.params.id);
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: charge.data,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `charges/${req.params.id}/cancel`,
        'POST',
        200,
        duration,
        undefined,
        charge.data
      );

      // Straddle wraps response in .data
      res.json(charge.data);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error cancelling charge', err);
      res.status(err.status || 500).json({
        error: err.message || 'Failed to cancel charge',
      });
    }
  })();
});

/**
 * POST /api/charges/:id/hold
 * Place a hold on a charge
 */
router.post('/:id/hold', (req: Request, res: Response): void => {
  void (async (): Promise<void> => {
    try {
      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'POST',
        path: `/charges/${req.params.id}/hold`,
        requestId: req.requestId,
      });

      const startTime = Date.now();
      const charge = await straddleClient.charges.hold(req.params.id);
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: charge.data,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `charges/${req.params.id}/hold`,
        'POST',
        200,
        duration,
        undefined,
        charge.data
      );

      // Straddle wraps response in .data
      res.json(charge.data);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error holding charge', err);
      res.status(err.status || 500).json({
        error: err.message || 'Failed to hold charge',
      });
    }
  })();
});

/**
 * POST /api/charges/:id/release
 * Release a hold on a charge
 */
router.post('/:id/release', (req: Request, res: Response): void => {
  void (async (): Promise<void> => {
    try {
      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'POST',
        path: `/charges/${req.params.id}/release`,
        requestId: req.requestId,
      });

      const startTime = Date.now();
      const charge = await straddleClient.charges.release(req.params.id);
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: charge.data,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `charges/${req.params.id}/release`,
        'POST',
        200,
        duration,
        undefined,
        charge.data
      );

      // Straddle wraps response in .data
      res.json(charge.data);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error releasing charge', err);
      res.status(err.status || 500).json({
        error: err.message || 'Failed to release charge',
      });
    }
  })();
});

export default router;
