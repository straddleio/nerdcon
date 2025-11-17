import React, { useState } from 'react';
import { cn } from '@/components/ui/utils';
import type { APILogEntry } from '@/lib/state';

interface APILogInlineProps {
  entry: APILogEntry;
}

/**
 * Format JSON with syntax highlighting using retro color scheme
 */
const formatJSON = (obj: unknown): string => {
  if (!obj) {
    return '// No data';
  }

  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return '// Invalid JSON';
  }
};

/**
 * Syntax highlight JSON string
 */
const highlightJSON = (jsonString: string): React.ReactNode => {
  // Simple regex-based syntax highlighting
  const parts = jsonString.split(/("(?:[^"\\]|\\.)*")|(\d+)|(\btrue\b|\bfalse\b|\bnull\b)/g);

  return parts.map((part, i) => {
    if (!part) {
      return null;
    }

    // String (includes quotes)
    if (part.startsWith('"')) {
      // Check if it's a key (followed by :) or value
      const isKey =
        jsonString.indexOf(part) !== -1 &&
        jsonString[jsonString.indexOf(part) + part.length]?.trim() === ':';

      return (
        <span key={i} className={isKey ? 'text-secondary' : 'text-accent-green'}>
          {part}
        </span>
      );
    }

    // Number
    if (/^\d+$/.test(part)) {
      return (
        <span key={i} className="text-gold">
          {part}
        </span>
      );
    }

    // Boolean/null
    if (/^(true|false|null)$/.test(part)) {
      return (
        <span key={i} className="text-primary">
          {part}
        </span>
      );
    }

    // Default (punctuation, whitespace)
    return (
      <span key={i} className="text-neutral-400">
        {part}
      </span>
    );
  });
};

/**
 * Inline API request log that appears after terminal commands
 * Compact format with expandable request/response details
 */
export const APILogInline: React.FC<APILogInlineProps> = ({ entry }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) {
      return 'text-accent-green';
    }
    if (status >= 400 && status < 500) {
      return 'text-gold';
    }
    if (status >= 500) {
      return 'text-accent-red';
    }
    return 'text-neutral-400';
  };

  const getMethodColor = (method: string): string => {
    switch (method) {
      case 'GET':
        return 'text-secondary';
      case 'POST':
        return 'text-gold';
      case 'PATCH':
        return 'text-primary';
      case 'DELETE':
        return 'text-accent-red';
      default:
        return 'text-neutral-400';
    }
  };

  return (
    <div className="border-l-2 border-primary/30 ml-2 pl-3 my-1 hover:border-primary/60 transition-all duration-200">
      {/* Compact Request Line */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-background-elevated/30 p-1 rounded transition-all duration-200 hover:shadow-sm"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-primary/60 text-[10px] font-pixel">API</span>
        <span className={cn('font-pixel text-[10px] font-bold', getMethodColor(entry.method))}>
          {entry.method}
        </span>
        <span className="text-neutral-400 font-mono text-[10px] flex-1 truncate">{entry.path}</span>
        <span className={cn('font-mono text-[10px] font-bold', getStatusColor(entry.statusCode))}>
          {entry.statusCode}
        </span>
        <span className="text-neutral-500 font-mono text-[10px]">{entry.duration}ms</span>
        <span className="text-[10px] text-primary/60">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-2 space-y-2 text-[10px]">
          {/* Request/Response Split */}
          <div className="grid grid-cols-2 gap-2">
            {/* Request */}
            <div>
              <div className="text-neutral-500 font-pixel mb-1 text-[9px]">Request</div>
              <pre className="p-2 bg-background-dark border border-primary/20 rounded font-mono overflow-x-auto scrollbar-retro max-h-48 text-[10px] leading-relaxed">
                <code>{highlightJSON(formatJSON(entry.requestBody))}</code>
              </pre>
            </div>

            {/* Response */}
            <div>
              <div className="text-neutral-500 font-pixel mb-1 text-[9px]">Response</div>
              <pre className="p-2 bg-background-dark border border-secondary/20 rounded font-mono overflow-x-auto scrollbar-retro max-h-48 text-[10px] leading-relaxed">
                <code>{highlightJSON(formatJSON(entry.responseBody))}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
