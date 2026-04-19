// ─── Stage definitions ────────────────────────────────────────────────────────
export const STAGES = [
  { id: "found",     label: "Found",       color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.25)"  },
  { id: "liked",     label: "Liked",       color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.25)"  },
  { id: "commented", label: "Commented",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.25)"  },
  { id: "dm_sent",   label: "DM Sent",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)"  },
  { id: "replied",   label: "Replied",     color: "#06b6d4", bg: "rgba(6,182,212,0.12)",   border: "rgba(6,182,212,0.25)"   },
  { id: "qualified", label: "Qualified",   color: "#f97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.25)"  },
  { id: "call",      label: "Call Booked", color: "#ec4899", bg: "rgba(236,72,153,0.12)",  border: "rgba(236,72,153,0.25)"  },
  { id: "client",    label: "Client",      color: "#10b981", bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.35)"  },
  { id: "lost",      label: "Lost",        color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)"   },
] as const;

export type StageId = typeof STAGES[number]["id"];

export const NEXT_STAGE: Record<string, StageId> = {
  found: "liked",
  liked: "commented",
  commented: "dm_sent",
  dm_sent: "replied",
  replied: "qualified",
  qualified: "call",
  call: "client",
};

export const ACTIVE_STAGES = STAGES.filter(s => s.id !== "lost" && s.id !== "client");
export const PIPELINE_STAGES = STAGES.filter(s => s.id !== "lost");

// ─── Niches ───────────────────────────────────────────────────────────────────
export const NICHES = [
  "Pet/Grooming",
  "Food/Bakery",
  "Fashion/Boutique",
  "Fitness/Gym",
  "Agriculture",
  "Interior Design",
  "Photography",
  "Restaurant",
  "Salon/Beauty",
  "Wellness/Yoga",
  "Tech/Startup",
  "E-commerce",
  "Real Estate",
  "Education",
  "Other",
] as const;

export type Niche = typeof NICHES[number];

// ─── Services ─────────────────────────────────────────────────────────────────
export const SERVICES = [
  "Landing Page",
  "E-commerce Store",
  "SaaS MVP",
  "API Development",
  "Custom Website",
  "Website Redesign",
  "Mobile App",
  "Other",
] as const;

// ─── Project status ───────────────────────────────────────────────────────────
export const PROJECT_STATUS = [
  { id: "in_progress", label: "In Progress", color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)" },
  { id: "review",      label: "In Review",   color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.25)" },
  { id: "delivered",   label: "Delivered",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.25)" },
  { id: "paid",        label: "Paid",        color: "#10b981", bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.35)" },
] as const;

export type ProjectStatusId = typeof PROJECT_STATUS[number]["id"];

// ─── Default goals ────────────────────────────────────────────────────────────
export const DEFAULT_GOALS = {
  weeklyDMs: 105,
  weeklyReplies: 18,
  weeklyLeads: 50,
  weeklyClients: 2,
  dailyDMs: 15,
  dailyReplies: 3,
  dailyLeads: 2,
  dailyCalls: 1,
};

// ─── Nav links ────────────────────────────────────────────────────────────────
export const NAV_LINKS = [
  { href: "/dashboard",  label: "Dashboard"  },
  { href: "/leads",      label: "Leads"      },
  { href: "/pipeline",   label: "Pipeline"   },
  { href: "/projects",   label: "Projects"   },
  { href: "/daily-logs", label: "Daily Logs" },
  { href: "/strategy",   label: "Strategy"   },
  { href: "/planner",    label: "Planner"    },
  { href: "/settings",   label: "Settings"   },
] as const;
