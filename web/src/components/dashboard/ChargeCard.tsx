import React from 'react';
import {
  RetroCard,
  RetroCardHeader,
  RetroCardTitle,
  RetroCardContent,
  RetroBadge,
} from '@/components/ui/retro-components';
import { useDemoStore } from '@/lib/state';

/**
 * Charge (Payment) Orchestration Card
 * Shows: amount, status (synced with tracker), payment rail, balance checks
 *
 * Phase 3A: Placeholder data
 * Phase 3C: Will connect to real API data
 * Status badge syncs with PizzaTracker current status
 */
export const ChargeCard: React.FC = () => {
  const charge = useDemoStore((state) => state.charge);
  const paykey = useDemoStore((state) => state.paykey);

  if (!charge) {
    return (
      <RetroCard variant="magenta" className="h-full">
        <RetroCardHeader>
          <RetroCardTitle>Payment Charge</RetroCardTitle>
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

  return (
    <RetroCard variant="magenta" className="h-full">
      <RetroCardHeader>
        <div className="flex items-start justify-between gap-2">
          <RetroCardTitle className="flex-shrink">Payment Charge</RetroCardTitle>
          <RetroBadge variant={statusColor}>{charge.status.toUpperCase()}</RetroBadge>
        </div>
      </RetroCardHeader>
      <RetroCardContent className="space-y-4">
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
