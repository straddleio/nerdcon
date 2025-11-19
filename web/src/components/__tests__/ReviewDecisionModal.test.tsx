import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewDecisionModal } from '../ReviewDecisionModal';
import * as animations from '@/lib/animations';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/animations');
vi.mock('@/lib/sounds');

describe('ReviewDecisionModal', () => {
  const mockOnClose = vi.fn();
  const mockOnDecision = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Customer Review', () => {
    const customerData = {
      type: 'customer' as const,
      id: 'cust_123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+12125550123',
      status: 'review',
      verificationSummary: {
        email: 'accept',
        phone: 'accept',
        fraud: 'review',
      },
    };

    it('should render customer modal', () => {
      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={customerData}
        />
      );

      expect(screen.getByText('⚔️ COMPLIANCE CHALLENGE ⚔️')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should call onDecision with verified on APPROVE click', async () => {
      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={customerData}
        />
      );

      fireEvent.click(screen.getByText('APPROVE'));

      await waitFor(() => {
        expect(mockOnDecision).toHaveBeenCalledWith('verified');
      });
    });

    it('should call onDecision with rejected on REJECT click', async () => {
      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={customerData}
        />
      );

      fireEvent.click(screen.getByText('REJECT'));

      await waitFor(() => {
        expect(mockOnDecision).toHaveBeenCalledWith('rejected');
      });
    });

    it('should trigger approve animation on APPROVE', async () => {
      const mockCleanup = vi.fn();
      vi.mocked(animations.triggerApproveAnimation).mockReturnValue(mockCleanup);

      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={customerData}
        />
      );

      fireEvent.click(screen.getByText('APPROVE'));

      await waitFor(() => {
        expect(animations.triggerApproveAnimation).toHaveBeenCalled();
      });
    });

    it('should trigger reject animation on REJECT', async () => {
      const mockCleanup = vi.fn();
      vi.mocked(animations.triggerRejectAnimation).mockReturnValue(mockCleanup);

      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={customerData}
        />
      );

      fireEvent.click(screen.getByText('REJECT'));

      await waitFor(() => {
        expect(animations.triggerRejectAnimation).toHaveBeenCalled();
      });
    });
  });

  describe('Paykey Review', () => {
    const paykeyData = {
      type: 'paykey' as const,
      id: 'paykey_123',
      customerName: 'John Doe',
      institution: 'Chase Bank',
      balance: 1000.0,
      status: 'review',
      verificationSummary: {
        nameMatch: 'accept',
        accountValidation: 'review',
      },
    };

    it('should render paykey modal', () => {
      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={paykeyData}
        />
      );

      expect(screen.getByText('⚔️ COMPLIANCE CHALLENGE ⚔️')).toBeInTheDocument();
      expect(screen.getByText('Chase Bank')).toBeInTheDocument();
      expect(screen.getByText(/\$1000\.00/)).toBeInTheDocument();
    });

    it('should call onDecision with approved on APPROVE', async () => {
      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={paykeyData}
        />
      );

      fireEvent.click(screen.getByText('APPROVE'));

      await waitFor(() => {
        expect(mockOnDecision).toHaveBeenCalledWith('approved');
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should not render when isOpen is false', () => {
      const customerData = {
        type: 'customer' as const,
        id: 'cust_123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+12125550123',
        status: 'review',
      };

      render(
        <ReviewDecisionModal
          isOpen={false}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={customerData}
        />
      );

      expect(screen.queryByText('⚔️ COMPLIANCE CHALLENGE ⚔️')).not.toBeInTheDocument();
    });

    it('should close modal on backdrop click', () => {
      const customerData = {
        type: 'customer' as const,
        id: 'cust_123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+12125550123',
        status: 'review',
      };

      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={customerData}
        />
      );

      // Click backdrop (the overlay div)
      const backdrop = screen.getByText('⚔️ COMPLIANCE CHALLENGE ⚔️').closest('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('ReviewDecisionModal - Business Customer Features', () => {
    it('should display business fields when customer has business data', () => {
      const businessData = {
        type: 'customer' as const,
        id: 'cust_123',
        name: 'The Bluth Company',
        email: 'tobias@bluemyself.com',
        phone: '+15558675309',
        status: 'review',
        legal_business_name: 'The Bluth Company',
        website: 'thebananastand.com',
        ein: '12-3456789',
      };

      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={businessData}
        />
      );

      expect(screen.getByText('BUSINESS: The Bluth Company')).toBeInTheDocument();
      expect(screen.getByText('thebananastand.com')).toBeInTheDocument();
      expect(screen.getByText('EIN: 12-3456789')).toBeInTheDocument();
    });

    it('should color-code business identity codes correctly', () => {
      const businessData = {
        type: 'customer' as const,
        id: 'cust_123',
        name: 'Test Business',
        email: 'test@example.com',
        phone: '+12125550123',
        status: 'review',
        codes: ['BI001', 'BR002', 'BV003', 'XX999'],
      };

      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={businessData}
        />
      );

      // BI = green (Insight/Verified)
      const bi001 = screen.getByText('BI001');
      expect(bi001).toHaveClass('text-green-500');

      // BR = red (Risk)
      const br002 = screen.getByText('BR002');
      expect(br002).toHaveClass('text-accent-red');

      // BV = gold (Verification/Standing)
      const bv003 = screen.getByText('BV003');
      expect(bv003).toHaveClass('text-gold');

      // Unknown prefix = neutral
      const xx999 = screen.getByText('XX999');
      expect(xx999).toHaveClass('text-neutral-400');
    });

    it('should not display business fields for individual customers', () => {
      const individualData = {
        type: 'customer' as const,
        id: 'cust_456',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+12025551234',
        status: 'review',
      };

      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={individualData}
        />
      );

      expect(screen.queryByText(/BUSINESS:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/EIN:/)).not.toBeInTheDocument();
    });

    it('should render business identity codes section when codes are present', () => {
      const businessData = {
        type: 'customer' as const,
        id: 'cust_123',
        name: 'Test Business',
        email: 'test@example.com',
        phone: '+12125550123',
        status: 'review',
        codes: ['BI001', 'BR002'],
      };

      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={businessData}
        />
      );

      expect(screen.getByText('Business Identity Codes')).toBeInTheDocument();
      expect(screen.getByText('BI001')).toBeInTheDocument();
      expect(screen.getByText('BR002')).toBeInTheDocument();
    });

    it('should not render business identity codes section when codes are empty', () => {
      const businessData = {
        type: 'customer' as const,
        id: 'cust_123',
        name: 'Test Business',
        email: 'test@example.com',
        phone: '+12125550123',
        status: 'review',
        codes: [],
      };

      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={businessData}
        />
      );

      expect(screen.queryByText('Business Identity Codes')).not.toBeInTheDocument();
    });

    it('should display multiple business identity codes with correct colors', () => {
      const businessData = {
        type: 'customer' as const,
        id: 'cust_123',
        name: 'Test Business',
        email: 'test@example.com',
        phone: '+12125550123',
        status: 'review',
        codes: ['BI001', 'BI002', 'BR001', 'BR002', 'BV001', 'BV002'],
      };

      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={businessData}
        />
      );

      // Check all BI codes are green
      expect(screen.getByText('BI001')).toHaveClass('text-green-500');
      expect(screen.getByText('BI002')).toHaveClass('text-green-500');

      // Check all BR codes are red
      expect(screen.getByText('BR001')).toHaveClass('text-accent-red');
      expect(screen.getByText('BR002')).toHaveClass('text-accent-red');

      // Check all BV codes are gold
      expect(screen.getByText('BV001')).toHaveClass('text-gold');
      expect(screen.getByText('BV002')).toHaveClass('text-gold');
    });

    it('should handle business customer with only some business fields', () => {
      const partialBusinessData = {
        type: 'customer' as const,
        id: 'cust_789',
        name: 'Partial Business',
        email: 'partial@example.com',
        phone: '+12125550999',
        status: 'review',
        legal_business_name: 'Partial Business LLC',
        // website and ein are omitted
      };

      render(
        <ReviewDecisionModal
          isOpen={true}
          onClose={mockOnClose}
          onDecision={mockOnDecision}
          data={partialBusinessData}
        />
      );

      expect(screen.getByText('BUSINESS: Partial Business LLC')).toBeInTheDocument();
      expect(screen.queryByText(/EIN:/)).not.toBeInTheDocument();
    });
  });
});
