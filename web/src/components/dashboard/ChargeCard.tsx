import React, { useState } from 'react';
import {
  RetroCard,
  RetroCardHeader,
  RetroCardTitle,
  RetroCardContent,
  RetroBadge,
} from '@/components/ui/retro-components';
import { cn } from '@/components/ui/utils';
import { useDemoStore } from '@/lib/state';
import { FiKey, FiChevronDown, FiChevronUp } from 'react-icons/fi';

/**
 * Charge (Payment) Orchestration Card
 * Shows: amount, status, payment rail, balance checks
 * Embeds paykey details when paykeyMode is 'embedded'
 */
export const ChargeCard: React.FC = () => {
  const charge = useDemoStore((state) => state.charge);
  const paykey = useDemoStore((state) => state.paykey);
  const displayState = useDemoStore((state) => state.getCardDisplayState());
  const [paykeyExpanded, setPaykeyExpanded] = useState(false);

  if (!charge) {
    return (
      <RetroCard variant="magenta" className="h-full">
        <RetroCardHeader>
          <RetroCardTitle>Charge</RetroCardTitle>
        </RetroCardHeader>
        <RetroCardContent>
          <p className="text-neutral-400 text-sm">No charge created yet. Run /create-charge</p>
        </RetroCardContent>
      </RetroCard>
    );
  }

  // Extract data from charge with fallbacks
  const paymentRail = charge.payment_rail || 'ach';
  const consentType = charge.consent_type || 'internet';

  // Check if we have balance data (only available for Plaid/Straddle paykeys, not bank_account)
  const hasBalanceData =
    paykey?.balance?.account_balance !== null && paykey?.balance?.account_balance !== undefined;

  // Get balance from paykey state (in cents, convert to dollars)
  const balanceBefore =
    hasBalanceData &&
    paykey?.balance?.account_balance !== null &&
    paykey?.balance?.account_balance !== undefined
      ? paykey.balance.account_balance / 100
      : 0;

  // Calculate balance after charge (before - charge amount in dollars)
  const balanceAfter = balanceBefore - charge.amount / 100;

  // Determine if balance check passed
  // Check status history for any balance-related failures
  const hasBalanceFailure = charge.status_history?.some(
    (h) =>
      h.status === 'cancelled' &&
      (h.reason?.includes('insufficient_funds') || h.reason?.includes('balance_check'))
  );

  const balanceCheckPassed = !hasBalanceFailure && balanceAfter >= 0;

  const statusColors = {
    created: 'gold',
    scheduled: 'secondary',
    pending: 'gold',
    paid: 'primary',
    failed: 'accent',
    cancelled: 'secondary',
  } as const;

  const statusColor = statusColors[charge.status as keyof typeof statusColors] || 'secondary';

  const railLabels: Record<string, string> = {
    ach: 'ACH',
    rtp: 'RTP',
    fednow: 'FedNow',
  };

  // Paykey embedded mode
  const isPaykeyEmbedded = displayState.paykeyMode === 'embedded';

  const truncateBankName = (name: string | undefined): string => {
    if (!name) {
      return 'Unknown Bank';
    }
    return name.split(',')[0].trim();
  };

  const last4 = paykey?.bank_data?.account_number
    ? paykey.bank_data.account_number.slice(-4)
    : paykey?.last4 || '0000';

  return (
    <RetroCard variant="magenta" className="h-full">
      <RetroCardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <RetroCardTitle className="flex-shrink">Charge</RetroCardTitle>

            {/* Enhanced Embedded Paykey CTA */}
            {isPaykeyEmbedded && paykey && (
              <button
                onClick={() => setPaykeyExpanded(!paykeyExpanded)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-pixel transition-all',
                  'bg-green-500/10 border border-green-500/40 text-green-500',
                  'hover:bg-green-500/20 hover:border-green-500/60 hover:scale-105',
                  'shadow-glow-green',
                  'text-sm font-body font-semibold'
                )}
                aria-label="Toggle paykey details"
              >
                <FiKey className="w-4 h-4 animate-pulse" />
                <span>View Paykey</span>
                {paykeyExpanded ? (
                  <FiChevronUp className="w-4 h-4" />
                ) : (
                  <FiChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          <RetroBadge variant={statusColor}>{charge.status.toUpperCase()}</RetroBadge>
        </div>
      </RetroCardHeader>
      <RetroCardContent className="space-y-4">
        {/* Embedded Paykey Details - Expandable */}
        {isPaykeyEmbedded && paykey && paykeyExpanded && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-pixel p-3 space-y-2 animate-pixel-fade-in">
            <div className="flex items-center gap-2">
              <FiKey className="w-4 h-4 text-green-500" />
              <p className="text-xs font-pixel text-green-500">PAYKEY</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-neutral-500 font-body mb-0.5">Bank</p>
                <p className="text-neutral-100 font-body">
                  {truncateBankName(paykey.institution_name || paykey.label)}
                </p>
              </div>
              <div>
                <p className="text-neutral-500 font-body mb-0.5">Account</p>
                <p className="text-neutral-100 font-body">••••{last4}</p>
              </div>
              {hasBalanceData && (
                <div>
                  <p className="text-neutral-500 font-body mb-0.5">Balance</p>
                  <p className="text-neutral-100 font-body">
                    $
                    {balanceBefore.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-neutral-500 font-body mb-0.5">Status</p>
                <p className="text-green-500 font-body">{paykey.status.toUpperCase()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Amount */}
        <div>
          <p className="text-xs text-neutral-400 font-body mb-1">Amount</p>
          <p className="text-4xl text-neutral-100 font-pixel">
            ${(charge.amount / 100).toFixed(2)}
          </p>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-400 font-body mb-1">Payment Rail</p>
            <p className="text-sm text-neutral-100 font-body font-bold">
              {railLabels[paymentRail] || 'ACH'}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-body mb-1">Payment Date</p>
            <p className="text-sm text-neutral-100 font-body">
              {charge.payment_date || new Date().toISOString().split('T')[0]}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs text-neutral-400 font-body mb-1">Description</p>
          <p className="text-xs text-neutral-100 font-body">{charge.description || 'Payment'}</p>
        </div>

        {/* Balance Check - Only show for Plaid/Straddle paykeys (not bank_account) */}
        {hasBalanceData && (
          <div className="pt-3 border-t border-accent/20">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-neutral-400 font-body">Balance Check</p>
              <p
                className={`text-xs font-pixel ${balanceCheckPassed ? 'text-primary' : 'text-accent'}`}
              >
                {balanceCheckPassed ? 'PASSED' : 'FAILED'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-neutral-500 font-body mb-0.5">Before</p>
                <p className="text-neutral-300 font-body">${balanceBefore.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-neutral-500 font-body mb-0.5">After</p>
                <p className="text-neutral-300 font-body">${balanceAfter.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Consent Type */}
        <div className="pt-3 border-t border-accent/20">
          <div className="flex justify-between items-center">
            <p className="text-xs text-neutral-400 font-body">Consent Type</p>
            <p className="text-xs text-neutral-300 font-body capitalize">{consentType}</p>
          </div>
        </div>
      </RetroCardContent>
    </RetroCard>
  );
};
