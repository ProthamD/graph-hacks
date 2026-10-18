# BlastRadius — Railway Deployment Guide

This guide walks you through deploying BlastRadius (FalkorDB + Python Backend + Frontend) on **Railway**.

---

## Architecture on Railway

```
┌────────────────────────────────────────────────────────┐
│  Service 1: FalkorDB (Docker Image)                   │
│  Image: falkordb/falkordb:latest                      │
│  Port: 6379 | Volume: /data                           │
│  Private domain: falkordb.railway.internal             │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Service 2: BlastRadius Backend (FastAPI + Agent)     │
│  Source: blastradius/backend (via Dockerfile)          │
│  Auto-bootstraps schema & seeds demo graph on boot     │
│  Public Domain: https://<your-backend>.up.railway.app  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Service 3: BlastRadius Frontend (Next.js 15)          │
│  Deployable on Railway OR Vercel                       │
│  NEXT_PUBLIC_API_URL: https://<your-backend>...        │
└────────────────────────────────────────────────────────┘
```

---

## Step 1: Create a Project & Deploy FalkorDB

1. Log into [railway.app](https://railway.app) and create a **New Project**.
2. Click **+ New** → **Docker Image**.
3. In the image prompt, type:
   ```
   falkordb/falkordb:latest
   ```
4. Click on the newly created service and rename it to **falkordb**.
5. **Add Persistent Storage**:
   * Go to **Settings** → **Volumes** → **Add Volume**.
   * Mount Path: `/data` (this preserves your graph database across redeployments).
6. **Check Private Networking**:
   * Go to **Settings** → **Networking**.
   * You will see the private address (usually `falkordb.railway.internal:6379`).

---

## Step 2: Deploy the Backend API Server

1. In the same Railway project, click **+ New** → **GitHub Repo** and choose your repository.
2. Click on the new service and go to **Settings**:
   * **Root Directory**: `blastradius/backend`
   * Railway will automatically detect the [Dockerfile](file:///d:/graph%20hacks/blastradius/backend/Dockerfile).
3. Go to **Variables** and add:
   | Variable | Value |
   |---|---|
   | `FALKORDB_HOST` | `falkordb.railway.internal` (or `${{falkordb.RAILWAY_PRIVATE_DOMAIN}}`) |
   | `FALKORDB_PORT` | `6379` |
   | `OPENAI_API_KEY` | your OpenAI API key (or `GEMINI_API_KEY`) |
   | `LITELLM_MODEL` | `openai/gpt-4o` (or `gemini/gemini-2.5-flash`) |
4. **Generate Public Domain**:
   * Go to **Settings** → **Networking** → Click **Generate Domain**.
   * Note the URL (e.g. `https://blastradius-backend-production.up.railway.app`).

> **Note**: On startup, the backend automatically connects to FalkorDB, creates range and vector indexes, and seeds the microservices topology demo data! You can also re-trigger seeding anytime by sending a `POST` request to `/api/seed`.

---

## Step 3: Deploy the Frontend

You can deploy the frontend on either **Vercel** (recommended for speed) or directly on **Railway**.

### Option A: Deploy on Vercel (Recommended)
1. Go to [vercel.com](https://vercel.com) → **Add New Project**.
2. Select your repository.
3. Configure:
   * **Root Directory**: `blastradius/frontend`
   * **Framework Preset**: Next.js
4. In **Environment Variables**, add:
   * `NEXT_PUBLIC_API_URL`: Your backend URL from Step 2 (e.g. `https://blastradius-backend-production.up.railway.app`).
5. Click **Deploy**.

### Option B: Deploy on Railway
1. In the same Railway project, click **+ New** → **GitHub Repo**.
2. Go to **Settings**:
   * **Root Directory**: `blastradius/frontend`
3. Go to **Variables** and add:
   * `NEXT_PUBLIC_API_URL`: Your backend URL from Step 2.
4. Go to **Networking** → Click **Generate Domain**.
5. Done!
