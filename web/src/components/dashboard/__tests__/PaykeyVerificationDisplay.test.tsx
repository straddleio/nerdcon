import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NameMatchDisplay, AccountValidationDisplay } from '../PaykeyVerificationDisplay';

describe('NameMatchDisplay', () => {
  const mockNameMatch = {
    decision: 'accept',
    correlation_score: 0.95,
    customer_name: 'John Smith',
    matched_name: 'John A Smith',
    names_on_account: ['John A Smith', 'Jane Smith'],
    codes: ['I001'],
    reason: null,
  };

  it('should display correlation score with correct bucket', () => {
    const { getByText } = render(
      <NameMatchDisplay
        nameMatch={mockNameMatch}
        customerName="John Smith"
        isExpanded={true}
        showInfoMode={false}
      />
    );

    expect(getByText('Name Match')).toBeInTheDocument();
    expect(getByText('• HIGH')).toBeInTheDocument();
    expect(getByText('Correlation Score')).toBeInTheDocument();
    expect(getByText('0.950')).toBeInTheDocument();
  });

  it('should display customer and matched names', () => {
    const { getByText } = render(
      <NameMatchDisplay
        nameMatch={mockNameMatch}
        customerName="John Smith"
        isExpanded={true}
        showInfoMode={false}
      />
    );

    expect(getByText('Customer:')).toBeInTheDocument();
    expect(getByText('John Smith')).toBeInTheDocument();
    expect(getByText('Matched:')).toBeInTheDocument();
    expect(getByText('John A Smith')).toBeInTheDocument();
  });

  it('should display decision as PASS/REVIEW/FAIL', () => {
    const { getByText } = render(
      <NameMatchDisplay
        nameMatch={mockNameMatch}
        customerName="John Smith"
        isExpanded={true}
        showInfoMode={false}
      />
    );

    expect(getByText('Name Match')).toBeInTheDocument();
    expect(getByText('PASS')).toBeInTheDocument();
  });

  it('should show all names on account in INFO mode', () => {
    const { getByText } = render(
      <NameMatchDisplay
        nameMatch={mockNameMatch}
        customerName="John Smith"
        isExpanded={true}
        showInfoMode={true}
      />
    );

    expect(getByText('Names on Account')).toBeInTheDocument();
    expect(getByText('John A Smith')).toBeInTheDocument();
    expect(getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should handle null correlation score', () => {
    const mockWithNull = {
      ...mockNameMatch,
      correlation_score: null,
    };

    const { getByText } = render(
      <NameMatchDisplay
        nameMatch={mockWithNull}
        customerName="John Smith"
        isExpanded={true}
        showInfoMode={false}
      />
    );

    expect(getByText('• UNKNOWN')).toBeInTheDocument();
  });

  it('should show "Not found" when matched name is missing', () => {
    const mockWithoutMatch = {
      ...mockNameMatch,
      matched_name: null,
    };

    const { getByText } = render(
      <NameMatchDisplay
        nameMatch={mockWithoutMatch}
        customerName="John Smith"
        isExpanded={true}
        showInfoMode={false}
      />
    );

    expect(getByText('Not found')).toBeInTheDocument();
  });

  it('should fallback to customerName prop when customer_name is missing', () => {
    const mockWithoutCustomerName = {
      ...mockNameMatch,
      customer_name: null,
    };

    const { getByText } = render(
      <NameMatchDisplay
        nameMatch={mockWithoutCustomerName}
        customerName="Fallback Name"
        isExpanded={true}
        showInfoMode={false}
      />
    );

    expect(getByText('Fallback Name')).toBeInTheDocument();
  });

  it('should show "No additional names available" when names_on_account is empty in INFO mode', () => {
    const mockWithoutNames = {
      ...mockNameMatch,
      names_on_account: [],
    };

    const { getByText } = render(
      <NameMatchDisplay
        nameMatch={mockWithoutNames}
        customerName="John Smith"
        isExpanded={true}
        showInfoMode={true}
      />
    );

    expect(getByText('No additional names available')).toBeInTheDocument();
  });
});

describe('AccountValidationDisplay', () => {
  const mockAccountVal = {
    decision: 'review',
    reason: 'Account requires manual review',
    codes: ['BR001', 'BR002', 'BI001'],
  };

  const mockMessages = {
    BR001: 'High risk indicator',
    BR002: 'Velocity check failed',
    BI001: 'Additional verification available',
  };

  it('should display validation decision and reason', () => {
    const { getByText } = render(
      <AccountValidationDisplay
        accountValidation={mockAccountVal}
        messages={mockMessages}
        isExpanded={true}
        showInfoMode={false}
      />
    );

    expect(getByText('Account Validation')).toBeInTheDocument();
    expect(getByText('REVIEW')).toBeInTheDocument();
    expect(getByText('Reason')).toBeInTheDocument();
    expect(getByText('Account requires manual review')).toBeInTheDocument();
  });

  it('should display BR-codes in default mode', () => {
    const { getByText, queryByText } = render(
      <AccountValidationDisplay
        accountValidation={mockAccountVal}
        messages={mockMessages}
        isExpanded={true}
        showInfoMode={false}
      />
    );

    expect(getByText('BR001')).toBeInTheDocument();
    expect(getByText('High risk indicator')).toBeInTheDocument();
    expect(getByText('BR002')).toBeInTheDocument();
    expect(getByText('Velocity check failed')).toBeInTheDocument();

    // Should not show BI-codes in default mode
    expect(queryByText('BI001')).not.toBeInTheDocument();
  });

  it('should display BI-codes in INFO mode', () => {
    const { getByText, queryByText } = render(
      <AccountValidationDisplay
        accountValidation={mockAccountVal}
        messages={mockMessages}
        isExpanded={true}
        showInfoMode={true}
      />
    );

    expect(getByText('Insights')).toBeInTheDocument();
    expect(getByText('BI001')).toBeInTheDocument();
    expect(getByText('Additional verification available')).toBeInTheDocument();

    // Should not show BR-codes in INFO mode
    expect(queryByText('BR001')).not.toBeInTheDocument();
    expect(queryByText('BR002')).not.toBeInTheDocument();
  });

  it('should handle decision without reason', () => {
    const mockWithoutReason = {
      decision: 'accept',
      codes: [],
    };

    const { getByText, queryByText } = render(
      <AccountValidationDisplay
        accountValidation={mockWithoutReason}
        messages={{}}
        isExpanded={true}
        showInfoMode={false}
      />
    );

    expect(getByText('Account Validation')).toBeInTheDocument();
    expect(getByText('PASS')).toBeInTheDocument();
    expect(queryByText('Reason')).not.toBeInTheDocument();
  });

  it('should show "No risk signals" when no BR-codes exist', () => {
    const mockNoRCodes = {
      decision: 'accept',
      codes: ['BI001'],
    };

    const { getByText } = render(
      <AccountValidationDisplay
        accountValidation={mockNoRCodes}
        messages={{}}
        isExpanded={true}
        showInfoMode={false}
      />
    );

    expect(getByText('No risk signals')).toBeInTheDocument();
  });

  it('should show "No insights" when no BI-codes exist in INFO mode', () => {
    const mockNoICodes = {
      decision: 'review',
      codes: ['BR001'],
    };

    const { getByText } = render(
      <AccountValidationDisplay
        accountValidation={mockNoICodes}
        messages={{}}
        isExpanded={true}
        showInfoMode={true}
      />
    );

    expect(getByText('No insights')).toBeInTheDocument();
  });

  it('should use fallback text when message is not provided for code', () => {
    const mockAccountValWithUnknownCode = {
      decision: 'review',
      codes: ['BR999'],
    };

    const { getByText } = render(
      <AccountValidationDisplay
        accountValidation={mockAccountValWithUnknownCode}
        messages={{}}
        isExpanded={true}
        showInfoMode={false}
      />
    );

    expect(getByText('BR999')).toBeInTheDocument();
    expect(getByText('Risk signal detected')).toBeInTheDocument();
  });

  it('should handle reject decision with proper styling', () => {
    const mockReject = {
      decision: 'reject',
      reason: 'Account is closed',
      codes: ['BR003'],
    };

    const { getByText } = render(
      <AccountValidationDisplay
        accountValidation={mockReject}
        messages={{}}
        isExpanded={true}
        showInfoMode={false}
      />
    );

    expect(getByText('FAIL')).toBeInTheDocument();
    expect(getByText('Account is closed')).toBeInTheDocument();
  });
});
