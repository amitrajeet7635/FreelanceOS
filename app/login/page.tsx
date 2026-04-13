"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

// ── Inner form (uses useSearchParams — must be inside Suspense) ───────────────
function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get("next") || "/dashboard";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createSupabaseBrowser();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: 20,
        padding: "28px 28px 24px",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <form onSubmit={handleLogin}>
        {/* Email */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Email</label>
          <div style={{ position: "relative" }}>
            <Mail
              size={15}
              style={{
                position: "absolute", left: 11, top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none",
              }}
            />
            <input
              id="email"
              type="email"
              className="form-control"
              style={{ paddingLeft: 34 }}
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Password</label>
          <div style={{ position: "relative" }}>
            <Lock
              size={15}
              style={{
                position: "absolute", left: 11, top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none",
              }}
            />
            <input
              id="password"
              type={showPw ? "text" : "password"}
              className="form-control"
              style={{ paddingLeft: 34, paddingRight: 40 }}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", padding: 2, display: "flex",
              }}
              tabIndex={-1}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10, padding: "10px 12px", marginBottom: 14,
                fontSize: 13, color: "#ef4444",
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="btn btn-primary"
          style={{
            width: "100%", justifyContent: "center",
            padding: "11px 0", fontSize: 14, fontWeight: 700,
            borderRadius: 12, gap: 8,
          }}
          disabled={loading || !email || !password}
        >
          {loading
            ? <><Loader2 size={15} className="spinner" /> Signing in…</>
            : "Sign In"
          }
        </motion.button>
      </form>
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: "24px",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 500, height: 500, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
            style={{
              width: 52, height: 52, borderRadius: 16,
              background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: "0 8px 32px rgba(99,102,241,0.35)",
            }}
          >
            <Zap size={26} color="#fff" strokeWidth={2.5} />
          </motion.div>
          <h1
            style={{
              fontSize: 22, fontWeight: 800, color: "var(--text-primary)",
              letterSpacing: "-0.03em", margin: "0 0 4px",
            }}
          >
            FreelanceOS
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Sign in to access your workspace
          </p>
        </div>

        {/* Wrap the form in Suspense (required for useSearchParams in App Router) */}
        <Suspense fallback={
          <div
            style={{
              background: "var(--bg-surface)", border: "1px solid var(--border-default)",
              borderRadius: 20, padding: "28px", display: "flex",
              justifyContent: "center", alignItems: "center", minHeight: 200,
            }}
          >
            <Loader2 size={20} className="spinner" color="var(--text-muted)" />
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p
          style={{
            textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 20,
          }}
        >
          Personal workspace · Access restricted
        </p>
      </motion.div>
    </div>
  );
}
