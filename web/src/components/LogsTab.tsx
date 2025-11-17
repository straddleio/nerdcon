import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/components/ui/utils';
import { useDemoStore } from '@/lib/state';
import { API_BASE_URL } from '@/lib/api';

type LogEntryType = 'straddle-req' | 'straddle-res' | 'webhook';

interface WebhookPayload {
  data?: {
    id?: string;
  };
}

interface LogStreamEntry {
  id: string;
  timestamp: string;
  type: LogEntryType;
  method?: string;
  path?: string;
  requestBody?: unknown;
  statusCode?: number;
  responseBody?: unknown;
  duration?: number;
  eventType?: string;
  eventId?: string;
  webhookPayload?: WebhookPayload;
  requestId?: string;
}

export const LogsTab: React.FC = () => {
  const [logStream, setLogStream] = useState<LogStreamEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<LogStreamEntry | null>(null);

  const customer = useDemoStore((state) => state.customer);
  const paykey = useDemoStore((state) => state.paykey);
  const charge = useDemoStore((state) => state.charge);

  // Memoize filtered log stream for performance
  const filteredLogStream = useMemo((): LogStreamEntry[] => {
    return logStream.filter((entry): boolean => {
      // Only show webhooks for current resources
      if (entry.type === 'webhook') {
        const resourceId = entry.webhookPayload?.data?.id;
        if (!resourceId) {
          return false;
        }

        return (
          resourceId === customer?.id || resourceId === paykey?.id || resourceId === charge?.id
        );
      }

      // Show all Straddle request/response entries (straddle-req, straddle-res)
      return true;
    });
  }, [logStream, customer?.id, paykey?.id, charge?.id]);

  useEffect(() => {
    const fetchStream = async (): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE_URL}/log-stream`);
        if (response.ok) {
          const data: unknown = await response.json();
          if (Array.isArray(data)) {
            setLogStream(data as LogStreamEntry[]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch log stream:', error);
      }
    };

    void fetchStream();
    const interval = setInterval(() => {
      void fetchStream();
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const getTypeColor = (type: LogEntryType): string => {
    switch (type) {
      case 'straddle-req':
        return 'text-gold';
      case 'straddle-res':
        return 'text-primary';
      case 'webhook':
        return 'text-accent';
      default:
        return 'text-neutral-400';
    }
  };

  const getTypeIcon = (type: LogEntryType): string => {
    switch (type) {
      case 'straddle-req':
        return '⇉';
      case 'straddle-res':
        return '⇇';
      case 'webhook':
        return '⚡';
      default:
        return '•';
    }
  };

  const getTypeLabel = (type: LogEntryType): string => {
    switch (type) {
      case 'straddle-req':
        return 'STRADDLE REQ';
      case 'straddle-res':
        return 'STRADDLE RES';
      case 'webhook':
        return 'WEBHOOK';
      default:
        return type;
    }
  };

  return (
    <div className="h-full flex bg-background-dark font-mono text-sm">
      {/* Left: Console-style log stream */}
      <div className="flex-1 p-4 overflow-y-auto scrollbar-retro">
        <div className="mb-4">
          <h2 className="text-lg font-pixel text-secondary mb-1">DEVELOPER LOGS</h2>
          <p className="text-xs text-neutral-500">
            Chronological stream of all requests, responses, and webhooks
          </p>
        </div>

        <div className="space-y-1">
          {logStream.length === 0 ? (
            <div className="text-neutral-600">No log entries yet...</div>
          ) : (
            filteredLogStream.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className={cn(
                  'flex items-start gap-3 px-2 py-1 cursor-pointer hover:bg-background-card/20 rounded',
                  selectedEntry?.id === entry.id && 'bg-background-card/40'
                )}
              >
                {/* Timestamp */}
                <span className="text-neutral-600 text-xs w-24 flex-shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                  .{new Date(entry.timestamp).getMilliseconds().toString().padStart(3, '0')}
                </span>

                {/* Type icon */}
                <span className={cn('w-4 flex-shrink-0', getTypeColor(entry.type))}>
                  {getTypeIcon(entry.type)}
                </span>

                {/* Type label */}
                <span className={cn('w-32 flex-shrink-0 font-bold', getTypeColor(entry.type))}>
                  {getTypeLabel(entry.type)}
                </span>

                {/* Content */}
                <span className="flex-1 text-neutral-300">
                  {entry.method && `${entry.method} `}
                  {entry.path}
                  {entry.statusCode && ` [${entry.statusCode}]`}
                  {entry.duration && ` ${entry.duration}ms`}
                  {entry.eventType}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Detail panel */}
      {selectedEntry && (
        <div className="w-1/2 border-l-2 border-secondary/30 p-4 overflow-y-auto scrollbar-retro">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className={cn('text-2xl', getTypeColor(selectedEntry.type))}>
                {getTypeIcon(selectedEntry.type)}
              </span>
              <h3 className={cn('text-lg font-pixel', getTypeColor(selectedEntry.type))}>
                {getTypeLabel(selectedEntry.type)}
              </h3>
            </div>
            <div className="text-xs text-neutral-500">
              {new Date(selectedEntry.timestamp).toLocaleString()}
            </div>
            {selectedEntry.requestId && (
              <div className="text-xs text-neutral-600 mt-1">
                Request ID: {selectedEntry.requestId}
              </div>
            )}
          </div>

          {/* Request Body */}
          {selectedEntry.requestBody !== undefined && (
            <div className="mb-4">
              <h4 className="text-xs text-neutral-400 mb-2">Request Body:</h4>
              <pre className="p-3 bg-background-card border border-secondary/20 rounded text-xs text-neutral-300 overflow-x-auto scrollbar-retro">
                {JSON.stringify(selectedEntry.requestBody, null, 2)}
              </pre>
            </div>
          )}

          {/* Response Body */}
          {selectedEntry.responseBody !== undefined && (
            <div className="mb-4">
              <h4 className="text-xs text-neutral-400 mb-2">Response Body:</h4>
              <pre className="p-3 bg-background-card border border-secondary/20 rounded text-xs text-neutral-300 overflow-x-auto scrollbar-retro">
                {JSON.stringify(selectedEntry.responseBody, null, 2)}
              </pre>
            </div>
          )}

          {/* Webhook Payload */}
          {selectedEntry.webhookPayload && (
            <div className="mb-4">
              <h4 className="text-xs text-neutral-400 mb-2">Webhook Payload:</h4>
              <pre className="p-3 bg-background-card border border-secondary/20 rounded text-xs text-neutral-300 overflow-x-auto scrollbar-retro">
                {JSON.stringify(selectedEntry.webhookPayload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
