import React, { useEffect, useState } from 'react';
import { CommandCard } from '../CommandCard';
import { cn } from '@/components/ui/utils';

interface PaykeyCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: PaykeyFormData,
    outcome: 'standard' | 'active' | 'rejected' | 'review',
    type: 'plaid' | 'bank'
  ) => void;
  type: 'plaid' | 'bank';
  customerId?: string;
}

export interface PaykeyFormData {
  customer_id: string;
  // Plaid
  plaid_token?: string;
  // Bank
  account_number?: string;
  routing_number?: string;
  account_type?: 'checking' | 'savings';
}

export const PaykeyCard: React.FC<PaykeyCardProps> = ({
  isOpen,
  onClose,
  onSubmit,
  type,
  customerId,
}) => {
  const [formData, setFormData] = useState<PaykeyFormData>(() => ({
    customer_id: customerId || '',
    ...(type === 'plaid'
      ? { plaid_token: '' } // Empty - will use server's PLAID_PROCESSOR_TOKEN env var
      : {
          account_number: '123456789',
          routing_number: '021000021',
          account_type: 'checking',
        }),
  }));

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      customer_id: customerId || '',
    }));
  }, [customerId]);

  const handleSubmit = (outcome: 'standard' | 'active' | 'rejected' | 'review'): void => {
    const payload: PaykeyFormData = {
      ...formData,
      customer_id: formData.customer_id || customerId || '',
    };

    if (type === 'bank') {
      const { plaid_token: _unused, ...rest } = payload;
      Object.assign(payload, rest);
      delete payload.plaid_token;
    }

    onSubmit(payload, outcome, type);
    onClose();
  };

  const updateField = (field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const title = type === 'plaid' ? 'LINK PLAID ACCOUNT' : 'LINK BANK ACCOUNT';

  return (
    <CommandCard isOpen={isOpen} onClose={onClose} title={title}>
      {/* Image Placeholder */}
      <div className="flex items-center justify-center h-24 bg-white border-2 border-primary/20 rounded-pixel mb-4 overflow-hidden">
        {type === 'plaid' ? (
          <img
            src="https://img.logo.dev/chase.com?token=pk_CLM39wkpRgSIYbu6L-lzNw&format=webp&retina=true"
            alt="Chase"
            className="h-16 object-contain"
          />
        ) : (
          <img
            src="https://img.logo.dev/name/citizens%20bank?token=pk_CLM39wkpRgSIYbu6L-lzNw&format=webp&retina=true"
            alt="Citizens Bank"
            className="h-16 object-contain"
          />
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        {/* Customer ID */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Customer ID</label>
          <input
            type="text"
            value={formData.customer_id}
            onChange={(e) => updateField('customer_id', e.target.value)}
            className={cn(
              'w-full px-2 py-1 bg-background-dark border border-primary/30',
              'rounded text-neutral-200 font-body text-sm',
              'focus:border-primary focus:outline-none'
            )}
            placeholder="customer_xxx"
          />
        </div>

        {type === 'plaid' ? (
          /* Plaid Token */
          <div>
            <label className="block text-xs font-pixel text-primary mb-1">Plaid Token</label>
            <div className="relative">
              <input
                type="text"
                value={formData.plaid_token}
                onChange={(e) => updateField('plaid_token', e.target.value)}
                className={cn(
                  'w-full px-2 py-1 bg-background-dark border border-primary/30',
                  'rounded text-neutral-200 font-body text-sm pl-8',
                  'focus:border-primary focus:outline-none'
                )}
                placeholder="Leave empty to use server default"
              />
              <img
                src="https://img.logo.dev/plaid.com?token=pk_CLM39wkpRgSIYbu6L-lzNw&format=webp&retina=true"
                alt="Plaid"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4"
              />
            </div>
          </div>
        ) : (
          /* Bank Account Fields */
          <>
            <div>
              <label className="block text-xs font-pixel text-primary mb-1">Account Number</label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => updateField('account_number', e.target.value)}
                className={cn(
                  'w-full px-2 py-1 bg-background-dark border border-primary/30',
                  'rounded text-neutral-200 font-body text-sm',
                  'focus:border-primary focus:outline-none'
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-pixel text-primary mb-1">Routing Number</label>
              <input
                type="text"
                value={formData.routing_number}
                onChange={(e) => updateField('routing_number', e.target.value)}
                className={cn(
                  'w-full px-2 py-1 bg-background-dark border border-primary/30',
                  'rounded text-neutral-200 font-body text-sm',
                  'focus:border-primary focus:outline-none'
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-pixel text-primary mb-1">Account Type</label>
              <select
                value={formData.account_type}
                onChange={(e) => updateField('account_type', e.target.value)}
                className={cn(
                  'w-full px-2 py-1 bg-background-dark border border-primary/30',
                  'rounded text-neutral-200 font-body text-sm',
                  'focus:border-primary focus:outline-none'
                )}
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Sandbox Outcome Buttons */}
      <div className="mt-6 pt-4 border-t-2 border-primary/20">
        <p className="text-xs font-pixel text-secondary mb-3">SANDBOX OUTCOME</p>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleSubmit('standard')}
            className={cn(
              'px-2 py-3 rounded-pixel font-pixel text-[10px]',
              'bg-secondary/20 border-2 border-secondary text-secondary',
              'hover:bg-secondary/30 hover:shadow-[0_0_15px_rgba(0,102,255,0.5)]',
              'transition-all duration-200 uppercase'
            )}
          >
            ⚡ Standard
          </button>
          <button
            onClick={() => handleSubmit('active')}
            className={cn(
              'px-2 py-3 rounded-pixel font-pixel text-[10px]',
              'bg-accent-green/20 border-2 border-accent-green text-accent-green',
              'hover:bg-accent-green/30 hover:shadow-[0_0_15px_rgba(57,255,20,0.5)]',
              'transition-all duration-200 uppercase'
            )}
          >
            ✓ Active
          </button>
          <button
            onClick={() => handleSubmit('review')}
            className={cn(
              'px-2 py-3 rounded-pixel font-pixel text-[10px]',
              'bg-gold/20 border-2 border-gold text-gold',
              'hover:bg-gold/30 hover:shadow-[0_0_15px_rgba(255,195,0,0.5)]',
              'transition-all duration-200 uppercase'
            )}
          >
            ⚠ Review
          </button>
          <button
            onClick={() => handleSubmit('rejected')}
            className={cn(
              'px-2 py-3 rounded-pixel font-pixel text-[10px]',
              'bg-accent-red/20 border-2 border-accent-red text-accent-red',
              'hover:bg-accent-red/30 hover:shadow-[0_0_15px_rgba(255,0,64,0.5)]',
              'transition-all duration-200 uppercase'
            )}
          >
            ✗ Rejected
          </button>
        </div>
      </div>
    </CommandCard>
  );
};
