import React, { useState } from 'react';
import { cn } from './ui/utils';
import { triggerApproveAnimation, triggerRejectAnimation } from '@/lib/animations';
import { playApproveSound, playRejectSound } from '@/lib/sounds';

type CustomerReviewData = {
  type: 'customer';
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  verificationSummary?: Record<string, string>;
  legal_business_name?: string;
  website?: string;
  ein?: string;
  codes?: string[];
};

type PaykeyReviewData = {
  type: 'paykey';
  id: string;
  customerName: string;
  institution: string;
  balance: number;
  status: string;
  verificationSummary?: Record<string, string>;
};

type ReviewData = CustomerReviewData | PaykeyReviewData;

interface ReviewDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecision: (decision: 'verified' | 'rejected' | 'approved') => Promise<void>;
  data: ReviewData;
}

export const ReviewDecisionModal: React.FC<ReviewDecisionModalProps> = ({
  isOpen,
  onClose,
  onDecision,
  data,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleApprove = async (): Promise<void> => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    // Trigger animation and sound
    const cleanup = triggerApproveAnimation();
    void playApproveSound();

    // Call decision handler
    const decision = data.type === 'customer' ? 'verified' : 'approved';
    await onDecision(decision);

    // Close modal after animation
    setTimeout(() => {
      cleanup();
      onClose();
      setIsProcessing(false);
    }, 1000);
  };

  const handleReject = async (): Promise<void> => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    // Trigger animation and sound
    const cleanup = triggerRejectAnimation();
    void playRejectSound();

    // Call decision handler
    await onDecision('rejected');

    // Close modal after animation
    setTimeout(() => {
      cleanup();
      onClose();
      setIsProcessing(false);
    }, 1500);
  };

  // Helper to determine code color
  const getCodeColor = (code: string): string => {
    if (code.startsWith('BI')) {
      return 'text-green-500'; // Insight/Verified
    }
    if (code.startsWith('BR')) {
      return 'text-accent-red'; // Risk
    }
    if (code.startsWith('BV')) {
      return 'text-gold'; // Verification/Standing
    }
    return 'text-neutral-400';
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg mx-4">
        {/* Modal Card */}
        <div className="border-4 border-primary bg-background rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.5)]">
          {/* Header */}
          <div className="border-b-4 border-primary bg-primary/10 px-6 py-4">
            <h2 className="text-2xl font-pixel text-primary text-center">
              ⚔️ COMPLIANCE CHALLENGE ⚔️
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-4">
            {data.type === 'customer' ? (
              <>
                <div className="text-center mb-4">
                  <p className="text-xl font-body text-neutral-100">{data.name}</p>
                  <p className="text-sm text-neutral-400">{data.email}</p>
                  <p className="text-sm text-neutral-400">{data.phone}</p>
                  {data.legal_business_name && (
                    <p className="text-xs text-primary mt-1 font-pixel">
                      BUSINESS: {data.legal_business_name}
                    </p>
                  )}
                  {data.website && <p className="text-xs text-neutral-500">{data.website}</p>}
                  {data.ein && <p className="text-xs text-neutral-500">EIN: {data.ein}</p>}
                </div>

                {data.verificationSummary && (
                  <div className="border border-primary/20 rounded-pixel bg-background-dark/50 p-4">
                    <p className="text-xs text-neutral-400 font-body mb-2">Verification Summary</p>
                    <div className="space-y-1">
                      {Object.entries(data.verificationSummary).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-neutral-300 capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span
                            className={cn(
                              'font-pixel',
                              value === 'accept'
                                ? 'text-green-500'
                                : value === 'review'
                                  ? 'text-gold'
                                  : 'text-accent'
                            )}
                          >
                            {value.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Business Identity Codes Display */}
                {data.codes && data.codes.length > 0 && (
                  <div className="border border-primary/20 rounded-pixel bg-background-dark/50 p-4 mt-2">
                    <p className="text-xs text-neutral-400 font-body mb-2">
                      Business Identity Codes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.codes.map((code) => (
                        <span
                          key={code}
                          className={cn(
                            'text-xs font-pixel px-2 py-1 bg-background rounded border border-white/10',
                            getCodeColor(code)
                          )}
                          title={code} // Tooltip could be added here if we had descriptions
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <p className="text-xl font-body text-neutral-100">{data.institution}</p>
                  <p className="text-sm text-neutral-400">{data.customerName}</p>
                  <p className="text-lg text-primary font-bold mt-2">${data.balance.toFixed(2)}</p>
                </div>

                {data.verificationSummary && (
                  <div className="border border-primary/20 rounded-pixel bg-background-dark/50 p-4">
                    <p className="text-xs text-neutral-400 font-body mb-2">Verification Summary</p>
                    <div className="space-y-1">
                      {Object.entries(data.verificationSummary).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-neutral-300 capitalize">{key}:</span>
                          <span
                            className={cn(
                              'font-pixel',
                              value === 'accept'
                                ? 'text-green-500'
                                : value === 'review'
                                  ? 'text-gold'
                                  : 'text-accent'
                            )}
                          >
                            {value.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="pt-4 border-t border-primary/20">
              <p className="text-center text-sm text-neutral-400 font-body mb-4">
                RENDER YOUR VERDICT
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => void handleApprove()}
                  disabled={isProcessing}
                  className={cn(
                    'flex-1 px-6 py-3 font-pixel text-lg',
                    'border-2 border-green-500 bg-green-500/10 text-green-500',
                    'hover:bg-green-500/20 hover:border-green-400',
                    'rounded-pixel transition-all',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  APPROVE
                </button>

                <button
                  onClick={() => void handleReject()}
                  disabled={isProcessing}
                  className={cn(
                    'flex-1 px-6 py-3 font-pixel text-lg',
                    'border-2 border-accent bg-accent/10 text-accent',
                    'hover:bg-accent/20 hover:border-accent',
                    'rounded-pixel transition-all',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  REJECT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
