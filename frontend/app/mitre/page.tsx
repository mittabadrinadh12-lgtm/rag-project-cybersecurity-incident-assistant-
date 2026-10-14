"use client";

import { useCallback, useEffect, useState } from "react";
import { Network, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

interface Technique {
  id: string;
  name: string;
  tactic: string;
  confidence: number;
  justification: string;
  detection: string;
  mitigation: string;
}

export default function MitrePage() {
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setTechniques(await api<Technique[]>("/mitre/techniques"));
      setError("");
    }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load technique mappings."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6">
      <div><p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">Threat framework</p><h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">MITRE ATT&amp;CK mapping</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Technique mappings are defensive triage hypotheses, not proof of adversary activity. Validate each mapping against incident evidence and trusted telemetry.</p></div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-center gap-3"><Network aria-hidden="true" size={19} className="text-primary" /><p className="text-xs leading-5 text-slate-300">Curated starter mappings include confidence, a short justification, detection ideas, and defensive mitigations.</p></div><span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">Enterprise</span></div>
      {error && <div role="alert" className="rounded-lg border border-critical/30 bg-critical/10 p-3 text-sm text-red-200">{error} <button type="button" onClick={() => void load()} className="underline">Retry</button></div>}
      {loading ? <p className="py-12 text-center text-sm text-muted">Loading ATT&amp;CK mappings…</p> : <section aria-label="MITRE ATT&CK techniques" className="grid gap-4 lg:grid-cols-2">{techniques.map((item) => <article key={item.id} className="rounded-xl border border-border bg-surface p-5 shadow-panel"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="font-mono text-sm font-semibold text-primary">{item.id}</span><h2 className="mt-1 text-base font-semibold text-foreground">{item.name}</h2></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-sky-200">{Math.round(item.confidence * 100)}% confidence</span></div><p className="mt-2 text-xs leading-5 text-muted"><span className="font-medium text-slate-300">Tactic:</span> {item.tactic}</p><p className="mt-4 text-sm leading-6 text-slate-300">{item.justification}</p><div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2"><div><h3 className="text-xs font-semibold text-slate-200">Detection ideas</h3><p className="mt-2 text-xs leading-5 text-muted">{item.detection}</p></div><div><h3 className="flex items-center gap-1.5 text-xs font-semibold text-green-200"><ShieldCheck aria-hidden="true" size={14} /> Defensive mitigation</h3><p className="mt-2 text-xs leading-5 text-muted">{item.mitigation}</p></div></div></article>)}</section>}
      {!loading && !error && techniques.length === 0 && <p className="rounded-lg border border-border p-8 text-center text-sm text-muted">No techniques are available.</p>}
    </div>
  );
}
