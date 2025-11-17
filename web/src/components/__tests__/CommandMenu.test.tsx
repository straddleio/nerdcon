import { render, screen, fireEvent } from '@testing-library/react';
import { CommandMenu } from '../CommandMenu';
import { describe, it, expect, vi } from 'vitest';

describe('CommandMenu', () => {
  describe('Visibility and Animation', () => {
    it('should not render when isOpen is false', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={false} onClose={mockClose} />);

      // Menu should not be in the document when closed
      const menu = screen.queryByText('COMMAND MENU');
      expect(menu).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      // Menu should be visible when open
      expect(screen.getByText('COMMAND MENU')).toBeInTheDocument();
    });

    it('should have correct ID attribute', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      const panel = document.getElementById('command-menu-panel');
      expect(panel).toBeInTheDocument();
    });
  });

  describe('Command Categories', () => {
    it('should render all customer commands', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Create Customer')).toBeInTheDocument();
      expect(screen.getByText('Customer KYC')).toBeInTheDocument();
    });

    it('should render all paykey commands', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      expect(screen.getByText('Paykeys')).toBeInTheDocument();
      expect(screen.getByText('Plaid Link')).toBeInTheDocument();
      expect(screen.getByText('Bank Account')).toBeInTheDocument();
    });

    it('should render all payment commands', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      expect(screen.getByText('Payments')).toBeInTheDocument();
      expect(screen.getByText('Charge')).toBeInTheDocument();
      expect(screen.getByText('Payout')).toBeInTheDocument();
    });

    it('should render all utility commands', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      expect(screen.getByText('DEMO')).toBeInTheDocument();
      expect(screen.getByText('RESET')).toBeInTheDocument();
    });
  });

  describe('Command Selection', () => {
    it('should call onCommandSelect and onClose when Create Customer is clicked', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      const createCustomerBtn = screen.getByText('Create Customer');
      fireEvent.click(createCustomerBtn);

      expect(mockSelect).toHaveBeenCalledWith('customer-create');
      expect(mockClose).toHaveBeenCalled();
    });

    it('should call onCommandSelect and onClose when Customer KYC is clicked', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      const kycBtn = screen.getByText('Customer KYC');
      fireEvent.click(kycBtn);

      expect(mockSelect).toHaveBeenCalledWith('customer-kyc');
      expect(mockClose).toHaveBeenCalled();
    });

    it('should call onCommandSelect and onClose when Plaid Link is clicked', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      const plaidBtn = screen.getByText('Plaid Link');
      fireEvent.click(plaidBtn);

      expect(mockSelect).toHaveBeenCalledWith('paykey-plaid');
      expect(mockClose).toHaveBeenCalled();
    });

    it('should call onCommandSelect and onClose when Bank Account is clicked', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      const bankBtn = screen.getByText('Bank Account');
      fireEvent.click(bankBtn);

      expect(mockSelect).toHaveBeenCalledWith('paykey-bank');
      expect(mockClose).toHaveBeenCalled();
    });

    it('should call onCommandSelect and onClose when Charge is clicked', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      const chargeBtn = screen.getByText('Charge');
      fireEvent.click(chargeBtn);

      expect(mockSelect).toHaveBeenCalledWith('charge');
      expect(mockClose).toHaveBeenCalled();
    });

    it('should call onCommandSelect and onClose when DEMO is clicked', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      const demoBtn = screen.getByText('DEMO');
      fireEvent.click(demoBtn);

      expect(mockSelect).toHaveBeenCalledWith('demo');
      expect(mockClose).toHaveBeenCalled();
    });

    it('should call onCommandSelect and onClose when RESET is clicked', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      const resetBtn = screen.getByText('RESET');
      fireEvent.click(resetBtn);

      expect(mockSelect).toHaveBeenCalledWith('reset');
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Button States', () => {
    it('should have Payout button disabled', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      const payoutBtn = screen.getByText('Payout');
      expect(payoutBtn).toBeDisabled();
    });

    it('should not call handlers when clicking disabled Payout button', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      const payoutBtn = screen.getByText('Payout');
      fireEvent.click(payoutBtn);

      expect(mockSelect).not.toHaveBeenCalled();
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  describe('Button Variants', () => {
    it('should apply correct variant classes to primary buttons', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      const createCustomerBtn = screen.getByText('Create Customer');
      expect(createCustomerBtn).toHaveClass('bg-primary/20', 'border-primary', 'text-primary');
    });

    it('should apply correct variant classes to utility buttons', () => {
      const mockSelect = vi.fn();
      const mockClose = vi.fn();

      render(<CommandMenu onCommandSelect={mockSelect} isOpen={true} onClose={mockClose} />);

      const demoBtn = screen.getByText('DEMO');
      expect(demoBtn).toHaveClass('bg-gold/20', 'border-gold', 'text-gold');
    });
  });
});
