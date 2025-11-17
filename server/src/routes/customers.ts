import { Router, Request, Response } from 'express';
import straddleClient from '../sdk.js';
import { stateManager } from '../domain/state.js';
import {
  DemoCustomer,
  CustomerOutcome,
  CustomerReview,
  validateKYCCustomerRequest,
} from '../domain/types.js';
import { addLogEntry } from '../domain/log-stream.js';
import { logStraddleCall } from '../domain/logs.js';
import { toExpressError } from '../domain/errors.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * POST /api/customers
 * Create a new customer with identity verification
 */
router.post('/', (req: Request, res: Response) => {
  void (async () => {
    // Parse request body with type safety (outside try for error handler access)
    const body = req.body as Record<string, unknown>;

    try {
      const name = typeof body.name === 'string' ? body.name : undefined;
      const first_name = typeof body.first_name === 'string' ? body.first_name : undefined;
      const last_name = typeof body.last_name === 'string' ? body.last_name : undefined;
      const type = typeof body.type === 'string' ? body.type : undefined;
      const email = typeof body.email === 'string' ? body.email : undefined;
      const phone = typeof body.phone === 'string' ? body.phone : undefined;
      const outcome = typeof body.outcome === 'string' ? body.outcome : undefined;
      const address = body.address as Record<string, unknown> | undefined;
      const compliance_profile = body.compliance_profile as Record<string, unknown> | undefined;

      // Log incoming request
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'request',
        method: 'POST',
        path: '/api/customers',
        requestBody: body,
        requestId: req.requestId,
      });

      // Validate KYC customer request if compliance_profile is provided
      if (compliance_profile && address) {
        const validationResult = validateKYCCustomerRequest(body);
        if (!validationResult.isValid) {
          addLogEntry({
            timestamp: new Date().toISOString(),
            type: 'response',
            statusCode: 400,
            responseBody: {
              error: 'KYC validation failed',
              details: validationResult.errors,
            },
            requestId: req.requestId,
          });

          res.status(400).json({
            error: 'Validation failed',
            details: validationResult.errors,
          });
          return;
        }
      }

      // Generate unique email if not provided
      const uniqueEmail = email || `customer.${Date.now()}@example.com`;

      // Combine first_name and last_name if provided, otherwise use name
      const fullName =
        first_name && last_name
          ? `${first_name} ${last_name}`
          : name || 'Alberta Bobbeth Charleson';

      // Default test data if not provided
      const customerData: Record<string, unknown> = {
        name: fullName,
        type: type || 'individual',
        email: uniqueEmail,
        phone: phone || '+12125550123',
        device: { ip_address: req.ip || '192.168.1.1' },
        ...(address && { address }),
        ...(compliance_profile && { compliance_profile }),
        config: {
          sandbox_outcome: (outcome as CustomerOutcome) || 'verified',
        },
      };

      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'POST',
        path: '/customers',
        requestBody: customerData,
        requestId: req.requestId,
      });

      // Create customer via Straddle SDK
      const startTime = Date.now();
      const customer = await straddleClient.customers.create(
        customerData as unknown as Parameters<typeof straddleClient.customers.create>[0]
      );
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: customer.data,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        'customers',
        'POST',
        200,
        duration,
        customerData,
        customer.data
      );

      // Debug: Log the actual customer response
      const customerResponseData = customer.data as unknown as Record<string, unknown>;
      logger.debug('Straddle customer response', {
        customerId: customer.data.id,
        verificationStatus: customerResponseData.verification_status,
      });

      // Fetch review data to get detailed risk breakdown
      let reviewData: CustomerReview | undefined;
      try {
        logger.debug('Fetching review data internally for customer', {
          customerId: customer.data.id,
        });

        // Log outbound Straddle request to stream
        addLogEntry({
          timestamp: new Date().toISOString(),
          type: 'straddle-req',
          method: 'GET',
          path: `/customers/${customer.data.id}/review`,
          requestId: req.requestId,
        });

        const reviewStartTime = Date.now();
        const review = await straddleClient.customers.review.get(customer.data.id);
        const reviewDuration = Date.now() - reviewStartTime;

        logger.debug('Review fetch completed', { duration: reviewDuration });

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
          `customers/${customer.data.id}/review`,
          'GET',
          200,
          reviewDuration,
          undefined,
          review.data
        );

        logger.debug('Logged review call to Terminal API Log');

        const reviewResponse = review.data as unknown as Record<string, unknown>;
        const identityDetails = reviewResponse.identity_details as
          | Record<string, unknown>
          | undefined;

        if (identityDetails) {
          const breakdown = identityDetails.breakdown as Record<string, unknown> | undefined;
          reviewData = {
            review_id: identityDetails.review_id as string,
            decision: identityDetails.decision as string,
            messages: identityDetails.messages as Record<string, string> | undefined,
            breakdown: {
              email: breakdown?.email as CustomerReview['breakdown']['email'],
              phone: breakdown?.phone as CustomerReview['breakdown']['phone'],
              address: breakdown?.address as CustomerReview['breakdown']['address'],
              fraud: breakdown?.fraud as CustomerReview['breakdown']['fraud'],
              synthetic: breakdown?.synthetic as CustomerReview['breakdown']['synthetic'],
            },
            kyc: identityDetails.kyc as CustomerReview['kyc'],
            reputation: identityDetails.reputation as CustomerReview['reputation'],
            network_alerts: identityDetails.network_alerts as CustomerReview['network_alerts'],
            watch_list: identityDetails.watch_list as CustomerReview['watch_list'],
          };
        }
      } catch (reviewError) {
        logger.warn('Failed to fetch review data', { error: reviewError });
        // Continue without review data
      }

      // Map to demo customer format (Straddle wraps response in .data)
      const responseData = customer.data as unknown as Record<string, unknown>;
      const demoCustomer: DemoCustomer = {
        id: responseData.id as string,
        name: responseData.name as string,
        type: responseData.type as 'individual' | 'business',
        email: responseData.email as string | undefined,
        phone: responseData.phone as string | undefined,
        verification_status: responseData.status as string | undefined, // Note: API uses 'status' not 'verification_status'
        risk_score: (responseData.risk_score as number | undefined) || 0, // SDK may not expose this in types
        created_at: responseData.created_at as string,
        address: responseData.address as DemoCustomer['address'],
        compliance_profile: responseData.compliance_profile as DemoCustomer['compliance_profile'],
        review: reviewData,
      };

      // Update demo state
      stateManager.setCustomer(demoCustomer);

      // Log successful response
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'response',
        statusCode: 201,
        responseBody: demoCustomer,
        requestId: req.requestId,
      });

      res.status(201).json(demoCustomer);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error creating customer', err);

      const statusCode = err.status || 500;
      const errorResponse = {
        error: err.message || 'Failed to create customer',
        details: err.code || null,
      };

      // Log error response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode,
        responseBody: errorResponse,
        requestId: req.requestId,
      });

      // Log failed Straddle API call (Terminal API Log Panel)
      const errorData = error as Record<string, unknown>;
      logStraddleCall(
        req.requestId,
        req.correlationId,
        'customers',
        'POST',
        statusCode,
        0, // duration unknown on error
        body,
        errorData.error || errorResponse
      );

      res.status(statusCode).json(errorResponse);
    }
  })();
});

