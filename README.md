# FreelanceOS

A personal freelance management system for web development client acquisition.

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: MongoDB + Mongoose
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Data Fetching**: SWR
- **Drag & Drop**: @hello-pangea/dnd

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure MongoDB

Edit `.env.local` and set your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/freelanceos
```

For **MongoDB Atlas** (cloud), replace with your Atlas URI:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freelanceos
```

### 3. Start the dev server
```bash
npm run dev
```

### 4. Open the app
Visit [http://localhost:3000](http://localhost:3000)

## Features

- **Dashboard** — Animated weekly metrics, daily tracker (+/−), pipeline overview, quick notes
- **Leads** — Full lead management with stage pipeline, search/filter, CSV export, Instagram links
- **Pipeline** — Drag-and-drop Kanban board across 8 stages
- **Projects** — Client project tracking with deadline countdown rings and payment status
- **Strategy** — Full DM outreach framework with templates and funnel math
- **Planner** — 7-day weekly execution schedule with Instagram safety rules
- **Settings** — Editable goal targets stored in MongoDB

## Running with MongoDB Atlas (Cloud)

1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Get your connection string
3. Set it in `.env.local`
4. No other changes needed — Mongoose handles everything
