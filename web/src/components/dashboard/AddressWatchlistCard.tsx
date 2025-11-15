import React, { useState } from 'react';
import type { Customer } from '@/lib/api';
import { cn } from '@/components/ui/utils';

interface AddressWatchlistCardProps {
  customer: Customer;
}

export const AddressWatchlistCard: React.FC<AddressWatchlistCardProps> = ({ customer }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const watchlist = customer.review?.watch_list;

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
          <span className="text-xs font-body text-neutral-200">Address Watchlist</span>
          {hasMatches && watchlist.matches && (
            <span className="text-xs text-accent">• {watchlist.matches.length} matches</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'text-xs font-pixel',
            hasMatches ? 'text-accent' : 'text-green-500'
          )}>
            {hasMatches ? 'FLAGGED' : 'CLEAR'}
          </span>
          <span className="text-xs text-neutral-500">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-primary/10">
          <div className="px-3 py-2 bg-background-dark/30">
            {hasMatches && watchlist.matches ? (
              <div className="space-y-3">
                {watchlist.matches.map((match, idx) => (
                  <div key={idx} className="border border-primary/20 rounded-pixel p-2 bg-background-dark/20">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-pixel text-accent">{match.list_name}</span>
                      {match.correlation && (
                        <span className="text-xs text-neutral-500 font-mono">
                          {match.correlation}
                        </span>
                      )}
                    </div>

                    {match.match_fields && match.match_fields.length > 0 && (
                      <div>
                        <span className="text-xs text-neutral-500 font-body block mb-1">
                          Matched Fields:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {match.match_fields.map((field, fieldIdx) => (
                            <span
                              key={fieldIdx}
                              className="px-2 py-0.5 bg-accent/10 border border-accent/30 text-accent text-xs font-mono rounded-pixel"
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