/**
 * GET /api/customers/:id
 * Get customer details
 */
router.get('/:id', (req: Request, res: Response) => {
  void (async () => {
    try {
      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'GET',
        path: `/customers/${req.params.id}`,
        requestId: req.requestId,
      });

      const startTime = Date.now();
      const customer = await straddleClient.customers.get(req.params.id);
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: customer.data,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `customers/${req.params.id}`,
        'GET',
        200,
        duration,
        undefined,
        customer.data
      );

      // Map to demo customer format (Straddle wraps response in .data)
      const customerData = customer.data as unknown as Record<string, unknown>;
      const demoCustomer: DemoCustomer = {
        id: customer.data.id,
        name: customer.data.name,
        type: customer.data.type,
        email: customer.data.email,
        phone: customer.data.phone,
        verification_status: customer.data.status,
        risk_score: (customerData.risk_score as number | undefined) || 0, // SDK may not expose this in types
        created_at: customer.data.created_at,
      };

      res.json(demoCustomer);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error getting customer', err);
      res.status(err.status || 500).json({
        error: err.message || 'Failed to get customer',
      });
    }
  })();
});

/**
 * GET /api/customers/:id/review
 * Get customer identity review details
 */
router.get('/:id/review', (req: Request, res: Response) => {
  void (async () => {
    try {
      logger.debug('Customer review endpoint called', {
        customerId: req.params.id,
        requestId: req.requestId,
        origin: req.headers.origin,
        referer: req.headers.referer,
        userAgent: req.headers['user-agent'],
      });

      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'GET',
        path: `/customers/${req.params.id}/review`,
        requestId: req.requestId,
      });

      const startTime = Date.now();
      const review = await straddleClient.customers.review.get(req.params.id);
      const duration = Date.now() - startTime;

      logger.debug('Review fetch completed', { duration });

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
        `customers/${req.params.id}/review`,
        'GET',
        200,
        duration,
        undefined,
        review.data
      );

      // Straddle wraps response in .data
      res.json(review.data);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error getting customer review', err);

      const statusCode = err.status || 500;
      const errorResponse = {
        error: err.message || 'Failed to get customer review',
        details: err.code || null,
      };

      // Log error response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode,
        responseBody: errorResponse,
        requestId: req.requestId,
      });

      // Log failed Straddle API call (Terminal API Log Panel)
      const errorData = error as Record<string, unknown>;
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `customers/${req.params.id}/review`,
        'GET',
        statusCode,
        0, // duration unknown on error
        undefined,
        errorData.error || errorResponse
      );

      res.status(statusCode).json(errorResponse);
    }
  })();
});

