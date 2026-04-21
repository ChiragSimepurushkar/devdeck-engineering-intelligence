import 'dotenv/config';
import mongoose from 'mongoose';
import PullRequest from './models/PullRequest.js';
import Repository from './models/Repository.js';
import MetricSnapshot from './models/MetricSnapshot.js';
import Contributor from './models/Contributor.js';
import PREvent from './models/PREvent.js';
import User from './models/User.js';
import Organisation from './models/Organisation.js';

async function dropData() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devdeck');
  await PullRequest.deleteMany({});
  await Repository.deleteMany({});
  await MetricSnapshot.deleteMany({});
  await Contributor.deleteMany({});
  await PREvent.deleteMany({});
  await User.deleteMany({});
  await Organisation.deleteMany({});
  console.log('Successfully dropped all DevDeck data. Database is wiped completely clean.');
  process.exit(0);
}
dropData();
