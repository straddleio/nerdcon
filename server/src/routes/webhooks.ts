import { Router, Request, Response } from 'express';
import { eventBroadcaster } from '../domain/events.js';
import { stateManager } from '../domain/state.js';
import { addLogEntry } from '../domain/log-stream.js';
import { logger } from '../lib/logger.js';
import { ChargeStatusHistory } from '../domain/types.js';

const router = Router();

/**
 * TypeScript interfaces for webhook payloads
 */
interface WebhookEventBase extends Record<string, unknown> {
  event_type: string;
  event_id: string;
  account_id?: string;
  data: Record<string, unknown>;
}

interface CustomerWebhookData extends Record<string, unknown> {
  id: string;
  status?: string;
  risk_score?: number;
}

interface PaykeyWebhookData extends Record<string, unknown> {
  id: string;
  status: string;
}

interface ChargeStatusDetails {
  reason?: string;
  source?: string;
  message?: string;
  changed_at?: string;
}

interface ChargeWebhookData extends Record<string, unknown> {
  id: string;
  status: string;
  updated_at?: string;
  completed_at?: string;
  failure_reason?: string;
  status_details?: ChargeStatusDetails;
}

/**
 * Type guards for webhook validation
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isWebhookEvent(value: unknown): value is WebhookEventBase {
  if (!isRecord(value)) {
    return false;
  }
  return isString(value.event_type) && isString(value.event_id) && isRecord(value.data);
}

function isCustomerWebhookData(data: unknown): data is CustomerWebhookData {
  return isRecord(data) && isString(data.id);
}

function isPaykeyWebhookData(data: unknown): data is PaykeyWebhookData {
  return isRecord(data) && isString(data.id) && isString(data.status);
}

function isChargeWebhookData(data: unknown): data is ChargeWebhookData {
  return isRecord(data) && isString(data.id) && isString(data.status);
}

/**
 * POST /api/webhooks/straddle
 * Receive webhooks from Straddle
 */
router.post('/straddle', (req: Request, res: Response): void => {
  // Process synchronously - no async needed for webhook handling
  try {
    // Validate webhook payload structure
    const body = req.body as unknown;
    if (!isWebhookEvent(body)) {
      logger.warn('Invalid webhook payload', { body });
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }

    const webhookEvent = body;

    // Webhook structure: { event_type, event_id, account_id, data }
    logger.info('Received webhook', {
      event_type: webhookEvent.event_type,
      event_id: webhookEvent.event_id,
      resource_id: webhookEvent.data.id,
    });

    // Log webhook to stream (for Logs Tab)
    addLogEntry({
      timestamp: new Date().toISOString(),
      type: 'webhook',
      eventType: webhookEvent.event_type,
      eventId: webhookEvent.event_id,
      webhookPayload: webhookEvent,
    });

    // Broadcast webhook event to connected SSE clients
    eventBroadcaster.broadcast('webhook', webhookEvent);

    // Handle specific webhook events (format: resource.action.v1)
    switch (webhookEvent.event_type) {
      case 'customer.created.v1':
      case 'customer.event.v1': {
        // Update customer state if it matches current demo customer
        const state = stateManager.getState();
        if (
          state.customer &&
          isCustomerWebhookData(webhookEvent.data) &&
          webhookEvent.data.id === state.customer.id
        ) {
          stateManager.updateCustomer({
            verification_status: webhookEvent.data.status,
            risk_score: webhookEvent.data.risk_score,
          });
        }
        break;
      }

      case 'paykey.created.v1':
      case 'paykey.event.v1': {
        // Update paykey state
        const paykeyState = stateManager.getState();
        if (
          paykeyState.paykey &&
          isPaykeyWebhookData(webhookEvent.data) &&
          webhookEvent.data.id === paykeyState.paykey.id
        ) {
          stateManager.setPaykey({
            ...paykeyState.paykey,
            status: webhookEvent.data.status,
          });
        }
        break;
      }

      case 'charge.created.v1':
      case 'charge.event.v1': {
        // Update charge state
        const chargeState = stateManager.getState();
        if (
          chargeState.charge &&
          isChargeWebhookData(webhookEvent.data) &&
          webhookEvent.data.id === chargeState.charge.id
        ) {
          // Safely extract status_details
          const statusDetailsRaw = webhookEvent.data.status_details;
          const statusDetails = isRecord(statusDetailsRaw) ? statusDetailsRaw : undefined;

          // Build new status history entry from webhook data
          const newHistoryEntry: ChargeStatusHistory = {
            status: webhookEvent.data.status,
            timestamp: isString(webhookEvent.data.updated_at)
              ? webhookEvent.data.updated_at
              : new Date().toISOString(),
            reason:
              statusDetails && isString(statusDetails.reason) ? statusDetails.reason : undefined,
            source:
              statusDetails && isString(statusDetails.source) ? statusDetails.source : undefined,
            message:
              statusDetails && isString(statusDetails.message) ? statusDetails.message : undefined,
          };

          // Append to status_history unless it's a duplicate event
          const currentHistory = chargeState.charge.status_history || [];
          const lastEntry = currentHistory[currentHistory.length - 1];

          // Check if this is a true duplicate (same status, message, and timestamp)
          const isDuplicate =
            lastEntry !== undefined &&
            lastEntry.status === newHistoryEntry.status &&
            lastEntry.message === newHistoryEntry.message &&
            lastEntry.timestamp === newHistoryEntry.timestamp;

          let updatedHistory = currentHistory;
          if (!isDuplicate) {
            updatedHistory = [...currentHistory, newHistoryEntry];
          }

          stateManager.updateCharge({
            status: webhookEvent.data.status,
            status_history: updatedHistory,
            completed_at: isString(webhookEvent.data.completed_at)
              ? webhookEvent.data.completed_at
              : undefined,
            failure_reason: isString(webhookEvent.data.failure_reason)
              ? webhookEvent.data.failure_reason
              : undefined,
          });
        }
        break;
      }

      default:
        logger.debug('Unhandled webhook type', { eventType: webhookEvent.event_type });
    }

    // Acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error: unknown) {
    logger.error('Error processing webhook', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
