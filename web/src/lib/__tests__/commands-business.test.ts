import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCommand } from '../commands';
import * as api from '../api';
import { useDemoStore } from '../state';

vi.mock('../api');
vi.mock('../state');

describe('commands - Business Customer (/create-business)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful business creation', () => {
    it('should create business customer with standard outcome', async () => {
      const mockCustomer: api.Customer = {
        id: 'cust_business_123',
        name: 'The Bluth Company',
        email: 'tobias@bluemyself.com',
        phone: '+15558675309',
        verification_status: 'standard',
      };

      vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
      const setCustomer = vi.fn();
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer } as any);

      const result = await executeCommand('/create-business');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Business Customer created');
      expect(result.message).toContain('cust_business_123');
      expect(result.data).toEqual(mockCustomer);
      expect(setCustomer).toHaveBeenCalledWith(mockCustomer);
    });

    it('should create business customer with verified outcome', async () => {
      const mockCustomer: api.Customer = {
        id: 'cust_verified_123',
        name: 'The Bluth Company',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'verified',
      };

      vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business --outcome verified');

      expect(result.success).toBe(true);
      expect(result.message).toContain('verified');
      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'business',
          name: 'The Bluth Company',
          email: 'tobias@bluemyself.com',
          phone: '+15558675309',
          outcome: 'verified',
        })
      );
    });

    it('should create business customer with review outcome', async () => {
      const mockCustomer: api.Customer = {
        id: 'cust_review_123',
        name: 'The Bluth Company',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'review',
      };

      vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business --outcome review');

      expect(result.success).toBe(true);
      expect(result.message).toContain('review');
      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'review',
        })
      );
    });

    it('should create business customer with rejected outcome', async () => {
      const mockCustomer: api.Customer = {
        id: 'cust_rejected_123',
        name: 'The Bluth Company',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'rejected',
      };

      vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business --outcome rejected');

      expect(result.success).toBe(true);
      expect(result.message).toContain('rejected');
      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'rejected',
        })
      );
    });
  });

  describe('address selection based on outcome', () => {
    beforeEach(() => {
      vi.mocked(api.createCustomer).mockResolvedValue({
        id: 'cust_123',
        name: 'Test',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'standard',
      });
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);
    });

    it('should use verified address (I301) for verified outcome', async () => {
      await executeCommand('/create-business --outcome verified');

      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          address: expect.objectContaining({
            address1: '1234 Sandbox Street',
            address2: 'PO Box I301',
            city: 'Mock City',
            state: 'CA',
            zip: '94105',
          }),
        })
      );
    });

    it('should use review address (I304) for review outcome (default)', async () => {
      await executeCommand('/create-business --outcome review');

      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          address: expect.objectContaining({
            address2: 'PO Box I304',
          }),
        })
      );
    });

    it('should use review address (I304) for standard outcome (default)', async () => {
      await executeCommand('/create-business');

      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          address: expect.objectContaining({
            address2: 'PO Box I304',
          }),
        })
      );
    });

    it('should use rejected address (I103) for rejected outcome', async () => {
      await executeCommand('/create-business --outcome rejected');

      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          address: expect.objectContaining({
            address2: 'PO Box I103',
          }),
        })
      );
    });

    it('should maintain consistent address structure for all outcomes', async () => {
      const outcomes = ['standard', 'verified', 'review', 'rejected'];

      for (const outcome of outcomes) {
        vi.clearAllMocks();
        vi.mocked(api.createCustomer).mockResolvedValue({
          id: 'cust_123',
          name: 'Test',
          email: 'test@example.com',
          phone: '+12125550123',
          verification_status: 'standard',
        });
        vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

        await executeCommand(`/create-business --outcome ${outcome}`);

        const call = vi.mocked(api.createCustomer).mock.calls[0]?.[0];
        expect(call?.address).toEqual(
          expect.objectContaining({
            address1: '1234 Sandbox Street',
            city: 'Mock City',
            state: 'CA',
            zip: '94105',
          })
        );
      }
    });
  });

  describe('business data structure', () => {
    beforeEach(() => {
      vi.mocked(api.createCustomer).mockResolvedValue({
        id: 'cust_123',
        name: 'Test',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'standard',
      });
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);
    });

    it('should include required business customer fields', async () => {
      await executeCommand('/create-business');

      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'business',
          name: 'The Bluth Company',
          email: 'tobias@bluemyself.com',
          phone: '+15558675309',
        })
      );
    });

    it('should include compliance profile with EIN', async () => {
      await executeCommand('/create-business');

      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          compliance_profile: expect.objectContaining({
            ein: '12-3456789',
          }),
        })
      );
    });

    it('should include legal business name in compliance profile', async () => {
      await executeCommand('/create-business');

      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          compliance_profile: expect.objectContaining({
            legal_business_name: 'The Bluth Company',
          }),
        })
      );
    });

    it('should include website in compliance profile', async () => {
      await executeCommand('/create-business');

      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          compliance_profile: expect.objectContaining({
            website: 'thebananastand.com',
          }),
        })
      );
    });

    it('should format EIN with hyphen', async () => {
      await executeCommand('/create-business');

      const call = vi.mocked(api.createCustomer).mock.calls[0]?.[0];
      expect(call?.compliance_profile?.ein).toMatch(/^\d{2}-\d{7}$/);
    });

    it('should have complete compliance profile', async () => {
      await executeCommand('/create-business');

      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          compliance_profile: {
            ein: '12-3456789',
            legal_business_name: 'The Bluth Company',
            website: 'thebananastand.com',
          },
        })
      );
    });
  });

  describe('outcome flag validation', () => {
    it('should reject invalid outcome values', async () => {
      vi.mocked(api.createCustomer).mockResolvedValue({
        id: 'cust_123',
        name: 'Test',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'standard',
      });
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business --outcome invalid');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid outcome');
      expect(api.createCustomer).not.toHaveBeenCalled();
    });

    it('should reject outcome with typo', async () => {
      vi.mocked(api.createCustomer).mockResolvedValue({
        id: 'cust_123',
        name: 'Test',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'standard',
      });
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business --outcome verificed');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid outcome');
      expect(api.createCustomer).not.toHaveBeenCalled();
    });

    it('should reject outcome with uppercase', async () => {
      vi.mocked(api.createCustomer).mockResolvedValue({
        id: 'cust_123',
        name: 'Test',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'standard',
      });
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business --outcome VERIFIED');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid outcome');
      expect(api.createCustomer).not.toHaveBeenCalled();
    });

    it('should default to standard outcome when outcome flag has no value', async () => {
      vi.mocked(api.createCustomer).mockResolvedValue({
        id: 'cust_123',
        name: 'Test',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'standard',
      });
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      await executeCommand('/create-business --outcome');

      // When --outcome has no value, it defaults to 'standard'
      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'standard',
        })
      );
    });

    it('should show list of valid outcomes in error message', async () => {
      vi.mocked(api.createCustomer).mockResolvedValue({
        id: 'cust_123',
        name: 'Test',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'standard',
      });
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business --outcome invalid');

      expect(result.message).toContain('standard');
      expect(result.message).toContain('verified');
      expect(result.message).toContain('review');
      expect(result.message).toContain('rejected');
    });

    it('should accept all valid outcomes without error', async () => {
      const validOutcomes = ['standard', 'verified', 'review', 'rejected'];

      for (const outcome of validOutcomes) {
        vi.clearAllMocks();
        vi.mocked(api.createCustomer).mockResolvedValue({
          id: 'cust_123',
          name: 'Test',
          email: 'test@example.com',
          phone: '+12125550123',
          verification_status: 'standard',
        });
        vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

        const result = await executeCommand(`/create-business --outcome ${outcome}`);

        expect(result.success).toBe(true);
        expect(result.message).not.toContain('Invalid');
      }
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const errorMessage = 'API Error: Invalid customer type';
      vi.mocked(api.createCustomer).mockRejectedValue(new Error(errorMessage));
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to create business customer');
      expect(result.message).toContain(errorMessage);
    });

    it('should handle network errors', async () => {
      vi.mocked(api.createCustomer).mockRejectedValue(new Error('Network timeout'));
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to create business customer');
    });

    it('should handle unknown errors', async () => {
      vi.mocked(api.createCustomer).mockRejectedValue('Unknown error');
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to create business customer');
    });

    it('should handle null API response as error', async () => {
      vi.mocked(api.createCustomer).mockResolvedValue(null as any);
      const setCustomer = vi.fn();
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer } as any);

      const result = await executeCommand('/create-business');

      // When API returns null, accessing customer.id will throw
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to create business customer');
    });
  });

  describe('state management', () => {
    it('should call setCustomer with returned customer data', async () => {
      const mockCustomer: api.Customer = {
        id: 'cust_123',
        name: 'The Bluth Company',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'verified',
      };

      vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
      const setCustomer = vi.fn();
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer } as any);

      await executeCommand('/create-business --outcome verified');

      expect(setCustomer).toHaveBeenCalledTimes(1);
      expect(setCustomer).toHaveBeenCalledWith(mockCustomer);
    });

    it('should not call setCustomer on API failure', async () => {
      vi.mocked(api.createCustomer).mockRejectedValue(new Error('API Error'));
      const setCustomer = vi.fn();
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer } as any);

      await executeCommand('/create-business');

      expect(setCustomer).not.toHaveBeenCalled();
    });

    it('should update state with customer ID', async () => {
      const mockCustomer: api.Customer = {
        id: 'cust_verified_business_999',
        name: 'The Bluth Company',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'verified',
      };

      vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
      const setCustomer = vi.fn();
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer } as any);

      await executeCommand('/create-business');

      expect(setCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cust_verified_business_999',
        })
      );
    });

    it('should preserve full customer object in state', async () => {
      const mockCustomer: api.Customer = {
        id: 'cust_123',
        name: 'The Bluth Company',
        email: 'tobias@bluemyself.com',
        phone: '+15558675309',
        verification_status: 'verified',
        risk_score: 42,
      };

      vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
      const setCustomer = vi.fn();
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer } as any);

      await executeCommand('/create-business');

      expect(setCustomer).toHaveBeenCalledWith(mockCustomer);
    });
  });

  describe('command parsing', () => {
    it('should parse outcome flag with space separator', async () => {
      vi.mocked(api.createCustomer).mockResolvedValue({
        id: 'cust_123',
        name: 'Test',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'standard',
      });
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      await executeCommand('/create-business --outcome verified');

      expect(api.createCustomer).toHaveBeenCalled();
      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'verified',
        })
      );
    });

    it('should handle extra whitespace in command', async () => {
      vi.mocked(api.createCustomer).mockResolvedValue({
        id: 'cust_123',
        name: 'Test',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'standard',
      });
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      await executeCommand('/create-business   --outcome   verified');

      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'verified',
        })
      );
    });

    it('should handle leading/trailing whitespace', async () => {
      vi.mocked(api.createCustomer).mockResolvedValue({
        id: 'cust_123',
        name: 'Test',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'standard',
      });
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      await executeCommand('  /create-business --outcome verified  ');

      expect(api.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'verified',
        })
      );
    });

    it('should ignore additional unknown flags', async () => {
      vi.mocked(api.createCustomer).mockResolvedValue({
        id: 'cust_123',
        name: 'Test',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'standard',
      });
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      // Command should still succeed even with unknown flags
      const result = await executeCommand(
        '/create-business --outcome verified --unknown-flag value'
      );

      // The command succeeds because outcome is valid
      expect(result.success).toBe(true);
      expect(api.createCustomer).toHaveBeenCalled();
    });
  });

  describe('command response format', () => {
    it('should return success structure with data', async () => {
      const mockCustomer: api.Customer = {
        id: 'cust_123',
        name: 'The Bluth Company',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'verified',
      };

      vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
      expect(result.success).toBe(true);
    });

    it('should return error structure on failure', async () => {
      vi.mocked(api.createCustomer).mockRejectedValue(new Error('API Error'));
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result.success).toBe(false);
    });

    it('should include customer ID in success message', async () => {
      const mockCustomer: api.Customer = {
        id: 'cust_business_final_test',
        name: 'The Bluth Company',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'standard',
      };

      vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business');

      expect(result.message).toContain('cust_business_final_test');
    });

    it('should include outcome in success message', async () => {
      const mockCustomer: api.Customer = {
        id: 'cust_123',
        name: 'Test',
        email: 'test@example.com',
        phone: '+12125550123',
        verification_status: 'verified',
      };

      vi.mocked(api.createCustomer).mockResolvedValue(mockCustomer);
      vi.mocked(useDemoStore.getState).mockReturnValue({ setCustomer: vi.fn() } as any);

      const result = await executeCommand('/create-business --outcome verified');

      expect(result.message).toContain('verified');
    });
  });
});
