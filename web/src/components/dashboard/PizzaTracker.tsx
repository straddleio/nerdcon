import React from 'react';
import {
  RetroCard,
  RetroCardHeader,
  RetroCardTitle,
  RetroCardContent,
} from '@/components/ui/retro-components';
import { cn } from '@/components/ui/utils';
import { ChargeStatusIcon } from '@/components/ui/ChargeStatusIcon';
import { useDemoStore } from '@/lib/state';

interface StatusHistoryEntry {
  status: string;
  message?: string;
  changed_at?: string;
  timestamp?: string;
  reason?: string;
  source?: string;
}

/**
 * Pizza Tracker - Charge Lifecycle Visualizer
 * Shows: Status history with messages and friendly timestamps
 * Webhook-driven status updates
 *
 * Phase 3A: Placeholder with realistic status_history structure
 * Phase 3D: Will update via SSE webhooks
 */
export const PizzaTracker: React.FC = () => {
  const charge = useDemoStore((state) => state.charge);

  if (!charge) {
    return (
      <RetroCard variant="gold" className="w-full">
        <RetroCardHeader>
          <RetroCardTitle>Charge Lifecycle</RetroCardTitle>
        </RetroCardHeader>
        <RetroCardContent>
          <p className="text-neutral-400 text-sm">No charge to track. Run /create-charge</p>
        </RetroCardContent>
      </RetroCard>
    );
  }

  // Use real status_history from charge or fallback to single current status
  const apiHistory = charge.status_history || [
    {
      status: charge.status,
      timestamp: new Date().toISOString(),
    },
  ];

  // Render ALL status_history entries without filtering duplicates
  // This ensures the complete webhook audit trail is visible
  const statusHistory: StatusHistoryEntry[] = apiHistory;

  // Current status is the last entry in the history
  const currentStatus = statusHistory[statusHistory.length - 1]?.status || 'created';

  const getStepColor = (status: string, isLatest: boolean) => {
    if (status === 'paid') {
      return 'text-primary border-primary bg-primary/10';
    }
    if (isLatest) {
      return 'text-gold border-gold bg-gold/10';
    }
    return 'text-secondary border-secondary bg-secondary/10';
  };

  const getConnectorColor = (index: number) => {
    // All connectors before the last entry are complete
    if (index < statusHistory.length - 1) {
      return 'bg-primary';
    }
    return 'bg-neutral-700';
  };

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) {return null;}
    try {
      const date = new Date(timestamp);
      // Format as: Nov 12, 8:05 PM
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <RetroCard variant="gold" className="w-full">
      <RetroCardHeader>
        <div className="flex items-center justify-between">
          <RetroCardTitle>Charge Lifecycle</RetroCardTitle>
          <p className="text-xs font-pixel text-gold">{currentStatus.toUpperCase()}</p>
        </div>
      </RetroCardHeader>
      <RetroCardContent>
        {/* Horizontal tracker row - displays all status_history entries */}
        <div className="flex items-start justify-between gap-2">
          {statusHistory.map((entry, index) => {
            const isLatest = index === statusHistory.length - 1;

            return (
              <React.Fragment key={index}>
                {/* Step Column */}
                <div className="flex-1 flex flex-col items-center min-w-0">
                  {/* Icon Circle */}
                  <div
                    className={cn(
                      'w-10 h-10 flex items-center justify-center border-2 rounded-pixel transition-all flex-shrink-0',
                      getStepColor(entry.status, isLatest)
                    )}
                  >
                    <ChargeStatusIcon
                      status={entry.status}
                      className="w-5 h-5"
                    />
                  </div>

                  {/* Step Label */}
                  <p
                    className={cn(
                      'font-body text-xs font-bold mt-2 text-center',
                      entry.status === 'paid' ? 'text-primary' :
                      isLatest ? 'text-gold' :
                      'text-secondary'
                    )}
                  >
                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                  </p>

                  {/* Timestamp */}
                  <p className="text-xs text-neutral-500 font-mono mt-1 text-center">
                    {formatTimestamp(entry.changed_at)}
                  </p>

                  {/* Message */}
                  {entry.message && (
                    <p className="text-xs text-neutral-400 font-body leading-relaxed mt-2 text-center px-1 break-words">
                      {entry.message}
                    </p>
                  )}
                </div>

                {/* Horizontal Connector (except for last step) */}
                {index < statusHistory.length - 1 && (
                  <div className="flex items-center pt-5 flex-shrink-0">
                    <div
                      className={cn(
                        'h-1 w-8 transition-all',
                        getConnectorColor(index)
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </RetroCardContent>
    </RetroCard>
  );
};
