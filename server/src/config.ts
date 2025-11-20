import dotenv from 'dotenv';

dotenv.config();

// Normalize CORS_ORIGIN to ensure it has https:// protocol in production
function normalizeCorsOrigin(origin: string | undefined): string {
  if (!origin) {
    return 'http://localhost:5173';
  }
  // If it already has a protocol, use as-is
  if (origin.startsWith('http://') || origin.startsWith('https://')) {
    return origin;
  }
  // Render's fromService.property gives hostname without protocol - add https://
  return `https://${origin}`;
}

export const config = {
  straddle: {
    apiKey: process.env.STRADDLE_API_KEY || '',
    environment: (process.env.STRADDLE_ENV as 'sandbox' | 'production') || 'sandbox',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: normalizeCorsOrigin(process.env.CORS_ORIGIN),
  },
  webhook: {
    secret: process.env.WEBHOOK_SECRET || '',
    ngrokUrl: process.env.NGROK_URL || '',
  },
  plaid: {
    processorToken: process.env.PLAID_PROCESSOR_TOKEN || '',
  },
  generator: {
    url: process.env.GENERATOR_URL || 'http://localhost:8081',
  },
  features: {
    enableUnmask: process.env.ENABLE_UNMASK === 'true',
    enableLogStream: process.env.ENABLE_LOG_STREAM === 'true',
  },
} as const;
