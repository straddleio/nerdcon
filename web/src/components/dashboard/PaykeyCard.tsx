import React, { useState, useEffect } from 'react';
import {
  RetroCard,
  RetroCardHeader,
  RetroCardTitle,
  RetroCardContent,
  RetroBadge,
} from '@/components/ui/retro-components';
import { useDemoStore } from '@/lib/state';
import { hasVerificationData } from './PaykeyCard.helpers';
import { cn } from '@/components/ui/utils';
import {
  NameMatchDisplay,
  AccountValidationDisplay,
  AccountStatusDisplay,
} from './PaykeyVerificationDisplay';

/**
 * Paykey (Bank Account) Ownership Card
 * Shows: Source (Plaid/Bank), account owner name, ownership signals, balance
 *
 * Phase 3A: Placeholder data
 * Phase 3C: Will connect to real API data with logo.dev integration
 */
export const PaykeyCard: React.FC = () => {
  const paykey = useDemoStore((state) => state.paykey);
  const customer = useDemoStore((state) => state.customer);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showInfoMode, setShowInfoMode] = useState(false);

  // Reset states when paykey changes
  useEffect(() => {
    setIsExpanded(false);
    setShowInfoMode(false);
  }, [paykey?.id]);

  if (!paykey) {
    return (
      <RetroCard variant="blue" className="h-full">
        <RetroCardHeader>
          <RetroCardTitle>Paykey</RetroCardTitle>
        </RetroCardHeader>
        <RetroCardContent>
          <p className="text-neutral-400 text-sm">No bank account linked. Run /create-paykey</p>
        </RetroCardContent>
      </RetroCard>
    );
  }

  // Extract data from paykey with fallbacks
  const source: 'plaid' | 'bank_account' = paykey.source === 'plaid' ? 'plaid' : 'bank_account';
  const balance = paykey.balance?.account_balance ? paykey.balance.account_balance / 100 : 0; // Convert cents to dollars

  // Build ownership signals dynamically
  const ownershipSignals: string[] = [];
  if (paykey.balance?.status === 'completed') {
    ownershipSignals.push('Balance verified');
  }
  if (paykey.status === 'active') {
    ownershipSignals.push('Account active');
  }
  if (paykey.ownership_verified) {
    ownershipSignals.push('Ownership verified');
  }

  // Extract last 4 digits from masked account number
  const last4 = paykey.bank_data?.account_number
    ? paykey.bank_data.account_number.slice(-4)
    : paykey.last4 || '0000';

  const statusColors = {
    active: 'primary',
    inactive: 'secondary',
    rejected: 'accent',
    pending: 'gold',
    review: 'gold',
  } as const;

  const statusColor = statusColors[paykey.status as keyof typeof statusColors] || 'secondary';

  const sourceLabels = {
    plaid: 'Plaid',
    bank_account: 'Direct',
  };

  // Helper: Truncate bank name at comma (e.g., "JPMORGAN CHASE BANK, NA" → "JPMORGAN CHASE BANK")
  const truncateBankName = (name: string | undefined): string => {
    if (!name) {
      return 'Unknown Bank';
    }
    return name.split(',')[0].trim();
  };

  // Helper: Get customer name from review data or fallback to customer object
  const getCustomerName = (): string => {
    // First priority: customer_name from paykey review endpoint
    const customerNameFromReview =
      paykey.review?.verification_details?.breakdown?.name_match?.customer_name;
    if (customerNameFromReview) {
      return customerNameFromReview;
    }

    // Second priority: customer name from customer object
    if (customer?.name) {
      return customer.name;
    }

    // Final fallback
    return 'Unknown';
  };

  return (
    <RetroCard variant="blue" className="h-full">
      <RetroCardHeader>
        <div className="flex items-start justify-between gap-2">
          <RetroCardTitle className="flex-shrink">Paykey</RetroCardTitle>
          {paykey.status === 'review' ? (
            <button
              onClick={() => {
                // TODO: Add review action handler in future task
                // eslint-disable-next-line no-console
                console.log('Paykey review button clicked - workflow to be implemented');
              }}
              className={cn(
                'px-2 py-1 text-xs font-pixel uppercase transition-all',
                'bg-gold/20 text-gold border border-gold/40 rounded-pixel',
                'hover:bg-gold/30 hover:border-gold/60',
                'animate-pulse',
                'cursor-pointer'
              )}
            >
              REVIEW
            </button>
          ) : (
            <RetroBadge variant={statusColor}>{paykey.status.toUpperCase()}</RetroBadge>
          )}
        </div>
      </RetroCardHeader>
      <RetroCardContent className="space-y-4">
        {/* Bank Info with Source */}
        <div className="flex items-start gap-3">
          {/* Logo Placeholder - Phase 3C will use logo.dev */}
          <div className="w-14 h-14 flex-shrink-0 border-2 border-secondary/40 rounded-pixel flex items-center justify-center bg-background-dark">
            <span className="text-secondary font-pixel text-xs">$</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-neutral-100 font-body font-bold truncate">
              {truncateBankName(paykey.institution_name || paykey.label)}
            </p>
            <p className="text-xs text-neutral-400 font-body">
              {paykey.bank_data?.account_type
                ? paykey.bank_data.account_type.charAt(0).toUpperCase() +
                  paykey.bank_data.account_type.slice(1)
                : paykey.account_type
                  ? paykey.account_type.charAt(0).toUpperCase() + paykey.account_type.slice(1)
                  : 'Account'}{' '}
              ••••{last4}
            </p>
            <p className="text-xs text-secondary font-body mt-0.5">via {sourceLabels[source]}</p>
          </div>
          {/* Customer Name in right column */}
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-neutral-400 font-body mb-1">Customer</p>
            <p className="text-sm text-neutral-100 font-body">{getCustomerName()}</p>
          </div>
        </div>

        {/* Balance & Token */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-400 font-body mb-1">Balance</p>
            <p className="text-sm text-neutral-100 font-body font-bold">${balance.toFixed(2)}</p>
            {paykey.balance?.updated_at && (
              <p className="text-xs text-neutral-500 font-body mt-0.5">
                {new Date(paykey.balance.updated_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-neutral-400 font-body mb-1">Paykey</p>
            <p className="text-xs text-neutral-100 font-mono truncate">{paykey.paykey || 'N/A'}</p>
          </div>
        </div>

        {/* Verification Details */}
        {hasVerificationData(paykey) && (
          <div className="pt-3 border-t border-secondary/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-neutral-400 font-body">Verification Details</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={cn(
                    'px-2 py-1 text-xs font-body border rounded-pixel transition-all',
                    isExpanded
                      ? 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20'
                      : 'border-neutral-600 text-neutral-400 hover:border-primary hover:text-primary'
                  )}
                >
                  {isExpanded ? 'HIDE' : 'SHOW'}
                </button>
                {isExpanded && (
                  <button
                    onClick={() => setShowInfoMode(!showInfoMode)}
                    className={cn(
                      'px-2 py-1 text-xs font-body border rounded-pixel transition-all',
                      showInfoMode
                        ? 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20'
                        : 'border-neutral-600 text-neutral-400 hover:border-primary hover:text-primary'
                    )}
                  >
                    INFO
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {paykey.source === 'bank_account' ? (
                <AccountValidationDisplay
                  accountValidation={
                    paykey.review?.verification_details?.breakdown?.account_validation
                  }
                  messages={paykey.review?.verification_details?.messages}
                  isExpanded={isExpanded}
                  showInfoMode={showInfoMode}
                />
              ) : (
                <>
                  {/* Account Status - Static module for plaid/straddle/quiltt */}
                  <AccountStatusDisplay status={paykey.status} />
                  <NameMatchDisplay
                    nameMatch={paykey.review?.verification_details?.breakdown?.name_match}
                    customerName={customer?.name}
                    isExpanded={isExpanded}
                    showInfoMode={showInfoMode}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </RetroCardContent>
    </RetroCard>
  );
};