/**
 * PATCH /api/customers/:id/review
 * Make manual verification decision
 */
router.patch('/:id/review', (req: Request, res: Response) => {
  void (async () => {
    try {
      const body = req.body as Record<string, unknown>;
      const status = typeof body.status === 'string' ? body.status : undefined;

      if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
      }

      const decisionData: Record<string, unknown> = { status };

      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'PATCH',
        path: `/customers/${req.params.id}/review`,
        requestBody: decisionData,
        requestId: req.requestId,
      });

      const startTime = Date.now();
      const decision = await straddleClient.customers.review.decision(req.params.id, {
        status: status as 'verified' | 'rejected',
      });
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: decision.data,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `customers/${req.params.id}/review`,
        'PATCH',
        200,
        duration,
        decisionData,
        decision.data
      );

      // Straddle wraps response in .data
      res.json(decision.data);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error updating customer review', err);
      res.status(err.status || 500).json({
        error: err.message || 'Failed to update customer review',
      });
    }
  })();
});

/**
 * GET /api/customers/:id/unmask
 * Get unmasked customer data (SSN, DOB, etc.)
 * Calls Straddle /customers/:id/unmask endpoint
 */
router.get('/:id/unmask', (req: Request, res: Response) => {
  void (async () => {
    try {
      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'GET',
        path: `/customers/${req.params.id}/unmask`,
        requestId: req.requestId,
      });

      const startTime = Date.now();

      // Use unmask endpoint
      const unmaskResponse = await straddleClient.get(`/customers/${req.params.id}/unmask`);
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: unmaskResponse,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `customers/${req.params.id}/unmask`,
        'GET',
        200,
        duration,
        undefined,
        unmaskResponse
      );

      // SDK custom requests don't wrap in .data
      res.json(unmaskResponse);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error unmasking customer', err);

      const statusCode = err.status || 500;
      const errorResponse = {
        error: err.message || 'Failed to unmask customer',
      };

      // Log failed Straddle API call (Terminal API Log Panel)
      const errorData = error as Record<string, unknown>;
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `customers/${req.params.id}/unmask`,
        'GET',
        statusCode,
        0, // duration unknown on error
        undefined,
        errorData.error || errorResponse
      );

      res.status(statusCode).json(errorResponse);
    }
  })();
});

/**
 * POST /api/customers/:id/refresh-review
 * Refresh customer review status
 */
router.post('/:id/refresh-review', (req: Request, res: Response) => {
  void (async () => {
    try {
      // Log outbound Straddle request to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-req',
        method: 'POST',
        path: `/customers/${req.params.id}/refresh-review`,
        requestId: req.requestId,
      });

      const startTime = Date.now();
      const customer = await straddleClient.customers.review.refreshReview(req.params.id);
      const duration = Date.now() - startTime;

      // Log inbound Straddle response to stream
      addLogEntry({
        timestamp: new Date().toISOString(),
        type: 'straddle-res',
        statusCode: 200,
        responseBody: customer.data,
        duration,
        requestId: req.requestId,
      });

      // Log Straddle API call (Terminal API Log Panel)
      logStraddleCall(
        req.requestId,
        req.correlationId,
        `customers/${req.params.id}/refresh-review`,
        'POST',
        200,
        duration,
        undefined,
        customer.data
      );

      // Straddle wraps response in .data
      res.json(customer.data);
    } catch (error: unknown) {
      const err = toExpressError(error);
      logger.error('Error refreshing customer review', err);
      res.status(err.status || 500).json({
        error: err.message || 'Failed to refresh customer review',
      });
    }
  })();
});

export default router;
