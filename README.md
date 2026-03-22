# Retro Tool

A real-time collaborative retrospective board for agile teams. Run your retros with your team — everyone sees the same board, live.

## Features

- **4 columns** — Hi Five, Complaints, Ideas, Shout Outs
- **4 phases** — Reflect → Vote → Discuss → Actions
- **Real-time sync** — Firebase Realtime Database, everyone stays in sync
- **Shared timer** — start/pause for the whole team
- **Voting** — each person votes independently per device/tab
- **Card grouping** — drag one card onto another to group them
- **Discussion queue** — sidebar showing cards ranked by votes
- **Action items** — assign owners and due dates, track completion
- **Presence** — see who's online
- **Board sharing** — share the URL, anyone can join

## Tech Stack

- [Next.js 15](https://nextjs.org) — React framework
- [TypeScript](https://www.typescriptlang.org) — type safety
- [Tailwind CSS](https://tailwindcss.com) — styling
- [Firebase Realtime Database](https://firebase.google.com) — real-time sync & presence

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to a new board automatically.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase config:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## How Boards Work

Each board lives at `/board/:boardId`. Share the URL with your team and everyone joins the same board in real time. The board ID is generated automatically when you open the app.

## Deploying

The easiest way is [Vercel](https://vercel.com):

1. Push to GitHub
2. Import the repo on Vercel
3. Add environment variables
4. Deploy

## Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Realtime Database** (set rules to public for now)
3. Enable **Authentication → Anonymous**
4. Copy config values to `.env.local`
