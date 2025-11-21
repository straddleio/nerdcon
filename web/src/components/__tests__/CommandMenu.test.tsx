import { render, screen, fireEvent } from '@testing-library/react';
import { CommandMenu } from '../CommandMenu';
import { describe, it, expect, vi } from 'vitest';

describe('CommandMenu', () => {
  describe('Visibility and Animation', () => {
    it('should not render when isOpen is false', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={false} />);

      // Menu should not be in the document when closed
      const menu = screen.queryByText('COMMAND MENU');
      expect(menu).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      // Menu should be visible when open
      expect(screen.getByText('COMMAND MENU')).toBeInTheDocument();
    });

    it('should have correct ID attribute', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const panel = document.getElementById('command-menu-panel');
      expect(panel).toBeInTheDocument();
    });
  });

  describe('Command Categories', () => {
    it('should render all customer commands', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Create Customer')).toBeInTheDocument();
      expect(screen.getByText('Create Customer (KYC)')).toBeInTheDocument();
      expect(screen.getByText('Create Business')).toBeInTheDocument();
    });

    it('should render all paykey commands', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      expect(screen.getByText('Paykeys')).toBeInTheDocument();
      expect(screen.getByText('Straddle')).toBeInTheDocument();
      expect(screen.getByText('Plaid')).toBeInTheDocument();
      expect(screen.getByText('Quiltt')).toBeInTheDocument();
      expect(screen.getByText('Bank Account')).toBeInTheDocument();
    });

    it('should render all payment commands', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      expect(screen.getByText('Payments')).toBeInTheDocument();
      expect(screen.getByText('Charge')).toBeInTheDocument();
      expect(screen.getByText('Payout')).toBeInTheDocument();
    });

    it('should render all utility commands', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      expect(screen.getByText('DEMO')).toBeInTheDocument();
      expect(screen.getByText('RESET')).toBeInTheDocument();
    });

    it('should not render hidden commands (state, outcomes, review, decision)', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      expect(screen.queryByText('Show State')).not.toBeInTheDocument();
      expect(screen.queryByText('Show Outcomes')).not.toBeInTheDocument();
      expect(screen.queryByText('Review Details')).not.toBeInTheDocument();
      expect(screen.queryByText('Approve/Reject')).not.toBeInTheDocument();
    });
  });

  describe('Command Selection', () => {
    it('should call onCommandSelect when Create Customer is clicked (menu stays open)', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const createCustomerBtn = screen.getByText('Create Customer');
      fireEvent.click(createCustomerBtn);

      expect(mockSelect).toHaveBeenCalledWith('customer-create');
      // Menu stays open - no auto-close
    });

    it('should call onCommandSelect when Customer KYC is clicked (menu stays open)', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const kycBtn = screen.getByText('Create Customer (KYC)');
      fireEvent.click(kycBtn);

      expect(mockSelect).toHaveBeenCalledWith('customer-kyc');
      // Menu stays open - no auto-close
    });

    it('should call onCommandSelect when Plaid is clicked (menu stays open)', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const plaidBtn = screen.getByText('Plaid');
      fireEvent.click(plaidBtn);

      expect(mockSelect).toHaveBeenCalledWith('paykey-plaid');
      // Menu stays open - no auto-close
    });

    it('should call onCommandSelect when Bank Account is clicked (menu stays open)', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const bankBtn = screen.getByText('Bank Account');
      fireEvent.click(bankBtn);

      expect(mockSelect).toHaveBeenCalledWith('paykey-bank');
      // Menu stays open - no auto-close
    });

    it('should call onCommandSelect when Charge is clicked (menu stays open)', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const chargeBtn = screen.getByText('Charge');
      fireEvent.click(chargeBtn);

      expect(mockSelect).toHaveBeenCalledWith('charge');
      // Menu stays open - no auto-close
    });

    it('should call onCommandSelect when DEMO is clicked (menu stays open)', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const demoBtn = screen.getByText('DEMO');
      fireEvent.click(demoBtn);

      expect(mockSelect).toHaveBeenCalledWith('demo');
      // Menu stays open - no auto-close
    });

    it('should call onCommandSelect when RESET is clicked (menu stays open)', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const resetBtn = screen.getByText('RESET');
      fireEvent.click(resetBtn);

      expect(mockSelect).toHaveBeenCalledWith('reset');
      // Menu stays open - no auto-close
    });
  });

  describe('Button States', () => {
    it('should have Payout button disabled', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const payoutBtn = screen.getByText('Payout');
      expect(payoutBtn).toBeDisabled();
    });

    it('should not call handlers when clicking disabled Payout button', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const payoutBtn = screen.getByText('Payout');
      fireEvent.click(payoutBtn);

      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('should have Quiltt button disabled', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const quilttBtn = screen.getByText('Quiltt');
      expect(quilttBtn).toBeDisabled();
    });
  });

  describe('Button Variants', () => {
    it('should apply correct variant classes to secondary buttons', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const createCustomerBtn = screen.getByText('Create Customer');
      expect(createCustomerBtn).toHaveClass('border-secondary/70', 'bg-background-card', 'text-primary');
    });

    it('should apply correct variant classes to utility buttons', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const demoBtn = screen.getByText('DEMO');
      expect(demoBtn).toHaveClass('border-gold/70', 'bg-background-card', 'text-primary');
    });
  });

  describe('End Demo button', () => {
    it('should have End Demo button', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const endButton = screen.getByText('END');
      expect(endButton).toBeInTheDocument();
    });

    it('should call onCommandSelect with "end" when End Demo clicked', () => {
      const mockSelect = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} />);

      const endButton = screen.getByText('END');
      fireEvent.click(endButton);

      expect(mockSelect).toHaveBeenCalledWith('end');
    });
  });
});
