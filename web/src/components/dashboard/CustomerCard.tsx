import React, { useState, useEffect } from 'react';
import {
  RetroCard,
  RetroCardHeader,
  RetroCardTitle,
  RetroCardContent,
  RetroBadge,
} from '@/components/ui/retro-components';
import { cn } from '@/components/ui/utils';
import { useGeolocation } from '@/lib/useGeolocation';
import { useDemoStore } from '@/lib/state';
import { unmaskCustomer, customerReviewDecision, type UnmaskedCustomer } from '@/lib/api';
import { KYCValidationCard } from './KYCValidationCard';
import { AddressWatchlistCard } from './AddressWatchlistCard';
import { PixelSkull } from '@/components/ui/PixelSkull';
import { ReviewDecisionModal } from '@/components/ReviewDecisionModal';

type ModuleDecision = 'accept' | 'reject' | 'review' | 'unavailable';

function isValidModuleDecision(value: unknown): value is ModuleDecision {
  return typeof value === 'string' && ['accept', 'reject', 'review', 'unavailable'].includes(value);
}

interface VerificationModule {
  name: string;
  decision: 'accept' | 'review' | 'reject';
  riskScore: number;
  correlation?: string; // 'Match' | 'Partial' | null
  correlationScore?: number;
  codes?: string[];
  messages?: Record<string, string>;
}

/**
 * Customer Identity Verification Card
 * Shows: Module-based risk breakdown with traffic light indicators
 *
 * Phase 3A: Placeholder data with intuitive module display
 * Phase 3C: Will connect to real API data from customer review endpoint
 */
