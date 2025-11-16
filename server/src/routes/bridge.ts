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

    // Validate outcome if provided
    if (outcome && !['active', 'inactive', 'rejected'].includes(outcome)) {
      return res.status(400).json({
        error: `Invalid outcome. Must be one of: active, inactive, rejected`
      });
    }

    // Default test data
    const linkData = {
      customer_id,
      account_number: account_number || '123456789',
      routing_number: routing_number || '021000021', // Chase Bank routing
      account_type: account_type || 'checking',
      ...(outcome && {
        config: {
          sandbox_outcome: outcome as 'active' | 'inactive' | 'rejected'
        }
      })
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
      label: paykeyData.label, // Use API-provided label
      institution_name: paykeyData.institution_name || 'Unknown Bank',
      source: paykeyData.source || 'bank_account',
      balance: paykeyData.balance ? {
        status: paykeyData.balance.status,
        account_balance: paykeyData.balance.account_balance || 0, // In dollars
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

    // Update demo state
    stateManager.setPaykey(demoPaykey);

    return res.status(201).json(demoPaykey);
  } catch (error: any) {
    console.error('Error linking bank account:', error);

    const statusCode = error.status || 500;
    const errorResponse = {
      error: error.message || 'Failed to link bank account',
      details: error.error || null,
    };

    // Log error response to stream
    addLogEntry({
      timestamp: new Date().toISOString(),
      type: 'straddle-res',
      statusCode,
      responseBody: error.error || errorResponse,
      requestId: req.requestId,
    });

    // Log failed Straddle API call (Terminal API Log Panel)
    logStraddleCall(
      req.requestId,
      req.correlationId,
      'bridge/link/bank-account',
      'POST',
      statusCode,
      0, // duration unknown on error
      req.body,
      error.error || errorResponse
    );

    return res.status(statusCode).json(errorResponse);
  }
});

/**
 * POST /api/bridge/plaid
 * Link account via Plaid processor token
 */
router.post('/plaid', async (req: Request, res: Response) => {
  try {
    const { customer_id, plaid_token, outcome } = req.body;

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

    // Validate outcome if provided
    if (outcome && !['active', 'inactive', 'rejected'].includes(outcome)) {
      return res.status(400).json({
        error: `Invalid outcome. Must be one of: active, inactive, rejected`
      });
    }

    const linkData = {
      customer_id,
      plaid_token: tokenToUse,
      ...(outcome && {
        config: {
          sandbox_outcome: outcome as 'active' | 'inactive' | 'rejected'
        }
      })
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
      label: paykeyData.label, // Use API-provided label
      institution_name: paykeyData.institution_name || 'Unknown Bank',
      source: paykeyData.source || 'plaid',
      balance: paykeyData.balance ? {
        status: paykeyData.balance.status,
        account_balance: paykeyData.balance.account_balance || 0, // In dollars
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

    // Update demo state
    stateManager.setPaykey(demoPaykey);

    return res.status(201).json(demoPaykey);
  } catch (error: any) {
    console.error('Error linking via Plaid:', error);

    const statusCode = error.status || 500;
    const errorResponse = {
      error: error.message || 'Failed to link via Plaid',
      details: error.error || null,
    };

    // Log error response to stream
    addLogEntry({
      timestamp: new Date().toISOString(),
      type: 'straddle-res',
      statusCode,
      responseBody: error.error || errorResponse,
      requestId: req.requestId,
    });

    // Log failed Straddle API call (Terminal API Log Panel)
    logStraddleCall(
      req.requestId,
      req.correlationId,
      'bridge/link/plaid',
      'POST',
      statusCode,
      0, // duration unknown on error
      req.body,
      error.error || errorResponse
    );

    return res.status(statusCode).json(errorResponse);
  }
});

export default router;
