import express from 'express';
import crypto from 'crypto';
import PullRequest from '../models/PullRequest.js';
import Repository from '../models/Repository.js';
import logger from '../config/logger.js';

const router = express.Router();

function validateGitHubSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expected = `sha256=${hmac.digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// POST /api/webhooks/github
router.post('/github', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];
  const rawBody = req.body;

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (secret && signature) {
    if (!validateGitHubSignature(rawBody, signature, secret)) {
      logger.warn('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // Reject payloads older than 5 minutes
  const delivered = req.headers['x-github-delivery'];
  logger.info(`Webhook received: ${event}`, { delivery: delivered });

  res.status(200).json({ received: true });

  // Process async
  try {
    await processWebhookEvent(event, payload);
  } catch (err) {
    logger.error('Webhook processing error', { error: err.message });
  }
});

async function processWebhookEvent(event, payload) {
  if (!['pull_request', 'pull_request_review'].includes(event)) return;

  const repoFullName = payload.repository?.full_name;
  if (!repoFullName) return;

  const repo = await Repository.findOne({ fullName: repoFullName, isActive: true });
  if (!repo) {
    logger.info(`Webhook for untracked repo: ${repoFullName}`);
    return;
  }

  if (event === 'pull_request') {
    const ghPr = payload.pull_request;
    const action = payload.action;
    const updates = {
      title: ghPr.title,
      body: ghPr.body,
      isDraft: ghPr.draft,
      linesAdded: ghPr.additions,
      linesRemoved: ghPr.deletions,
      filesChanged: ghPr.changed_files,
      lastActivityAt: new Date(),
      requestedReviewers: (ghPr.requested_reviewers || []).map((r) => ({
        username: r.login,
        avatarUrl: r.avatar_url,
      })),
    };

    if (action === 'closed') {
      updates.state = ghPr.merged ? 'merged' : 'closed';
      if (ghPr.merged) updates.mergedAt = new Date(ghPr.merged_at);
      updates.closedAt = new Date(ghPr.closed_at);
    }

    const updated = await PullRequest.findOneAndUpdate(
      { repoFullName, githubPrId: ghPr.id },
      updates,
      { new: true }
    );

    if (updated) {
      // Broadcast via Socket.IO (imported lazily to avoid circular deps)
      const { broadcastPRUpdate } = await import('../socket/index.js');
      broadcastPRUpdate(repo.orgId.toString(), updated);
    }
  }
}

export default router;
