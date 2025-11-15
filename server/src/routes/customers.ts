import { Router, Request, Response } from 'express';
import straddleClient from '../sdk.js';
import { stateManager } from '../domain/state.js';
import { DemoCustomer, CustomerOutcome, CustomerReview, validateKYCCustomerRequest } from '../domain/types.js';
import { addLogEntry } from '../domain/log-stream.js';
import { logStraddleCall } from '../domain/logs.js';

const router = Router();

/**
 * POST /api/customers
 * Create a new customer with identity verification
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, first_name, last_name, type, email, phone, outcome, address, compliance_profile } = req.body;

    // Log incoming request
    addLogEntry({
      timestamp: new Date().toISOString(),
      type: 'request',
      method: 'POST',
      path: '/api/customers',
      requestBody: req.body,
      requestId: req.requestId,
    });

    // Validate KYC customer request if compliance_profile is provided
    if (compliance_profile && address) {
      const validationResult = validateKYCCustomerRequest(req.body);
      if (!validationResult.isValid) {
        addLogEntry({
          timestamp: new Date().toISOString(),
          type: 'response',
          statusCode: 400,
          responseBody: {
            error: 'KYC validation failed',
            details: validationResult.errors
          },
          requestId: req.requestId,
        });

        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.errors
        });
      }
    }

    // Generate unique email if not provided
    const uniqueEmail = email || `customer.${Date.now()}@example.com`;

    // Combine first_name and last_name if provided, otherwise use name
    const fullName = first_name && last_name
      ? `${first_name} ${last_name}`
      : name || 'Alberta Bobbeth Charleson';

    // Default test data if not provided
    const customerData = {
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
    const customer = await straddleClient.customers.create(customerData);
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
    console.log('Straddle customer response:', JSON.stringify(customer, null, 2));

    // Fetch review data to get detailed risk breakdown
    let reviewData: CustomerReview | undefined;
    try {
      console.log('[POST /customers] Fetching review data internally for customer:', customer.data.id);

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

      console.log(`[POST /customers] Review fetch completed in ${reviewDuration}ms`);

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

      console.log('[POST /customers] Logged review call to Terminal API Log');

      const identityDetails = (review.data as any).identity_details;

      if (identityDetails) {
        reviewData = {
          review_id: identityDetails.review_id,
          decision: identityDetails.decision,
          messages: identityDetails.messages,
          breakdown: {
            email: identityDetails.breakdown?.email,
            phone: identityDetails.breakdown?.phone,
            address: identityDetails.breakdown?.address,
            fraud: identityDetails.breakdown?.fraud,
            synthetic: identityDetails.breakdown?.synthetic,
          },
          kyc: identityDetails.kyc,
          reputation: identityDetails.reputation,
          network_alerts: identityDetails.network_alerts,
          watch_list: identityDetails.watch_list,
        };
      }
    } catch (reviewError) {
      console.warn('Failed to fetch review data:', reviewError);
      // Continue without review data
    }

    // Map to demo customer format (Straddle wraps response in .data)
    const responseData = customer.data as any;
    const demoCustomer: DemoCustomer = {
      id: responseData.id,
      name: responseData.name,
      type: responseData.type,
      email: responseData.email,
      phone: responseData.phone,
      verification_status: responseData.status, // Note: API uses 'status' not 'verification_status'
      risk_score: responseData.risk_score || 0,  // SDK may not expose this in types
      created_at: responseData.created_at,
      address: responseData.address,
      compliance_profile: responseData.compliance_profile,
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

    return res.status(201).json(demoCustomer);
  } catch (error: any) {
    console.error('Error creating customer:', error);

    const statusCode = error.status || 500;
    const errorResponse = {
      error: error.message || 'Failed to create customer',
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
      'customers',
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
 * GET /api/customers/:id
 * Get customer details
 */
router.get('/:id', async (req: Request, res: Response) => {
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
    const demoCustomer: DemoCustomer = {
      id: customer.data.id,
      name: customer.data.name,
      type: customer.data.type,
      email: customer.data.email,
      phone: customer.data.phone,
      verification_status: customer.data.status,
      risk_score: (customer.data as any).risk_score || 0,  // SDK may not expose this in types
      created_at: customer.data.created_at,
    };

    res.json(demoCustomer);
  } catch (error: any) {
    console.error('Error getting customer:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to get customer',
    });
  }
});

/**
 * GET /api/customers/:id/review
 * Get customer identity review details
 */
router.get('/:id/review', async (req: Request, res: Response) => {
  try {
    console.log('========================================');
    console.log('[GET /customers/:id/review] ENDPOINT CALLED!');
    console.log('Customer ID:', req.params.id);
    console.log('Request ID:', req.requestId);
    console.log('Origin:', req.headers.origin);
    console.log('Referer:', req.headers.referer);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('========================================');

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

    console.log(`[GET /customers/:id/review] Review fetch completed in ${duration}ms`);

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
  } catch (error: any) {
    console.error('Error getting customer review:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to get customer review',
    });
  }
});

/**
 * PATCH /api/customers/:id/review
 * Make manual verification decision
 */
router.patch('/:id/review', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const decisionData = { status };

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
    const decision = await straddleClient.customers.review.decision(req.params.id, decisionData);
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
    return res.json(decision.data);
  } catch (error: any) {
    console.error('Error updating customer review:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to update customer review',
    });
  }
});

/**
 * GET /api/customers/:id/unmask
 * Get unmasked customer data (SSN, DOB, etc.)
 * Calls Straddle /customers/:id/unmask endpoint
 */
router.get('/:id/unmask', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error('Error unmasking customer:', error);

    const statusCode = error.status || 500;
    const errorResponse = {
      error: error.message || 'Failed to unmask customer',
    };

    // Log failed Straddle API call (Terminal API Log Panel)
    logStraddleCall(
      req.requestId,
      req.correlationId,
      `customers/${req.params.id}/unmask`,
      'GET',
      statusCode,
      0, // duration unknown on error
      undefined,
      error.error || errorResponse
    );

    res.status(statusCode).json(errorResponse);
  }
});

/**
 * POST /api/customers/:id/refresh-review
 * Refresh customer review status
 */
router.post('/:id/refresh-review', async (req: Request, res: Response) => {
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
    const customer = await straddleClient.customers.refreshReview(req.params.id);
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
  } catch (error: any) {
    console.error('Error refreshing customer review:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to refresh customer review',
    });
  }
});

export default router;
