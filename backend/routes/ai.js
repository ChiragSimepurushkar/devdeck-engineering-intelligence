import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect } from '../middleware/auth.js';
import PullRequest from '../models/PullRequest.js';
import MetricSnapshot from '../models/MetricSnapshot.js';
import Contributor from '../models/Contributor.js';
import logger from '../config/logger.js';

const router = express.Router();

// Initialize Gemini
const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

// Helper: Build engineering context from DB
async function buildOrgContext(orgId) {
  const openPRs = await PullRequest.find({ orgId, state: 'open' }).limit(30);
  const stalledPRs = openPRs.filter(p =>
    p.lastActivityAt && (Date.now() - p.lastActivityAt) > 48 * 3600 * 1000
  );
  const epicPRs = openPRs.filter(p => ['epic', 'high'].includes(p.complexityLabel));
  const unassignedPRs = openPRs.filter(p => !p.requestedReviewers?.length);
  const snapshot = await MetricSnapshot.findOne({ orgId }).sort({ date: -1 });

  return {
    openPRCount: openPRs.length,
    stalledPRs: stalledPRs.map(p => ({
      number: p.number, title: p.title, repo: p.repoFullName,
      hoursSinceActivity: Math.round((Date.now() - p.lastActivityAt) / 3600000),
      author: p.authorUsername, complexity: p.complexityLabel
    })),
    epicPRs: epicPRs.map(p => ({
      number: p.number, title: p.title, repo: p.repoFullName,
      complexity: p.complexityLabel, shipProbability: p.shipProbability,
      additions: p.linesAdded, deletions: p.linesRemoved
    })),
    unassignedPRs: unassignedPRs.map(p => ({
      number: p.number, title: p.title, repo: p.repoFullName, author: p.authorUsername
    })),
    metrics: snapshot ? {
      sprintHealthScore: snapshot.sprintHealthScore,
      cycleTimeP50Hours: (snapshot.cycleTimeP50 / 3600).toFixed(1),
      reviewLatencyP50Hours: (snapshot.reviewLatencyP50 / 3600).toFixed(1),
      throughput7d: snapshot.throughput7d,
      avgChurnRate: snapshot.avgChurnRate,
    } : null,
  };
}

// POST /api/ai/chat — Real Gemini chat grounded in org PR data
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'message required' });

    const ctx = await buildOrgContext(req.orgId);

    const systemPrompt = `You are DevDeck AI, an expert engineering intelligence assistant embedded in a developer productivity dashboard.

You have access to the following REAL-TIME data from the engineering team:

CURRENT METRICS:
- Open PRs: ${ctx.openPRCount}
- Sprint Health Score: ${ctx.metrics?.sprintHealthScore ?? 'No data yet'}
- Avg Cycle Time (p50): ${ctx.metrics?.cycleTimeP50Hours ?? 'N/A'}h
- Avg Review Latency (p50): ${ctx.metrics?.reviewLatencyP50Hours ?? 'N/A'}h  
- PRs Merged (7d): ${ctx.metrics?.throughput7d ?? 'N/A'}
- Avg Churn Rate: ${ctx.metrics?.avgChurnRate ?? 'N/A'}

STALLED PRs (>48h no activity): ${JSON.stringify(ctx.stalledPRs.slice(0, 5), null, 2)}

EPIC/HIGH COMPLEXITY PRs: ${JSON.stringify(ctx.epicPRs.slice(0, 5), null, 2)}

PRs WITHOUT REVIEWERS: ${JSON.stringify(ctx.unassignedPRs.slice(0, 5), null, 2)}

Instructions:
- Answer in clear, actionable engineering manager language
- Use markdown formatting with **bold**, bullet lists, and code where appropriate
- Focus on SPECIFIC insights from the real data above — never hallucinate numbers
- If data is empty, acknowledge that and suggest connecting repos
- For blocker questions, identify the MOST critical 2-3 issues to address first
- Keep responses concise but thorough (2-4 paragraphs max)`;

    const model = getGemini();

    // Build conversation history for multi-turn
    let chatHistory = history.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Gemini requires the first message to be from 'user'
    while (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
    }

    const chat = model.startChat({
      history: chatHistory.length > 0 ? chatHistory : undefined,
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.json({ success: true, data: { reply } });
  } catch (err) {
    logger.error('AI chat error', { error: err.message });
    // Fallback to structured template if Gemini fails
    res.status(500).json({ success: false, message: err.message || 'AI unavailable' });
  }
});

