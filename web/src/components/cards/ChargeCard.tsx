import React, { useEffect, useState } from 'react';
import { CommandCard } from '../CommandCard';
import { cn } from '@/components/ui/utils';

interface ChargeCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ChargeFormData, outcome: ChargeOutcome) => void;
  paykeyToken?: string;
}

export type ChargeOutcome =
  | 'standard'
  | 'paid'
  | 'on_hold_daily_limit'
  | 'cancelled_for_fraud_risk'
  | 'cancelled_for_balance_check'
  | 'failed_insufficient_funds'
  | 'failed_customer_dispute'
  | 'failed_closed_bank_account'
  | 'reversed_insufficient_funds'
  | 'reversed_customer_dispute'
  | 'reversed_closed_bank_account';

export interface ChargeFormData {
  paykey: string;
  amount: number;
  description: string;
  payment_date: string;
  consent_type: 'internet' | 'telephone' | 'written';
}

export const ChargeCard: React.FC<ChargeCardProps> = ({
  isOpen,
  onClose,
  onSubmit,
  paykeyToken,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<ChargeFormData>({
    paykey: paykeyToken || '',
    amount: 5000, // $50.00
    description: 'Payment for services',
    payment_date: today,
    consent_type: 'internet',
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      paykey: paykeyToken || '',
    }));
  }, [paykeyToken]);

  const handleSubmit = (outcome: ChargeOutcome): void => {
    onSubmit(formData, outcome);
    onClose();
  };

  const updateField = (field: string, value: string | number): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <CommandCard isOpen={isOpen} onClose={onClose} title="CREATE CHARGE">
      {/* Form Fields */}
      <div className="space-y-3">
        {/* Paykey */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Paykey Token</label>
          <input
            type="text"
            value={formData.paykey}
            onChange={(e) => updateField('paykey', e.target.value)}
            className={cn(
              'w-full px-2 py-1 bg-background-dark border border-primary/30',
              'rounded text-neutral-200 font-body text-sm',
              'focus:border-primary focus:outline-none'
            )}
            placeholder="xxxxxxxx.02.xxxxxxxxx..."
          />
          <p className="text-xs text-neutral-500 mt-1">From state.paykey.paykey</p>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Amount (cents)</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => updateField('amount', parseInt(e.target.value))}
            className={cn(
              'w-full px-2 py-1 bg-background-dark border border-primary/30',
              'rounded text-neutral-200 font-body text-sm',
              'focus:border-primary focus:outline-none'
            )}
          />
          <p className="text-xs text-neutral-500 mt-1">${(formData.amount / 100).toFixed(2)} USD</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            className={cn(
              'w-full px-2 py-1 bg-background-dark border border-primary/30',
              'rounded text-neutral-200 font-body text-sm',
              'focus:border-primary focus:outline-none'
            )}
          />
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Payment Date</label>
          <input
            type="date"
            value={formData.payment_date}
            onChange={(e) => updateField('payment_date', e.target.value)}
            className={cn(
              'w-full px-2 py-1 bg-background-dark border border-primary/30',
              'rounded text-neutral-200 font-body text-sm',
              'focus:border-primary focus:outline-none'
            )}
          />
        </div>

        {/* Consent Type */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Consent Type</label>
          <select
            value={formData.consent_type}
            onChange={(e) => updateField('consent_type', e.target.value)}
            className={cn(
              'w-full px-2 py-1 bg-background-dark border border-primary/30',
              'rounded text-neutral-200 font-body text-sm',
              'focus:border-primary focus:outline-none'
            )}
          >
            <option value="internet">Internet</option>
            <option value="signed">Signed</option>
          </select>
        </div>
      </div>

      {/* Sandbox Outcome Buttons */}
      <div className="mt-6 pt-4 border-t-2 border-primary/20">
        <p className="text-xs font-pixel text-secondary mb-3">SANDBOX OUTCOME</p>

        {/* Success Scenarios */}
        <div className="mb-3">
          <p className="text-[10px] font-pixel text-secondary/60 mb-2">SUCCESS</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSubmit('standard')}
              className={cn(
                'px-2 py-1.5 rounded-pixel font-pixel text-[10px]',
                'bg-secondary/20 border border-secondary text-secondary',
                'hover:bg-secondary/30 hover:shadow-[0_0_10px_rgba(0,102,255,0.3)]',
                'transition-all duration-200 uppercase'
              )}
            >
              ⚡ Standard
            </button>
            <button
              onClick={() => handleSubmit('paid')}
              className={cn(
                'px-2 py-1.5 rounded-pixel font-pixel text-[10px]',
                'bg-accent-green/20 border border-accent-green text-accent-green',
                'hover:bg-accent-green/30 hover:shadow-[0_0_10px_rgba(57,255,20,0.3)]',
                'transition-all duration-200 uppercase'
              )}
            >
              ✓ Paid
            </button>
          </div>
        </div>

        {/* Hold & Cancellation Scenarios */}
        <div className="mb-3">
          <p className="text-[10px] font-pixel text-secondary/60 mb-2">HOLD / CANCEL</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSubmit('on_hold_daily_limit')}
              className={cn(
                'px-2 py-1.5 rounded-pixel font-pixel text-[10px]',
                'bg-gold/20 border border-gold text-gold',
                'hover:bg-gold/30 hover:shadow-[0_0_10px_rgba(255,195,0,0.3)]',
                'transition-all duration-200 uppercase'
              )}
            >
              ⏸ Daily Limit
            </button>
            <button
              onClick={() => handleSubmit('cancelled_for_fraud_risk')}
              className={cn(
                'px-2 py-1.5 rounded-pixel font-pixel text-[10px]',
                'bg-accent/20 border border-accent text-accent',
                'hover:bg-accent/30 hover:shadow-[0_0_10px_rgba(255,0,153,0.3)]',
                'transition-all duration-200 uppercase'
              )}
            >
              🚫 Fraud
            </button>
            <button
              onClick={() => handleSubmit('cancelled_for_balance_check')}
              className={cn(
                'px-2 py-1.5 rounded-pixel font-pixel text-[10px] col-span-2',
                'bg-accent/20 border border-accent text-accent',
                'hover:bg-accent/30 hover:shadow-[0_0_10px_rgba(255,0,153,0.3)]',
                'transition-all duration-200 uppercase'
              )}
            >
              🚫 Balance Check
            </button>
          </div>
        </div>

        {/* Failure Scenarios */}
        <div className="mb-3">
          <p className="text-[10px] font-pixel text-secondary/60 mb-2">FAILURES</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSubmit('failed_insufficient_funds')}
              className={cn(
                'px-2 py-1.5 rounded-pixel font-pixel text-[10px]',
                'bg-accent-red/20 border border-accent-red text-accent-red',
                'hover:bg-accent-red/30 hover:shadow-[0_0_10px_rgba(255,0,64,0.3)]',
                'transition-all duration-200 uppercase'
              )}
            >
              ✗ NSF
            </button>
            <button
              onClick={() => handleSubmit('failed_customer_dispute')}
              className={cn(
                'px-2 py-1.5 rounded-pixel font-pixel text-[10px]',
                'bg-accent-red/20 border border-accent-red text-accent-red',
                'hover:bg-accent-red/30 hover:shadow-[0_0_10px_rgba(255,0,64,0.3)]',
                'transition-all duration-200 uppercase'
              )}
            >
              ✗ Dispute
            </button>
            <button
              onClick={() => handleSubmit('failed_closed_bank_account')}
              className={cn(
                'px-2 py-1.5 rounded-pixel font-pixel text-[10px] col-span-2',
                'bg-accent-red/20 border border-accent-red text-accent-red',
                'hover:bg-accent-red/30 hover:shadow-[0_0_10px_rgba(255,0,64,0.3)]',
                'transition-all duration-200 uppercase'
              )}
            >
              ✗ Closed Acct
            </button>
          </div>
        </div>
      </div>
    </CommandCard>
  );
};
