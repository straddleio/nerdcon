import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaykeyCard } from '../PaykeyCard';

describe('PaykeyCard', () => {
  const mockOnClose = () => {};
  const mockOnSubmit = () => {};

  it('should render bank account form fields', () => {
    render(
      <PaykeyCard
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        type="bank"
        customerId="cust_123"
      />
    );

    expect(screen.getByText('LINK BANK ACCOUNT')).toBeInTheDocument();
    expect(screen.getByText('Customer ID')).toBeInTheDocument();
    expect(screen.getByText('Account Number')).toBeInTheDocument();
    expect(screen.getByText('Routing Number')).toBeInTheDocument();
    expect(screen.getByText('Account Type')).toBeInTheDocument();
  });

  it('should render plaid form fields', () => {
    render(
      <PaykeyCard
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        type="plaid"
        customerId="cust_123"
      />
    );

    expect(screen.getByText('LINK PLAID ACCOUNT')).toBeInTheDocument();
    expect(screen.getByText('Customer ID')).toBeInTheDocument();
    expect(screen.getByText('Plaid Token')).toBeInTheDocument();
  });

  it('should populate customer ID from props', () => {
    const { container } = render(
      <PaykeyCard
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        type="bank"
        customerId="cust_456"
      />
    );

    const customerIdInput = container.querySelector(
      'input[placeholder="customer_xxx"]'
    ) as HTMLInputElement;
    expect(customerIdInput).toHaveValue('cust_456');
  });

  it('should handle null customer ID gracefully', () => {
    const { container } = render(
      <PaykeyCard
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        type="bank"
        customerId={undefined}
      />
    );

    const customerIdInput = container.querySelector(
      'input[placeholder="customer_xxx"]'
    ) as HTMLInputElement;
    expect(customerIdInput).toHaveValue('');
  });

  it('should not render when closed', () => {
    const { container } = render(
      <PaykeyCard
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        type="bank"
        customerId="cust_123"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show default bank account values', () => {
    render(
      <PaykeyCard
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        type="bank"
        customerId="cust_123"
      />
    );

    // Verify default values are present
    const accountNumberInput = screen.getByDisplayValue('123456789');
    const routingNumberInput = screen.getByDisplayValue('021000021');

    expect(accountNumberInput).toBeInTheDocument();
    expect(routingNumberInput).toBeInTheDocument();
  });
});
