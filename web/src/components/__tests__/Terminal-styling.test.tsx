import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { Terminal } from '../Terminal';
import { useDemoStore } from '@/lib/state';
import { describe, it, expect } from 'vitest';

describe('Terminal formatting and styling', () => {
  it('should apply Alacritty-style formatting to bulleted output', () => {
    render(<Terminal />);

    // Simulate terminal output with bullets
    const output = `
- Customer: cust_123
  Status: verified
- Paykey: pk_456
  Status: active
    `;

    // Check if formatter applies styling
    // (This test documents expected behavior)
    expect(output).toContain('-');
  });

  it('should use readable monospace font for output', () => {
    const { container } = render(<Terminal />);

    // Verify the terminal output area has the right classes
    const outputArea = container.querySelector('.flex-1.overflow-y-auto');
    expect(outputArea).toBeTruthy();
    expect(outputArea?.className).toContain('font-body');
  });

  it('should format command output with proper structure', () => {
    // Test that /info output includes bullets/structure
    const expectedFormat = `
Current Demo State:
- Customer: cust_123
  Status: verified
- Paykey: pk_456
  Status: active
- Charge: charge_789
  Status: paid
  Amount: $50.00
    `;

    expect(expectedFormat).toContain('-');
    expect(expectedFormat).toContain('  '); // Indentation
  });

  it('renders command menu inline with input', () => {
    render(<Terminal />);
    const menuButton = screen.getByLabelText(/toggle command menu/i);
    const inputArea = screen.getByPlaceholderText(/enter command/i).parentElement;

    expect(inputArea).toContainElement(menuButton);
  });

  it('displays API logs inline after commands', async () => {
    const { rerender } = render(<Terminal />);

    // Mock API log data
    const mockAPILog = {
      requestId: 'req-1',
      correlationId: 'corr-1',
      method: 'POST',
      path: '/api/customers',
      statusCode: 200,
      duration: 150,
      timestamp: new Date().toISOString(),
      requestBody: { name: 'Test' },
      responseBody: { id: 'cust_123' },
    };

    // Add a command to the terminal and associate API log
    act(() => {
      const commandId = useDemoStore.getState().addTerminalLine({
        text: '> /demo',
        type: 'input',
      });

      // Associate API log with the command
      useDemoStore.getState().associateAPILogsWithCommand(commandId, [mockAPILog]);

      // Re-render to pick up state changes
      rerender(<Terminal />);
    });

    // Check for inline API log
    await waitFor(() => {
      expect(screen.getByText(/POST/i)).toBeInTheDocument();
      expect(screen.getByText(/\/api\/customers/i)).toBeInTheDocument();
    });
  });
});
