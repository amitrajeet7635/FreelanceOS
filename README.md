# FreelanceOS

A personal freelance management system for web development client acquisition and project tracking.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database & Auth**: Supabase (PostgreSQL)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Data Fetching**: SWR
- **Drag & Drop**: @hello-pangea/dnd
- **Styling**: Vanilla CSS / Tailwind CSS

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [Supabase](https://supabase.com/)
2. Set up your database tables and RLS policies using the provided SQL files in the `supabase/` directory (`supabase/schema.sql` and `supabase/rls_policies.sql`).
3. Edit your environment variables (e.g., create an `.env.local` file) to include your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start the dev server
```bash
npm run dev
```

### 4. Open the app
Visit [http://localhost:3000](http://localhost:3000)

## Features

- **Authentication** — Secure login protecting all dashboard routes
- **Dashboard** — Animated weekly metrics, daily tracker (+/−), pipeline overview, quick notes
- **Leads** — Full lead management with stage pipeline, search/filter, update tracking
- **Pipeline** — Drag-and-drop Kanban board across multiple acquisition stages
- **Projects** — Client project tracking with deadline countdowns and progress metrics
- **Strategy** — Full DM outreach framework with templates and funnel math
- **Planner** — Weekly execution schedule to stay consistent
- **Settings** — Editable user preferences and persistent configuration

## Architecture

This project is built using server-side Next.js features and integrates heavily with Supabase.
- **Supabase Auth**: Authenticating users via email or magic links. All protected pages exist under the `(app)` route group, with middleware intercepting unauthenticated sessions.
- **Row Level Security (RLS)**: Enforced at the database level to ensure data privacy per user session.
- **Supabase SSR**: Utility clients located in `lib/` to fetch data safely on the server and efficiently in browser components.
