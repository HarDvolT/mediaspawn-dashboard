# Media Spawn Dashboard

The control center for Media Spawn — a 360° digital agency run entirely by AI agents. This dashboard provides real-time visibility into agent activity, pipeline execution, client management, and system memory.

## Stack

- **Vite** — Fast build tool and dev server
- **React 18** — UI framework
- **TypeScript** — Type-safe JavaScript
- **Tailwind CSS** — Utility-first styling
- **Supabase** — PostgreSQL database with realtime subscriptions

## Features

- 📊 **Overview** — Dashboard home with key metrics and activity feed
- 📈 **Analytics** — Revenue, tasks, and performance metrics
- 🤖 **Agent Status** — Real-time agent health and activity monitoring
- 🔥 **Spawned Agents** — Temporary agent instances and their tasks
- 🔀 **Pipelines** — Running, blocked, and completed workflows
- ✅ **Staged Actions** — Pending approvals for database migrations, scripts, etc.
- 💾 **Memory** — Agent memory and context browser
- 👥 **Clients** — Client management and project tracking

All pages feature:
- Real-time updates via Supabase subscriptions
- Responsive design (mobile-friendly sidebar)
- Loading skeletons for better UX
- Empty states with clear messaging
- Page transitions

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/mediaspawn/dashboard.git
cd mediaspawn-dashboard
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_DASHBOARD_PASSWORD=your-secure-password
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (public) | ✅ Yes |
| `VITE_DASHBOARD_PASSWORD` | Password for dashboard access | ✅ Yes |

> ⚠️ Never commit `.env.local` to git. It's already in `.gitignore`.

## Production Build

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Preview Production Build Locally

```bash
npm run preview
```

Opens at [http://localhost:4173](http://localhost:4173).

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option 2: GitHub Integration

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Project Settings > Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_DASHBOARD_PASSWORD`
5. Deploy

### Option 3: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mediaspawn/dashboard)

## Project Structure

```
mediaspawn-dashboard/
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.tsx    # Top-level error handling
│   │   ├── Header.tsx           # Top navigation bar
│   │   ├── Layout.tsx           # Main layout with sidebar
│   │   ├── LoopConfigPanel.tsx  # Loop configuration UI
│   │   ├── PasswordGate.tsx     # Authentication gate
│   │   └── Sidebar.tsx          # Navigation sidebar
│   ├── hooks/
│   │   └── useRealtime.ts       # Supabase realtime subscriptions
│   ├── lib/
│   │   └── supabase.ts          # Supabase client
│   ├── pages/
│   │   ├── Overview.tsx         # Dashboard home
│   │   ├── Analytics.tsx        # Analytics & revenue
│   │   ├── AgentStatus.tsx      # Agent monitoring
│   │   ├── SpawnedAgents.tsx    # Spawned agents
│   │   ├── Pipelines.tsx        # Pipeline runs
│   │   ├── StagedActions.tsx    # Pending approvals
│   │   ├── Memory.tsx           # Memory browser
│   │   └── Clients.tsx          # Client management
│   ├── App.tsx                  # Main app with routing
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite configuration
└── README.md                    # This file
```

## Tech Notes

- **No `any` types** — All TypeScript is strictly typed
- **Functional components only** — Using React hooks
- **No hardcoded secrets** — All config via environment variables
- **Responsive** — Mobile-first design with breakpoint at 768px
- **Real-time** — Supabase Postgres Changes for live updates
- **Error handling** — Top-level ErrorBoundary with friendly messages

## License

Private — Media Spawn Internal Use Only
