import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect } from '../middleware/auth.js';
import PullRequest from '../models/PullRequest.js';
import MetricSnapshot from '../models/MetricSnapshot.js';
import Contributor from '../models/Contributor.js';
import logger from '../config/logger.js';

const router = express.Router();

// Stall reason → human readable label
const STALL_LABELS = {
  REVIEWER_INACTIVE: 'reviewer assigned but inactive',
  NO_REVIEWER:       'no reviewer assigned',
  CHURNING:          'high churn — repeated change requests',
  COMPLEX_IN_REVIEW: 'complex PR under active review (healthy)',
  NEEDS_EXPERT:      'complex PR needs expert assignment',
  STALLED:           'stalled with no recent activity',
};

function getGenai() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Build shared team context injected into every Gemini prompt.
 * Uses only data already stored — no new queries beyond what the stubs had.
 */
async function buildTeamContext(orgId) {
  const [openCount, snapshot, stalledPRs, cultureStalls, contributors] = await Promise.all([
    PullRequest.countDocuments({ orgId, state: 'open' }),
    MetricSnapshot.findOne({ orgId }).sort({ date: -1 }),
    PullRequest.find({
      orgId,
      state: 'open',
      stallReason: { $in: ['STALLED', 'REVIEWER_INACTIVE', 'NO_REVIEWER', 'CHURNING'] },
    }).select('number title authorUsername stallReason complexityLabel requestedReviewers lastActivityAt repoFullName').limit(10),
    PullRequest.countDocuments({
      orgId,
      state: 'open',
      stallReason: { $in: ['REVIEWER_INACTIVE', 'NO_REVIEWER'] },
    }),
    Contributor.find({ orgId }).sort({ reviewerLoadIndex: -1 }).limit(8),
  ]);

  const cycleHours = snapshot ? (snapshot.cycleTimeP50 / 3600).toFixed(1) : 'N/A';
  const latencyHours = snapshot ? (snapshot.reviewLatencyP50 / 3600).toFixed(1) : 'N/A';
  const health = snapshot?.sprintHealthScore ?? 'N/A';

  const stalledLines = stalledPRs.map((p) => {
    const reason = STALL_LABELS[p.stallReason] || p.stallReason;
    const reviewer = p.requestedReviewers?.[0]?.username
      ? `@${p.requestedReviewers[0].username}`
      : 'unassigned';
    return `  - PR #${p.number} "${p.title}" by @${p.authorUsername} — ${reason} [reviewer: ${reviewer}] [${p.complexityLabel}]`;
  }).join('\n');

  const contributorLines = contributors.map((c) =>
    `  - @${c.username}: load=${c.reviewerLoadIndex?.toFixed(1) ?? 0}, quality=${c.reviewQualityScore?.toFixed(2) ?? '?'}`
  ).join('\n');

  return `SPRINT DATA (live from DevDeck):
- Open PRs: ${openCount}
- Sprint Health Score: ${health}/100
- Cycle time P50: ${cycleHours}h
- Review latency P50: ${latencyHours}h
- Culture stalls (reviewer assigned but no action): ${cultureStalls}

STALLED/AT-RISK PRs:
${stalledLines || '  (none)'}

TOP REVIEWER LOAD:
${contributorLines || '  (no contributors synced)'}`;
}

// POST /api/ai/chat  — Gemini-powered conversational assistant
router.post('/chat', protect, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'message required' });

  const genai = getGenai();

  if (!genai) {
    // Graceful fallback — still shows real data, tells user what to do
    const openCount = await PullRequest.countDocuments({ orgId: req.orgId, state: 'open' });
    const snapshot = await MetricSnapshot.findOne({ orgId: req.orgId }).sort({ date: -1 });
    const reply = `Based on your DevDeck data:
- **${openCount} open PRs** across connected repos
- **Sprint Health: ${snapshot?.sprintHealthScore ?? 'N/A'}/100**
- **Cycle time P50: ${snapshot ? (snapshot.cycleTimeP50 / 3600).toFixed(1) : 'N/A'}h**
- **Review latency P50: ${snapshot ? (snapshot.reviewLatencyP50 / 3600).toFixed(1) : 'N/A'}h**

> You asked: "${message}"

Add \`GEMINI_API_KEY\` to \`backend/.env\` to get AI-powered answers.`;
    return res.json({ success: true, data: { reply, aiEnabled: false } });
  }

  try {
    const teamContext = await buildTeamContext(req.orgId);
    const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemInstruction = `You are DevDeck's AI assistant — an expert engineering manager copilot.
You have access to real-time PR metrics, team load, and sprint health data.
Rules:
- Be specific: name PR numbers, authors, reviewer usernames when relevant.
- Distinguish culture problems (reviewer inactive, no reviewer assigned) from legitimate complexity (epic PRs under active review).
- Keep answers concise — 3-5 sentences max unless asked for detail.
- If you spot a pattern, name it plainly.`;

    const prompt = `${systemInstruction}

${teamContext}

Manager asks: "${message}"`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ success: true, data: { reply, aiEnabled: true } });
  } catch (err) {
    logger.error('Gemini chat error', { error: err.message });
    res.status(500).json({ success: false, message: 'AI request failed: ' + err.message });
  }
});

