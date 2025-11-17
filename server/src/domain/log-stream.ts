/**
 * Chronological log stream for hardcore developer view
 * Captures every request, response, and webhook as separate entries
 */

export type LogEntryType =
  | 'request'      // Incoming request to our server
  | 'response'     // Outgoing response from our server
  | 'straddle-req' // Outgoing request to Straddle
  | 'straddle-res' // Incoming response from Straddle
  | 'webhook';     // Incoming webhook from Straddle

export interface LogStreamEntry {
  id: string;
  timestamp: string;
  type: LogEntryType;

  // For requests
  method?: string;
  path?: string;
  requestBody?: unknown;

  // For responses
  statusCode?: number;
  responseBody?: unknown;
  duration?: number;

  // For webhooks
  eventType?: string;
  eventId?: string;
  webhookPayload?: unknown;

  // Correlation
  requestId?: string;
  correlationId?: string;
}

const logStream: LogStreamEntry[] = [];
const MAX_ENTRIES = 200;

export function addLogEntry(entry: Omit<LogStreamEntry, 'id'>): void {
  logStream.unshift({
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  });

  if (logStream.length > MAX_ENTRIES) {
    logStream.pop();
  }
}

export function getLogStream(): LogStreamEntry[] {
  return [...logStream];
}

export function clearLogStream(): void {
  logStream.length = 0;
}
