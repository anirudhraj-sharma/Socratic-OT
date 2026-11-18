# Socratic-OT Frontend

Next.js 14 App Router frontend for the FastAPI tutor.

## Pages

| Route | Purpose |
|-------|---------|
| `/tutor` | Socratic chat (default mode) |
| `/tutor/study` | Study chat (direct teaching mode) |
| `/architecture` | 5-panel pipeline visualizer (live + replay) |
| `/compare` | Same question, Socratic vs Study sequential reveal |
| `/dashboard` | Session state, weak topics, message log |

## Local dev

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The browser connects to `NEXT_PUBLIC_API_URL`,
which defaults to `http://localhost:8000`. Follow the backend setup in the
[project README](../README.md) before starting the tutor.

## Static build and deployment

With `GITHUB_PAGES` unset, build and preview the root-path export in `out/`:

```bash
npm run build
npm start
```

Open `http://localhost:3000`. The preview uses Python's local static server
and the API origin set at build time.

To build for the GitHub Pages project path, run:

```bash
GITHUB_PAGES=true NEXT_PUBLIC_API_URL=https://api.example.com npm run build
```

The Pages workflow builds the same export for `/Socratic-OT/`. Set the
repository variable `NEXT_PUBLIC_API_URL` to the public HTTPS FastAPI origin
and include `https://anirudhraj-sharma.github.io` in the backend's `CORS_ORIGINS`.

## Stack

- Next.js 14 (app router) + TypeScript
- Tailwind CSS for styling
- Framer Motion for transitions
- `eventsource-parser` for backend SSE consumption
- `zustand` available for state management (currently only `useSession` etc. via hooks)
