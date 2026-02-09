# WolvesVille Deployment Guide

This project consists of two parts:
1.  **Frontend**: A Next.js application (pages, components, UI).
2.  **Backend**: A custom Node.js + Socket.io server (`server.ts`).

Because **Vercel** is optimized for serverless functions, it does **not** natively support long-running WebSocket servers (which are required for the real-time game logic).

## Deployment Strategy

You must deploy the application in two parts:

### Part 1: Deploy Frontend to Vercel

1.  Push this repository to GitHub (already done).
2.  Go to [Vercel](https://vercel.com) and "Add New Project".
3.  Import the `WolvesVille` repository.
4.  Vercel will detect it as a Next.js project.
5.  **Environment Variables**:
    *   Add `NEXT_PUBLIC_SOCKET_URL` and set it to your **Backend URL** (see Part 2).
    *   *For now, you can leave it empty, but the game won't connect until Part 2 is done.*
6.  Click **Deploy**.

### Part 2: Deploy Backend (Socket Server)

You need a hosting provider that supports long-running Node.js processes. Good options are **Render**, **Railway**, or **Heroku**.

**Example using Render (Free Tier):**
1.  Create a new **Web Service** on [Render](https://render.com).
2.  Connect your GitHub repository.
3.  **Build Command**: `npm install && npm run build` (or just `npm install` if using ts-node directly).
4.  **Start Command**: `npm run start:server` (or `npx ts-node --project tsconfig.server.json server.ts`).
    *   *Recommended*: Add a "build-server" script to package.json: `"build-server": "tsc -p tsconfig.server.json"` and start with `node dist/server.js`.
5.  **Environment Variables**:
    *   `PORT`: `4000` (or let Render assign one and use `process.env.PORT`).
    *   `MONGODB_URI`: Your MongoDB connection string.
6.  Deploy. Render will give you a URL (e.g., `https://wolvesville-backend.onrender.com`).

### Part 3: Connect Them

1.  Go back to your **Vercel Project Settings**.
2.  Update the `NEXT_PUBLIC_SOCKET_URL` environment variable to match your Backend URL (e.g., `https://wolvesville-backend.onrender.com`).
3.  **Redeploy** the Frontend on Vercel.

## Summary
-   **Frontend (Vercel)**: Serves the UI.
-   **Backend (Render/Railway)**: Handles the Game Logic & Sockets.
