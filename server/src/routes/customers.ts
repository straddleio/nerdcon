import { Router, Request, Response } from 'express';
import straddleClient from '../sdk.js';
import { stateManager } from '../domain/state.js';
import { DemoCustomer, CustomerOutcome } from '../domain/types.js';

const router = Router();

/**
 * POST /api/customers
 * Create a new customer with identity verification
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, email, phone, outcome } = req.body;

    // Generate unique email if not provided
    const uniqueEmail = email || `customer.${Date.now()}@example.com`;

    // Default test data if not provided
    const customerData = {
      name: name || 'Alberta Bobbeth Charleson',
      type: type || 'individual',
      email: uniqueEmail,
      phone: phone || '+12125550123',
      device: { ip_address: req.ip || '192.168.1.1' },
      config: {
        sandbox_outcome: (outcome as CustomerOutcome) || 'verified',
      },
    };

    // Create customer via Straddle SDK
    const customer = await straddleClient.customers.create(customerData);

    // Debug: Log the actual customer response
    console.log('Straddle customer response:', JSON.stringify(customer, null, 2));

    // Map to demo customer format (Straddle wraps response in .data)
    const demoCustomer: DemoCustomer = {
      id: customer.data.id,
      name: customer.data.name,
      type: customer.data.type,
      email: customer.data.email,
      phone: customer.data.phone,
      verification_status: customer.data.status, // Note: API uses 'status' not 'verification_status'
      risk_score: (customer.data as any).risk_score || 0,  // SDK may not expose this in types
      created_at: customer.data.created_at,
    };

    // Update demo state
    stateManager.setCustomer(demoCustomer);

    res.status(201).json(demoCustomer);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to create customer',
      details: error.error || null,
    });
  }
});

/**
 * GET /api/customers/:id
 * Get customer details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await straddleClient.customers.get(req.params.id);

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
    const review = await straddleClient.customers.review.get(req.params.id);

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

    const decision = await straddleClient.customers.review.decision(req.params.id, {
      status,
    });

    // Update state with new review status
    const state = stateManager.getState();
    if (state.customer && state.customer.id === req.params.id) {
      stateManager.updateCustomer({
        review: decision.data,
      });
    }

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
 * POST /api/customers/:id/refresh-review
 * Refresh customer review status
 */
router.post('/:id/refresh-review', async (req: Request, res: Response) => {
  try {
    const customer = await straddleClient.customers.refreshReview(req.params.id);

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
