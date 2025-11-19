import { Router, Request, Response } from 'express';
import straddleClient from '../sdk.js';
import { stateManager } from '../domain/state.js';
import { DemoPaykey, PaykeyReview, SANDBOX_OUTCOMES, PaykeyOutcome } from '../domain/types.js';
import { addLogEntry, parseStraddleError } from '../domain/log-stream.js';
import { logStraddleCall } from '../domain/logs.js';
import { config } from '../config.js';
import { toExpressError } from '../domain/errors.js';
import { logger } from '../lib/logger.js';

const router = Router();

// Type guard for request body with string fields
interface BankAccountRequestBody {
  customer_id: unknown;
  account_number?: unknown;
  routing_number?: unknown;
  account_type?: unknown;
  outcome?: unknown;
}

interface PlaidRequestBody {
  customer_id: unknown;
  plaid_token?: unknown;
  outcome?: unknown;
}

// Type guard to check if value is a string
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Type guard to check if value is a valid object
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * POST /api/bridge/bank-account
 * Link bank account directly (routing + account number)
 */
router.post('/bank-account', (req: Request, res: Response): void => {
  const body = req.body as BankAccountRequestBody;

  // Validate required fields
  if (!isString(body.customer_id)) {
    res.status(400).json({ error: 'customer_id is required' });
    return;
  }

  const customer_id = body.customer_id;
  const account_number = isString(body.account_number) ? body.account_number : undefined;
  const routing_number = isString(body.routing_number) ? body.routing_number : undefined;
  const account_type = isString(body.account_type) ? body.account_type : undefined;
  const outcome = isString(body.outcome) ? body.outcome : undefined;

  // Validate outcome if provided
  if (outcome && !SANDBOX_OUTCOMES.paykey.includes(outcome as PaykeyOutcome)) {
    res.status(400).json({
      error: `Invalid outcome. Must be one of: ${SANDBOX_OUTCOMES.paykey.join(', ')}`,
    });
    return;
  }

  // Default test data
  const linkData: {
    customer_id: string;
    account_number: string;
    routing_number: string;
    account_type: string;
    config?: { sandbox_outcome: PaykeyOutcome };
  } = {
    customer_id,
    account_number: account_number || '123456789',
    routing_number: routing_number || '021000021', // Chase Bank routing
    account_type: account_type || 'checking',
  };

  if (outcome) {
    linkData.config = {
      sandbox_outcome: outcome as PaykeyOutcome,
    };
  }

  // Log outbound Straddle request to stream
  addLogEntry({
    timestamp: new Date().toISOString(),
    type: 'straddle-req',
    method: 'POST',
    path: '/bridge/link/bank-account',
    requestBody: linkData,
    requestId: req.requestId,
  });

  // Use async IIFE to handle promises properly
  void (async (): Promise<void> => {
    try {
      // Link bank account via Straddle SDK
      const startTime = Date.now();
      const paykey = await straddleClient.bridge.link.bankAccount({
        ...linkData,
        account_type: linkData.account_type as 'checking' | 'savings',
      });
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
      logger.debug('Straddle paykey response (bank_account)', {
        paykeyId: paykey.data.id,
        status: paykey.data.status,
      });

      // Fetch review data to get verification details
      let reviewData: PaykeyReview | undefined;
      try {
        logger.debug('Fetching review data internally for paykey', {
          paykeyId: paykey.data.id,
        });

        // Log outbound Straddle request to stream
        addLogEntry({
          timestamp: new Date().toISOString(),
          type: 'straddle-req',
          method: 'GET',
          path: `/paykeys/${paykey.data.id}/review`,
          requestId: req.requestId,
        });

        const reviewStartTime = Date.now();
        const review = await straddleClient.paykeys.review.get(paykey.data.id);
        const reviewDuration = Date.now() - reviewStartTime;

        logger.debug('Paykey review fetch completed', { duration: reviewDuration });

        // Log inbound Straddle response to stream
        addLogEntry({
          timestamp: new Date().toISOString(),
          type: 'straddle-res',
          statusCode: 200,
          responseBody: review.data,
          duration: reviewDuration,
          requestId: req.requestId,
        });

        // Log Straddle API call (Terminal API Log Panel)
        logStraddleCall(
          req.requestId,
          req.correlationId,
          `paykeys/${paykey.data.id}/review`,
          'GET',
          200,
          reviewDuration,
          undefined,
          review.data
        );

        logger.debug('Logged paykey review call to Terminal API Log');

        reviewData = review.data as unknown as PaykeyReview;
      } catch (reviewError) {
        logger.warn('Failed to fetch paykey review data', { error: reviewError });
        // Continue without review data
      }

      // Map to demo paykey format (Straddle wraps response in .data)
      // Type guard: Access SDK response fields directly
      const paykeyResponseData = paykey.data;

      // Helper to safely extract balance data
      const balanceData = isRecord(paykeyResponseData.balance)
        ? paykeyResponseData.balance
        : undefined;
      const balance = balanceData
        ? {
            status: isString(balanceData.status) ? balanceData.status : undefined,
            account_balance:
              typeof balanceData.account_balance === 'number' ? balanceData.account_balance : 0,
            updated_at: isString(balanceData.updated_at) ? balanceData.updated_at : undefined,
          }
        : undefined;

      // Helper to safely extract bank_data
      const bankDataRaw = isRecord(paykeyResponseData.bank_data)
        ? paykeyResponseData.bank_data
        : undefined;
      const bank_data = bankDataRaw
        ? {
            account_number: isString(bankDataRaw.account_number)
              ? bankDataRaw.account_number
              : undefined,
            account_type: isString(bankDataRaw.account_type) ? bankDataRaw.account_type : undefined,
            routing_number: isString(bankDataRaw.routing_number)
              ? bankDataRaw.routing_number
              : undefined,
          }
        : undefined;

      const demoPaykey: DemoPaykey = {
        id: paykeyResponseData.id,
        paykey: paykeyResponseData.paykey,
        customer_id: paykeyResponseData.customer_id || '',
        status: paykeyResponseData.status,
        label: paykeyResponseData.label,
        institution_name: paykeyResponseData.institution_name || 'Unknown Bank',
        source: paykeyResponseData.source || 'bank_account',
        balance,
        bank_data,
        created_at: paykeyResponseData.created_at,
        updated_at: paykeyResponseData.updated_at,
        review: reviewData,
      };

      // Update demo state
      stateManager.setPaykey(demoPaykey);

      res.status(201).json(demoPaykey);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error linking bank account', err);

      const statusCode = err.status || 500;

      // Parse and log Straddle error response if available
      const errorResponseBody = parseStraddleError(error);

      // Log error response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode,
        responseBody: errorResponseBody || { error: err.message },
        requestId: req.requestId,
      });

      const errorResponse = {
        error: err.message || 'Failed to link bank account',
        details: errorResponseBody || null,
      };

      // Log outbound response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'response',
        statusCode,
        responseBody: errorResponse,
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
        linkData,
        errorResponseBody || errorResponse
      );

      res.status(statusCode).json(errorResponse);
    }
  })();
});

