"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileBarChart2, LoaderCircle } from "lucide-react";
import { api, formatTimestamp } from "@/lib/api";
import type { Incident } from "@/lib/types";

export default function ReportsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentId, setIncidentId] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const items = await api<Incident[]>("/incidents");
      setIncidents(items);
      setIncidentId((current) => current || items[0]?.id || "");
      setError("");
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load incidents."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function generate(format: "markdown" | "html") {
    if (!incidentId) return;
    setGenerating(true);
    setError("");
    try {
      if (format === "markdown") {
        const result = await api<{ report: string }>("/reports/generate", { method: "POST", body: JSON.stringify({ incident_id: incidentId, format }) });
        setReport(result.report);
      } else {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/api/reports/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ incident_id: incidentId, format }) });
        if (!response.ok) throw new Error(`Report export failed with HTTP ${response.status}.`);
        const html = await response.text();
        const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${incidentId}-report.html`;
        anchor.click();
        URL.revokeObjectURL(url);
      }
    } catch (generationError) { setError(generationError instanceof Error ? generationError.message : "Could not generate report."); }
    finally { setGenerating(false); }
  }

  return (
    <div className="space-y-6">
      <div><p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">Incident documentation</p><h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">Reports</h1><p className="mt-2 text-sm text-muted">Generate structured, evidence-linked incident summaries for review and handoff.</p></div>
      <section className="rounded-xl border border-border bg-surface p-5 shadow-panel">
        <div className="flex items-start gap-3"><div className="rounded-lg bg-primary/10 p-2.5 text-primary"><FileBarChart2 aria-hidden="true" size={19} /></div><div><h2 className="text-sm font-semibold text-foreground">Generate incident report</h2><p className="mt-1 text-xs text-muted">Includes executive summary, severity and impact, timeline, evidence, MITRE mappings, actions, and confidence notes.</p></div></div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="report-incident" className="sr-only">Select incident</label>
          <select id="report-incident" value={incidentId} onChange={(event) => { setIncidentId(event.target.value); setReport(""); }} disabled={loading} className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-slate-200">{incidents.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}</select>
          <button type="button" disabled={generating || !incidentId} onClick={() => void generate("markdown")} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-slate-950 hover:bg-sky-300 disabled:opacity-50">{generating ? <LoaderCircle aria-hidden="true" size={15} className="animate-spin" /> : <Download aria-hidden="true" size={15} />}Export Markdown</button>
          <button type="button" disabled={generating || !incidentId} onClick={() => void generate("html")} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-xs font-medium text-slate-200 hover:bg-elevated disabled:opacity-50">PDF-ready HTML</button>
        </div>
      </section>
      {error && <div role="alert" className="rounded-lg border border-critical/30 bg-critical/10 p-3 text-sm text-red-200">{error} <button type="button" onClick={() => void load()} className="underline">Retry</button></div>}
      {report && <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-panel"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold text-foreground">Report preview</h2><p className="mt-1 text-xs text-muted">Generated {formatTimestamp(new Date().toISOString())}</p></div><button type="button" onClick={() => void generate("markdown")} className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-sky-300"><Download aria-hidden="true" size={14} /> Download again</button></div><pre className="max-h-[640px] overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-6 text-slate-300">{report}</pre></section>}
    </div>
  );
}
