import 'dotenv/config';
import mongoose from 'mongoose';
import Repository from './models/Repository.js';
import PullRequest from './models/PullRequest.js';
import User from './models/User.js';
import Cryptr from 'cryptr';
import { syncRepository } from './scripts/syncGitHub.js';

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devdeck');
  const repos = await Repository.find();
  const prs = await PullRequest.find();
  console.log('--- REPOSE FOUND: ', repos.map(r => r.fullName));
  console.log('--- PRS FOUND: ', prs.length);

  if (repos.length > 0 && prs.length === 0) {
    console.log('Forcing manual sync for ' + repos[0].fullName);
    const user = await User.findById(repos[0].addedBy);
    if (!user || !user.githubPatEncrypted) {
      console.log('No PAT found for user');
    } else {
      const cryptr = new Cryptr(process.env.PAT_ENCRYPTION_KEY || 'fallback_key_change_this');
      const pat = cryptr.decrypt(user.githubPatEncrypted);
      try {
        await syncRepository(repos[0], pat, repos[0].orgId);
        console.log('Sync complete!');
      } catch (err) {
        console.log('Sync failed: ', err.message);
      }
    }
  }

  process.exit(0);
}
check();
