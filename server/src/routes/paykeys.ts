import { Router, Request, Response } from 'express';
import straddleClient from '../sdk.js';
import { DemoPaykey } from '../domain/types.js';
import { addLogEntry } from '../domain/log-stream.js';
import { logStraddleCall } from '../domain/logs.js';
import { toExpressError } from '../domain/errors.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * GET /api/paykeys/:id
 * Get paykey details with institution, balance, ownership
 */
router.get('/:id', (req: Request, res: Response) => {
  void (async () => {
    try {
      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'GET',
        path: `/paykeys/${req.params.id}`,
        requestId: req.requestId,
      });

      const startTime = Date.now();
      const paykey = await straddleClient.paykeys.get(req.params.id);
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: paykey.data,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `paykeys/${req.params.id}`,
        'GET',
        200,
        duration,
        undefined,
        paykey.data
      );

      // Debug: Log the actual paykey response
      logger.debug('Straddle paykey response (get)', {
        paykeyId: paykey.data.id,
        status: paykey.data.status,
      });

      // Map to demo paykey format (Straddle wraps response in .data)
      const paykeyData = paykey.data as unknown as Record<string, unknown>; // SDK types don't expose all fields

      // Type guard for nested objects
      const balanceData = paykeyData.balance as Record<string, unknown> | undefined;
      const bankData = paykeyData.bank_data as Record<string, unknown> | undefined;

      const demoPaykey: DemoPaykey = {
        id: paykeyData.id as string,
        paykey: (paykeyData.paykey as string) || '', // The actual token to use in charges
        customer_id: paykeyData.customer_id as string,
        status: paykeyData.status as string,
        label: paykeyData.label as string | undefined, // Use API-provided label
        institution_name: (paykeyData.institution_name as string | undefined) || 'Unknown Bank',
        source: paykeyData.source as string | undefined,
        balance: balanceData
          ? {
              status: balanceData.status as string,
              account_balance: (balanceData.account_balance as number) || 0, // Balance in CENTS from Straddle API
              updated_at: balanceData.updated_at as string,
            }
          : undefined,
        bank_data: bankData
          ? {
              account_number: bankData.account_number as string,
              account_type: bankData.account_type as string,
              routing_number: bankData.routing_number as string,
            }
          : undefined,
        created_at: (paykeyData.created_at as string) || new Date().toISOString(),
        updated_at: paykeyData.updated_at as string | undefined,
        ownership_verified: (paykeyData.ownership_verified as boolean) || false,
      };

      res.json(demoPaykey);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error getting paykey', err);
      res.status(err.status || 500).json({
        error: err.message || 'Failed to get paykey',
      });
    }
  })();
});

/**
 * POST /api/paykeys/:id/cancel
 * Cancel a paykey
 */
router.post('/:id/cancel', (req: Request, res: Response) => {
  void (async () => {
    try {
      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'POST',
        path: `/paykeys/${req.params.id}/cancel`,
        requestId: req.requestId,
      });

      const startTime = Date.now();
      const paykey = await straddleClient.paykeys.cancel(req.params.id);
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: paykey.data,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `paykeys/${req.params.id}/cancel`,
        'POST',
        200,
        duration,
        undefined,
        paykey.data
      );

      // Straddle wraps response in .data
      res.json(paykey.data);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error cancelling paykey', err);
      res.status(err.status || 500).json({
        error: err.message || 'Failed to cancel paykey',
      });
    }
  })();
});

/**
 * GET /api/paykeys/:id/review
 * Get paykey review details including verification_details
 */
router.get('/:id/review', (req: Request, res: Response) => {
  void (async () => {
    try {
      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'GET',
        path: `/paykeys/${req.params.id}/review`,
        requestId: req.requestId,
      });

      const startTime = Date.now();
      const review = await straddleClient.paykeys.review.get(req.params.id);
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: review.data,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `paykeys/${req.params.id}/review`,
        'GET',
        200,
        duration,
        undefined,
        review.data
      );

      // Debug: Log the full review response to verify structure
      const reviewData = review.data as unknown as Record<string, unknown>;
      logger.debug('Straddle paykey review response', {
        paykeyId: req.params.id,
        status: reviewData.status,
      });

      // Straddle wraps response in .data
      res.json(review.data);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error getting paykey review', err);
      res.status(err.status || 500).json({
        error: err.message || 'Failed to get paykey review',
      });
    }
  })();
});

/**
 * PATCH /api/paykeys/:id/review
 * Update paykey review decision (approve/reject)
 */
router.patch('/:id/review', (req: Request, res: Response) => {
  void (async () => {
    try {
      const { decision } = req.body as { decision?: string };

      if (!decision || !['approved', 'rejected'].includes(decision)) {
        res.status(400).json({
          error: 'Decision must be either "approved" or "rejected"',
        });
        return;
      }

      // Map frontend decision to SDK status
      const status = decision === 'approved' ? 'active' : 'rejected';

      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'PATCH',
        path: `/paykeys/${req.params.id}/review`,
        requestBody: { status },
        requestId: req.requestId,
      });

      const startTime = Date.now();
      const review = await straddleClient.paykeys.review.decision(req.params.id, {
        status,
      });
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: review.data,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `paykeys/${req.params.id}/review`,
        'PATCH',
        200,
        duration,
        { status },
        review.data
      );

      // Debug: Log the review update response
      const reviewUpdateData = review.data as unknown as Record<string, unknown>;
      logger.debug('Straddle paykey review update response', {
        paykeyId: req.params.id,
        status: reviewUpdateData.status,
      });

      // Straddle wraps response in .data
      res.json(review.data);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error updating paykey review', err);
      res.status(err.status || 500).json({
        error: err.message || 'Failed to update paykey review',
      });
    }
  })();
});

export default router;
