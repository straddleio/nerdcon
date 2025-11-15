import React, { useState, useEffect } from 'react';
import { cn } from '@/components/ui/utils';
import { useDemoStore } from '@/lib/state';

/**
 * API Request Log with expandable entries
 * Shows: method, path, status, timing
 * Expandable: request/response in split code boxes
 * Hidden by default: request ID, idempotency key
 */
export const APILog: React.FC = () => {
  const apiLogs = useDemoStore((state) => state.apiLogs);
  const setApiLogs = useDemoStore((state) => state.setApiLogs);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [autoExpandTimeout, setAutoExpandTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-expand most recent log entry
  useEffect(() => {
    if (apiLogs.length === 0) return;

    const latestIndex = apiLogs.length - 1;

    // Clear any pending timeout
    if (autoExpandTimeout) {
      clearTimeout(autoExpandTimeout);
    }

    // Expand latest immediately
    setExpandedId(latestIndex);

    // After 3 seconds, keep it expanded (user can manually collapse)
    // This gives buffer for rapid sequences - only latest stays expanded
    const timeout = setTimeout(() => {
      // Check if this is still the latest
      const currentLatest = useDemoStore.getState().apiLogs.length - 1;
      if (latestIndex !== currentLatest) {
        // A newer request came in, this will be collapsed by the new one
        setExpandedId(currentLatest);
      }
    }, 3000);

    setAutoExpandTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [apiLogs.length, autoExpandTimeout]); // Only trigger on new logs

  // Fetch logs from backend on mount and periodically
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/logs');
        if (response.ok) {
          const logs = await response.json();
          setApiLogs(logs);
        }
      } catch (error) {
        console.error('Failed to fetch API logs:', error);
      }
    };

    // Initial fetch
    fetchLogs();

    // Poll every 2 seconds
    const interval = setInterval(fetchLogs, 2000);

    return () => clearInterval(interval);
  }, [setApiLogs]);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-primary';
    if (status >= 400 && status < 500) return 'text-gold';
    if (status >= 500) return 'text-accent';
    return 'text-neutral-400';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'text-secondary';
      case 'POST':
        return 'text-gold';
      case 'PATCH':
        return 'text-primary';
      case 'DELETE':
        return 'text-accent';
      default:
        return 'text-neutral-400';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background-dark p-4 relative">
      {/* Background Logo - blended into dark background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/assets/nerdcon-logo.png)',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          opacity: 0.03,
          mixBlendMode: 'lighten',
        }}
      />

      {/* Header */}
      <div className="mb-3 pb-2 border-b border-secondary/30 relative z-10">
        <h3 className="text-xs font-pixel text-secondary leading-relaxed">
          API REQUEST LOG
        </h3>
        <p className="text-xs text-neutral-400 font-body mt-1">
          Real Straddle sandbox calls
        </p>
      </div>

      {/* Log Entries */}
      <div className="flex-1 overflow-y-auto scrollbar-retro space-y-2 relative z-10">
        {apiLogs.length === 0 ? (
          <p className="text-xs text-neutral-500 font-body">No requests yet...</p>
        ) : (
          apiLogs.map((entry, index) => (
            <div
              key={`api-log-${index}-${entry.timestamp}`}
              className="border border-secondary/30 bg-background-card/50 rounded-pixel hover:border-secondary/60 transition-colors"
            >
              {/* Compact Request Line */}
              <div
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-background-elevated/30 transition-colors"
                onClick={() => setExpandedId(expandedId === index ? null : index)}
              >
                <span className={cn('font-pixel text-xs font-bold', getMethodColor(entry.method))}>
                  {entry.method}
                </span>
                <span className="text-neutral-300 font-body text-xs flex-1 truncate">
                  {entry.path}
                </span>
                <span className={cn('font-body text-xs font-bold', getStatusColor(entry.statusCode))}>
                  {entry.statusCode}
                </span>
                <span className="text-neutral-500 font-body text-xs">{entry.duration}ms</span>

                {/* Expand/Collapse Indicator */}
                <span className="text-xs text-primary pointer-events-none">
                  {expandedId === index ? '▼' : '▶'}
                </span>
              </div>

              {/* Expanded View: Split Request/Response */}
              {expandedId === index && (
                <div className="border-t border-secondary/20 p-3 space-y-3">
                  {/* Metadata (shown when expanded) */}
                  <div className="space-y-1 text-xs font-body pb-2 border-b border-primary/10">
                    <div className="flex gap-2">
                      <span className="text-neutral-500 w-28">Request-Id:</span>
                      <span className="text-neutral-300 font-mono text-[10px]">{entry.requestId}</span>
                    </div>
                    {entry.idempotencyKey && (
                      <div className="flex gap-2">
                        <span className="text-neutral-500 w-28">Idempotency-Key:</span>
                        <span className="text-neutral-300 font-mono text-[10px]">{entry.idempotencyKey}</span>
                      </div>
                    )}
                  </div>

                  {/* Split Code Boxes: Request | Response */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Request Body */}
                    <div>
                      <div className="text-xs text-neutral-400 font-body mb-1 flex items-center gap-2">
                        <span>Request</span>
                        {entry.requestBody && (
                          <span className="text-[10px] text-neutral-600">
                            {JSON.stringify(entry.requestBody).length} chars
                          </span>
                        )}
                      </div>
                      <pre className="p-2 bg-background-dark border border-primary/20 rounded text-[10px] text-neutral-300 font-mono overflow-x-auto scrollbar-retro max-h-64">
                        {entry.requestBody
                          ? JSON.stringify(entry.requestBody, null, 2)
                          : '// No request body'}
                      </pre>
                    </div>

                    {/* Response Body */}
                    <div>
                      <div className="text-xs text-neutral-400 font-body mb-1 flex items-center gap-2">
                        <span>Response</span>
                        {entry.responseBody && (
                          <span className="text-[10px] text-neutral-600">
                            {JSON.stringify(entry.responseBody).length} chars
                          </span>
                        )}
                      </div>
                      <pre className="p-2 bg-background-dark border border-primary/20 rounded text-[10px] text-neutral-300 font-mono overflow-x-auto scrollbar-retro max-h-64">
                        {entry.responseBody
                          ? JSON.stringify(entry.responseBody, null, 2)
                          : '// No response body'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