/**
 * POST /api/bridge/plaid
 * Link account via Plaid processor token
 */
router.post('/plaid', (req: Request, res: Response): void => {
  const body = req.body as PlaidRequestBody;

  // Validate required fields
  if (!isString(body.customer_id)) {
    res.status(400).json({
      error: 'customer_id is required',
    });
    return;
  }

  const customer_id = body.customer_id;
  const plaid_token = isString(body.plaid_token) ? body.plaid_token : undefined;
  const outcome = isString(body.outcome) ? body.outcome : undefined;

  // Use provided token or fall back to configured token
  const tokenToUse = plaid_token || config.plaid.processorToken;

  if (!tokenToUse) {
    res.status(400).json({
      error:
        'plaid_token must be provided in request or PLAID_PROCESSOR_TOKEN must be set in environment',
    });
    return;
  }

  // Validate outcome if provided
  if (outcome && !SANDBOX_OUTCOMES.paykey.includes(outcome as PaykeyOutcome)) {
    res.status(400).json({
      error: `Invalid outcome. Must be one of: ${SANDBOX_OUTCOMES.paykey.join(', ')}`,
    });
    return;
  }

  const linkData: {
    customer_id: string;
    plaid_token: string;
    config?: { sandbox_outcome: PaykeyOutcome };
  } = {
    customer_id,
    plaid_token: tokenToUse,
  };

  if (outcome) {
    linkData.config = {
      sandbox_outcome: outcome as PaykeyOutcome,
    };
  }

  // Log outbound Straddle request to stream
  addLogEntry({
    timestamp: new Date().toISOString(),
    type: 'straddle-req',
    method: 'POST',
    path: '/bridge/link/plaid',
    requestBody: linkData,
    requestId: req.requestId,
  });

  // Use async IIFE to handle promises properly
  void (async (): Promise<void> => {
    try {
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
      logger.debug('Straddle paykey response (plaid)', {
        paykeyId: paykey.data.id,
        status: paykey.data.status,
      });

      // Fetch review data to get verification details
      let reviewData: PaykeyReview | undefined;
      try {
        logger.debug('Fetching review data internally for paykey', {
          paykeyId: paykey.data.id,
        });

        // Log outbound Straddle request to stream
        addLogEntry({
          timestamp: new Date().toISOString(),
          type: 'straddle-req',
          method: 'GET',
          path: `/paykeys/${paykey.data.id}/review`,
          requestId: req.requestId,
        });

        const reviewStartTime = Date.now();
        const review = await straddleClient.paykeys.review.get(paykey.data.id);
        const reviewDuration = Date.now() - reviewStartTime;

        logger.debug('Paykey review fetch completed', { duration: reviewDuration });

        // Log inbound Straddle response to stream
        addLogEntry({
          timestamp: new Date().toISOString(),
          type: 'straddle-res',
          statusCode: 200,
          responseBody: review.data,
          duration: reviewDuration,
          requestId: req.requestId,
        });

        // Log Straddle API call (Terminal API Log Panel)
        logStraddleCall(
          req.requestId,
          req.correlationId,
          `paykeys/${paykey.data.id}/review`,
          'GET',
          200,
          reviewDuration,
          undefined,
          review.data
        );

        logger.debug('Logged paykey review call to Terminal API Log');

        reviewData = review.data as unknown as PaykeyReview;
      } catch (reviewError) {
        logger.warn('Failed to fetch paykey review data', { error: reviewError });
        // Continue without review data
      }

      // Map to demo paykey format (Straddle wraps response in .data)
      // Type guard: Access SDK response fields directly
      const paykeyResponseData = paykey.data;

      // Helper to safely extract balance data
      const balanceData = isRecord(paykeyResponseData.balance)
        ? paykeyResponseData.balance
        : undefined;
      const balance = balanceData
        ? {
            status: isString(balanceData.status) ? balanceData.status : undefined,
            account_balance:
              typeof balanceData.account_balance === 'number' ? balanceData.account_balance : 0,
            updated_at: isString(balanceData.updated_at) ? balanceData.updated_at : undefined,
          }
        : undefined;

      // Helper to safely extract bank_data
      const bankDataRaw = isRecord(paykeyResponseData.bank_data)
        ? paykeyResponseData.bank_data
        : undefined;
      const bank_data = bankDataRaw
        ? {
            account_number: isString(bankDataRaw.account_number)
              ? bankDataRaw.account_number
              : undefined,
            account_type: isString(bankDataRaw.account_type) ? bankDataRaw.account_type : undefined,
            routing_number: isString(bankDataRaw.routing_number)
              ? bankDataRaw.routing_number
              : undefined,
          }
        : undefined;

      const demoPaykey: DemoPaykey = {
        id: paykeyResponseData.id,
        paykey: paykeyResponseData.paykey,
        customer_id: paykeyResponseData.customer_id || '',
        status: paykeyResponseData.status,
        label: paykeyResponseData.label,
        institution_name: paykeyResponseData.institution_name || 'Unknown Bank',
        source: paykeyResponseData.source || 'plaid',
        balance,
        bank_data,
        created_at: paykeyResponseData.created_at,
        updated_at: paykeyResponseData.updated_at,
        review: reviewData,
      };

      // Update demo state
      stateManager.setPaykey(demoPaykey);

      res.status(201).json(demoPaykey);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error linking via Plaid', err);

      const statusCode = err.status || 500;

      // Parse and log Straddle error response if available
      const errorResponseBody = parseStraddleError(error);

      // Log error response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode,
        responseBody: errorResponseBody || { error: err.message },
        requestId: req.requestId,
      });

      const errorResponse = {
        error: err.message || 'Failed to link via Plaid',
        details: errorResponseBody || null,
      };

      // Log outbound response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'response',
        statusCode,
        responseBody: errorResponse,
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
        linkData,
        errorResponseBody || errorResponse
      );

      res.status(statusCode).json(errorResponse);
    }
  })();
});

