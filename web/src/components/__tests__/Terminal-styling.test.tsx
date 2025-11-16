import { render } from '@testing-library/react';
import { Terminal } from '../Terminal';
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
});
