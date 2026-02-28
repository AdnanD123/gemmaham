# Gemmaham

Real estate platform connecting tenants, agencies, and contractors. Built with React Router 7, TypeScript, Tailwind CSS 4, and Firebase.

## Tech Stack

- **React Router 7** (SSR) — Frontend framework
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Styling
- **Firebase** — Auth, Firestore, Cloud Functions, Storage
- **Vertex AI (Gemini)** — AI-powered 3D floor plan visualization

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
packages/
  shared/     — TypeScript types and constants
  web/        — React Router 7 frontend
  functions/  — Firebase Cloud Functions
```

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Build web app
- `npm run build:shared` — Build shared package
- `npm run build:functions` — Build Cloud Functions
