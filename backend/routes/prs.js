import express from 'express';
import { protect } from '../middleware/auth.js';
import PullRequest from '../models/PullRequest.js';

const router = express.Router();

// GET /api/prs?state=open&repo=owner/name&days=30
router.get('/', protect, async (req, res) => {
  try {
    const { state, repo, days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 3600 * 1000);
    const filter = { orgId: req.orgId, openedAt: { $gte: since } };
    if (state && state !== 'all') filter.state = state;
    if (repo) filter.repoFullName = repo;

    const prs = await PullRequest.find(filter)
      .sort({ lastActivityAt: -1 })
      .limit(200);
    res.json({ success: true, count: prs.length, data: prs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/prs/bubble-matrix  — D3 bubble data: id, size, color (health), title, author
router.get('/bubble-matrix', protect, async (req, res) => {
  try {
    const prs = await PullRequest.find({ orgId: req.orgId, state: 'open' })
      .select('number title authorUsername authorAvatarUrl linesAdded linesRemoved complexityLabel shipProbability stallProbability lastActivityAt requestedReviewers repoFullName')
      .limit(100);

    const bubbles = prs.map((p) => {
      const size = Math.max(p.linesAdded + p.linesRemoved, 5);
      // Health: green (active), amber (at-risk), red (stalled)
      const hoursSinceActivity = p.lastActivityAt
        ? (Date.now() - p.lastActivityAt) / 3600000
        : 9999;
      const health =
        hoursSinceActivity < 24 ? 'healthy'
        : hoursSinceActivity < 72 ? 'at-risk'
        : 'stalled';
      return {
        id: p._id,
        number: p.number,
        title: p.title,
        author: p.authorUsername,
        authorAvatar: p.authorAvatarUrl,
        size,
        linesAdded: p.linesAdded,
        linesRemoved: p.linesRemoved,
        complexity: p.complexityLabel,
        shipProbability: p.shipProbability,
        health,
        hasReviewer: (p.requestedReviewers || []).length > 0,
        repo: p.repoFullName,
      };
    });

    res.json({ success: true, data: bubbles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/prs/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const pr = await PullRequest.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!pr) return res.status(404).json({ success: false, message: 'PR not found' });
    res.json({ success: true, data: pr });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/prs/latency-histogram  — distribution of review latencies in hours
router.get('/stats/latency-histogram', protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const merged = await PullRequest.find({
      orgId: req.orgId,
      state: 'merged',
      reviewLatencySeconds: { $ne: null },
      openedAt: { $gte: since },
    }).select('reviewLatencySeconds');

    // Bucket into 0-6h, 6-12h, 12-24h, 24-48h, 48-72h, 72h+
    const buckets = [
      { label: '0–6h', min: 0, max: 6, count: 0 },
      { label: '6–12h', min: 6, max: 12, count: 0 },
      { label: '12–24h', min: 12, max: 24, count: 0 },
      { label: '24–48h', min: 24, max: 48, count: 0 },
      { label: '48–72h', min: 48, max: 72, count: 0 },
      { label: '72h+', min: 72, max: Infinity, count: 0 },
    ];

    for (const pr of merged) {
      const hours = pr.reviewLatencySeconds / 3600;
      const bucket = buckets.find((b) => hours >= b.min && hours < b.max);
      if (bucket) bucket.count++;
    }

    res.json({ success: true, data: buckets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
