import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChargeCard } from '../ChargeCard';

describe('ChargeCard', () => {
  const mockOnClose = () => {};
  const mockOnSubmit = () => {};

  it('should render charge form fields', () => {
    render(
      <ChargeCard
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        paykeyToken="token_abc123"
      />
    );

    expect(screen.getByText('CREATE CHARGE')).toBeInTheDocument();
    expect(screen.getByText('Paykey Token')).toBeInTheDocument();
    expect(screen.getByText('Amount (cents)')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Payment Date')).toBeInTheDocument();
    expect(screen.getByText('Consent Type')).toBeInTheDocument();
  });

  it('should populate paykey token from props', () => {
    const { container } = render(
      <ChargeCard
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        paykeyToken="token_xyz789"
      />
    );

    const paykeyInput = container.querySelector(
      'input[placeholder*="xxxxxxxx"]'
    ) as HTMLInputElement;
    expect(paykeyInput).toHaveValue('token_xyz789');
  });

  it('should show default amount value', () => {
    const { container } = render(
      <ChargeCard
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        paykeyToken="token_abc"
      />
    );

    const amountInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(amountInput).toHaveValue(5000);
  });

  it('should format amount display correctly', () => {
    render(
      <ChargeCard
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        paykeyToken="token_abc"
      />
    );

    // Default is 5000 cents = $50.00
    expect(screen.getByText(/\$50\.00/)).toBeInTheDocument();
  });

  it('should handle null paykey token gracefully', () => {
    const { container } = render(
      <ChargeCard
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        paykeyToken={undefined}
      />
    );

    const paykeyInput = container.querySelector(
      'input[placeholder*="xxxxxxxx"]'
    ) as HTMLInputElement;
    expect(paykeyInput).toHaveValue('');
  });

  it('should not render when closed', () => {
    const { container } = render(
      <ChargeCard
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        paykeyToken="token_abc"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show default description', () => {
    const { container } = render(
      <ChargeCard
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        paykeyToken="token_abc"
      />
    );

    const descriptionInput = container.querySelector(
      'input[value="Payment for services"]'
    ) as HTMLInputElement;
    expect(descriptionInput).toHaveValue('Payment for services');
  });

  it('should set payment date to today by default', () => {
    const today = new Date().toISOString().split('T')[0];
    const { container } = render(
      <ChargeCard
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        paykeyToken="token_abc"
      />
    );

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput).toHaveValue(today);
  });

  it('should show available charge outcomes', () => {
    render(
      <ChargeCard
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        paykeyToken="token_abc"
      />
    );

    // Should show outcome buttons
    expect(screen.getByText(/paid/i)).toBeInTheDocument();
    expect(screen.getByText(/standard/i)).toBeInTheDocument();
  });
});