// POST /api/ai/summarize-blockers — Real LLM blocker analysis
router.post('/summarize-blockers', protect, async (req, res) => {
  try {
    const ctx = await buildOrgContext(req.orgId);

    if (ctx.openPRCount === 0) {
      return res.json({ success: true, data: { summary: 'No open PRs found. Connect a GitHub repo and sync to see blocker analysis.' } });
    }

    const prompt = `You are an expert engineering manager assistant. Analyze these real pull request blockers and provide a concise, actionable summary:

STALLED PRs (${ctx.stalledPRs.length} total, >48h inactive):
${JSON.stringify(ctx.stalledPRs, null, 2)}

EPIC/COMPLEX PRs at risk (${ctx.epicPRs.length} total):
${JSON.stringify(ctx.epicPRs, null, 2)}

PRs WITHOUT REVIEWERS (${ctx.unassignedPRs.length} total):
${JSON.stringify(ctx.unassignedPRs, null, 2)}

CURRENT SPRINT METRICS: ${JSON.stringify(ctx.metrics, null, 2)}

Write a SHORT (3-5 bullet points) engineering manager briefing that:
1. Identifies the TOP 3 most critical blockers to address TODAY
2. Explains WHY each is risky (with specific numbers from the data)
3. Suggests concrete NEXT ACTIONS for each
4. Includes a 1-sentence overall sprint health assessment

Format using markdown bullets. Be specific, direct, and actionable.`;

    const model = getGemini();
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.json({
      success: true,
      data: {
        summary,
        rawData: {
          stalledCount: ctx.stalledPRs.length,
          epicCount: ctx.epicPRs.length,
          unassignedCount: ctx.unassignedPRs.length,
          details: ctx,
        }
      }
    });
  } catch (err) {
    logger.error('Blocker summary error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/recommend-reviewer — NLP-enhanced reviewer suggestion
router.post('/recommend-reviewer', protect, async (req, res) => {
  try {
    const { prId } = req.body;
    const pr = await PullRequest.findOne({ _id: prId, orgId: req.orgId });
    if (!pr) return res.status(404).json({ success: false, message: 'PR not found' });

    // Gather contributor activity data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const recentMerged = await PullRequest.find({
      orgId: req.orgId,
      repoFullName: pr.repoFullName,
      state: 'merged',
      mergedAt: { $gte: thirtyDaysAgo },
    }).select('authorUsername linesAdded linesRemoved filesChanged labels complexityLabel');

    // Build contributor profile
    const profiles = {};
    for (const p of recentMerged) {
      if (!p.authorUsername || p.authorUsername === pr.authorUsername) continue;
      if (!profiles[p.authorUsername]) {
        profiles[p.authorUsername] = { mergeCount: 0, totalLines: 0, labels: [], complexity: [] };
      }
      profiles[p.authorUsername].mergeCount++;
      profiles[p.authorUsername].totalLines += p.linesAdded + p.linesRemoved;
      profiles[p.authorUsername].complexity.push(p.complexityLabel);
      if (p.labels?.length) profiles[p.authorUsername].labels.push(...p.labels.map(l => l.name));
    }

    // Get current open review load
    const openPRs = await PullRequest.find({ orgId: req.orgId, state: 'open' });
    const currentLoad = {};
    for (const p of openPRs) {
      for (const r of (p.requestedReviewers || [])) {
        currentLoad[r.username] = (currentLoad[r.username] || 0) + 1;
      }
    }

    if (Object.keys(profiles).length === 0) {
      return res.json({ success: true, data: { pr: pr.title, recommendations: [], message: 'Not enough contributor data yet' } });
    }

    // Use Gemini to intelligently rank reviewers
    const prompt = `You are a tech lead assistant helping choose the best reviewer for a pull request.

PR TO REVIEW:
Title: "${pr.title}"
Complexity: ${pr.complexityLabel}
Size: +${pr.linesAdded} / -${pr.linesRemoved} lines, ${pr.filesChanged} files
Author: ${pr.authorUsername}
Labels: ${pr.labels?.map(l => l.name).join(', ') || 'none'}

AVAILABLE REVIEWERS (from recent activity in this repo):
${JSON.stringify(profiles, null, 2)}

CURRENT REVIEW LOAD (pending reviews):
${JSON.stringify(currentLoad, null, 2)}

Select the TOP 3 best reviewers. For each, provide:
1. Username
2. 1-sentence reason WHY they are a good fit (reference their experience and current workload)
3. Confidence score 0-100

Return ONLY valid JSON in this exact format:
[
  { "username": "...", "reason": "...", "score": 85 },
  { "username": "...", "reason": "...", "score": 70 }
]`;

    let recommendations = [];
    try {
      const model = getGemini();
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) recommendations = JSON.parse(jsonMatch[0]);
    } catch (aiErr) {
      // Fallback to heuristic if AI fails
      recommendations = Object.entries(profiles)
        .sort((a, b) => {
          const loadA = currentLoad[a[0]] || 0;
          const loadB = currentLoad[b[0]] || 0;
          return (b[1].mergeCount - loadB * 2) - (a[1].mergeCount - loadA * 2);
        })
        .slice(0, 3)
        .map(([username, data]) => ({
          username,
          reason: `${data.mergeCount} recent merged PRs in this repo, ${currentLoad[username] || 0} current review assignments`,
          score: Math.min(95, data.mergeCount * 15 - (currentLoad[username] || 0) * 10),
        }));
    }

    res.json({ success: true, data: { pr: pr.title, recommendations } });
  } catch (err) {
    logger.error('Reviewer recommend error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/analyze-commits — NLP over commit messages to extract signal
router.post('/analyze-commits', protect, async (req, res) => {
  try {
    const { prId } = req.body;
    const pr = await PullRequest.findOne({ _id: prId, orgId: req.orgId });
    if (!pr) return res.status(404).json({ success: false, message: 'PR not found' });

    const prompt = `You are a senior code reviewer analyzing a pull request for engineering risk signals.

PR DETAILS:
- Title: "${pr.title}"
- Body: """${(pr.body || 'No description').slice(0, 500)}"""
- Complexity: ${pr.complexityLabel}
- Size: +${pr.linesAdded}/-${pr.linesRemoved} lines across ${pr.filesChanged} files
- Labels: ${pr.labels?.map(l => l.name).join(', ') || 'none'}
- Churn Rate: ${pr.churnRate} (higher = more re-reviews requested)
- Ship Probability: ${pr.shipProbability}%
- Is Draft: ${pr.isDraft}

Based on the PR title and description, extract the following signals and return ONLY valid JSON:
{
  "riskLevel": "low|medium|high|critical",
  "riskFactors": ["..."],
  "suggestedLabels": ["..."],
  "breakingChangeRisk": true/false,
  "testingSignals": "likely-has-tests|no-tests-mentioned|unclear",
  "summarySentence": "One plain English sentence summarizing what this PR does and its risk"
}`;

    const model = getGemini();
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summarySentence: text };

    res.json({ success: true, data: { pr: pr.title, analysis } });
  } catch (err) {
    logger.error('Commit analysis error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
