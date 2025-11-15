import React, { useState } from 'react';
import type { Customer } from '@/lib/api';
import { cn } from '@/components/ui/utils';

interface AddressWatchlistCardProps {
  customer: Customer;
  isExpanded?: boolean;
}

export const AddressWatchlistCard: React.FC<AddressWatchlistCardProps> = ({ customer, isExpanded: parentExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const watchlist = customer.review?.watch_list;

  // Use parent expansion state if provided
  const expanded = parentExpanded || isExpanded;

  if (!watchlist) {
    return null;
  }

  const hasMatches = watchlist.matches && watchlist.matches.length > 0;

  return (
    <div className="border border-primary/20 rounded-pixel bg-background-dark/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-primary/5"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-body text-neutral-200">Watchlist</span>
          {hasMatches && watchlist.matches && (
            <span className="text-xs text-neutral-400">• {watchlist.matches.length} matches</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'text-xs font-pixel',
            hasMatches ? 'text-gold' : 'text-green-500'
          )}>
            {hasMatches ? 'FLAGGED' : 'CLEAR'}
          </span>
          <span className="text-xs text-neutral-500">
            {expanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-primary/10">
          <div className="px-3 py-2 bg-background-dark/30">
            {hasMatches && watchlist.matches ? (
              <div className="space-y-3">
                {watchlist.matches.map((match, idx) => (
                  <div key={idx} className="border border-primary/20 rounded-pixel p-2 bg-background-dark/20">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-body text-neutral-200 flex-shrink-0">{match.list_name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {match.correlation && (
                          <span className="text-xs text-neutral-500 font-mono">
                            {match.correlation}
                          </span>
                        )}
                        {/* View Source links - only rendered when API returns match.urls array */}
                        {match.urls && match.urls.length > 0 && (
                          <div className="flex items-center gap-1">
                            {match.urls.map((url, urlIdx) => (
                              <a
                                key={urlIdx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 border border-primary/30 text-primary text-xs font-body rounded-pixel hover:bg-primary/20 hover:border-primary/50 transition-all whitespace-nowrap"
                              >
                                <span>View Source</span>
                                <span className="text-[10px]">↗</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {match.match_fields && match.match_fields.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-neutral-500 font-body flex-shrink-0">
                          Matched Fields:
                        </span>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {match.match_fields.map((field, fieldIdx) => (
                            <span
                              key={fieldIdx}
                              className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-neutral-300 text-xs font-mono rounded-pixel"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-neutral-400 font-body">
                <span className="text-green-500">✓</span> No watchlist matches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
