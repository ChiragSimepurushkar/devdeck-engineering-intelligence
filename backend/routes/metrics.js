import express from 'express';
import { protect } from '../middleware/auth.js';
import PullRequest from '../models/PullRequest.js';
import MetricSnapshot from '../models/MetricSnapshot.js';
import Repository from '../models/Repository.js';

const router = express.Router();

// Helper: parse date range from query
function getDateRange(query) {
  const days = parseInt(query.days) || 30;
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  return since;
}

// GET /api/metrics/dashboard  — main dashboard aggregation
router.get('/dashboard', protect, async (req, res) => {
  try {
    const since = getDateRange(req.query);
    const orgId = req.orgId;

    const prs = await PullRequest.find({ orgId, openedAt: { $gte: since } });
    const merged = prs.filter((p) => p.state === 'merged');
    const open = prs.filter((p) => p.state === 'open');

    // Cycle time (seconds → hours)
    const ctValues = merged.filter((p) => p.cycleTimeSeconds).map((p) => p.cycleTimeSeconds / 3600);
    const avgCycleTimeHours = ctValues.length
      ? parseFloat((ctValues.reduce((a, b) => a + b, 0) / ctValues.length).toFixed(1))
      : 0;

    // Review latency
    const rlValues = merged.filter((p) => p.reviewLatencySeconds).map((p) => p.reviewLatencySeconds / 3600);
    const avgReviewLatencyHours = rlValues.length
      ? parseFloat((rlValues.reduce((a, b) => a + b, 0) / rlValues.length).toFixed(1))
      : 0;

    // Throughput — PRs merged per week
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const merged7d = merged.filter((p) => p.mergedAt && p.mergedAt >= sevenDaysAgo).length;

    // Churn rate
    const avgChurn = prs.length
      ? parseFloat((prs.reduce((s, p) => s + (p.churnRate || 0), 0) / prs.length).toFixed(2))
      : 0;

    // WIP (open, non-draft)
    const wip = open.filter((p) => !p.isDraft);
    const wipByStage = {
      draft: open.filter((p) => p.isDraft).length,
      inReview: wip.filter((p) => p.requestedReviewers?.length > 0).length,
      waitingForReviewer: wip.filter((p) => !p.requestedReviewers?.length).length,
    };

    // Latest sprint health score
    const latestSnapshot = await MetricSnapshot.findOne({ orgId }).sort({ date: -1 });
    const sprintHealthScore = latestSnapshot?.sprintHealthScore ?? null;

    // Throughput over last 14 days (by day)
    const throughputTrend = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = new Date(Date.now() - i * 24 * 3600 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const count = merged.filter(
        (p) => p.mergedAt && p.mergedAt >= dayStart && p.mergedAt <= dayEnd
      ).length;
      throughputTrend.push({ date: dayStart.toISOString().split('T')[0], merged: count });
    }

    res.json({
      success: true,
      data: {
        sprintHealthScore,
        avgCycleTimeHours,
        avgReviewLatencyHours,
        throughput7d: merged7d,
        avgChurnRate: avgChurn,
        openPRs: open.length,
        mergedPRs: merged.length,
        wipByStage,
        throughputTrend,
        totalPRs: prs.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/metrics/cycle-time  — cycle time funnel data
router.get('/cycle-time', protect, async (req, res) => {
  try {
    const since = getDateRange(req.query);
    const merged = await PullRequest.find({ orgId: req.orgId, state: 'merged', openedAt: { $gte: since } });

    const stages = merged.map((p) => {
      const commit2open = p.openedAt && p.firstCommitAt
        ? (p.openedAt - p.firstCommitAt) / 3600000 : 0;
      const open2review = p.firstReviewAt && p.openedAt
        ? (p.firstReviewAt - p.openedAt) / 3600000 : 0;
      const review2merge = p.mergedAt && (p.firstReviewAt || p.openedAt)
        ? (p.mergedAt - (p.firstReviewAt || p.openedAt)) / 3600000 : 0;
      return { commit2open, open2review, review2merge };
    });

    const avg = (key) =>
      stages.length
        ? parseFloat((stages.reduce((s, x) => s + x[key], 0) / stages.length).toFixed(1))
        : 0;

    res.json({
      success: true,
      data: {
        commitToOpen: avg('commit2open'),
        openToReview: avg('open2review'),
        reviewToMerge: avg('review2merge'),
        totalCycleHours: avg('commit2open') + avg('open2review') + avg('review2merge'),
        sampleSize: stages.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/metrics/snapshots  — historical trend data per repo
router.get('/snapshots', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 3600 * 1000);
    const snapshots = await MetricSnapshot.find({ orgId: req.orgId, date: { $gte: since } })
      .sort({ date: 1 })
      .populate('repoId', 'fullName name');
    res.json({ success: true, data: snapshots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
