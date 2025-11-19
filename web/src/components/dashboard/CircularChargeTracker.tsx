import React, { useState, useMemo } from 'react';
import {
  RetroCard,
  RetroCardHeader,
  RetroCardTitle,
  RetroCardContent,
  RetroBadge,
} from '@/components/ui/retro-components';
import { cn } from '@/components/ui/utils';
import { useDemoStore } from '@/lib/state';
import { ChargeStatusIcon } from '@/components/ui/ChargeStatusIcon';
import { FiKey, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface CircularChargeTrackerProps {
  size?: 'normal' | 'large';
}

/**
 * Circular Charge Tracker - Featured animated progress display
 * Shows: Circular progress ring, current status, amount, payment rail
 * Animates based on charge status progression
 */
export const CircularChargeTracker: React.FC<CircularChargeTrackerProps> = ({ size = 'large' }) => {
  const charge = useDemoStore((state) => state.charge);
  const paykey = useDemoStore((state) => state.paykey);
  const [paykeyExpanded, setPaykeyExpanded] = useState(false);

  // Calculate progress based on status
  const progress = useMemo(() => {
    if (!charge) {
      return 0;
    }

    const statusSteps = ['created', 'scheduled', 'pending', 'paid'];
    const currentIndex = statusSteps.indexOf(charge.status);

    if (currentIndex === -1) {
      // Failed/cancelled states
      return charge.status_history?.length ? (charge.status_history.length / 5) * 100 : 25;
    }

    return ((currentIndex + 1) / statusSteps.length) * 100;
  }, [charge]);

  if (!charge) {
    return null;
  }

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

  // SVG circle parameters for progress ring
  const ringSize = size === 'large' ? 200 : 140;
  const strokeWidth = size === 'large' ? 12 : 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  // Helper functions for paykey display
  const truncateBankName = (name: string | undefined): string => {
    if (!name) {
      return 'Unknown Bank';
    }
    return name.split(',')[0].trim();
  };

  const last4 = paykey?.bank_data?.account_number
    ? paykey.bank_data.account_number.slice(-4)
    : paykey?.last4 || '0000';

  const balance = paykey?.balance?.account_balance ? paykey.balance.account_balance / 100 : 0;

  return (
    <RetroCard
      variant="gold"
      className={cn('w-full transition-all duration-500', 'hover:shadow-neon-gold')}
    >
      <RetroCardHeader>
        <div className="flex items-center justify-between">
          <RetroCardTitle>Charge Progress</RetroCardTitle>
          <RetroBadge variant={statusColor}>{charge.status.toUpperCase()}</RetroBadge>
        </div>
      </RetroCardHeader>
      <RetroCardContent>
        <div className="flex items-center justify-center py-6">
          {/* Circular Progress Container */}
          <div className="relative">
            {/* Background ring with rotating gradient effect */}
            <svg
              width={ringSize}
              height={ringSize}
              className="transform -rotate-90 animate-rotate-slow opacity-20"
            >
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth / 2}
                fill="none"
                className="text-gold"
              />
            </svg>

            {/* Main progress ring */}
            <svg
              width={ringSize}
              height={ringSize}
              className="absolute inset-0 transform -rotate-90"
            >
              {/* Background circle */}
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="none"
                className="text-neutral-800 opacity-30"
              />

              {/* Animated progress circle */}
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className={cn(
                  'transition-all duration-1000 ease-out',
                  charge.status === 'paid'
                    ? 'text-primary'
                    : charge.status === 'failed' || charge.status === 'cancelled'
                      ? 'text-accent'
                      : 'text-gold',
                  charge.status === 'pending' && 'animate-pulse-ring'
                )}
                style={{
                  filter: 'drop-shadow(0 0 8px currentColor)',
                }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Status Icon */}
              <ChargeStatusIcon
                status={charge.status}
                className={cn(
                  'w-12 h-12 mb-2',
                  charge.status === 'paid' && 'text-primary animate-pulse',
                  charge.status === 'pending' && 'text-gold animate-bounce'
                )}
              />

              {/* Amount */}
              <p className="text-3xl font-pixel text-neutral-100 mb-1">
                ${(charge.amount / 100).toFixed(2)}
              </p>

              {/* Progress Percentage */}
              <p className="text-xs text-neutral-500 font-mono">{Math.round(progress)}% Complete</p>
            </div>
          </div>
        </div>

        {/* Enhanced Payment Method CTA */}
        {paykey && (
          <div className="mb-4">
            <button
              onClick={() => setPaykeyExpanded(!paykeyExpanded)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-pixel transition-all',
                'bg-green-500/10 border border-green-500/40 text-green-500',
                'hover:bg-green-500/20 hover:border-green-500/60 hover:scale-105',
                'shadow-glow-green',
                'text-base font-body font-semibold'
              )}
              aria-label="Toggle paykey details"
            >
              <div className="flex items-center gap-2">
                <FiKey className="w-5 h-5 animate-pulse" />
                <span>Paykey</span>
              </div>
              {paykeyExpanded ? (
                <FiChevronUp className="w-5 h-5" />
              ) : (
                <FiChevronDown className="w-5 h-5" />
              )}
            </button>

            {paykeyExpanded && (
              <div className="mt-2 bg-green-500/5 border border-green-500/20 rounded-pixel p-3 space-y-2 animate-pixel-fade-in">
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
                  <div>
                    <p className="text-neutral-500 font-body mb-0.5">Balance</p>
                    <p className="text-neutral-100 font-body">
                      $
                      {balance.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500 font-body mb-0.5">Status</p>
                    <p className="text-green-500 font-body">{paykey.status.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Additional Info Row */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gold/20">
          <div className="text-center">
            <p className="text-xs text-neutral-500 font-body mb-1">Rail</p>
            <p className="text-sm font-body text-neutral-100">
              {railLabels[charge.payment_rail || 'ach'] || 'ACH'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-500 font-body mb-1">Date</p>
            <p className="text-sm font-body text-neutral-100">
              {charge.payment_date || new Date().toISOString().split('T')[0]}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-500 font-body mb-1">Steps</p>
            <p className="text-sm font-body text-neutral-100">
              {charge.status_history?.length || 1}
            </p>
          </div>
        </div>

        {/* Status Timeline - Compact horizontal */}
        {charge.status_history && charge.status_history.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gold/20">
            <p className="text-xs text-neutral-400 font-body mb-2">Status Timeline</p>
            <div className="flex items-center gap-1">
              {charge.status_history.map((entry, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex-1 h-2 rounded-pixel transition-all duration-300',
                    index === charge.status_history!.length - 1
                      ? entry.status === 'paid'
                        ? 'bg-primary'
                        : 'bg-gold'
                      : 'bg-secondary opacity-50'
                  )}
                  title={`${entry.status} - ${new Date(entry.timestamp || '').toLocaleString()}`}
                />
              ))}
            </div>
          </div>
        )}
      </RetroCardContent>
    </RetroCard>
  );
};
