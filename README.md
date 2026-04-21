<div align="center">
  <img src="https://img.shields.io/badge/Status-Live-success?style=for-the-badge&color=10b981" />
  <img src="https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge&color=3b82f6" />
  <img src="https://img.shields.io/badge/Powered%20By-Vite%20%2B%20D3.js-violet?style=for-the-badge&color=8b5cf6" />
</div>

<br />

# DevDeck — Engineering Intelligence Platform 🌌

DevDeck is a next-generation engineering telemetry platform designed for engineering managers and technical leads. It ingests raw GitHub pull request data and securely transforms it into actionable insights using advanced temporal metrics—calculating Sprint Health, Review Latency, and PR Churn Rate in real time. 

Built with an Awwwards-inspired **Dark Glassmorphism** bento-box design system, providing lightning-fast UI responsiveness and data visualization.

---

## 🔥 Features

- **GitHub Pipeline Sync**: Securely connect repositories via PATs encryption. Custom asynchronous architecture bypasses third-party queue requirements to securely ingest massive GitHub event histories locally.
- **D3.js Bubble Matrix**: Interactive visualization of PR Health (Stalled vs Active) mapping pull-request sizes and complexities dynamically on a localized force-graph.
- **Deep Sprint Health Metrics**: 
  - **Cycle Time:** Track how long PRs take from the very first commit to being merged.
  - **Review Latency:** Pinpoint workflow bottlenecks by calculating the exact time from PR open to the first active review.
  - **Churn Rate:** Track code rejection frequencies to identify epic-scale architectural flaws.
- **Glassmorphism UI Engine**: Hand-crafted CSS layout engine featuring custom mesh-gradients, seamless page transitions, animated magnetic components, and fluid responsive design without relying on bloatware UI libraries.
- **Secure Authentication Framework**: Firebase Google Sign-In with backend JWT verification loops locking down private organizational metrics.

## 🛠 Tech Stack

**Frontend**
- React 18 & TypeScript
- Vite (HMR via port 5173)
- Tailwind CSS (Utility classes mapped to custom Dark Glass theme)
- `@tanstack/react-query` & Zustand (Live data caching & state)
- D3.js & Recharts (Data Visualization)
- `lucide-react` & `react-hot-toast` (Iconography & Global System Messaging)

**Backend**
- Node.js & Express
- MongoDB (Mongoose Schema Models for Repositories, Events, Snapshots, PRs)
- Custom Zero-Dependency In-Memory Queue (Background processing)
- GitHub REST API (`@octokit/rest`)
- Cryptr (AES-256-CTR encryption for tokens)
- Firebase Admin SDK (Identity validation)

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/ChiragSimepurushkar/devdeck-engineering-intelligence.git
cd devdeck-engineering-intelligence
```

### 2. Backend Setup
```bash
cd backend
npm install
```
- Rename `.env.example` to `.env` and fill in your MongoDB URI, your Firebase Admin SDK parameters, and GitHub Webhook Secrets.
- Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal session.
```bash
cd frontend
npm install
```
- Rename `.env.example` to `.env.local` and populate your public Firebase parameters (`VITE_FIREBASE_API_KEY`, etc).
- Start the Vite development server:
```bash
npm run dev
```

Navigate to `http://localhost:5173` 🚀

## 📊 Roadmap
- **Live Socket.IO Integration**: Stream GitHub webhook events directly to connected clients in real-time.
- **AI Triage Agent**: Implement LLM stubs to automatically summarize bottlenecks across complex PR code-bases directly from the assistant tab.