export const CustomerCard: React.FC = () => {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [unmaskedData, setUnmaskedData] = useState<UnmaskedCustomer | null>(null);
  const [isUnmasking, setIsUnmasking] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);
  const [infoMode, setInfoMode] = useState(false);
  const [unmaskError, setUnmaskError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const customer = useDemoStore((state) => state.customer);

  // Determine if customer is business or individual
  const customerType = customer?.type || 'individual';
  const isBusinessCustomer = customerType === 'business';

  // Extract IP address from device field if available (placeholder for now since API doesn't include device yet)
  // IMPORTANT: Must be before early return to satisfy Rules of Hooks
  const ipAddress = customer ? '192.168.1.1' : null; // TODO: Get from customer.device?.ip_address when available

  // Fetch geolocation from IP address
  // IMPORTANT: Hook must be called unconditionally (before early return)
  const geo = useGeolocation(ipAddress);

  // Sound cue placeholder for review status
  useEffect(() => {
    if (customer?.verification_status === 'review') {
      // TODO: Play sound alert when customer status is "review"
      // Example: new Audio('/sounds/review-alert.mp3').play();
      console.info('🔔 Customer in REVIEW status - sound cue would play here');
    }
  }, [customer?.verification_status]);

  // Reset unmasked data when customer changes
  useEffect(() => {
    setUnmaskedData(null);
    setUnmaskError(null);
  }, [customer?.id]);

  // Toggle unmask customer data
  const handleUnmask = (): void => {
    void (async (): Promise<void> => {
      if (isUnmasking) {
        return;
      }

      // If already unmasked, hide it
      if (unmaskedData) {
        setUnmaskedData(null);
        setUnmaskError(null);
        return;
      }

      // Otherwise, fetch unmasked data
      if (!customer?.id) {
        return;
      }

      setIsUnmasking(true);
      try {
        setUnmaskError(null); // Clear previous errors
        const data = await unmaskCustomer(customer.id);
        setUnmaskedData(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to unmask customer data';
        setUnmaskError(message);
      } finally {
        setIsUnmasking(false);
      }
    })();
  };

  if (!customer) {
    return (
      <RetroCard variant="cyan" className="h-full">
        <RetroCardHeader>
          <RetroCardTitle>Customer</RetroCardTitle>
        </RetroCardHeader>
        <RetroCardContent>
          <p className="text-neutral-400 text-sm">No customer created yet. Run /create-customer</p>
        </RetroCardContent>
      </RetroCard>
    );
  }

  // Map verification_status to status (verified, review, rejected, pending)
  const status = (customer.verification_status || 'pending') as
    | 'verified'
    | 'review'
    | 'rejected'
    | 'pending';

  // Build verification modules from real review data if available
  const modules: VerificationModule[] = [];

  if (customer.review?.breakdown) {
    const { breakdown, messages } = customer.review;

    // Email module
    if (breakdown.email) {
      const emailDecision = isValidModuleDecision(breakdown.email.decision)
        ? breakdown.email.decision
        : 'unavailable';
      modules.push({
        name: 'Email',
        decision: emailDecision as 'accept' | 'review' | 'reject',
        riskScore: breakdown.email.risk_score || 0,
        correlation:
          breakdown.email.correlation === 'high_confidence'
            ? 'Match'
            : breakdown.email.correlation === 'medium_confidence'
              ? 'Partial'
              : undefined,
        correlationScore: breakdown.email.correlation_score,
        codes: breakdown.email.codes,
        messages: messages || {},
      });
    }

    // Phone module
    if (breakdown.phone) {
      const phoneDecision = isValidModuleDecision(breakdown.phone.decision)
        ? breakdown.phone.decision
        : 'unavailable';
      modules.push({
        name: 'Phone',
        decision: phoneDecision as 'accept' | 'review' | 'reject',
        riskScore: breakdown.phone.risk_score || 0,
        correlation:
          breakdown.phone.correlation === 'high_confidence'
            ? 'Match'
            : breakdown.phone.correlation === 'medium_confidence'
              ? 'Partial'
              : undefined,
        correlationScore: breakdown.phone.correlation_score,
        codes: breakdown.phone.codes,
        messages: messages || {},
      });
    }

    // Address module - only displays if customer.review.breakdown.address exists
    // This requires /customer-KYC command or customer creation with full address validation
    if (breakdown.address) {
      const addressDecision = isValidModuleDecision(breakdown.address.decision)
        ? breakdown.address.decision
        : 'unavailable';
      modules.push({
        name: 'Address',
        decision: addressDecision as 'accept' | 'review' | 'reject',
        riskScore: breakdown.address.risk_score || 0,
        correlation:
          breakdown.address.correlation === 'high_confidence'
            ? 'Match'
            : breakdown.address.correlation === 'medium_confidence'
              ? 'Partial'
              : undefined,
        correlationScore: breakdown.address.correlation_score,
        codes: breakdown.address.codes,
        messages: messages || {},
      });
    }

    // Fraud module
    if (breakdown.fraud) {
      const fraudDecision = isValidModuleDecision(breakdown.fraud.decision)
        ? breakdown.fraud.decision
        : 'unavailable';
      modules.push({
        name: 'Fraud',
        decision: fraudDecision as 'accept' | 'review' | 'reject',
        riskScore: breakdown.fraud.risk_score || 0,
        codes: breakdown.fraud.codes,
        messages: messages || {},
      });
    }

    // Note: Synthetic module intentionally excluded from display
  }

  // Reputation module (from reputation field)
  if (customer.review?.reputation) {
    const reputationDecision = isValidModuleDecision(customer.review.reputation.decision)
      ? customer.review.reputation.decision
      : 'unavailable';
    modules.push({
      name: 'Reputation',
      decision: reputationDecision as 'accept' | 'review' | 'reject',
      riskScore: customer.review.reputation.risk_score || 0,
      codes: customer.review.reputation.codes,
      messages: customer.review.messages || {},
    });
  }

  // Reputation intelligence data (from identity_details.reputation.insights)
  const insights = customer.review?.reputation?.insights;
  const reputationInsights = {
    achFraudCount: insights?.ach_fraud_transactions_count || 0,
    achFraudAmount: insights?.ach_fraud_transactions_total_amount || 0,
    achReturnCount: insights?.ach_returned_transactions_count || 0,
    achReturnAmount: insights?.ach_returned_transactions_total_amount || 0,
    cardFraudCount: insights?.card_fraud_transactions_count || 0,
    cardFraudAmount: insights?.card_fraud_transactions_total_amount || 0,
    cardDisputeCount: insights?.card_disputed_transactions_count || 0,
    cardDisputeAmount: insights?.card_disputed_transactions_total_amount || 0,
  };

  const statusColors = {
    verified: 'primary',
    review: 'gold',
    rejected: 'accent',
    pending: 'secondary',
  } as const;

  const getRiskColor = (score: number): string => {
    if (score < 0.75) {
      return 'text-green-500';
    } // Green - low risk
    if (score < 0.9) {
      return 'text-gold';
    } // Yellow - medium risk
    return 'text-accent'; // Red - high risk
  };

  const getDecisionLabel = (decision: 'accept' | 'review' | 'reject'): string => {
    if (decision === 'accept') {
      return 'PASS';
    }
    if (decision === 'review') {
      return 'REVIEW';
    }
    return 'FAIL';
  };

  const toggleModule = (moduleName: string): void => {
    setExpandedModule(expandedModule === moduleName ? null : moduleName);
  };

  const toggleAllModules = (): void => {
    setAllExpanded(!allExpanded);
    setExpandedModule(null);
  };

  const toggleInfoMode = (): void => {
    setInfoMode(!infoMode);
  };

  // Determine if a module should be expanded
  const isModuleExpanded = (moduleName: string): boolean => {
    if (allExpanded) {
      return true;
    }
    return expandedModule === moduleName;
  };

  return (
    <RetroCard variant="cyan" className="h-full">
      <RetroCardHeader>
        <div className="flex items-start justify-between gap-2">
          <RetroCardTitle className="flex-shrink">Customer</RetroCardTitle>
          {status === 'review' ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className={cn(
                'px-2 py-1 text-xs font-pixel uppercase transition-all',
                'bg-gold/20 text-gold border border-gold/40 rounded-pixel',
                'hover:bg-gold/30 hover:border-gold/60',
                'animate-pulse',
                'cursor-pointer'
              )}
            >
              {status.toUpperCase()}
            </button>
          ) : (
            <RetroBadge variant={statusColors[status]}>
              {status === 'rejected' && <PixelSkull size={12} className="mr-1 -mt-0.5" />}
              {status.toUpperCase()}
            </RetroBadge>
          )}
        </div>
      </RetroCardHeader>
      <RetroCardContent className="space-y-3">
        {/* Name and Email Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-neutral-400 font-body mb-0.5">Name</p>
            <p className="text-sm text-neutral-100 font-body">{customer.name}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-body mb-0.5">Email</p>
            <p className="text-xs text-neutral-100 font-body truncate">{customer.email}</p>
          </div>
        </div>

        {/* Phone and Address Row */}
        <div className="pt-2 border-t border-primary/10">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div>
                <p className="text-xs text-neutral-500 font-body mb-0.5">Phone</p>
                <p className="text-xs text-neutral-100 font-body">{customer.phone}</p>
              </div>
              {/* Live Geolocation Indicator */}
              {!geo.loading && !geo.error && geo.city && (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-xs text-neutral-400 font-body">
                    Live: {geo.city}, {geo.countryCode}
                  </span>
                </div>
              )}
            </div>
            {customer.address && (
              <div>
                <p className="text-xs text-neutral-500 font-body mb-0.5">Address</p>
                <div className="text-xs text-neutral-100 font-body">
                  <p>
                    {customer.address.address1}
                    {customer.address.address2 ? `, ${customer.address.address2}` : ''}
                  </p>
                  <p>
                    {customer.address.city}, {customer.address.state} {customer.address.zip}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SSN and DOB Row with Unmask */}
        {customer.compliance_profile?.ssn && (
          <div className="pt-2 border-t border-primary/10 relative">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-neutral-500 font-body mb-0.5">SSN</p>
                <p className="text-xs text-neutral-100 font-body font-mono">
                  {unmaskedData?.compliance_profile?.ssn || customer.compliance_profile.ssn}
                </p>
              </div>
              <div className="pr-16">
                <p className="text-xs text-neutral-500 font-body mb-0.5">Date of Birth</p>
                <p className="text-xs text-neutral-100 font-body font-mono">
                  {unmaskedData?.compliance_profile?.dob || customer.compliance_profile.dob}
                </p>
              </div>
            </div>
            <button
              onClick={handleUnmask}
              disabled={isUnmasking}
              className={cn(
                'absolute top-2 right-0 px-2 py-1 text-xs font-body border rounded-pixel transition-all flex-shrink-0',
                unmaskedData
                  ? 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20'
                  : 'border-neutral-600 text-neutral-400 hover:border-primary hover:text-primary',
                isUnmasking && 'opacity-50 cursor-not-allowed'
              )}
              title={unmaskedData ? 'Hide sensitive data' : 'Show unmasked data'}
            >
              {unmaskedData ? 'HIDE' : 'SHOW'}
            </button>
            {unmaskError && <p className="text-xs text-accent font-body mt-1">{unmaskError}</p>}
          </div>
        )}

        {/* Verification Modules */}
        <div className="pt-2 border-t border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-neutral-400 font-body">
              {isBusinessCustomer ? 'Business Verification' : 'Identity Verification'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAllModules}
                className={cn(
                  'px-2 py-1 text-xs font-body border rounded-pixel transition-all',
                  allExpanded
                    ? 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20'
                    : 'border-neutral-600 text-neutral-400 hover:border-primary hover:text-primary'
                )}
              >
                {allExpanded ? 'HIDE' : 'SHOW'}
              </button>
              {allExpanded && (
                <button
                  onClick={toggleInfoMode}
                  className={cn(
                    'px-2 py-1 text-xs font-body border rounded-pixel transition-all',
                    infoMode
                      ? 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20'
                      : 'border-neutral-600 text-neutral-400 hover:border-primary hover:text-primary'
                  )}
                >
                  INFO
                </button>
              )}
            </div>
          </div>

          {/* 2x3 Grid: Email/Phone, Reputation/Fraud, Address/KYC */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {modules.map((module) => (
              <div
                key={module.name}
                className="border border-primary/20 rounded-pixel bg-background-dark/50"
              >
                {/* Module Header - Clickable */}
                <button
                  onClick={() => module.codes && toggleModule(module.name)}
                  className={cn(
                    'w-full px-3 py-2 flex items-center justify-between text-left transition-colors',
                    module.codes && 'hover:bg-primary/5 cursor-pointer'
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-body text-neutral-200 flex-shrink-0">
                      {module.name}
                    </span>
                    {module.correlation && (
                      <span className="text-xs text-primary font-body">• {module.correlation}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={cn(
                        'text-xs font-pixel',
                        module.decision === 'accept'
                          ? 'text-green-500'
                          : module.decision === 'review'
                            ? 'text-gold'
                            : 'text-accent'
                      )}
                    >
                      {getDecisionLabel(module.decision)}
                    </span>
                    {module.codes && (
                      <span className="text-xs text-neutral-500">
                        {isModuleExpanded(module.name) ? '▼' : '▶'}
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded Section - Scores and Codes */}
                {isModuleExpanded(module.name) && (
                  <div className="border-t border-primary/10">
                    {/* Risk Score / Insights Header */}
                    <div className="px-3 py-2 bg-background-dark/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500 font-body">
                          {infoMode ? 'Insights' : 'Risk Score'}
                        </span>
                        {!infoMode && (
                          <span
                            className={cn('text-sm font-pixel', getRiskColor(module.riskScore))}
                          >
                            {module.riskScore.toFixed(3)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Codes Display */}
                    {module.codes && module.messages && (
                      <div className="px-3 pb-2">
                        <div className="pt-2 space-y-1.5">
                          {infoMode
                            ? // I-Codes Mode: Show codes that DON'T start with R
                              module.codes
                                .filter((code) => !code.startsWith('R'))
                                .map((code) => (
                                  <div key={code} className="flex gap-2">
                                    <span className="text-xs text-primary font-mono flex-shrink-0">
                                      {code}
                                    </span>
                                    <span className="text-xs text-neutral-400 font-body">
                                      {module.messages![code] || 'Information signal'}
                                    </span>
                                  </div>
                                ))
                            : // R-Codes Mode: Show codes that start with R
                              module.codes
                                .filter((code) => code.startsWith('R'))
                                .map((code) => (
                                  <div key={code} className="flex gap-2">
                                    <span className="text-xs text-accent font-mono flex-shrink-0">
                                      {code}
                                    </span>
                                    <span className="text-xs text-neutral-400 font-body">
                                      {module.messages![code] || 'Risk signal detected'}
                                    </span>
                                  </div>
                                ))}
                          {/* No codes message */}
                          {(infoMode
                            ? module.codes.filter((code) => !code.startsWith('R')).length === 0
                            : module.codes.filter((code) => code.startsWith('R')).length === 0) && (
                            <p className="text-xs text-neutral-500 font-body">
                              {infoMode ? 'No insights' : 'No risk signals'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* KYC Validation */}
            {customer.review?.kyc && (
              <KYCValidationCard customer={customer} isExpanded={allExpanded} />
            )}
          </div>

          {/* Address Watchlist - Full Width Row */}
          {customer.review?.watch_list && (
            <AddressWatchlistCard customer={customer} isExpanded={allExpanded} />
          )}
        </div>

        {/* Network Intelligence (Reputation) */}
        <div className="pt-2 border-t border-primary/20">
          <p className="text-xs text-neutral-400 font-body mb-3">Network Intelligence</p>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-xs text-neutral-500 font-body mb-1">ACH Fraud</p>
              <p className="text-sm font-pixel text-accent">{reputationInsights.achFraudCount}</p>
              <p className="text-xs text-neutral-600 font-body">
                ${(reputationInsights.achFraudAmount / 100).toFixed(0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-500 font-body mb-1">ACH Returns</p>
              <p className="text-sm font-pixel text-gold">{reputationInsights.achReturnCount}</p>
              <p className="text-xs text-neutral-600 font-body">
                ${(reputationInsights.achReturnAmount / 100).toFixed(0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-500 font-body mb-1">Card Fraud</p>
              <p className="text-sm font-pixel text-accent">{reputationInsights.cardFraudCount}</p>
              <p className="text-xs text-neutral-600 font-body">
                ${(reputationInsights.cardFraudAmount / 100).toFixed(0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-500 font-body mb-1">Disputes</p>
              <p className="text-sm font-pixel text-gold">{reputationInsights.cardDisputeCount}</p>
              <p className="text-xs text-neutral-600 font-body">
                ${(reputationInsights.cardDisputeAmount / 100).toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </RetroCardContent>

      {/* Review Decision Modal */}
      {customer.verification_status === 'review' && (
        <ReviewDecisionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDecision={async (decision) => {
            // Log to terminal
            useDemoStore.getState().addAPILogEntry({
              type: 'ui-action',
              text: `Customer review decision: ${decision}`,
            });

            try {
              // Call API
              await customerReviewDecision(customer.id, decision as 'verified' | 'rejected');

              // State will update via SSE
            } catch (error) {
              console.error('Failed to update customer review:', error);
              // Show error in terminal
              useDemoStore.getState().addTerminalLine({
                text: `Error: ${error instanceof Error ? error.message : 'Failed to update review'}`,
                type: 'error',
              });
            }
          }}
          data={{
            type: 'customer',
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            status: customer.verification_status || 'review',
            verificationSummary: modules.reduce(
              (acc, m) => {
                acc[m.name.toLowerCase()] = m.decision;
                return acc;
              },
              {} as Record<string, string>
            ),
          }}
        />
      )}
    </RetroCard>
  );
};
