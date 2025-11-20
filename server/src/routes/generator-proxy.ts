import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * Proxy the Python paykey-generator (default http://localhost:8081)
 * to avoid mixed-content issues when the UI is served over HTTPS.
 *
 * Mount path: /api/generator
 */
router.use('*', async (req: Request, res: Response): Promise<void> => {
  const targetBase = config.generator.url.replace(/\/$/, '');
  const targetPath = req.url === '/' ? '/' : req.url;
  const targetUrl = `${targetBase}${targetPath}`;

  try {
    const headers: Record<string, string> = {};
    Object.entries(req.headers).forEach(([key, value]) => {
      if (!value || key.toLowerCase() === 'host' || key.toLowerCase() === 'content-length') {
        return;
      }
      headers[key] = Array.isArray(value) ? value.join(',') : value;
    });

    const isBodyAllowed = req.method !== 'GET' && req.method !== 'HEAD';
    const body =
      isBodyAllowed && req.body
        ? typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body)
        : undefined;

    if (body && !headers['content-type']) {
      headers['content-type'] = 'application/json';
    }

    // Create AbortController for 30-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const upstream = await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'content-length') {
          return;
        }
        res.setHeader(key, value);
      });

      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.send(buffer);
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Check if error is an abort/timeout error
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        logger.error('Generator proxy timeout', fetchError);
        res.status(504).json({ error: 'Generator service timeout (30s exceeded)' });
        return;
      }

      throw fetchError;
    }
  } catch (error) {
    logger.error('Generator proxy error', error as Error);
    res.status(502).json({ error: 'Generator service unavailable' });
  }
});

export default router;
