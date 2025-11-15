import { Router, Request, Response } from 'express';
import straddleClient from '../sdk.js';
import { stateManager } from '../domain/state.js';
import { DemoPaykey } from '../domain/types.js';
import { addLogEntry } from '../domain/log-stream.js';
import { logStraddleCall } from '../domain/logs.js';
import { config } from '../config.js';

const router = Router();

/**
 * POST /api/bridge/bank-account
 * Link bank account directly (routing + account number)
 */
router.post('/bank-account', async (req: Request, res: Response) => {
  try {
    const { customer_id, account_number, routing_number, account_type, outcome } = req.body;

    // Validate required fields
    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id is required' });
    }

    // Default test data
    const linkData = {
      customer_id,
      account_number: account_number || '123456789',
      routing_number: routing_number || '021000021', // Chase Bank routing
      account_type: account_type || 'checking',
      config: {
        sandbox_outcome: outcome === 'inactive' ? undefined : outcome as 'active' | 'rejected' | 'standard'
      },
    };

    // Log outbound Straddle request to stream
    addLogEntry({
      timestamp: new Date().toISOString(),
      type: 'straddle-req',
      method: 'POST',
      path: '/bridge/link/bank-account',
      requestBody: linkData,
      requestId: req.requestId,
    });

    // Link bank account via Straddle SDK
    const startTime = Date.now();
    const paykey = await straddleClient.bridge.link.bankAccount(linkData);
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
      'bridge/link/bank-account',
      'POST',
      200,
      duration,
      linkData,
      paykey.data
    );

    // Debug: Log the actual paykey response
    console.log('Straddle paykey response (bank_account):', JSON.stringify(paykey, null, 2));

    // Map to demo paykey format (Straddle wraps response in .data)
    const paykeyData = paykey.data as any; // SDK types don't expose all fields
    const demoPaykey: DemoPaykey = {
      id: paykeyData.id,
      paykey: paykeyData.paykey || '', // The actual token to use in charges
      customer_id: paykeyData.customer_id,
      status: paykeyData.status,
      institution: paykeyData.institution ? {
        name: paykeyData.institution.name || 'Unknown',
        logo: paykeyData.institution.logo
      } : undefined,
      ownership_verified: paykeyData.ownership_verified || false,
      balance: paykeyData.balance ? {
        available: paykeyData.balance.available || 0,
        currency: paykeyData.balance.currency || 'USD'
      } : undefined,
      account_type: paykeyData.account_type,
      linked_at: paykeyData.created_at || new Date().toISOString(),
    };

    // Update demo state
    stateManager.setPaykey(demoPaykey);

    return res.status(201).json(demoPaykey);
  } catch (error: any) {
    console.error('Error linking bank account:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to link bank account',
      details: error.error || null,
    });
  }
});

/**
 * POST /api/bridge/plaid
 * Link account via Plaid processor token
 */
router.post('/plaid', async (req: Request, res: Response) => {
  try {
    const { customer_id, plaid_token } = req.body;

    // Validate required fields
    if (!customer_id) {
      return res.status(400).json({
        error: 'customer_id is required',
      });
    }

    // Use provided token or fall back to configured token
    const tokenToUse = plaid_token || config.plaid.processorToken;

    if (!tokenToUse) {
      return res.status(400).json({
        error: 'plaid_token must be provided in request or PLAID_PROCESSOR_TOKEN must be set in environment',
      });
    }

    const linkData = {
      customer_id,
      plaid_token: tokenToUse,
    };

    // Log outbound Straddle request to stream
    addLogEntry({
      timestamp: new Date().toISOString(),
      type: 'straddle-req',
      method: 'POST',
      path: '/bridge/link/plaid',
      requestBody: linkData,
      requestId: req.requestId,
    });

    // Link via Plaid
    const startTime = Date.now();
    const paykey = await straddleClient.bridge.link.plaid(linkData);
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
      'bridge/link/plaid',
      'POST',
      200,
      duration,
      linkData,
      paykey.data
    );

    // Debug: Log the actual paykey response
    console.log('Straddle paykey response (plaid):', JSON.stringify(paykey, null, 2));

    // Map to demo paykey format (Straddle wraps response in .data)
    const paykeyData = paykey.data as any; // SDK types don't expose all fields
    const demoPaykey: DemoPaykey = {
      id: paykeyData.id,
      paykey: paykeyData.paykey || '', // The actual token to use in charges
      customer_id: paykeyData.customer_id,
      status: paykeyData.status,
      institution: paykeyData.institution ? {
        name: paykeyData.institution.name || 'Unknown',
        logo: paykeyData.institution.logo
      } : undefined,
      ownership_verified: paykeyData.ownership_verified || false,
      balance: paykeyData.balance ? {
        available: paykeyData.balance.available || 0,
        currency: paykeyData.balance.currency || 'USD'
      } : undefined,
      account_type: paykeyData.account_type,
      linked_at: paykeyData.created_at || new Date().toISOString(),
    };

    // Update demo state
    stateManager.setPaykey(demoPaykey);

    return res.status(201).json(demoPaykey);
  } catch (error: any) {
    console.error('Error linking via Plaid:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to link via Plaid',
      details: error.error || null,
    });
  }
});

export default router;
