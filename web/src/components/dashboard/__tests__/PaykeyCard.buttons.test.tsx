import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaykeyCard } from '../PaykeyCard';
import { useDemoStore } from '../../../lib/state';
import * as commands from '../../../lib/commands';

// Mock commands module
vi.mock('../../../lib/commands', () => ({
  executeCommand: vi.fn(),
}));

describe('PaykeyCard - UI Buttons', () => {
  beforeEach(() => {
    useDemoStore.getState().reset();
    vi.clearAllMocks();
  });

  describe('Empty State Buttons', () => {
    it('should render three link buttons when no paykey exists', () => {
      // Setup: No paykey, but customer exists
      useDemoStore.getState().setCustomer({
        id: 'cust_123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-555-5555',
        verification_status: 'verified',
      });

      render(<PaykeyCard />);

      // Verify all three buttons are present
      expect(screen.getByRole('button', { name: /Link via Bridge/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Link via Plaid/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Link Direct/i })).toBeInTheDocument();
    });

    it('should call executeCommand with /create-paykey-bridge when Bridge button clicked', async () => {
      useDemoStore.getState().setCustomer({
        id: 'cust_123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-555-5555',
        verification_status: 'verified',
      });

      render(<PaykeyCard />);

      const bridgeButton = screen.getByRole('button', { name: /Link via Bridge/i });
      fireEvent.click(bridgeButton);

      await waitFor(() => {
        expect(commands.executeCommand).toHaveBeenCalledWith('/create-paykey-bridge');
      });
    });

    it('should call executeCommand with /create-paykey plaid when Plaid button clicked', async () => {
      useDemoStore.getState().setCustomer({
        id: 'cust_123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-555-5555',
        verification_status: 'verified',
      });

      render(<PaykeyCard />);

      const plaidButton = screen.getByRole('button', { name: /Link via Plaid/i });
      fireEvent.click(plaidButton);

      await waitFor(() => {
        expect(commands.executeCommand).toHaveBeenCalledWith('/create-paykey plaid');
      });
    });

    it('should call executeCommand with /create-paykey bank when Direct button clicked', async () => {
      useDemoStore.getState().setCustomer({
        id: 'cust_123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-555-5555',
        verification_status: 'verified',
      });

      render(<PaykeyCard />);

      const directButton = screen.getByRole('button', { name: /Link Direct/i });
      fireEvent.click(directButton);

      await waitFor(() => {
        expect(commands.executeCommand).toHaveBeenCalledWith('/create-paykey bank');
      });
    });

    it('should not render buttons when no customer exists', () => {
      // No customer, no paykey
      render(<PaykeyCard />);

      expect(screen.queryByRole('button', { name: /Link via Bridge/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Link via Plaid/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Link Direct/i })).not.toBeInTheDocument();

      // Should show message to create customer first
      expect(screen.getByText(/No bank account linked/i)).toBeInTheDocument();
    });

    it('should disable buttons while command is executing', async () => {
      useDemoStore.getState().setCustomer({
        id: 'cust_123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-555-5555',
        verification_status: 'verified',
      });

      // Mock executeCommand to simulate async operation
      vi.mocked(commands.executeCommand).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ success: true, message: 'Done' }), 100);
        });
      });

      render(<PaykeyCard />);

      const bridgeButton = screen.getByRole('button', { name: /Link via Bridge/i });

      // Click button
      fireEvent.click(bridgeButton);

      // Button should be disabled during execution
      expect(bridgeButton).toBeDisabled();

      // Wait for command to complete
      await waitFor(() => {
        expect(bridgeButton).not.toBeDisabled();
      });
    });
  });

  describe('Button Interaction Feedback', () => {
    it('should show loading spinner on button during execution', async () => {
      useDemoStore.getState().setCustomer({
        id: 'cust_123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-555-5555',
        verification_status: 'verified',
      });

      // Mock executeCommand with delay
      vi.mocked(commands.executeCommand).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ success: true, message: 'Done' }), 100);
        });
      });

      render(<PaykeyCard />);

      const bridgeButton = screen.getByRole('button', { name: /Link via Bridge/i });

      fireEvent.click(bridgeButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/Linking\.\.\./i)).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/Linking\.\.\./i)).not.toBeInTheDocument();
      });
    });

    it('should handle command failure gracefully', async () => {
      useDemoStore.getState().setCustomer({
        id: 'cust_123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-555-5555',
        verification_status: 'verified',
      });

      // Mock executeCommand to fail
      vi.mocked(commands.executeCommand).mockRejectedValue(
        new Error('Bridge initialization failed')
      );

      render(<PaykeyCard />);

      const bridgeButton = screen.getByRole('button', { name: /Link via Bridge/i });

      fireEvent.click(bridgeButton);

      // Button should re-enable after error
      await waitFor(() => {
        expect(bridgeButton).not.toBeDisabled();
      });
    });
  });
});
