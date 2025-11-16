import { Router, Request, Response } from 'express';
import straddleClient from '../sdk.js';
import { DemoPaykey } from '../domain/types.js';
import { addLogEntry } from '../domain/log-stream.js';
import { logStraddleCall } from '../domain/logs.js';

const router = Router();

/**
 * GET /api/paykeys/:id
 * Get paykey details with institution, balance, ownership
 */
router.get('/:id', async (req: Request, res: Response) => {
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
    console.log('Straddle paykey response (get):', JSON.stringify(paykey, null, 2));

    // Map to demo paykey format (Straddle wraps response in .data)
    const paykeyData = paykey.data as any; // SDK types don't expose all fields
    const demoPaykey: DemoPaykey = {
      id: paykeyData.id,
      paykey: paykeyData.paykey || '', // The actual token to use in charges
      customer_id: paykeyData.customer_id,
      status: paykeyData.status,
      label: paykeyData.label, // Use API-provided label
      institution_name: paykeyData.institution_name || 'Unknown Bank',
      source: paykeyData.source,
      balance: paykeyData.balance ? {
        status: paykeyData.balance.status,
        account_balance: paykeyData.balance.account_balance || 0, // Balance in CENTS from Straddle API
        updated_at: paykeyData.balance.updated_at,
      } : undefined,
      bank_data: paykeyData.bank_data ? {
        account_number: paykeyData.bank_data.account_number,
        account_type: paykeyData.bank_data.account_type,
        routing_number: paykeyData.bank_data.routing_number,
      } : undefined,
      created_at: paykeyData.created_at || new Date().toISOString(),
      updated_at: paykeyData.updated_at,
      ownership_verified: paykeyData.ownership_verified || false,
    };

    res.json(demoPaykey);
  } catch (error: any) {
    console.error('Error getting paykey:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to get paykey',
    });
  }
});

/**
 * POST /api/paykeys/:id/cancel
 * Cancel a paykey
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error('Error cancelling paykey:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to cancel paykey',
    });
  }
});

export default router;
