"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Bot, Download, LoaderCircle, Plus, RefreshCw, UserRound } from "lucide-react";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { api, formatTimestamp } from "@/lib/api";
import type { IncidentDetail, IncidentStatus } from "@/lib/types";

const tabs = ["Overview", "Evidence", "AI Analysis", "MITRE ATT&CK", "Timeline", "Notes"] as const;
type Tab = (typeof tabs)[number];
type AssistantAnswer = { answer: string; confidence: number; humanReview: boolean; sources: Array<{ id: string; title: string; source: string; content: string; score: number; chunk: number }> };

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const incidentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    try {
      setIncident(await api<IncidentDetail>(`/incidents/${encodeURIComponent(incidentId)}`));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load incident.");
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function update(fields: { status?: IncidentStatus; analyst?: string }) {
    setBusy(true);
    setActionError("");
    try {
      setIncident(await api<IncidentDetail>(`/incidents/${encodeURIComponent(incidentId)}`, { method: "PATCH", body: JSON.stringify(fields) }));
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : "Could not update incident.");
    } finally {
      setBusy(false);
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await api<IncidentDetail>(`/incidents/${encodeURIComponent(incidentId)}/notes`, {
        method: "POST", body: JSON.stringify({ author: "Maya Chen", content: note.trim() }),
      });
      setIncident(result);
      setNote("");
    } catch (noteError) {
      setActionError(noteError instanceof Error ? noteError.message : "Could not save note.");
    } finally {
      setBusy(false);
    }
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    setBusy(true);
    setActionError("");
    try {
      setAnswer(await api<AssistantAnswer>("/rag/query", {
        method: "POST", body: JSON.stringify({ question: question.trim(), incident_id: incidentId }),
      }));
      setQuestion("");
    } catch (queryError) {
      setActionError(queryError instanceof Error ? queryError.message : "The AI analysis request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function exportReport(format: "markdown" | "html") {
    setActionError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/api/reports/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident_id: incidentId, format }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.detail ?? `Report export failed (${response.status}).`);
      }
      const report = format === "html" ? await response.text() : (await response.json()).report;
      const blob = new Blob([report], { type: format === "html" ? "text/html" : "text/markdown" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${incidentId}-report.${format === "html" ? "html" : "md"}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (reportError) {
      setActionError(reportError instanceof Error ? reportError.message : "Could not export the report.");
    }
  }

  if (loading) return <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted"><LoaderCircle aria-hidden="true" className="animate-spin text-primary" size={20} />Loading incident workspace…</div>;
  if (error || !incident) return <div role="alert" className="rounded-xl border border-critical/30 bg-critical/10 p-5 text-sm text-red-200">{error || "Incident not found."}<div className="mt-4 flex gap-3"><button type="button" onClick={() => { setLoading(true); void load(); }} className="underline">Retry</button><Link href="/incidents" className="underline">Back to incidents</Link></div></div>;

  const indicatorGroups = [
    ["Suspicious IPs", incident.suspiciousIps],
    ["Domains", incident.domains],
    ["Hashes", incident.hashes],
    ["Usernames", incident.usernames],
    ["Endpoints", incident.endpoints],
    ["Affected systems", incident.affectedSystems],
  ] as const;

  return (
    <div className="space-y-6">
      <Link href="/incidents" className="inline-flex items-center gap-2 text-xs text-muted hover:text-primary"><ArrowLeft aria-hidden="true" size={15} /> Back to incidents</Link>
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted">{incident.id}</span><SeverityBadge severity={incident.severity} />
            <span className="rounded-full bg-elevated px-2.5 py-1 text-xs text-slate-300">{incident.status}</span>
          </div>
          <h1 className="mt-3 text-xl font-semibold leading-7 text-foreground md:text-2xl">{incident.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{incident.description}</p>
          <p className="mt-3 text-xs text-muted">Affected asset <span className="font-mono text-slate-300">{incident.asset}</span><span className="mx-2 text-slate-600">·</span>Owner <span className="text-slate-300">{incident.analyst}</span><span className="mx-2 text-slate-600">·</span>Updated <span className="text-slate-300">{formatTimestamp(incident.updatedAt)}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="assign-analyst">Assign analyst</label>
          <select id="assign-analyst" value={incident.analyst} disabled={busy} onChange={(event) => void update({ analyst: event.target.value })} className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-slate-200">
            {["Maya Chen", "Jordan Lee", "Avery Patel", "Sam Rivera", "Unassigned"].map((name) => <option key={name}>{name}</option>)}
          </select>
          <label className="sr-only" htmlFor="incident-status">Change status</label>
          <select id="incident-status" value={incident.status} disabled={busy} onChange={(event) => void update({ status: event.target.value as IncidentStatus })} className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-slate-200">
            {(["Open", "In Progress", "Contained", "Resolved"] as const).map((status) => <option key={status}>{status}</option>)}
          </select>
          <button type="button" onClick={() => void exportReport("markdown")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-slate-200 hover:bg-elevated"><Download aria-hidden="true" size={14} /> Export report</button>
        </div>
      </div>
      {actionError && <div role="alert" className="rounded-lg border border-critical/30 bg-critical/10 p-3 text-xs text-red-200">{actionError}</div>}

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-panel">
        <div role="tablist" aria-label="Incident workspace" className="flex gap-1 overflow-x-auto border-b border-border px-3 pt-2">
          {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-t-lg border-b-2 px-3 py-3 text-xs font-medium transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"}`}>{tab}</button>)}
        </div>
        <div role="tabpanel" className="min-h-[390px] p-5 md:p-6">
          {activeTab === "Overview" && (
            <div className="space-y-7">
              <div><h2 className="text-sm font-semibold text-foreground">Incident overview</h2><p className="mt-1 text-xs text-muted">Key indicators and affected entities recorded for this case.</p></div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {indicatorGroups.map(([label, values]) => <div key={label} className="rounded-lg border border-border bg-background/60 p-4"><h3 className="text-xs font-medium text-muted">{label}</h3><ul className="mt-3 space-y-2">{values.length ? values.map((value) => <li key={value} className="break-all font-mono text-xs text-slate-200">{value}</li>) : <li className="text-xs text-slate-500">None recorded</li>}</ul></div>)}
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-4"><p className="text-xs text-muted">Created <span className="ml-1 text-slate-300">{formatTimestamp(incident.createdAt)}</span></p><p className="mt-2 text-xs text-muted">Primary technique <span className="ml-1 font-mono text-primary">{incident.technique}</span></p></div>
            </div>
          )}
          {activeTab === "Evidence" && <div><h2 className="text-sm font-semibold text-foreground">Evidence</h2><p className="mt-1 text-xs text-muted">Recorded observations and their source telemetry. Validate before acting.</p><div className="mt-5 space-y-3">{incident.evidence.map((item, index) => <article key={`${item.type}-${index}`} className="rounded-lg border border-border bg-background/50 p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="text-xs font-semibold text-primary">{item.type}</h3><span className="text-[11px] text-muted">{item.source}</span></div><p className="mt-2 text-sm leading-6 text-slate-200">{item.value}</p></article>)}{!incident.evidence.length && <p className="text-sm text-muted">No evidence has been recorded.</p>}</div></div>}
          {activeTab === "AI Analysis" && <div className="space-y-5"><div><h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Bot aria-hidden="true" size={17} className="text-primary" /> Incident-grounded AI analysis</h2><p className="mt-1 text-xs text-muted">Local qwen3:4b with retrieved source chunks and this incident record.</p></div><form onSubmit={ask} className="flex gap-2"><label className="sr-only" htmlFor="incident-ai-question">Ask about this incident</label><input id="incident-ai-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={4000} placeholder="Ask what evidence to check next…" className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-slate-500" /><button disabled={busy || !question.trim()} className="rounded-lg bg-primary px-4 text-xs font-semibold text-slate-950 disabled:opacity-40">{busy ? "Thinking…" : "Ask"}</button></form>{answer && <article className="rounded-lg border border-border bg-background/50 p-4"><div className="flex flex-wrap justify-between gap-2"><span className="text-xs font-semibold text-primary">Confidence {Math.round(answer.confidence * 100)}%</span>{answer.humanReview && <span className="text-xs font-medium text-amber-200">Human review needed</span>}</div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{answer.answer}</p><h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Retrieved sources</h3><ul className="mt-2 space-y-2">{answer.sources.map((source) => <li key={`${source.id}-${source.chunk}`} className="rounded-md border border-border p-3 text-xs"><span className="font-mono text-primary">[{source.id}]</span> <span className="text-slate-200">{source.title}</span><p className="mt-1 leading-5 text-muted">{source.content}</p></li>)}</ul></article>}<Link href="/assistant" className="inline-block text-xs text-primary hover:text-sky-300">Open full AI assistant →</Link></div>}
          {activeTab === "MITRE ATT&CK" && <div><h2 className="text-sm font-semibold text-foreground">MITRE ATT&CK mapping</h2><p className="mt-1 text-xs text-muted">Triage mappings are hypotheses; validate against incident evidence.</p><div className="mt-5 grid gap-3 lg:grid-cols-2">{incident.techniques.map((item) => <article key={item.id} className="rounded-lg border border-border bg-background/50 p-4"><div className="flex items-start justify-between gap-3"><div><span className="font-mono text-xs font-semibold text-primary">{item.id}</span><h3 className="mt-1 text-sm font-semibold text-foreground">{item.name}</h3></div><span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-sky-200">{Math.round(item.confidence * 100)}% match</span></div><p className="mt-2 text-xs text-muted">Tactic: {item.tactic}</p><p className="mt-4 text-xs leading-5 text-slate-300">{item.justification}</p><div className="mt-4 border-t border-border pt-3"><h4 className="text-xs font-semibold text-slate-200">Defensive detection</h4><p className="mt-1 text-xs leading-5 text-muted">{item.detection}</p><h4 className="mt-3 text-xs font-semibold text-slate-200">Mitigation</h4><p className="mt-1 text-xs leading-5 text-muted">{item.mitigation}</p></div></article>)}{!incident.techniques.length && <p className="text-sm text-muted">No mapping available; technique {incident.technique} needs analyst review.</p>}</div></div>}
          {activeTab === "Timeline" && <div><h2 className="text-sm font-semibold text-foreground">Investigation timeline</h2><p className="mt-1 text-xs text-muted">Chronological actions recorded for this incident.</p><ol className="mt-5 space-y-0">{[...incident.timeline].sort((a, b) => a.time.localeCompare(b.time)).map((event, index) => <li key={`${event.time}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">{index < incident.timeline.length - 1 && <span aria-hidden="true" className="absolute left-[5px] top-3 h-full w-px bg-border" />}<span aria-hidden="true" className="relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full bg-primary" /><div><p className="text-sm text-slate-200">{event.event}</p><p className="mt-1 text-xs text-muted">{formatTimestamp(event.time)} · {event.actor}</p></div></li>)}</ol>{!incident.timeline.length && <p className="mt-4 text-sm text-muted">No timeline events recorded.</p>}</div>}
          {activeTab === "Notes" && <div><h2 className="text-sm font-semibold text-foreground">Analyst notes</h2><p className="mt-1 text-xs text-muted">Internal working notes for this incident.</p><form onSubmit={addNote} className="mt-4"><label htmlFor="incident-note" className="sr-only">Add an analyst note</label><textarea id="incident-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={5000} rows={3} placeholder="Record an observation or handoff…" className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground outline-none placeholder:text-slate-500 focus:border-primary/60" /><button type="submit" disabled={busy || !note.trim()} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-40"><Plus aria-hidden="true" size={14} /> Add note</button></form><div className="mt-5 space-y-3">{incident.notes.map((item, index) => <article key={`${item.createdAt}-${index}`} className="rounded-lg border border-border bg-background/50 p-4"><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-xs font-medium text-slate-200"><UserRound aria-hidden="true" size={14} className="text-primary" />{item.author}</span><time className="text-[11px] text-muted">{formatTimestamp(item.createdAt)}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.content}</p></article>)}{!incident.notes.length && <p className="text-xs text-muted">No notes added yet.</p>}</div></div>}
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted"><span>Created {formatTimestamp(incident.createdAt)}</span><div className="flex gap-3"><button type="button" onClick={() => void exportReport("html")} className="inline-flex items-center gap-1 hover:text-primary"><Download aria-hidden="true" size={13} /> PDF-ready HTML</button><button type="button" onClick={() => { setLoading(true); void load(); }} className="inline-flex items-center gap-1 hover:text-primary"><RefreshCw aria-hidden="true" size={13} /> Refresh</button></div></div>
    </div>
  );
}
