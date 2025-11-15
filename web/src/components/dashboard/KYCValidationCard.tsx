import React, { useState } from 'react';
import type { DemoCustomer } from '../../../../server/src/domain/types';
import { NerdIcons } from '@/lib/nerd-icons';
import { cn } from '@/components/ui/utils';

interface KYCValidationCardProps {
  customer: DemoCustomer;
}

export const KYCValidationCard: React.FC<KYCValidationCardProps> = ({ customer }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const kyc = customer.review?.kyc;

  if (!kyc) {
    return null;
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'ACCEPT':
        return <span className="text-green-500 text-xl">{NerdIcons.checkmark}</span>;
      case 'REJECT':
        return <span className="text-red-500 text-xl">{NerdIcons.cross}</span>;
      case 'REVIEW':
        return <span className="text-yellow-500 text-xl">{NerdIcons.warning}</span>;
      default:
        return <span className="text-gray-500 text-xl">{NerdIcons.info}</span>;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'ACCEPT':
        return 'bg-green-50 border-green-200';
      case 'REJECT':
        return 'bg-red-50 border-red-200';
      case 'REVIEW':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
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
    <div className={cn('border rounded-lg p-4', getDecisionColor(kyc.decision))}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {getDecisionIcon(kyc.decision)}
          <div>
            <h3 className="font-semibold text-lg">KYC Validation</h3>
            <p className="text-sm text-gray-600">
              Decision: <span className="font-medium">{kyc.decision}</span>
            </p>
          </div>
        </div>
        <span className="text-gray-500">
          {isExpanded ? NerdIcons.arrowUp : NerdIcons.arrowDown}
        </span>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Validated Fields */}
          {validatedFields.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                ✅ Validated Fields ({validatedFields.length}/{validationFields.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {validatedFields.map(field => (
                  <div key={field.key} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">{NerdIcons.checkmark}</span>
                    <span>{field.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed/Missing Fields */}
          {failedFields.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                ❌ Not Validated ({failedFields.length}/{validationFields.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {failedFields.map(field => (
                  <div key={field.key} className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="text-gray-400">{NerdIcons.cross}</span>
                    <span>{field.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Codes */}
          {kyc.codes && kyc.codes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                ⚠️ Risk Codes
              </h4>
              <div className="flex flex-wrap gap-2">
                {kyc.codes.map((code, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
