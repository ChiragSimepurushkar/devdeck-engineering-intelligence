import logger from '../config/logger.js';
import PullRequest from '../models/PullRequest.js';
import PREvent from '../models/PREvent.js';

class WebhookQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  async add(name, data) {
    this.queue.push({ name, data });
    this.processNext();
  }

  async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const job = this.queue.shift();
    try {
      await processJob(job);
      logger.info(`✅ Job ${job.name} has completed successfully!`);
    } catch (err) {
      logger.error(`❌ Job ${job.name} has failed`, { error: err.message });
    }

    this.processing = false;
    this.processNext();
  }
}

export const webhookQueue = new WebhookQueue();

async function processJob(job) {
  const { event, action, payload } = job.data;
  logger.info(`⚙️ Processing webhook job ${job.name}`, { event, action });

  if (event === 'pull_request') {
    const prData = payload.pull_request;
    const repoData = payload.repository;

    await PullRequest.findOneAndUpdate(
      { githubId: prData.id },
      {
        githubId: prData.id,
        number: prData.number,
        title: prData.title,
        state: prData.state,
        url: prData.html_url,
        repoFullName: repoData.full_name,
        additions: prData.additions,
        deletions: prData.deletions,
        changedFiles: prData.changed_files,
        createdAt: prData.created_at,
        mergedAt: prData.merged_at,
        closedAt: prData.closed_at,
      },
      { upsert: true, new: true }
    );

    await PREvent.create({
      eventType: event,
      action,
      prId: prData.id,
      timestamp: new Date(),
      actor: payload.sender?.login,
    });
  }
}
