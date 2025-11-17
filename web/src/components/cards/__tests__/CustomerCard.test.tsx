import { render, fireEvent } from '@testing-library/react';
import { CustomerCard } from '../CustomerCard';
import { describe, it, expect, vi } from 'vitest';

describe('CustomerCard - Form State Management', () => {
  it('should reset form data when modal closes and reopens', () => {
    const mockSubmit = vi.fn();
    const mockClose = vi.fn();

    // First render - modal open
    const { container, rerender } = render(
      <CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />
    );

    // Change email field - find it by type
    const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'old@example.com' } });
    expect(emailInput).toHaveValue('old@example.com');

    // Close modal
    rerender(
      <CustomerCard isOpen={false} onClose={mockClose} onSubmit={mockSubmit} mode="create" />
    );

    // Reopen modal
    rerender(
      <CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />
    );

    // Verify email was reset to default (should include timestamp)
    const newEmailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
    expect(newEmailInput.value).toMatch(/user\.\d+@example\.com/);
    expect(newEmailInput).not.toHaveValue('old@example.com');
  });

  it('should reset form when mode changes', () => {
    const mockSubmit = vi.fn();
    const mockClose = vi.fn();

    const { container, rerender } = render(
      <CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />
    );

    const emailCreate = container.querySelector('input[type="email"]') as HTMLInputElement;
    expect(emailCreate.value).toMatch(/user\.\d+@example\.com/);

    // Switch to KYC mode
    rerender(<CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="kyc" />);

    const emailKyc = container.querySelector('input[type="email"]') as HTMLInputElement;
    expect(emailKyc.value).toMatch(/jane\.doe\.\d+@example\.com/);
  });
});
