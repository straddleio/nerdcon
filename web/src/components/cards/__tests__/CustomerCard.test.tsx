import { render, fireEvent, screen } from '@testing-library/react';
import { CustomerCard } from '../CustomerCard';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('CustomerCard - Business Mode', () => {
  const mockSubmit = vi.fn();
  const mockClose = vi.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
    mockClose.mockClear();
  });

  it('should display individual and business type toggle buttons', () => {
    render(<CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />);

    expect(screen.getByText('Individual')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
  });

  it('should start in individual mode by default', () => {
    render(<CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />);

    // Check that "First Name" label is visible (individual mode)
    const firstNameLabels = screen.getAllByText('First Name');
    expect(firstNameLabels.length).toBeGreaterThan(0);

    // Check that "Business Name" label is NOT visible initially
    const businessNameLabels = screen.queryAllByText('Business Name');
    expect(businessNameLabels.length).toBe(0);
  });

  it('should switch to business mode when Business button is clicked', () => {
    render(<CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />);

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    // Verify Business Name label appears
    const businessNameLabel = screen.getByText('Business Name');
    expect(businessNameLabel).toBeInTheDocument();

    // Verify individual First Name/Last Name labels are gone
    const firstNameLabels = screen.queryAllByText('First Name');
    expect(firstNameLabels.length).toBe(0);
  });

  it('should populate default business data when switching to business mode', () => {
    const { container } = render(
      <CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />
    );

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    // Check business name field has default value
    const businessNameInput = container.querySelector('input[value="The Bluth Company"]');
    expect(businessNameInput).toBeInTheDocument();

    // Check email
    expect(container.querySelector('input[value="tobias@bluemyself.com"]')).toBeInTheDocument();

    // Check phone
    expect(container.querySelector('input[value="+15558675309"]')).toBeInTheDocument();
  });

  it('should display business-specific fields when in business mode', () => {
    const { container } = render(
      <CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />
    );

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    // Check for EIN field
    expect(screen.getByText('EIN')).toBeInTheDocument();

    // Check for Website field
    expect(screen.getByText('Website')).toBeInTheDocument();

    // Verify values are populated
    expect(container.querySelector('input[value="12-3456789"]')).toBeInTheDocument();
    expect(container.querySelector('input[value="thebananastand.com"]')).toBeInTheDocument();
  });

  it('should allow updating business name field', () => {
    const { container } = render(
      <CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />
    );

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    const businessNameInput = container.querySelector(
      'input[value="The Bluth Company"]'
    ) as HTMLInputElement;
    expect(businessNameInput).toBeInTheDocument();

    fireEvent.change(businessNameInput, { target: { value: 'New Company Name' } });
    expect(businessNameInput.value).toBe('New Company Name');
  });

  it('should allow updating EIN field', () => {
    const { container } = render(
      <CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />
    );

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    const einInput = container.querySelector('input[value="12-3456789"]') as HTMLInputElement;
    fireEvent.change(einInput, { target: { value: '98-7654321' } });
    expect(einInput.value).toBe('98-7654321');
  });

  it('should allow updating website field', () => {
    const { container } = render(
      <CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />
    );

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    const websiteInput = container.querySelector(
      'input[value="thebananastand.com"]'
    ) as HTMLInputElement;
    fireEvent.change(websiteInput, { target: { value: 'newwebsite.com' } });
    expect(websiteInput.value).toBe('newwebsite.com');
  });

  it('should use correct address (I301) for verified business outcome', () => {
    render(<CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />);

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    const verifiedButton = screen.getByText(/✓ Verified/i);
    fireEvent.click(verifiedButton);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'business',
        address: expect.objectContaining({
          address1: '1234 Sandbox Street',
          address2: 'PO Box I301',
          city: 'Mock City',
          state: 'CA',
          zip: '94105',
        }),
      }),
      'verified'
    );
  });

  it('should use correct address (I304) for review business outcome', () => {
    render(<CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />);

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    const reviewButton = screen.getByText(/⚠ Review/i);
    fireEvent.click(reviewButton);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'business',
        address: expect.objectContaining({
          address1: '1234 Sandbox Street',
          address2: 'PO Box I304',
          city: 'Mock City',
          state: 'CA',
          zip: '94105',
        }),
      }),
      'review'
    );
  });

  it('should use correct address (I103) for rejected business outcome', () => {
    render(<CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />);

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    const rejectedButton = screen.getByText(/✗ Rejected/i);
    fireEvent.click(rejectedButton);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'business',
        address: expect.objectContaining({
          address1: '1234 Sandbox Street',
          address2: 'PO Box I103',
          city: 'Mock City',
          state: 'CA',
          zip: '94105',
        }),
      }),
      'rejected'
    );
  });

  it('should submit business name in first_name field', () => {
    render(<CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />);

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    const verifiedButton = screen.getByText(/✓ Verified/i);
    fireEvent.click(verifiedButton);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'The Bluth Company',
        type: 'business',
      }),
      'verified'
    );
  });

  it('should include compliance_profile with EIN and website on submission', () => {
    render(<CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />);

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    const verifiedButton = screen.getByText(/✓ Verified/i);
    fireEvent.click(verifiedButton);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        compliance_profile: expect.objectContaining({
          ein: '12-3456789',
          legal_business_name: 'The Bluth Company',
          website: 'thebananastand.com',
        }),
      }),
      'verified'
    );
  });

  it('should not show KYC fields (SSN, DOB) in business mode with create mode', () => {
    render(<CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />);

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    // KYC fields should not be visible in create mode
    expect(screen.queryByText('SSN')).not.toBeInTheDocument();
    expect(screen.queryByText('Date of Birth')).not.toBeInTheDocument();
  });

  it('should switch back to individual mode from business mode', () => {
    render(<CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />);

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    // Verify in business mode
    expect(screen.getByText('Business Name')).toBeInTheDocument();

    const individualButton = screen.getByText('Individual');
    fireEvent.click(individualButton);

    // Verify switched back to individual mode
    const firstNameLabels = screen.getAllByText('First Name');
    expect(firstNameLabels.length).toBeGreaterThan(0);
    expect(screen.getByText('Last Name')).toBeInTheDocument();
  });

  it('should close modal and call onClose after business submission', () => {
    render(<CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />);

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    const verifiedButton = screen.getByText(/✓ Verified/i);
    fireEvent.click(verifiedButton);

    expect(mockClose).toHaveBeenCalled();
  });

  it('should handle standard outcome for business customer', () => {
    render(<CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />);

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    const standardButton = screen.getByText(/⚡ Standard/i);
    fireEvent.click(standardButton);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'business',
      }),
      'standard'
    );
  });

  it('should preserve edited business fields on submission', () => {
    const { container } = render(
      <CustomerCard isOpen={true} onClose={mockClose} onSubmit={mockSubmit} mode="create" />
    );

    const businessButton = screen.getByText('Business');
    fireEvent.click(businessButton);

    // Update business name
    const businessNameInput = container.querySelector(
      'input[value="The Bluth Company"]'
    ) as HTMLInputElement;
    fireEvent.change(businessNameInput, { target: { value: 'Custom Business' } });

    // Update EIN
    const einInput = container.querySelector('input[value="12-3456789"]') as HTMLInputElement;
    fireEvent.change(einInput, { target: { value: '55-5555555' } });

    // Update website
    const websiteInput = container.querySelector(
      'input[value="thebananastand.com"]'
    ) as HTMLInputElement;
    fireEvent.change(websiteInput, { target: { value: 'custom.com' } });

    const verifiedButton = screen.getByText(/✓ Verified/i);
    fireEvent.click(verifiedButton);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Custom Business',
        compliance_profile: expect.objectContaining({
          ein: '55-5555555',
          legal_business_name: 'Custom Business',
          website: 'custom.com',
        }),
      }),
      'verified'
    );
  });
});
