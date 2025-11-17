/**
 * Server-Sent Events (SSE) broadcaster for real-time updates
 */

import { Response } from 'express';
import { logger } from '../lib/logger.js';

interface SSEClient {
  id: string;
  res: Response;
}

class EventBroadcaster {
  private clients: SSEClient[] = [];

  /**
   * Add a new SSE client
   */
  addClient(id: string, res: Response): void {
    this.clients.push({ id, res });

    // Send initial connection message
    this.sendToClient(res, 'connected', { clientId: id });

    // Remove client on connection close
    res.on('close', () => {
      this.clients = this.clients.filter((client) => client.id !== id);
      logger.debug('SSE client disconnected', { clientId: id, activeClients: this.clients.length });
    });

    logger.debug('SSE client connected', { clientId: id, activeClients: this.clients.length });
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: string, data: Record<string, unknown>): void {
    logger.debug('SSE broadcasting event', { event, clientCount: this.clients.length });

    this.clients.forEach((client) => {
      this.sendToClient(client.res, event, data);
    });
  }

  /**
   * Send event to a specific client
   */
  private sendToClient(res: Response, event: string, data: Record<string, unknown>): void {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  /**
   * Get number of active clients
   */
  getClientCount(): number {
    return this.clients.length;
  }
}

export const eventBroadcaster = new EventBroadcaster();
