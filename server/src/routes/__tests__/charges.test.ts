import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock dependencies BEFORE importing modules that use them
jest.mock('../../sdk.js', () => ({
  default: {
    charges: {
      create: jest.fn(),
      get: jest.fn(),
      cancel: jest.fn(),
      hold: jest.fn(),
      release: jest.fn(),
    },
  },
}));

jest.mock('../../domain/state.js', () => ({
  stateManager: {
    setCharge: jest.fn(),
    getCharge: jest.fn(),
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
import chargeRouter from '../charges.js';
import straddleClient from '../../sdk.js';

describe('Charge Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.requestId = 'test-request-id';
      req.correlationId = 'test-correlation-id';
      next();
    });
    app.use('/api/charges', chargeRouter);
    jest.clearAllMocks();
  });

  describe('POST /api/charges', () => {
    it('should create a charge with valid data', async () => {
      const mockChargeResponse = {
        data: {
          id: 'charge_123',
          amount: 5000,
          currency: 'USD',
          status: 'paid',
          description: 'Test charge',
          paykey: 'token_abc123',
          external_id: 'charge_123_ext',
          payment_date: '2025-11-16',
          payment_rail: 'ach',
          consent_type: 'internet',
          created_at: '2025-11-16T10:00:00Z',
          updated_at: '2025-11-16T10:00:00Z',
        },
      };

      jest.spyOn(straddleClient.charges, 'create').mockResolvedValue(mockChargeResponse as any);

      const response = await request(app).post('/api/charges').send({
        paykey: 'token_abc123',
        amount: 5000,
        description: 'Test charge',
        outcome: 'paid',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'charge_123');
      expect(response.body).toHaveProperty('amount', 5000);
      expect(response.body).toHaveProperty('status', 'paid');
      expect(straddleClient.charges.create).toHaveBeenCalledWith(
        expect.objectContaining({
          paykey: 'token_abc123',
          amount: 5000,
          description: 'Test charge',
          config: expect.objectContaining({
            sandbox_outcome: 'paid',
          }),
        })
      );
    });

    it('should require paykey field', async () => {
      const response = await request(app).post('/api/charges').send({
        amount: 5000,
        description: 'Test charge',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('paykey is required');
    });

    it('should use default values when optional fields not provided', async () => {
      const mockChargeResponse = {
        data: {
          id: 'charge_456',
          amount: 10000,
          currency: 'USD',
          status: 'paid',
          description: 'Demo charge payment',
          paykey: 'token_def456',
          external_id: 'charge_456_ext',
          payment_date: '2025-11-16',
          payment_rail: 'ach',
          consent_type: 'internet',
          created_at: '2025-11-16T10:00:00Z',
          updated_at: '2025-11-16T10:00:00Z',
        },
      };

      jest.spyOn(straddleClient.charges, 'create').mockResolvedValue(mockChargeResponse as any);

      const response = await request(app).post('/api/charges').send({
        paykey: 'token_def456',
      });

      expect(response.status).toBe(201);
      expect(straddleClient.charges.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10000, // Default $100.00
          currency: 'USD',
          description: 'Demo charge payment',
          consent_type: 'internet',
        })
      );
    });

    it('should handle failed charge outcome', async () => {
      const mockChargeResponse = {
        data: {
          id: 'charge_789',
          amount: 5000,
          currency: 'USD',
          status: 'failed',
          description: 'Failed charge',
          paykey: 'token_ghi789',
          external_id: 'charge_789_ext',
          payment_date: '2025-11-16',
          payment_rail: 'ach',
          consent_type: 'internet',
          failure_reason: 'insufficient_funds',
          created_at: '2025-11-16T10:00:00Z',
          updated_at: '2025-11-16T10:00:00Z',
        },
      };

      jest.spyOn(straddleClient.charges, 'create').mockResolvedValue(mockChargeResponse as any);

      const response = await request(app).post('/api/charges').send({
        paykey: 'token_ghi789',
        amount: 5000,
        outcome: 'failed',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status', 'failed');
      expect(straddleClient.charges.create).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            sandbox_outcome: 'failed_insufficient_funds',
          }),
        })
      );
    });

    it('should handle different charge outcomes', async () => {
      const outcomes = [
        'paid',
        'on_hold_daily_limit',
        'cancelled_for_fraud_risk',
        'reversed_insufficient_funds',
      ];

      for (const outcome of outcomes) {
        const mockChargeResponse = {
          data: {
            id: `charge_${outcome}`,
            amount: 5000,
            currency: 'USD',
            status: outcome.includes('paid') ? 'paid' : outcome.split('_')[0],
            description: `Test ${outcome}`,
            paykey: 'token_test',
            external_id: `charge_${outcome}_ext`,
            payment_date: '2025-11-16',
            payment_rail: 'ach',
            consent_type: 'internet',
            created_at: '2025-11-16T10:00:00Z',
            updated_at: '2025-11-16T10:00:00Z',
          },
        };

        jest.spyOn(straddleClient.charges, 'create').mockResolvedValue(mockChargeResponse as any);

        const response = await request(app).post('/api/charges').send({
          paykey: 'token_test',
          amount: 5000,
          outcome,
        });

        expect(response.status).toBe(201);
        expect(straddleClient.charges.create).toHaveBeenCalledWith(
          expect.objectContaining({
            config: expect.objectContaining({
              sandbox_outcome: outcome,
            }),
          })
        );
      }
    });

    it('should include device IP address', async () => {
      const mockChargeResponse = {
        data: {
          id: 'charge_ip',
          amount: 5000,
          currency: 'USD',
          status: 'paid',
          description: 'Test charge',
          paykey: 'token_test',
          external_id: 'charge_ip_ext',
          payment_date: '2025-11-16',
          payment_rail: 'ach',
          consent_type: 'internet',
          created_at: '2025-11-16T10:00:00Z',
          updated_at: '2025-11-16T10:00:00Z',
        },
      };

      jest.spyOn(straddleClient.charges, 'create').mockResolvedValue(mockChargeResponse as any);

      const response = await request(app).post('/api/charges').send({
        paykey: 'token_test',
        amount: 5000,
      });

      expect(response.status).toBe(201);
      expect(straddleClient.charges.create).toHaveBeenCalledWith(
        expect.objectContaining({
          device: expect.objectContaining({
            ip_address: expect.any(String),
          }),
        })
      );
    });

    it('should handle Straddle API errors', async () => {
      const mockError = {
        error: {
          type: 'invalid_request',
          code: 'INVALID_PAYKEY',
          message: 'Invalid paykey token',
        },
        status: 400,
      };

      jest.spyOn(straddleClient.charges, 'create').mockRejectedValue(mockError as any);

      const response = await request(app).post('/api/charges').send({
        paykey: 'invalid_token',
        amount: 5000,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should set payment_date to today in Denver timezone', async () => {
      const mockChargeResponse = {
        data: {
          id: 'charge_date',
          amount: 5000,
          currency: 'USD',
          status: 'paid',
          description: 'Test charge',
          paykey: 'token_test',
          external_id: 'charge_date_ext',
          payment_date: '2025-11-16',
          payment_rail: 'ach',
          consent_type: 'internet',
          created_at: '2025-11-16T10:00:00Z',
          updated_at: '2025-11-16T10:00:00Z',
        },
      };

      jest.spyOn(straddleClient.charges, 'create').mockResolvedValue(mockChargeResponse as any);

      const response = await request(app).post('/api/charges').send({
        paykey: 'token_test',
        amount: 5000,
      });

      expect(response.status).toBe(201);
      expect(straddleClient.charges.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      );
    });
  });

  describe('GET /api/charges/:id', () => {
    it('should retrieve a charge by id', async () => {
      const mockChargeResponse = {
        data: {
          id: 'charge_123',
          amount: 5000,
          currency: 'USD',
          status: 'paid',
          description: 'Test charge',
          paykey: 'token_abc123',
          external_id: 'charge_123_ext',
          payment_date: '2025-11-16',
          payment_rail: 'ach',
          consent_type: 'internet',
          created_at: '2025-11-16T10:00:00Z',
          updated_at: '2025-11-16T10:00:00Z',
          status_history: [
            {
              status: 'pending',
              changed_at: '2025-11-16T10:00:00Z',
              reason: '',
              message: '',
              source: 'system',
            },
            {
              status: 'paid',
              changed_at: '2025-11-16T10:00:05Z',
              reason: '',
              message: '',
              source: 'system',
            },
          ],
        },
      };

      jest.spyOn(straddleClient.charges, 'get').mockResolvedValue(mockChargeResponse as any);

      const response = await request(app).get('/api/charges/charge_123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'charge_123');
      expect(response.body).toHaveProperty('status', 'paid');
      expect(response.body.status_history).toHaveLength(2);
      expect(straddleClient.charges.get).toHaveBeenCalledWith('charge_123');
    });

    it('should handle charge not found errors', async () => {
      const mockError = {
        error: {
          type: 'invalid_request',
          code: 'CHARGE_NOT_FOUND',
          message: 'Charge not found',
        },
        status: 404,
      };

      jest.spyOn(straddleClient.charges, 'get').mockRejectedValue(mockError as any);

      const response = await request(app).get('/api/charges/charge_nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/charges/:id/cancel', () => {
    it('should cancel a charge', async () => {
      const mockCancelResponse = {
        data: {
          id: 'charge_123',
          amount: 5000,
          currency: 'USD',
          status: 'cancelled',
          description: 'Test charge',
          paykey: 'token_abc123',
          external_id: 'charge_123_ext',
          payment_date: '2025-11-16',
          payment_rail: 'ach',
          consent_type: 'internet',
          created_at: '2025-11-16T10:00:00Z',
          updated_at: '2025-11-16T10:05:00Z',
        },
      };

      jest.spyOn(straddleClient.charges, 'cancel').mockResolvedValue(mockCancelResponse as any);

      const response = await request(app).post('/api/charges/charge_123/cancel');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'cancelled');
      expect(straddleClient.charges.cancel).toHaveBeenCalledWith('charge_123');
    });

    it('should handle cancel errors', async () => {
      const mockError = {
        error: {
          type: 'invalid_request',
          code: 'CHARGE_ALREADY_PAID',
          message: 'Cannot cancel a paid charge',
        },
        status: 400,
      };

      jest.spyOn(straddleClient.charges, 'cancel').mockRejectedValue(mockError as any);

      const response = await request(app).post('/api/charges/charge_123/cancel');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
