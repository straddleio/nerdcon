import React from 'react';
import { getCorrelationBucket, getDecisionLabel, getDecisionColor } from './PaykeyCard.helpers';

interface NameMatchDisplayProps {
  nameMatch?: {
    decision: string;
    correlation_score?: number | null;
    customer_name?: string | null;
    matched_name?: string | null;
    names_on_account?: string[] | null;
    codes?: string[];
    reason?: string | null;
  };
  customerName?: string;
  isExpanded: boolean;
  showInfoMode: boolean;
}

export const NameMatchDisplay: React.FC<NameMatchDisplayProps> = ({
  nameMatch,
  customerName,
  isExpanded,
  showInfoMode,
}) => {
  if (!nameMatch) {
    return null;
  }

  const correlationBucket = getCorrelationBucket(nameMatch.correlation_score);
  const correlationColor = {
    EXACT: 'text-primary',
    HIGH: 'text-secondary',
    MEDIUM: 'text-gold',
    LOW: 'text-accent',
    UNKNOWN: 'text-neutral-400',
  }[correlationBucket];

  // Collapsed state - just header with decision badge
  if (!isExpanded) {
    return (
      <div className="border border-primary/20 rounded-pixel bg-background-dark/50">
        <div className="w-full px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs font-body text-neutral-200 flex-shrink-0">Name Match</span>
              <span className={`text-xs font-body ${correlationColor}`}>• {correlationBucket}</span>
            </div>
            <span
              className={`text-xs font-pixel ${getDecisionColor(nameMatch.decision)} flex-shrink-0`}
            >
              {getDecisionLabel(nameMatch.decision)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Expanded state
  if (!showInfoMode) {
    return (
      <div className="border border-primary/20 rounded-pixel bg-background-dark/50">
        {/* Module Header */}
        <div className="w-full px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs font-body text-neutral-200 flex-shrink-0">Name Match</span>
              {/* Correlation indicator */}
              <span className={`text-xs font-body ${correlationColor}`}>• {correlationBucket}</span>
            </div>
            <span
              className={`text-xs font-pixel ${getDecisionColor(nameMatch.decision)} flex-shrink-0`}
            >
              {getDecisionLabel(nameMatch.decision)}
            </span>
          </div>
        </div>

        {/* Expanded Section - Always show for Name Match */}
        <div className="border-t border-primary/10">
          {/* Correlation Score */}
          <div className="px-3 py-2 bg-background-dark/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-body">Correlation Score</span>
              {nameMatch.correlation_score !== null &&
                nameMatch.correlation_score !== undefined && (
                  <span className={`text-sm font-pixel ${correlationColor}`}>
                    {nameMatch.correlation_score.toFixed(3)}
                  </span>
                )}
            </div>
          </div>

          {/* Names Display */}
          <div className="px-3 pb-2">
            <div className="pt-2 space-y-1.5">
              <div className="flex gap-2">
                <span className="text-xs text-neutral-400 font-body flex-shrink-0 w-24">
                  Customer:
                </span>
                <span className="text-xs text-neutral-100 font-body">
                  {nameMatch.customer_name || customerName || 'Unknown'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-xs text-neutral-400 font-body flex-shrink-0 w-24">
                  Matched:
                </span>
                <span className="text-xs text-neutral-100 font-body">
                  {nameMatch.matched_name || 'Not found'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // INFO mode - show all names on account
    return (
      <div className="border border-primary/20 rounded-pixel bg-background-dark/50">
        {/* Module Header */}
        <div className="w-full px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-neutral-200">Name Match</span>
            <span className="text-xs font-pixel text-primary">INFO</span>
          </div>
        </div>

        {/* Expanded Section - Names List */}
        <div className="border-t border-primary/10">
          <div className="px-3 py-2 bg-background-dark/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-body">Names on Account</span>
            </div>
          </div>

          <div className="px-3 pb-2">
            <div className="pt-2 space-y-1.5">
              {nameMatch.names_on_account && nameMatch.names_on_account.length > 0 ? (
                nameMatch.names_on_account.map((name: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-xs text-primary font-mono flex-shrink-0">•</span>
                    <span className="text-xs text-neutral-400 font-body">{name}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500 font-body">No additional names available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

interface AccountValidationDisplayProps {
  accountValidation?: {
    decision: string;
    reason?: string | null;
    codes?: string[];
  };
  messages?: Record<string, string>;
  isExpanded: boolean;
  showInfoMode: boolean;
}

export const AccountValidationDisplay: React.FC<AccountValidationDisplayProps> = ({
  accountValidation: accountVal,
  messages,
  isExpanded,
  showInfoMode,
}) => {
  if (!accountVal) {
    return null;
  }

  const riskCodes = accountVal.codes?.filter((code: string) => code.startsWith('BR')) ?? [];
  const infoCodes = accountVal.codes?.filter((code: string) => code.startsWith('BI')) ?? [];

  // Collapsed state - just header with decision badge
  if (!isExpanded) {
    return (
      <div className="border border-primary/20 rounded-pixel bg-background-dark/50">
        <div className="w-full px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-neutral-200">Account Validation</span>
            <span className={`text-xs font-pixel ${getDecisionColor(accountVal.decision)}`}>
              {getDecisionLabel(accountVal.decision)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Expanded state
  if (!showInfoMode) {
    // Show BR-codes (risk codes)
    return (
      <div className="border border-primary/20 rounded-pixel bg-background-dark/50">
        {/* Module Header */}
        <div className="w-full px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-neutral-200">Account Validation</span>
            <span className={`text-xs font-pixel ${getDecisionColor(accountVal.decision)}`}>
              {getDecisionLabel(accountVal.decision)}
            </span>
          </div>
        </div>

        {/* Expanded Section - Always show for Account Validation */}
        <div className="border-t border-primary/10">
          {/* Reason if available */}
          {accountVal.reason && (
            <div className="px-3 py-2 bg-background-dark/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-body">Reason</span>
              </div>
            </div>
          )}

          {/* Risk Codes */}
          <div className="px-3 pb-2">
            {accountVal.reason && (
              <div className="pt-2 pb-2">
                <p className="text-xs text-neutral-100 font-body">{accountVal.reason}</p>
              </div>
            )}
            {riskCodes.length > 0 && (
              <div className="pt-2 space-y-1.5">
                {riskCodes.map((code: string) => (
                  <div key={code} className="flex gap-2">
                    <span className="text-xs text-accent font-mono flex-shrink-0">{code}</span>
                    <span className="text-xs text-neutral-400 font-body">
                      {messages?.[code] || 'Risk signal detected'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {riskCodes.length === 0 && !accountVal.reason && (
              <div className="pt-2">
                <p className="text-xs text-neutral-500 font-body">No risk signals</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    // INFO mode - show BI-codes (information codes)
    return (
      <div className="border border-primary/20 rounded-pixel bg-background-dark/50">
        {/* Module Header */}
        <div className="w-full px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-neutral-200">Account Validation</span>
            <span className="text-xs font-pixel text-primary">INFO</span>
          </div>
        </div>

        {/* Expanded Section - Info Codes */}
        <div className="border-t border-primary/10">
          <div className="px-3 py-2 bg-background-dark/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-body">Insights</span>
            </div>
          </div>

          <div className="px-3 pb-2">
            <div className="pt-2 space-y-1.5">
              {infoCodes.map((code: string) => (
                <div key={code} className="flex gap-2">
                  <span className="text-xs text-primary font-mono flex-shrink-0">{code}</span>
                  <span className="text-xs text-neutral-400 font-body">
                    {messages?.[code] || 'Information signal'}
                  </span>
                </div>
              ))}
              {infoCodes.length === 0 && (
                <p className="text-xs text-neutral-500 font-body">No insights</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

interface AccountStatusDisplayProps {
  status: string;
}

/**
 * Helper function to determine account status based on paykey status.
 * - active or review → OPEN
 * - rejected → CLOSED
 * - Any other status defaults to CLOSED for safety
 */
const getAccountStatus = (paykeyStatus: string): 'OPEN' | 'CLOSED' => {
  return ['active', 'review'].includes(paykeyStatus) ? 'OPEN' : 'CLOSED';
};

/**
 * AccountStatusDisplay - Static verification module (header only, no expansion)
 *
 * Shows account status based on paykey status:
 * - OPEN (green) for active/review paykeys
 * - CLOSED (red) for rejected/inactive paykeys
 *
 * Only displayed for plaid/straddle/quiltt paykeys (not bank_account).
 */
export const AccountStatusDisplay: React.FC<AccountStatusDisplayProps> = ({ status }) => {
  const accountStatus = getAccountStatus(status);
  const statusColor = accountStatus === 'OPEN' ? 'text-green-500' : 'text-accent';

  return (
    <div className="border border-primary/20 rounded-pixel bg-background-dark/50">
      <div className="w-full px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-body text-neutral-200">Account Status</span>
          <span className={`text-xs font-pixel ${statusColor}`}>{accountStatus}</span>
        </div>
      </div>
    </div>
  );
};
