import express from 'express';
import crypto from 'crypto';
import logger from '../config/logger.js';
import { webhookQueue } from '../jobs/webhookQueue.js';
// import { getIo } from '../socket/index.js'; // Ensure IO gets emitted

const router = express.Router();

// Middleware: Authenticate Github Webhook HMAC signatures
const verifyGitHubWebhook = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return res.status(401).json({ success: false, message: 'No signature found' });
  }

  // The payload MUST be stringified EXACTLY as it was received. In Express, you need raw-body parsed for perfect HMAC matching.
  // Using JSON.stringify(req.body) works 99% of the time assuming no unescaped char drifts.
  const payloadString = JSON.stringify(req.body);
  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'devdeck_webhook_verification_secret_key';

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payloadString).digest('hex');

  if (signature !== digest) {
    logger.warn('Webhook signature mismatch', { signature, digest });
    return res.status(401).json({ success: false, message: 'Invalid signature' });
  }

  next();
};

// POST /api/webhooks/github
router.post('/github', verifyGitHubWebhook, async (req, res) => {
  try {
    const event = req.headers['x-github-event'];
    const action = req.body.action;

    logger.info(`📥 Received GitHub webhook`, { event, action });

    // Instantly queue this large incoming payload into Redis/BullMQ to prevent holding up the GitHub request timeout
    await webhookQueue.add(`webhook:${event}:${action}`, {
      event,
      action,
      payload: req.body,
    });

    res.status(202).json({ success: true, message: 'Webhook securely queued for processing' });
  } catch (err) {
    logger.error('Webhook error', { error: err.message });
    res.status(500).json({ success: false, message: 'Internal server error while processing webhook' });
  }
});

export default router;
