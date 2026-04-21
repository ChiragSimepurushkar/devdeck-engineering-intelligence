import express from 'express';
import { protect } from '../middleware/auth.js';
import PullRequest from '../models/PullRequest.js';
import MetricSnapshot from '../models/MetricSnapshot.js';

const router = express.Router();

// POST /api/ai/summarize-blockers
// Stub: returns structured summary built from real DB data (no LLM call yet)
router.post('/summarize-blockers', protect, async (req, res) => {
  try {
    const orgId = req.orgId;
    const stalledPRs = await PullRequest.find({
      orgId,
      state: 'open',
      lastActivityAt: { $lt: new Date(Date.now() - 48 * 3600 * 1000) },
    }).limit(10);

    const epicPRs = await PullRequest.find({
      orgId,
      state: 'open',
      complexityLabel: { $in: ['epic', 'high'] },
    }).limit(5);

    const noReviewerPRs = await PullRequest.find({
      orgId,
      state: 'open',
      requestedReviewers: { $size: 0 },
    }).limit(10);

    const summary = {
      stalledPRs: stalledPRs.map((p) => ({
        title: p.title,
        number: p.number,
        repo: p.repoFullName,
        hoursSinceActivity: p.lastActivityAt
          ? Math.round((Date.now() - p.lastActivityAt) / 3600000)
          : 'unknown',
      })),
      epicPRsAtRisk: epicPRs.map((p) => ({
        title: p.title,
        number: p.number,
        repo: p.repoFullName,
        complexity: p.complexityLabel,
        shipProbability: p.shipProbability,
      })),
      prsNeedingReviewer: noReviewerPRs.map((p) => ({
        title: p.title,
        number: p.number,
        repo: p.repoFullName,
        author: p.authorUsername,
      })),
      generatedAt: new Date().toISOString(),
      note: 'Connect an LLM API key to get natural language summaries of these blockers.',
    };

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/recommend-reviewer
router.post('/recommend-reviewer', protect, async (req, res) => {
  try {
    const { prId } = req.body;
    const pr = await PullRequest.findOne({ _id: prId, orgId: req.orgId });
    if (!pr) return res.status(404).json({ success: false, message: 'PR not found' });

    // Stub: find contributors who recently merged PRs in the same repo
    const recent = await PullRequest.find({
      orgId: req.orgId,
      repoFullName: pr.repoFullName,
      state: 'merged',
      mergedAt: { $gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
    }).select('authorUsername');

    const authorCounts = {};
    for (const p of recent) {
      if (p.authorUsername && p.authorUsername !== pr.authorUsername) {
        authorCounts[p.authorUsername] = (authorCounts[p.authorUsername] || 0) + 1;
      }
    }

    const recommendations = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([username, score]) => ({
        username,
        reason: `Recently active in ${pr.repoFullName} (${score} merged PRs)`,
        score: Math.min(100, score * 20),
      }));

    res.json({ success: true, data: { pr: pr.title, recommendations } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/chat  — streaming stub
router.post('/chat', protect, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'message required' });

  // Fetch context
  const orgId = req.orgId;
  const openCount = await PullRequest.countDocuments({ orgId, state: 'open' });
  const snapshot = await MetricSnapshot.findOne({ orgId }).sort({ date: -1 });

  const contextualResponse = `Based on your current DevDeck data:
- **${openCount} open PRs** across connected repos
- **Sprint Health Score: ${snapshot?.sprintHealthScore ?? 'N/A'}**
- **Avg cycle time: ${snapshot ? (snapshot.cycleTimeP50 / 3600).toFixed(1) : 'N/A'}h** (p50)
- **Review latency: ${snapshot ? (snapshot.reviewLatencyP50 / 3600).toFixed(1) : 'N/A'}h** (p50)

> You asked: "${message}"

To get AI-powered answers, add your OpenAI or Anthropic API key to the backend \`.env\` file. I'll then analyze blockers, recommend reviewers, and explain metric changes in natural language.`;

  res.json({ success: true, data: { reply: contextualResponse } });
});

export default router;
