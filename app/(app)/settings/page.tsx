"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSettings, saveSettings, Settings } from "@/hooks/useDaily";
import { DEFAULT_GOALS } from "@/lib/constants";
import { Save, Loader2, CheckCircle, Target, BarChart2, Sun, PlugZap, KeyRound, Copy, ShieldOff } from "lucide-react";

export default function SettingsPage() {
  const { settings, isLoading } = useSettings();
  const [form, setForm] = useState<Omit<Settings, "_id">>(DEFAULT_GOALS as Omit<Settings, "_id">);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [extensionApiKey, setExtensionApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [extLoading, setExtLoading] = useState<"generate" | "revoke" | null>(null);
  const [extMessage, setExtMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        weeklyDMs:     settings.weeklyDMs,
        weeklyReplies: settings.weeklyReplies,
        weeklyLeads:   settings.weeklyLeads,
        weeklyClients: settings.weeklyClients,
        dailyDMs:      settings.dailyDMs,
        dailyReplies:  settings.dailyReplies,
        dailyLeads:    settings.dailyLeads,
        dailyCalls:    settings.dailyCalls,
        currency:      settings.currency || "₹",
      });
    }
  }, [settings]);

  const set = (k: string, v: number | string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await saveSettings(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleGenerateApiKey = async () => {
    setExtLoading("generate");
    setExtMessage(null);
    try {
      const res = await fetch("/api/ext/api-keys/generate", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setExtMessage({ type: "error", text: data?.error || "Failed to generate API key" });
        return;
      }

      setExtensionApiKey(data.key || "");
      setShowApiKey(true);
      setExtMessage({ type: "success", text: "New API key generated." });
    } catch {
      setExtMessage({ type: "error", text: "Could not reach server. Try again." });
    } finally {
      setExtLoading(null);
    }
  };

  const handleRevokeApiKey = async () => {
    setExtLoading("revoke");
    setExtMessage(null);
    try {
      const res = await fetch("/api/ext/api-keys/revoke", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setExtMessage({ type: "error", text: data?.error || "Failed to revoke API key" });
        return;
      }

      setExtensionApiKey("");
      setShowApiKey(false);
      setExtMessage({ type: "success", text: "API key revoked." });
    } catch {
      setExtMessage({ type: "error", text: "Could not reach server. Try again." });
    } finally {
      setExtLoading(null);
    }
  };

  const handleCopyApiKey = async () => {
    if (!extensionApiKey) return;
    try {
      await navigator.clipboard.writeText(extensionApiKey);
      setExtMessage({ type: "success", text: "API key copied." });
    } catch {
      setExtMessage({ type: "error", text: "Unable to copy key. Copy manually." });
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <Loader2 size={24} className="spinner" color="var(--text-muted)" />
      </div>
    );
  }

  const weeklyFields = [
    { key: "weeklyDMs",     label: "Weekly DM Goal",      icon: Target,    hint: "105 recommended (15/day × 7)" },
    { key: "weeklyReplies", label: "Weekly Reply Goal",    icon: BarChart2, hint: "~17% of DMs sent" },
    { key: "weeklyLeads",   label: "Weekly Leads Goal",    icon: Target,    hint: "Qualified conversations" },
    { key: "weeklyClients", label: "Weekly Clients Goal",  icon: CheckCircle, hint: "New clients closed" },
  ];

  const dailyFields = [
    { key: "dailyDMs",     label: "Daily DMs",     hint: "Recommended: 15" },
    { key: "dailyReplies", label: "Daily Replies",  hint: "Track replied leads" },
    { key: "dailyLeads",   label: "Daily Qualified Leads", hint: "Recommended: 2" },
    { key: "dailyCalls",   label: "Daily Calls Booked",   hint: "Booked discovery calls" },
  ];

  return (
    <div style={{ paddingTop: 24, maxWidth: 600 }}>
      <div style={{ marginBottom: 20 }}>
        <div className="page-title">Settings</div>
        <div className="page-sub">Customize your goals and preferences</div>
      </div>

      {/* Weekly goals */}
      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <BarChart2 size={15} color="var(--accent)" /> Weekly Goals
        </div>
        <div className="grid-2">
          {weeklyFields.map(({ key, label, hint }) => (
            <div className="form-group" key={key}>
              <label className="form-label">{label}</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={(form as Record<string, number | string>)[key] as number}
                onChange={e => set(key, parseInt(e.target.value) || 0)}
              />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{hint}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Daily goals */}
      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Target size={15} color="var(--accent)" /> Daily Tracker Targets
        </div>
        <div className="grid-2">
          {dailyFields.map(({ key, label, hint }) => (
            <div className="form-group" key={key}>
              <label className="form-label">{label}</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={(form as Record<string, number | string>)[key] as number}
                onChange={e => set(key, parseInt(e.target.value) || 0)}
              />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{hint}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Sun size={15} color="var(--accent)" /> Appearance
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Use the <strong style={{ color: "var(--text-primary)" }}>sun/moon icon</strong> in the top-right corner to toggle between dark and light modes. Your preference is saved automatically in your browser.
        </p>
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <PlugZap size={15} color="var(--accent)" /> Chrome Extension
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={handleGenerateApiKey}
            disabled={extLoading !== null}
          >
            {extLoading === "generate" ? <Loader2 size={13} className="spinner" /> : <KeyRound size={13} />}
            Generate API Key
          </button>

          <button
            className="btn btn-danger btn-sm"
            type="button"
            onClick={handleRevokeApiKey}
            disabled={extLoading !== null}
          >
            {extLoading === "revoke" ? <Loader2 size={13} className="spinner" /> : <ShieldOff size={13} />}
            Revoke Key
          </button>
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Extension API Key</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="form-control"
              type={showApiKey ? "text" : "password"}
              value={extensionApiKey}
              readOnly
              placeholder="Generate a key to connect your extension"
            />
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => setShowApiKey(v => !v)}>
              {showApiKey ? "Hide" : "Show"}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={handleCopyApiKey}
              disabled={!extensionApiKey}
            >
              <Copy size={13} /> Copy
            </button>
          </div>
        </div>

        {extMessage && (
          <div
            style={{
              fontSize: 12,
              color: extMessage.type === "success" ? "var(--success)" : "var(--danger)",
              marginBottom: 12,
            }}
          >
            {extMessage.text}
          </div>
        )}

        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Setup steps</div>
          <ol style={{ margin: 0, paddingLeft: 16 }}>
            <li>Download or clone the extension folder.</li>
            <li>Open <code>chrome://extensions</code>.</li>
            <li>Enable Developer Mode.</li>
            <li>Click “Load unpacked” and select the <code>chrome-extension/</code> folder.</li>
            <li>Click the extension icon → settings icon → paste your API key.</li>
            <li>Done. Browse Instagram and capture leads instantly.</li>
          </ol>
        </div>
      </motion.div>

      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving}
        style={{ minWidth: 140 }}
      >
        {saving ? (
          <><Loader2 size={14} className="spinner" /> Saving…</>
        ) : saved ? (
          <><CheckCircle size={14} /> Saved!</>
        ) : (
          <><Save size={14} /> Save Settings</>
        )}
      </button>
    </div>
  );
}
