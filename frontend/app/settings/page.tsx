"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Check, CircleAlert, Cpu, LoaderCircle, Save, Shield } from "lucide-react";
import { api } from "@/lib/api";

type Role = "SOC Analyst" | "Security Engineer" | "Incident Responder" | "Student";
interface Profile { displayName: string; role: Role }
interface Health { status: string; model: string; ollamaReady: boolean; incidents: number; documents: number }

const defaultProfile: Profile = { displayName: "Maya Chen", role: "SOC Analyst" };

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadHealth = useCallback(async () => {
    try { setHealth(await api<Health>("/health")); }
    catch (healthError) { setError(healthError instanceof Error ? healthError.message : "Could not check API health."); }
    finally { setLoading(false); }
  }, []);
  const loadProfile = useCallback(async () => {
    try {
      setProfile(await api<Profile>("/settings"));
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Could not load the analyst profile.");
    }
  }, []);

  useEffect(() => {
    void loadHealth();
    void loadProfile();
  }, [loadHealth, loadProfile]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await api<Profile>("/settings", { method: "PUT", body: JSON.stringify(profile) });
      setProfile(updated);
      localStorage.setItem("sentinelrag-profile", JSON.stringify(updated));
      window.dispatchEvent(new Event("sentinelrag:profile"));
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div><p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">Workspace configuration</p><h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">Settings</h1><p className="mt-2 text-sm text-muted">Manage the local analyst profile and check service connections.</p></div>
      {error && <div role="alert" className="rounded-lg border border-critical/30 bg-critical/10 p-3 text-sm text-red-200">{error}</div>}
      <section className="rounded-xl border border-border bg-surface p-5 shadow-panel">
        <div className="flex items-start gap-3"><div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Shield aria-hidden="true" size={19} /></div><div><h2 className="text-sm font-semibold text-foreground">Mock analyst profile</h2><p className="mt-1 text-xs leading-5 text-muted">Development-only role selection for the initial mock login experience. This is not production authentication or access control.</p></div></div>
        <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-300">Display name<input required minLength={1} maxLength={100} value={profile.displayName} onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/60" /></label>
          <label className="text-xs font-medium text-slate-300">Mock role<select value={profile.role} onChange={(event) => setProfile((current) => ({ ...current, role: event.target.value as Role }))} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/60">{(["SOC Analyst", "Security Engineer", "Incident Responder", "Student"] as const).map((role) => <option key={role}>{role}</option>)}</select></label>
          <div className="flex items-center gap-3 sm:col-span-2"><button type="submit" disabled={saving || !profile.displayName.trim()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-sky-300 disabled:opacity-50">{saving ? <LoaderCircle aria-hidden="true" size={15} className="animate-spin" /> : <Save aria-hidden="true" size={15} />}Save profile</button>{saved && <span role="status" className="inline-flex items-center gap-1 text-xs text-green-300"><Check aria-hidden="true" size={14} />Saved</span>}</div>
        </form>
      </section>
      <section className="rounded-xl border border-border bg-surface p-5 shadow-panel">
        <div className="flex items-center justify-between gap-3"><div className="flex items-start gap-3"><div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Cpu aria-hidden="true" size={19} /></div><div><h2 className="text-sm font-semibold text-foreground">Local services</h2><p className="mt-1 text-xs text-muted">API connectivity and the configured Ollama model.</p></div></div><button type="button" onClick={() => { setLoading(true); void loadHealth(); }} className="text-xs text-primary hover:text-sky-300">Refresh</button></div>
        <dl className="mt-5 divide-y divide-border">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3"><dt className="text-xs text-muted">SentinelRAG API</dt><dd className="inline-flex items-center gap-2 text-xs text-slate-200">{loading ? <LoaderCircle aria-hidden="true" size={14} className="animate-spin" /> : <span className={`h-2 w-2 rounded-full ${health?.status === "ok" ? "bg-success" : "bg-critical"}`} />}{loading ? "Checking…" : health?.status === "ok" ? "Connected" : "Unavailable"}</dd></div>
          <div className="flex flex-wrap items-center justify-between gap-3 py-3"><dt className="text-xs text-muted">Local generation model</dt><dd className="text-xs text-slate-200">{health?.model ?? "qwen3:4b"} <span className={`ml-2 rounded-full px-2 py-1 ${health?.ollamaReady ? "bg-success/10 text-green-300" : "bg-warning/10 text-amber-200"}`}>{loading ? "Checking" : health?.ollamaReady ? "Available" : "Not detected"}</span></dd></div>
          <div className="flex flex-wrap items-center justify-between gap-3 py-3"><dt className="text-xs text-muted">Vector store / documents</dt><dd className="text-xs text-slate-200">ChromaDB · {health?.documents ?? "—"} indexed documents</dd></div>
          <div className="flex flex-wrap items-center justify-between gap-3 py-3"><dt className="text-xs text-muted">Incident database</dt><dd className="text-xs text-slate-200">Local SQLite · {health?.incidents ?? "—"} incidents</dd></div>
          <div className="flex flex-wrap items-center justify-between gap-3 py-3"><dt className="text-xs text-muted">Embedding strategy</dt><dd className="text-xs text-slate-200">Local deterministic hash + lexical reranking</dd></div>
        </dl>
        {!loading && health && !health.ollamaReady && <p className="mt-3 flex gap-2 rounded-lg border border-warning/20 bg-warning/5 p-3 text-xs leading-5 text-amber-100"><CircleAlert aria-hidden="true" size={15} className="mt-0.5 shrink-0" />Start Ollama and confirm <code>{health.model}</code> is installed before using the assistant.</p>}
      </section>
    </div>
  );
}
