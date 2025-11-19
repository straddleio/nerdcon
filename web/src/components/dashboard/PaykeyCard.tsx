import React, { useState, useEffect } from 'react';
import {
  RetroCard,
  RetroCardHeader,
  RetroCardTitle,
  RetroCardContent,
  RetroBadge,
  RetroButton,
} from '@/components/ui/retro-components';
import { useDemoStore } from '@/lib/state';
import { hasVerificationData } from './PaykeyCard.helpers';
import { cn } from '@/components/ui/utils';
import {
  NameMatchDisplay,
  AccountValidationDisplay,
  AccountStatusDisplay,
} from './PaykeyVerificationDisplay';
import { PixelSkull } from '@/components/ui/PixelSkull';
import { ReviewDecisionModal } from '@/components/ReviewDecisionModal';
import { paykeyReviewDecision } from '@/lib/api';
import { executeCommand } from '@/lib/commands';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);

  // Reset states when paykey changes
  useEffect(() => {
    setIsExpanded(false);
    setShowInfoMode(false);
    setIsModalOpen(false);
  }, [paykey?.id]);

  // Handler for button clicks
  const handleLinkAccount = async (command: string, label: string): Promise<void> => {
    setIsExecuting(true);
    setExecutingCommand(label);
    try {
      await executeCommand(command);
    } catch (error) {
      // Error is already logged to terminal by executeCommand
      // eslint-disable-next-line no-console
      console.error('Command execution failed:', error);
    } finally {
      setIsExecuting(false);
      setExecutingCommand(null);
    }
  };

  if (!paykey) {
    return (
      <RetroCard variant="blue" className="h-full">
        <RetroCardHeader>
          <RetroCardTitle>Paykey</RetroCardTitle>
        </RetroCardHeader>
        <RetroCardContent>
          <p className="text-neutral-400 text-sm mb-4">No bank account linked.</p>

          {customer ? (
            <div className="space-y-2">
              <RetroButton
                variant="primary"
                onClick={() => {
                  void handleLinkAccount('/create-paykey-bridge', 'Bridge');
                }}
                disabled={isExecuting}
                className="w-full"
              >
                {executingCommand === 'Bridge' ? '⏳ Linking...' : '🌉 Link via Bridge'}
              </RetroButton>

              <RetroButton
                variant="secondary"
                onClick={() => {
                  void handleLinkAccount('/create-paykey plaid', 'Plaid');
                }}
                disabled={isExecuting}
                className="w-full"
              >
                {executingCommand === 'Plaid' ? '⏳ Linking...' : '🏦 Link via Plaid'}
              </RetroButton>

              <RetroButton
                variant="secondary"
                onClick={() => {
                  void handleLinkAccount('/create-paykey bank', 'Direct');
                }}
                disabled={isExecuting}
                className="w-full"
              >
                {executingCommand === 'Direct' ? '⏳ Linking...' : '🏛️ Link Direct'}
              </RetroButton>
            </div>
          ) : (
            <p className="text-neutral-500 text-xs">
              Create a customer first with /customer-create
            </p>
          )}
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

  // Handler for review decision (approve/reject)
  const handleReviewDecision = async (
    decision: 'verified' | 'rejected' | 'approved'
  ): Promise<void> => {
    if (!paykey?.id) {
      return;
    }

    // Map 'approved' to 'approved', 'rejected' to 'rejected'
    const apiDecision = decision === 'approved' ? 'approved' : 'rejected';

    try {
      // Call API
      await paykeyReviewDecision(paykey.id, apiDecision);

      // Log to terminal
      const action = apiDecision === 'approved' ? 'Approved' : 'Rejected';
      useDemoStore.getState().addAPILogEntry({
        type: 'ui-action',
        text: `Paykey review decision: ${action} paykey for ${truncateBankName(paykey.institution_name || paykey.label)}`,
      });
    } catch (error) {
      // Log error to terminal
      useDemoStore.getState().addTerminalLine({
        type: 'error',
        text: `Failed to ${apiDecision === 'approved' ? 'approve' : 'reject'} paykey: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  return (
    <RetroCard
      variant="blue"
      className={cn(
        'h-full relative overflow-hidden transition-all duration-300',
        'hover:shadow-neon-primary hover:border-primary',
        'group'
      )}
    >
      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10 z-0 scanlines" />

      <RetroCardHeader className="relative z-10">
        <div className="flex items-start justify-between gap-2">
          <RetroCardTitle className="flex-shrink text-glow-primary">Paykey</RetroCardTitle>
          {paykey.status === 'review' ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className={cn(
                'px-2 py-1 text-xs font-pixel uppercase transition-all',
                'bg-gold/20 text-gold border border-gold/40 rounded-pixel',
                'hover:bg-gold/30 hover:border-gold/60 hover:shadow-glow-gold',
                'animate-pulse hover:animate-none', // Stop pulse on hover
                'cursor-pointer relative overflow-hidden'
              )}
            >
              <span className="relative z-10">REVIEW</span>
              {/* Glitch effect overlay on hover */}
              <div className="absolute inset-0 bg-gold/10 opacity-0 hover:opacity-100 animate-flicker pointer-events-none" />
            </button>
          ) : (
            <RetroBadge variant={statusColor}>
              {paykey.status === 'rejected' && <PixelSkull size={12} className="mr-1 -mt-0.5" />}
              {paykey.status.toUpperCase()}
            </RetroBadge>
          )}
        </div>
      </RetroCardHeader>
      <RetroCardContent className="space-y-4 relative z-10">
        {/* Bank Info with Source */}
        <div className="flex items-start gap-3">
          {/* Logo Placeholder - Phase 3C will use logo.dev */}
          <div
            className={cn(
              'w-14 h-14 flex-shrink-0 border-2 border-secondary/40 rounded-pixel flex items-center justify-center bg-background-dark',
              'group-hover:border-secondary/80 group-hover:shadow-glow-blue transition-all duration-300'
            )}
          >
            <span className="text-secondary font-pixel text-xs group-hover:text-glow-blue transition-all">
              $
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-neutral-100 font-body font-bold truncate group-hover:text-primary transition-colors">
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
            <p className="text-sm text-neutral-100 font-body font-bold text-glow-cyan">
              ${balance.toFixed(2)}
            </p>
            {paykey.balance?.updated_at && (
              <p className="text-xs text-neutral-500 font-body mt-0.5">
                {new Date(paykey.balance.updated_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-neutral-400 font-body mb-1">Paykey</p>
            <p className="text-xs text-neutral-100 font-mono truncate opacity-80 group-hover:opacity-100 transition-opacity">
              {paykey.paykey || 'N/A'}
            </p>
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
                      ? 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 hover:shadow-glow-primary'
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
                        ? 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 hover:shadow-glow-primary'
                        : 'border-neutral-600 text-neutral-400 hover:border-primary hover:text-primary'
                    )}
                  >
                    INFO
                  </button>
                )}
              </div>
            </div>

            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="space-y-2 pt-1">
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
          </div>
        )}
      </RetroCardContent>

      {/* Review Decision Modal */}
      {paykey.status === 'review' && (
        <ReviewDecisionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDecision={handleReviewDecision}
          data={{
            type: 'paykey',
            id: paykey.id,
            customerName: getCustomerName(),
            institution: truncateBankName(paykey.institution_name || paykey.label),
            balance: balance,
            status: paykey.status,
            verificationSummary: paykey.review?.verification_details?.breakdown
              ? Object.entries(paykey.review.verification_details.breakdown).reduce(
                  (acc, [key, value]) => {
                    if (value && typeof value === 'object' && 'decision' in value) {
                      acc[key] = (value as { decision: string }).decision;
                    }
                    return acc;
                  },
                  {} as Record<string, string>
                )
              : undefined,
          }}
        />
      )}
    </RetroCard>
  );
};
