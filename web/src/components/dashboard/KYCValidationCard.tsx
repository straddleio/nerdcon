import React, { useState } from 'react';
import type { Customer } from '@/lib/api';
import { cn } from '@/components/ui/utils';

interface KYCValidationCardProps {
  customer: Customer;
  isExpanded?: boolean;
}

export const KYCValidationCard: React.FC<KYCValidationCardProps> = ({ customer, isExpanded: parentExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const kyc = customer.review?.kyc;

  // Use parent expansion state if provided
  const expanded = parentExpanded || isExpanded;

  if (!kyc) {
    return null;
  }

  // Normalize decision to uppercase to fix case mismatch bug
  const decision = (kyc.decision || '').toUpperCase();

  // Map decision labels to match Email/Phone pattern
  const getDecisionLabel = (decision: string) => {
    if (decision === 'ACCEPT') {return 'PASS';}
    if (decision === 'REVIEW') {return 'REVIEW';}
    return 'FAIL';
  };

  const validationFields = [
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip', label: 'ZIP Code' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'email', label: 'Email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'ssn', label: 'SSN' }
  ];

  const validatedFields = validationFields.filter(field =>
    kyc.validations?.[field.key as keyof typeof kyc.validations]
  );

  const failedFields = validationFields.filter(field =>
    !kyc.validations?.[field.key as keyof typeof kyc.validations]
  );

  return (
    <div className="border border-primary/20 rounded-pixel bg-background-dark/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-primary/5"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-body text-neutral-200">KYC</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'text-xs font-pixel',
            decision === 'ACCEPT' ? 'text-green-500' :
            decision === 'REVIEW' ? 'text-gold' : 'text-accent'
          )}>
            {getDecisionLabel(decision)}
          </span>
          <span className="text-xs text-neutral-500">
            {expanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-primary/10">
          <div className="px-3 py-2 bg-background-dark/30">
            {/* Validated Fields */}
            {validatedFields.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-500 font-body">Validated Fields</span>
                  <span className="text-xs text-green-500 font-pixel">
                    {validatedFields.length}/{validationFields.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {validatedFields.map(field => (
                    <div key={field.key} className="flex items-center gap-1.5">
                      <span className="text-green-500 text-xs">✓</span>
                      <span className="text-xs text-neutral-300 font-body">{field.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Failed/Missing Fields */}
            {failedFields.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-500 font-body">Not Validated</span>
                  <span className="text-xs text-accent font-pixel">
                    {failedFields.length}/{validationFields.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {failedFields.map(field => (
                    <div key={field.key} className="flex items-center gap-1.5">
                      <span className="text-neutral-600 text-xs">✗</span>
                      <span className="text-xs text-neutral-500 font-body">{field.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
