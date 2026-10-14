"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Shield } from "lucide-react";
import { api } from "@/lib/api";

type Role = "SOC Analyst" | "Security Engineer" | "Incident Responder" | "Student";
interface Profile { displayName: string; role: Role }

export default function LoginPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("Maya Chen");
  const [role, setRole] = useState<Role>("SOC Analyst");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const profile = await api<Profile>("/auth/mock", {
        method: "POST",
        body: JSON.stringify({ displayName: displayName.trim(), role }),
      });
      localStorage.setItem("sentinelrag-profile", JSON.stringify(profile));
      localStorage.setItem("sentinelrag-mock-session", JSON.stringify({ ...profile, signedInAt: new Date().toISOString() }));
      window.dispatchEvent(new Event("sentinelrag:profile"));
      router.replace("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Could not start the mock analyst session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Shield aria-hidden="true" size={22} /></span>
          <div><p className="text-base font-semibold text-foreground">Sentinel<span className="text-primary">RAG</span></p><p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-muted">Cybersecurity incident assistant</p></div>
        </div>
        <h1 className="mt-8 text-xl font-semibold text-foreground">Analyst sign in</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Start a local demo session by selecting an analyst name and role.</p>
        <form onSubmit={signIn} className="mt-6 space-y-4">
          <label className="block text-xs font-medium text-slate-300">Display name<input required minLength={1} maxLength={100} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/60" /></label>
          <label className="block text-xs font-medium text-slate-300">Role<select value={role} onChange={(event) => setRole(event.target.value as Role)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/60">{(["SOC Analyst", "Security Engineer", "Incident Responder", "Student"] as const).map((item) => <option key={item}>{item}</option>)}</select></label>
          {error && <p role="alert" className="rounded-lg border border-critical/30 bg-critical/10 p-3 text-xs text-red-200">{error}</p>}
          <button type="submit" disabled={loading || !displayName.trim()} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-slate-950 hover:bg-sky-300 disabled:opacity-50">{loading && <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />}{loading ? "Starting session…" : "Continue to workspace"}</button>
        </form>
        <p className="mt-5 rounded-lg border border-warning/20 bg-warning/5 p-3 text-[11px] leading-5 text-amber-100">Mock sign-in only: this development profile is not password-protected and does not enforce authorization. Do not use it for production or sensitive real incidents.</p>
      </section>
    </div>
  );
}
