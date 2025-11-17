import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Terminal } from '../Terminal';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDemoStore } from '../../lib/state';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Terminal - CommandMenu Integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDemoStore.getState().reset();
    vi.clearAllMocks();
  });

  describe('Menu Toggle Button', () => {
    it('should render MENU button', () => {
      render(<Terminal />);

      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveTextContent('MENU');
    });

    it('should have correct initial ARIA attributes', () => {
      render(<Terminal />);

      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should show up arrow when menu is closed', () => {
      render(<Terminal />);

      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });
      expect(menuButton).toHaveTextContent('▲');
    });

    it('should show down arrow when menu is open', () => {
      render(<Terminal />);

      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });
      fireEvent.click(menuButton);

      expect(menuButton).toHaveTextContent('▼');
    });
  });

  describe('Menu State Management', () => {
    it('should open menu when MENU button is clicked', () => {
      render(<Terminal />);

      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });
      fireEvent.click(menuButton);

      // Menu should be visible
      expect(screen.getByText('COMMAND MENU')).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should close menu when MENU button is clicked again', async () => {
      render(<Terminal />);

      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });

      // Open menu
      fireEvent.click(menuButton);
      expect(screen.getByText('COMMAND MENU')).toBeInTheDocument();

      // Close menu
      fireEvent.click(menuButton);

      // Wait for animation to complete
      await waitFor(() => {
        expect(screen.queryByText('COMMAND MENU')).not.toBeInTheDocument();
      });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should close menu when a command is selected', async () => {
      render(<Terminal />);

      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });

      // Open menu
      fireEvent.click(menuButton);
      expect(screen.getByText('COMMAND MENU')).toBeInTheDocument();

      // Click a command (DEMO is simplest - no prerequisites)
      const demoButton = screen.getByText('DEMO');
      fireEvent.click(demoButton);

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByText('COMMAND MENU')).not.toBeInTheDocument();
      });
    });
  });

  describe('Command Selection from Menu', () => {
    it('should open CustomerCard when Create Customer is clicked', async () => {
      render(<Terminal />);

      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });
      fireEvent.click(menuButton);

      const createCustomerBtn = screen.getByText('Create Customer');
      fireEvent.click(createCustomerBtn);

      // CustomerCard should be visible - look for Phone label which is in the form
      await waitFor(() => {
        expect(screen.getByText('Phone')).toBeInTheDocument();
      });
    });

    it('should open CustomerCard in KYC mode when Customer KYC is clicked', async () => {
      render(<Terminal />);

      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });
      fireEvent.click(menuButton);

      const kycBtn = screen.getByText('Customer KYC');
      fireEvent.click(kycBtn);

      // CustomerCard should be visible - look for Address label which is in the form
      await waitFor(() => {
        expect(screen.getByText('Address')).toBeInTheDocument();
      });
    });

    it('should open DemoCard when DEMO is clicked', async () => {
      render(<Terminal />);

      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });
      fireEvent.click(menuButton);

      const demoBtn = screen.getByText('DEMO');
      fireEvent.click(demoBtn);

      // DemoCard should be visible - look for the "AUTO ATTACK" text
      await waitFor(() => {
        expect(screen.getByText('AUTO')).toBeInTheDocument();
        expect(screen.getByText('ATTACK')).toBeInTheDocument();
      });
    });

    it('should open ResetCard when RESET is clicked', async () => {
      render(<Terminal />);

      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });
      fireEvent.click(menuButton);

      const resetBtn = screen.getByText('RESET');
      fireEvent.click(resetBtn);

      // ResetCard should be visible - look for the WARNING text
      await waitFor(() => {
        expect(screen.getByText('WARNING')).toBeInTheDocument();
        expect(screen.getByText('This will clear all demo data:')).toBeInTheDocument();
      });
    });
  });

  describe('Menu and Card Interaction', () => {
    it('should clear selectedCommand when card is closed', async () => {
      render(<Terminal />);

      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });
      fireEvent.click(menuButton);

      // Open DEMO card
      const demoBtn = screen.getByText('DEMO');
      fireEvent.click(demoBtn);

      // Menu should be closed and card should be visible
      await waitFor(() => {
        expect(screen.queryByText('COMMAND MENU')).not.toBeInTheDocument();
        expect(screen.getByText('AUTO')).toBeInTheDocument();
      });

      // Close the card by clicking the X button
      const closeButtons = screen.getAllByRole('button');
      const closeBtn = closeButtons.find((btn) =>
        btn.getAttribute('aria-label')?.includes('Close')
      );

      if (closeBtn) {
        fireEvent.click(closeBtn);

        // Card should no longer be visible
        await waitFor(() => {
          expect(screen.queryByText('AUTO')).not.toBeInTheDocument();
        });
      }
    });

    it('should be able to reopen menu after selecting a command', async () => {
      render(<Terminal />);

      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });

      // Open menu
      fireEvent.click(menuButton);
      expect(screen.getByText('COMMAND MENU')).toBeInTheDocument();

      // Select a command
      const demoBtn = screen.getByText('DEMO');
      fireEvent.click(demoBtn);

      // Wait for menu to close
      await waitFor(() => {
        expect(screen.queryByText('COMMAND MENU')).not.toBeInTheDocument();
      });

      // Should be able to open menu again
      fireEvent.click(menuButton);
      expect(screen.getByText('COMMAND MENU')).toBeInTheDocument();
    });
  });

  describe('Menu Visibility During Execution', () => {
    it('should allow opening menu while not executing', () => {
      render(<Terminal />);

      // Menu button should be enabled
      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });
      expect(menuButton).not.toBeDisabled();

      // Should be able to open menu
      fireEvent.click(menuButton);
      expect(screen.getByText('COMMAND MENU')).toBeInTheDocument();
    });

    it('should keep menu button enabled during execution', () => {
      render(<Terminal />);

      // Trigger execution by submitting a command
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '/help' } });
      fireEvent.submit(input);

      // Menu button should still be enabled (allows user to open menu during execution)
      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });
      expect(menuButton).not.toBeDisabled();
    });
  });

  describe('Output Area Sizing', () => {
    it('should adjust output area height when menu opens', async () => {
      render(<Terminal />);

      // Get the output area
      const outputArea = document.querySelector('.overflow-y-auto');
      expect(outputArea).toBeInTheDocument();

      // Initial maxHeight should be 100%
      expect(outputArea).toHaveStyle({ maxHeight: '100%' });

      // Open menu
      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });
      fireEvent.click(menuButton);

      // After menu opens, maxHeight should be reduced
      await waitFor(() => {
        expect(outputArea).toHaveStyle({ maxHeight: 'calc(100% - 16rem)' });
      });
    });

    it('should restore output area height when menu closes', async () => {
      render(<Terminal />);

      const outputArea = document.querySelector('.overflow-y-auto');
      const menuButton = screen.getByRole('button', { name: /toggle command menu/i });

      // Open menu
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(outputArea).toHaveStyle({ maxHeight: 'calc(100% - 16rem)' });
      });

      // Close menu
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(outputArea).toHaveStyle({ maxHeight: '100%' });
      });
    });
  });
});