// POST /api/ai/summarize-blockers  — Gemini plain-English blocker summary
router.post('/summarize-blockers', protect, async (req, res) => {
  try {
    const orgId = req.orgId;
    const teamContext = await buildTeamContext(orgId);

    const genai = getGenai();

    if (!genai) {
      // Structured JSON fallback (original behaviour, but with stallReason)
      const stalledPRs = await PullRequest.find({
        orgId,
        state: 'open',
        lastActivityAt: { $lt: new Date(Date.now() - 48 * 3600 * 1000) },
      }).limit(10);

      const epicPRs = await PullRequest.find({
        orgId, state: 'open',
        complexityLabel: { $in: ['epic', 'high'] },
      }).limit(5);

      const noReviewerPRs = await PullRequest.find({
        orgId, state: 'open',
        requestedReviewers: { $size: 0 },
      }).limit(10);

      return res.json({
        success: true,
        data: {
          stalledPRs: stalledPRs.map((p) => ({
            title: p.title, number: p.number, repo: p.repoFullName,
            stallReason: p.stallReason,
            hoursSinceActivity: p.lastActivityAt
              ? Math.round((Date.now() - p.lastActivityAt) / 3600000) : 'unknown',
          })),
          epicPRsAtRisk: epicPRs.map((p) => ({
            title: p.title, number: p.number, repo: p.repoFullName,
            complexity: p.complexityLabel, shipProbability: p.shipProbability,
          })),
          prsNeedingReviewer: noReviewerPRs.map((p) => ({
            title: p.title, number: p.number, repo: p.repoFullName, author: p.authorUsername,
          })),
          generatedAt: new Date().toISOString(),
          note: 'Add GEMINI_API_KEY to get natural language summaries.',
        },
      });
    }

    const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an engineering manager assistant reviewing sprint blockers.

${teamContext}

Write a plain-English blocker summary in exactly this format:

**Sprint Blockers Summary**
[2-3 sentences on the biggest systemic issues — distinguish review culture problems from complexity.]

**Immediate Actions**
- [Action 1: specific, name PR numbers or usernames]
- [Action 2]
- [Action 3]

**Watch List**
- [PRs that need monitoring but aren't blockers yet]

Be specific. Name PR numbers and usernames. Do not be generic.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.json({ success: true, data: { summary, aiEnabled: true, generatedAt: new Date().toISOString() } });
  } catch (err) {
    logger.error('Gemini summarize-blockers error', { error: err.message });
    res.status(500).json({ success: false, message: 'AI request failed: ' + err.message });
  }
});

// POST /api/ai/recommend-reviewer
router.post('/recommend-reviewer', protect, async (req, res) => {
  try {
    const { prId } = req.body;
    const pr = await PullRequest.findOne({ _id: prId, orgId: req.orgId });
    if (!pr) return res.status(404).json({ success: false, message: 'PR not found' });

    // Base heuristic: contributors active in this repo + low current load
    const recentMergers = await PullRequest.find({
      orgId: req.orgId,
      repoFullName: pr.repoFullName,
      state: 'merged',
      mergedAt: { $gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
    }).select('authorUsername');

    const authorCounts = {};
    for (const p of recentMergers) {
      if (p.authorUsername && p.authorUsername !== pr.authorUsername) {
        authorCounts[p.authorUsername] = (authorCounts[p.authorUsername] || 0) + 1;
      }
    }

    // Load-weight: penalise overloaded reviewers
    const contributors = await Contributor.find({
      orgId: req.orgId,
      username: { $in: Object.keys(authorCounts) },
    }).select('username reviewerLoadIndex');

    const loadMap = {};
    for (const c of contributors) loadMap[c.username] = c.reviewerLoadIndex || 0;

    const candidates = Object.entries(authorCounts)
      .map(([username, merges]) => ({
        username,
        merges,
        load: loadMap[username] ?? 0,
        // Score: merges in repo minus load penalty
        score: Math.min(100, merges * 15 - (loadMap[username] || 0) * 10),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const genai = getGenai();

    if (!genai || candidates.length === 0) {
      return res.json({
        success: true,
        data: {
          pr: pr.title,
          recommendations: candidates.map((c) => ({
            username: c.username,
            reason: `Active in ${pr.repoFullName} (${c.merges} merged PRs), current load: ${c.load.toFixed(1)}`,
            score: Math.max(0, c.score),
          })),
          aiEnabled: false,
        },
      });
    }

    const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const candidateLines = candidates.map((c) =>
      `  - @${c.username}: ${c.merges} recent merges in this repo, reviewer load index ${c.load.toFixed(1)}`
    ).join('\n');

    const prompt = `You are a senior engineering manager. Suggest reviewers for this PR.

PR #${pr.number}: "${pr.title}"
Author: @${pr.authorUsername}
Complexity: ${pr.complexityLabel}
Stall reason: ${pr.stallReason ? STALL_LABELS[pr.stallReason] : 'none — active'}
Lines changed: +${pr.linesAdded} -${pr.linesRemoved}

Top candidates (by recent activity in this repo):
${candidateLines}

Reply with exactly 2 reviewer suggestions in this format:
1. @username — [one sentence reason, mention load and expertise]
2. @username — [one sentence reason]`;

    const result = await model.generateContent(prompt);
    const aiSuggestion = result.response.text();

    res.json({
      success: true,
      data: {
        pr: pr.title,
        aiSuggestion,
        candidates,
        aiEnabled: true,
      },
    });
  } catch (err) {
    logger.error('Gemini recommend-reviewer error', { error: err.message });
    res.status(500).json({ success: false, message: 'AI request failed: ' + err.message });
  }
});

export default router;
