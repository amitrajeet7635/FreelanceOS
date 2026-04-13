"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, RefreshCw, Mail, Target, DollarSign, CheckCircle } from "lucide-react";

type StratTab = "overview" | "phases" | "templates" | "niches" | "pricing";

const TABS: { id: StratTab; label: string; icon: React.ElementType }[] = [
  { id: "overview",   label: "Math & Funnel", icon: BarChart2  },
  { id: "phases",     label: "5 Phases",      icon: RefreshCw  },
  { id: "templates",  label: "DM Templates",  icon: Mail       },
  { id: "niches",     label: "Niches",        icon: Target     },
  { id: "pricing",    label: "Pricing",       icon: DollarSign },
];

function TabBar({ active, onSelect }: { active: StratTab; onSelect: (t: StratTab) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`chip${active === id ? " active" : ""}`}
          onClick={() => onSelect(id)}
          style={{ display: "flex", alignItems: "center", gap: 5 }}
        >
          <Icon size={12} /> {label}
        </button>
      ))}
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
function Overview() {
  const funnel = [
    { label: "105 accounts reached (15/day × 7 days)", pct: 100, color: "#10b981" },
    { label: "~18 replies received (~17% reply rate)",  pct: 68,  color: "#8b5cf6" },
    { label: "~8 qualified leads (warm conversations)", pct: 44,  color: "#f59e0b" },
    { label: "2–3 clients closed (25–30% close rate)",  pct: 19,  color: "#3b82f6" },
  ];
  const insights = [
    "Instagram DM open rates reach 80–100% with personalized openers vs 20% for cold email",
    "Cold email gets 1–5% reply rate — Instagram DMs get 10–36% with the warm method",
    "Pre-qualified prospects (3+ exchanges) accept calls at 25–30% vs 8–12% cold",
    "Warm-before-pitch (like → comment → DM) pushes reply rate from 8% to 25%+",
    "Follow-up messages capture 93% of total replies — never stop at just one DM",
    "Timeline hooks ('I noticed your orders come via DMs') convert 2.3× better than generic pitches",
  ];

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
          How 15 DMs/day = 2 clients by end of week
        </div>
        {funnel.map((f, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <motion.div
              style={{ height: 32, background: "var(--bg-overlay)", borderRadius: 8, overflow: "hidden" }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <motion.div
                style={{ height: "100%", background: `${f.color}22`, borderRadius: 8, display: "flex", alignItems: "center", paddingLeft: 12, borderLeft: `3px solid ${f.color}` }}
                initial={{ width: 0 }}
                animate={{ width: `${f.pct}%` }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.6, ease: [0.4,0,0.2,1] }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 600, color: f.color, whiteSpace: "nowrap" }}>{f.label}</span>
              </motion.div>
            </motion.div>
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
          Research-backed insights powering this strategy
        </div>
        {insights.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
            <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Phases ────────────────────────────────────────────────────────────────────
function Phases() {
  const phases = [
    {
      label: "Phase 1 — Setup", sub: "Day 0 · 4–6 hrs one-time", color: "#10b981",
      steps: [
        ["Optimize Instagram bio", "Value-first: 'I build websites for small businesses — landing pages, e-com, SaaS' + portfolio link in bio"],
        ["Create story highlights", "3 highlights: 'My Work', 'What I Build', 'Client Results' — proof at a glance before anyone reads your DM"],
        ["Portfolio link", "Single-page site or clean Notion with 3–5 past projects. Each project needs screenshot + outcome/result."],
        ["Build lead list", "Columns: username · niche · followers · has_website · DM_sent · response · status · notes"],
        ["Find leads via hashtags", "#PetShopIndia #HomeBaker #LudhianaFashion #LocalGym #OrganicFarm — 1k–50k follower accounts, no website in bio"],
      ],
    },
    {
      label: "Phase 2 — Warm Before Pitch", sub: "3-day cycle per account — critical step", color: "#8b5cf6",
      steps: [
        ["Day 1 — Like", "Like their 3 most recent posts. Puts your profile in their notification feed. If your bio is solid, they know what you do."],
        ["Day 2 — Comment", "Leave one genuine, specific comment. Not 'Great work!' — 'This packaging is so clean, do you take bulk orders?' Real over generic."],
        ["Day 3 — DM", "Now you're not a stranger. You're the person who commented. Open rate is near 100%. This is when you send the pitch."],
      ],
    },
    {
      label: "Phase 3 — DM Sequence", sub: "Opening + 2 follow-ups per lead", color: "#f59e0b",
      steps: [
        ["Opening DM (Day 3)", "Specific observation from their page + how a website solves their exact problem. Soft yes/no question at end."],
        ["Follow-up (Day 6)", "'I put together a quick idea of what a site for [their business] could look like…' Signals investment. Create a 20-min mockup."],
        ["Closing (Day 10)", "Soft urgency: 'Taking 2 new projects this month' — leave door open. Many come back 2–3 weeks after this message."],
      ],
    },
    {
      label: "Phase 4 — Weekly Schedule", sub: "90 mins/day · 110+ DMs/week", color: "#3b82f6",
      steps: [
        ["Monday", "Build list of 30 accounts, like all posts. Setup day — no DMs yet."],
        ["Tuesday", "Comment on all Monday batch (30 comments). Start new batch of 30 likes."],
        ["Wednesday", "DM all of Monday batch (30 DMs). Like new 30 accounts."],
        ["Thursday", "DM Tuesday batch (30 DMs). Follow-up on Wednesday DMs."],
        ["Friday", "Send follow-up DMs, handle all replies, book discovery calls (20 DMs)."],
        ["Sat–Sun", "Reply to inbox, review week metrics, prep next week list, post 1 portfolio reel."],
      ],
    },
    {
      label: "Phase 5 — Parallel Channels", sub: "Run alongside Instagram outreach", color: "#f97316",
      steps: [
        ["LinkedIn", "5 connections/day targeting startup founders. Connect with note → engage 2 days → DM with value-first opener."],
        ["WhatsApp Business Groups", "Join Ludhiana/Punjab business groups. Offer free website audit. Referrals convert 3–5× better than cold."],
        ["Content play", "1 reel/week: before vs after website for a specific niche. Attracts inbound DMs passively over time."],
        ["Free website audit", "For businesses with bad websites — send a Loom pointing out 3 improvements. Easy yes, natural upsell."],
      ],
    },
  ];

  return (
    <div>
      {phases.map(({ label, sub, color, steps }, pi) => (
        <motion.div
          key={label}
          className="card"
          style={{ marginBottom: 12, borderLeft: `3px solid ${color}` }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: pi * 0.08 }}
        >
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color }}>{label}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>
          </div>
          {steps.map(([title, desc], i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${color}22`, color, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, border: `1px solid ${color}44` }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// ── DM Templates ─────────────────────────────────────────────────────────────
function Templates() {
  const [active, setActive] = useState<"opening" | "followup" | "closing">("opening");
  const templates = {
    opening: {
      color: "#3b82f6",
      text: `Hey [Name]!\n\nLoved seeing your [specific product/post] — the [specific detail you noticed] really stands out.\n\nI noticed you're taking orders through DMs/WhatsApp. I'm a web developer and I build websites for small businesses like yours — a proper site would let you take orders 24/7, show your full catalog, and look way more professional to new customers.\n\nI've done this for a [similar niche] business recently — happy to share what it looked like. Would that be useful?`,
      rules: [
        "Always reference something specific — proves you actually looked at their page",
        "Lead with the benefit to them (orders 24/7), not your skill (I'm a developer)",
        "End with a soft yes/no question — not a price, not a proposal",
        "Never copy-paste word-for-word — personalize the first 2 lines every time",
      ],
    },
    followup: {
      color: "#10b981",
      text: `Hey [Name], just checking back on this!\n\nI put together a quick idea of what a site for [their business name] could look like. Nothing formal — just wanted to show what's possible.\n\nWould you have 10 minutes this week to take a look?`,
      rules: [
        "Signals investment — you've already thought about their specific business",
        "Create a quick Figma mockup or screenshot of a similar site you've built (20 mins)",
        "Attaching a visual doubles conversion rate on follow-ups",
        "Send on Day 3 after the opening DM",
      ],
    },
    closing: {
      color: "#f59e0b",
      text: `Hey [Name], last message from my end — I know you're busy running the business!\n\nI'm currently taking on 2 new projects this month. If now's not the right time, totally okay. But if you ever want a proper website, I'd love to help — I work fast and keep it affordable for small businesses.\n\nFeel free to reach out anytime.`,
      rules: [
        "'2 new projects this month' is a scarcity signal that works without being pushy",
        "The door stays open permanently — many clients come back 2–4 weeks later",
        "Never follow up again after this one",
        "Send on Day 7",
      ],
    },
  };

  const t = templates[active];
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {(["opening", "followup", "closing"] as const).map(id => (
          <button key={id} className={`chip${active === id ? " active" : ""}`} onClick={() => setActive(id)}>
            {id === "opening" ? "Opening DM" : id === "followup" ? "Follow-up Day 3" : "Closing Day 7"}
          </button>
        ))}
      </div>
      <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card" style={{ marginBottom: 12, borderLeft: `3px solid ${t.color}` }}>
          <pre style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)" }}>
            {t.text}
          </pre>
        </div>
        <div className="card" style={{ background: "var(--bg-overlay)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Why this works:</div>
          {t.rules.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
              <CheckCircle size={13} color={t.color} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>{r}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── Niches ────────────────────────────────────────────────────────────────────
function Niches() {
  const niches = [
    { label: "Pet shops / groomers", color: "#10b981" },
    { label: "Home bakers / food brands", color: "#f59e0b" },
    { label: "Fashion boutiques", color: "#8b5cf6" },
    { label: "Personal trainers / gyms", color: "#f97316" },
    { label: "Organic farms / agri", color: "#10b981" },
    { label: "Interior designers", color: "#3b82f6" },
    { label: "Photography studios", color: "#06b6d4" },
    { label: "Cloud kitchens / restaurants", color: "#f59e0b" },
    { label: "Salons / beauty brands", color: "#ec4899" },
    { label: "Yoga / wellness coaches", color: "#8b5cf6" },
  ];

  const qualifiers = [
    ["Hashtag search", "#PetShopPunjab #HomeBaker #LudhianaFashion — filter for 1k–50k followers"],
    ["'No website' signals", "Bio says 'DM to order', 'Order on WhatsApp' — these are your hottest leads"],
    ["Engagement quality", "Look for 3–10% engagement rate. Active owners = engaged audience"],
    ["Follower sweet spot", "1,000–50,000 followers. Budget but no in-house team"],
    ["Location targeting", "#Ludhiana #Punjab — local makes closing easier, can meet in person"],
    ["Content freshness", "Account must have posted in the last 2 weeks. Inactive = low conversion"],
  ];

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.7 }}>
        These niches have strong Instagram presence but very low website adoption — highest conversion targets.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {niches.map(n => (
          <span key={n.label} className="badge" style={{ background: `${n.color}18`, color: n.color, border: `1px solid ${n.color}33`, fontSize: 12, padding: "4px 10px" }}>
            {n.label}
          </span>
        ))}
      </div>
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>How to find and qualify them</div>
        {qualifiers.map(([title, desc], i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, marginTop: 5 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 1 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
function Pricing() {
  const tiers = [
    { tier: "Starter", range: "₹8,000 – ₹15,000", desc: "Landing page, 3–5 sections, contact/order form, fully mobile-responsive. No CMS.", delivery: "5–7 days", target: "Local shops, solo entrepreneurs, coaches", featured: false },
    { tier: "Growth",  range: "₹20,000 – ₹45,000", desc: "E-commerce or multi-page site with CMS, product listings, order system, or basic dashboard.", delivery: "10–14 days", target: "Food brands, fashion, fitness, restaurants", featured: true },
    { tier: "SaaS MVP",range: "₹60,000 – ₹1,50,000", desc: "Full-stack app with auth, user dashboard, APIs, database. For startup founders building a product.", delivery: "3–6 weeks", target: "Tech startups and early-stage founders", featured: false },
  ];

  const tips = [
    "Focus on Starter/Growth tiers first — SaaS takes longer to close, don't depend on them for Week 1",
    "Start slightly below target for the first 2 clients to build testimonials fast, then raise",
    "Quote a range (not a fixed number) — gives you room to anchor high and negotiate",
    "Structure as 50% upfront + 50% on delivery — standard and reduces risk for both sides",
    "Add a monthly maintenance retainer at ₹2,000–₹3,000/month after every project delivery",
  ];

  return (
    <div>
      {tiers.map((p, i) => (
        <motion.div
          key={p.tier}
          className="card"
          style={{ marginBottom: 12, border: p.featured ? "1.5px solid var(--accent-glow)" : undefined }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{p.tier}</span>
                {p.featured && <span className="badge" style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--accent-glow)" }}>Most Popular</span>}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>{p.range}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 4 }}>{p.desc}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Delivery: {p.delivery} · Best for: {p.target}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      <div className="card" style={{ background: "var(--bg-overlay)", marginTop: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Pricing strategy for Week 1</div>
        {tips.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start" }}>
            <CheckCircle size={13} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Strategy Page ────────────────────────────────────────────────────────
export default function StrategyPage() {
  const [activeTab, setActiveTab] = useState<StratTab>("overview");

  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div className="page-title">Strategy</div>
        <div className="page-sub">Full Instagram outreach framework — research-backed and field-tested</div>
      </div>
      <TabBar active={activeTab} onSelect={setActiveTab} />
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "overview"  && <Overview />}
          {activeTab === "phases"    && <Phases />}
          {activeTab === "templates" && <Templates />}
          {activeTab === "niches"    && <Niches />}
          {activeTab === "pricing"   && <Pricing />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