/**
 * POST /api/bridge/initialize
 * Generate a Bridge session token
 */
router.post('/initialize', (req: Request, res: Response): void => {
  const body = req.body as { customer_id: unknown };

  if (!isString(body.customer_id)) {
    res.status(400).json({ error: 'customer_id is required' });
    return;
  }

  const customer_id = body.customer_id;

  // Log outbound Straddle request to stream
  addLogEntry({
    timestamp: new Date().toISOString(),
    type: 'straddle-req',
    method: 'POST',
    path: '/bridge/initialize',
    requestBody: { customer_id },
    requestId: req.requestId,
  });

  void (async (): Promise<void> => {
    try {
      const startTime = Date.now();

      // Build URL based on environment (sandbox vs production)
      const baseUrl =
        config.straddle.environment === 'sandbox'
          ? 'https://api.sandbox.straddle.com'
          : 'https://api.straddle.com';
      const url = `${baseUrl}/v1/bridge/initialize`;

      // Use direct fetch since SDK might not have this endpoint yet
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.straddle.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer_id }),
      });

      const duration = Date.now() - startTime;
      const responseData = (await response.json()) as { message?: string; data?: unknown };

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: response.status,
        responseBody: responseData,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        'bridge/initialize',
        'POST',
        response.status,
        duration,
        { customer_id },
        responseData
      );

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to generate bridge token');
      }

      res.status(200).json(responseData);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error generating bridge token', err);

      const statusCode = err.status || 500;

      // Log error response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'response',
        statusCode,
        responseBody: { error: err.message },
        requestId: req.requestId,
      });

      res.status(statusCode).json({ error: err.message });
    }
  })();
});

export default router;
