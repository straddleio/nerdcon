import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock dependencies BEFORE importing modules that use them
jest.mock('../../sdk.js', () => ({
  default: {
    paykeys: {
      get: jest.fn(),
      cancel: jest.fn(),
      review: {
        get: jest.fn(),
        decision: jest.fn(),
      },
    },
  },
}));

jest.mock('../../domain/log-stream.js', () => ({
  addLogEntry: jest.fn(),
}));

jest.mock('../../domain/logs.js', () => ({
  logStraddleCall: jest.fn(),
}));

jest.mock('../../lib/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Import AFTER mocks are set up
import paykeyRouter from '../paykeys.js';
import straddleClient from '../../sdk.js';

describe('Paykey Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.requestId = 'test-request-id';
      req.correlationId = 'test-correlation-id';
      next();
    });
    app.use('/api/paykeys', paykeyRouter);
    jest.clearAllMocks();
  });

  describe('GET /api/paykeys/:id', () => {
    it('should retrieve a paykey by id', async () => {
      const mockPaykeyResponse = {
        data: {
          id: 'paykey_123',
          paykey: 'token_abc123',
          customer_id: 'cust_123',
          status: 'active',
          label: 'Chase Checking ****1234',
          institution_name: 'Chase Bank',
          source: 'plaid',
          balance: {
            status: 'active',
            account_balance: 100000,
            updated_at: '2025-11-16T10:00:00Z',
          },
          bank_data: {
            account_number: '****1234',
            account_type: 'checking',
            routing_number: '021000021',
          },
          created_at: '2025-11-16T09:00:00Z',
          updated_at: '2025-11-16T10:00:00Z',
          ownership_verified: true,
        },
      };

      jest.spyOn(straddleClient.paykeys, 'get').mockResolvedValue(mockPaykeyResponse as any);

      const response = await request(app).get('/api/paykeys/paykey_123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'paykey_123');
      expect(response.body).toHaveProperty('paykey', 'token_abc123');
      expect(response.body).toHaveProperty('status', 'active');
      expect(response.body).toHaveProperty('institution_name', 'Chase Bank');
      expect(response.body.balance).toHaveProperty('account_balance', 100000);
      expect(straddleClient.paykeys.get).toHaveBeenCalledWith('paykey_123');
    });

    it('should handle paykey without balance data', async () => {
      const mockPaykeyResponse = {
        data: {
          id: 'paykey_456',
          paykey: 'token_def456',
          customer_id: 'cust_456',
          status: 'active',
          label: 'Manual Bank Account',
          institution_name: 'Unknown Bank',
          source: 'manual',
          created_at: '2025-11-16T09:00:00Z',
          ownership_verified: false,
        },
      };

      jest.spyOn(straddleClient.paykeys, 'get').mockResolvedValue(mockPaykeyResponse as any);

      const response = await request(app).get('/api/paykeys/paykey_456');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'paykey_456');
      expect(response.body.balance).toBeUndefined();
      expect(response.body.bank_data).toBeUndefined();
    });

    it('should handle paykey not found errors', async () => {
      const mockError = {
        error: {
          type: 'invalid_request',
          code: 'PAYKEY_NOT_FOUND',
          message: 'Paykey not found',
        },
        status: 404,
      };

      jest.spyOn(straddleClient.paykeys, 'get').mockRejectedValue(mockError as any);

      const response = await request(app).get('/api/paykeys/paykey_nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/paykeys/:id/cancel', () => {
    it('should cancel a paykey', async () => {
      const mockCancelResponse = {
        data: {
          id: 'paykey_123',
          paykey: 'token_abc123',
          customer_id: 'cust_123',
          status: 'cancelled',
          institution_name: 'Chase Bank',
          source: 'plaid',
          created_at: '2025-11-16T09:00:00Z',
          updated_at: '2025-11-16T11:00:00Z',
          ownership_verified: true,
        },
      };

      jest.spyOn(straddleClient.paykeys, 'cancel').mockResolvedValue(mockCancelResponse as any);

      const response = await request(app).post('/api/paykeys/paykey_123/cancel');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'cancelled');
      expect(straddleClient.paykeys.cancel).toHaveBeenCalledWith('paykey_123');
    });

    it('should handle cancel errors', async () => {
      const mockError = {
        error: {
          type: 'invalid_request',
          code: 'PAYKEY_ALREADY_CANCELLED',
          message: 'Paykey already cancelled',
        },
        status: 400,
      };

      jest.spyOn(straddleClient.paykeys, 'cancel').mockRejectedValue(mockError as any);

      const response = await request(app).post('/api/paykeys/paykey_123/cancel');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/paykeys/:id/review', () => {
    it('should retrieve paykey review details', async () => {
      const mockReviewResponse = {
        data: {
          id: 'paykey_123',
          review_status: 'pending',
          verification_details: {
            breakdown: {
              account_validation: {
                codes: ['R01'],
                decision: 'review',
                reason: 'Account validation required',
              },
              name_match: {
                correlation_score: 0.85,
                customer_name: 'John Doe',
                matched_name: 'J. Doe',
              },
            },
          },
        },
      };

      jest.spyOn(straddleClient.paykeys.review, 'get').mockResolvedValue(mockReviewResponse as any);

      const response = await request(app).get('/api/paykeys/paykey_123/review');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('review_status', 'pending');
      expect(response.body.verification_details).toBeDefined();
      expect(straddleClient.paykeys.review.get).toHaveBeenCalledWith('paykey_123');
    });

    it('should handle review not found errors', async () => {
      const mockError = {
        error: {
          type: 'invalid_request',
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found for this paykey',
        },
        status: 404,
      };

      jest.spyOn(straddleClient.paykeys.review, 'get').mockRejectedValue(mockError as any);

      const response = await request(app).get('/api/paykeys/paykey_123/review');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/paykeys/:id/review', () => {
    it('should approve a paykey under review', async () => {
      const mockUpdateResponse = {
        data: {
          id: 'paykey_123',
          review_status: 'approved',
          status: 'active',
          decision: 'approve',
        },
      };

      jest
        .spyOn(straddleClient.paykeys.review, 'decision')
        .mockResolvedValue(mockUpdateResponse as any);

      const response = await request(app).patch('/api/paykeys/paykey_123/review').send({
        decision: 'approved',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('review_status', 'approved');
      expect(response.body).toHaveProperty('status', 'active');
      expect(straddleClient.paykeys.review.decision).toHaveBeenCalledWith('paykey_123', {
        status: 'active',
      });
    });

    it('should reject a paykey under review', async () => {
      const mockUpdateResponse = {
        data: {
          id: 'paykey_123',
          review_status: 'rejected',
          status: 'rejected',
          decision: 'reject',
        },
      };

      jest
        .spyOn(straddleClient.paykeys.review, 'decision')
        .mockResolvedValue(mockUpdateResponse as any);

      const response = await request(app).patch('/api/paykeys/paykey_123/review').send({
        decision: 'rejected',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('review_status', 'rejected');
      expect(straddleClient.paykeys.review.decision).toHaveBeenCalledWith('paykey_123', {
        status: 'rejected',
      });
    });

    it('should handle missing decision field', async () => {
      const response = await request(app).patch('/api/paykeys/paykey_123/review').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Decision must be either');
    });

    it('should handle invalid decision values', async () => {
      const response = await request(app).patch('/api/paykeys/paykey_123/review').send({
        decision: 'invalid',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Decision must be either');
    });
  });
});
