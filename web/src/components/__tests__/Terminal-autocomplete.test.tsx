import { render, screen, fireEvent } from '@testing-library/react';
import { Terminal } from '../Terminal';
import { AVAILABLE_COMMANDS } from '../../lib/commands';
import { describe, it, expect } from 'vitest';

describe('Terminal autocomplete', () => {
  it('should autocomplete /create-customer and /create-charge when typing /create', () => {
    render(<Terminal />);

    const input = screen.getByRole('textbox');

    // Type /create and press Tab
    fireEvent.change(input, { target: { value: '/create' } });
    fireEvent.keyDown(input, { key: 'Tab', code: 'Tab' });

    // Should autocomplete to common prefix /create- (multiple matches: /create-customer, /create-charge, /create-paykey)
    expect(input).toHaveValue('/create-');
  });

  it('should autocomplete /customer-create and /customer-KYC when typing /customer', () => {
    render(<Terminal />);

    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '/customer' } });
    fireEvent.keyDown(input, { key: 'Tab', code: 'Tab' });

    // Should autocomplete to common prefix /customer- (multiple matches)
    expect((input as HTMLInputElement).value).toBe('/customer-');
  });

  it('should fully autocomplete when there is a single match', () => {
    render(<Terminal />);

    const input = screen.getByRole('textbox');

    // Type /outc which should uniquely match /outcomes
    fireEvent.change(input, { target: { value: '/outc' } });
    fireEvent.keyDown(input, { key: 'Tab', code: 'Tab' });

    // Should fully autocomplete to /outcomes with trailing space
    expect((input as HTMLInputElement).value).toBe('/outcomes ');
  });

  it('should include /create-customer in available commands', () => {
    // This test verifies that Task 5 added /create-customer to AVAILABLE_COMMANDS
    expect(AVAILABLE_COMMANDS).toContain('/create-customer');
  });
});
