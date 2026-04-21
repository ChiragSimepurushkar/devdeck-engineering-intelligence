# DevDeck

DevDeck is an engineering intelligence dashboard that turns GitHub pull request activity into team-level signals such as sprint health, cycle time, review latency, churn, WIP distribution, and reviewer load. The project is split into a React frontend and an Express backend backed by MongoDB, Firebase Auth, and Socket.IO.

## What It Does

- Sign in with Google via Firebase Authentication
- Connect a GitHub personal access token and choose repositories to track
- Sync pull request activity from GitHub into MongoDB
- Show a live dashboard for sprint health, throughput, review latency, and WIP
- Visualize open pull requests in a D3-based PR health bubble matrix
- Provide team and metrics endpoints for engineering insights
- Expose an AI assistant UI grounded in stored PR and metric data

## Key Features & Pages Overview (For Judges/Pitch Review)

DevDeck is designed to be a comprehensive hub for engineering leaders. Below is a breakdown of the primary views and what they achieve:

- **Landing Page (`/`)**: A highly polished, glassmorphic split-screen entry point. It frames the product's value proposition against a visually striking interface and provides instant Google OAuth authentication.

- **Main Dashboard (`/dashboard`)**: The core command center. It features global time/repo filters, top-level metric snapshots (Sprint Health, Review Latency), interactive sparkline charts displaying 14-day history, and an integrated **AI Assistant widget** to query repo metrics in plain English.

- **Pull Request Health (`/prs`)**: A dedicated interface to fight PR staleness. It combines a bubble-matrix visualization mapping out PR age against code size, and a fully sortable data grid, immediately highlighting blocked PRs and unbalanced review loads.

- **Cycle Time Funnel (`/cycle-time`)**: A deep analytics page analyzing engineering flow. It visualizes the pipeline in three funnel stages (Commit to Open → Open to Review → Review to Merge) using Recharts and D3 to expose precise bottlenecks in the team's shipping velocity.

- **Notifications Hub (`/notifications`)**: A centralized inbox tracking PR alerts, successful merges, review requests, and sprint warnings. Supports categorised filtering, read/unread state tracking, and direct routing back to blocked PRs.

- **Settings & Dynamic Theming (`/settings`)**: A robust control panel allowing users to link GitHub organizations, manage notification preferences, and switch themes. Powered by a bespoke CSS-variable engine, the platform instantly transforms across **7 unique global themes** (including Ethereal Dark, Cyberpunk, Midnight Blue, and a pristine Light Mode) affecting all components seamlessly.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS, Recharts, D3, Socket.IO client
- Backend: Node.js, Express, Mongoose, Firebase Admin SDK, JWT, Socket.IO, Octokit, Winston, Zod
- Data/Auth: MongoDB, Firebase Authentication, GitHub API

## Project Structure

```text
.
├── backend/    # Express API, GitHub sync, metrics, auth, webhooks, sockets
├── frontend/   # React app and dashboard UI
├── devdeck.docx
└── README.md
```

## Prerequisites

- Node.js 20+
- npm
- MongoDB Atlas or a local MongoDB instance
- Firebase project with Google sign-in enabled
- GitHub personal access token with repository access

## Setup

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure backend environment

Copy `backend/.env.example` to `backend/.env` and fill in the values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRES_IN=7d
FIREBASE_SERVICE_ACCOUNT_JSON=
GITHUB_WEBHOOK_SECRET=
PAT_ENCRYPTION_KEY=
FRONTEND_URL=http://localhost:5173
```

Important backend values:

- `MONGO_URI`: MongoDB connection string
- `FIREBASE_SERVICE_ACCOUNT_JSON`: full Firebase Admin service account JSON as a single-line string
- `PAT_ENCRYPTION_KEY`: used to encrypt stored GitHub PATs
- `JWT_SECRET` and `REFRESH_TOKEN_SECRET`: use strong random secrets

### 3. Configure frontend environment

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=http://localhost:5000
```

## Running Locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

## Core Flows

### Authentication

1. User signs in with Google in the frontend.
2. Frontend sends the Firebase ID token to `POST /api/auth/firebase`.
3. Backend verifies the token, creates a user and organisation if needed, and returns app JWTs.

### GitHub Connection

1. User submits a GitHub PAT.
2. Backend verifies the token with GitHub and stores it encrypted.
3. User selects a repository to connect.
4. Backend creates the repository record and starts an async sync job.

### Metrics

The backend computes dashboard metrics from stored pull request data, including:

- Sprint health score
- Average cycle time
- Average review latency
- Throughput over the last 7 and 14 days
- Churn rate
- Open PR counts and WIP stage distribution

## API Overview

Main route groups:

- `POST /api/auth/firebase`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/github/connect-pat`
- `GET /api/github/repos`
- `POST /api/github/add-repo`
- `GET /api/github/connected-repos`
- `POST /api/github/sync/:repoId`
- `GET /api/metrics/dashboard`
- `GET /api/metrics/cycle-time`
- `GET /api/metrics/snapshots`
- `GET /api/prs`
- `GET /api/prs/bubble-matrix`
- `GET /api/prs/stats/latency-histogram`
- `POST /api/ai/chat`
- `POST /api/ai/summarize-blockers`
- `POST /api/ai/recommend-reviewer`

## Current Status

This repository is functional as a full-stack prototype, but a few parts are still stubbed or early-stage:

- The AI assistant uses real project data, but `POST /api/ai/chat` currently returns a contextual stub response instead of calling an LLM.
- The root `package.json` does not define workspace scripts; frontend and backend are run separately.
- Production deployment configuration is not included in this repository.

## Useful Scripts

Backend:

- `npm run dev` — start the API with file watching
- `npm start` — start the API normally

Frontend:

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build

## Notes

- CORS is configured from `FRONTEND_URL`.
- API routes are rate-limited under `/api`.
- The backend expects MongoDB to be available at startup.
- WebSocket support is initialized on the backend through Socket.IO for live updates.
