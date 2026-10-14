"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BookOpen, Clock3, ShieldAlert } from "lucide-react";
import { IncidentTable } from "@/components/dashboard/incident-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SeverityChart } from "@/components/dashboard/severity-chart";
import { api } from "@/lib/api";
import type { Incident } from "@/lib/types";

interface DocumentSummary {
  id: string;
}

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [documentCount, setDocumentCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [incidentData, documents] = await Promise.all([
        api<Incident[]>("/incidents"),
        api<DocumentSummary[]>("/documents"),
      ]);
      setIncidents(incidentData);
      setDocumentCount(documents.length);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCount = incidents.filter((item) => item.status !== "Resolved").length;
  const criticalCount = incidents.filter((item) => item.severity === "Critical" && item.status !== "Resolved").length;
  const chartData = useMemo(
    () =>
      (["Critical", "High", "Medium", "Low"] as const).map((severity) => ({
        name: severity,
        open: incidents.filter((item) => item.severity === severity && item.status !== "Resolved").length,
        resolved: incidents.filter((item) => item.severity === severity && item.status === "Resolved").length,
      })),
    [incidents],
  );
  const highPriorityIncidents = incidents
    .filter((item) => item.severity === "Critical" || item.severity === "High")
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "Critical" ? -1 : 1));

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {loading ? "SYNCING WORKSPACE" : "WORKSPACE CONNECTED"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">Security overview</h1>
          <p className="mt-1.5 text-sm text-muted">Monitor incidents, triage alerts, and stay ahead of threats.</p>
        </div>
        <button type="button" onClick={() => { setLoading(true); void load(); }} className="self-start rounded-lg border border-border px-3 py-2 text-xs text-slate-300 hover:bg-elevated sm:self-auto">
          Refresh data
        </button>
      </div>
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-critical/30 bg-critical/10 px-4 py-3 text-sm text-red-200">
          <span>Dashboard API error: {error}</span>
          <button type="button" onClick={() => { setLoading(true); void load(); }} className="font-medium underline">Retry</button>
        </div>
      )}

      <section aria-label="Security operations key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Open incidents" value={loading ? "—" : String(openCount)} change={loading ? "…" : `${incidents.length} total`} trend="up" icon={ShieldAlert} iconColor="text-primary" description="currently tracked" />
        <KpiCard label="Critical alerts" value={loading ? "—" : String(criticalCount)} change="Needs review" trend="up" icon={AlertTriangle} iconColor="text-critical" description="unresolved" />
        <KpiCard label="Mean time to respond" value="18m" change="Target < 30m" trend="down" icon={Clock3} iconColor="text-warning" description="sample workspace metric" />
        <KpiCard label="Knowledge base" value={documentCount === null ? "—" : documentCount.toLocaleString()} change="Local sources" trend="up" icon={BookOpen} iconColor="text-success" description="indexed documents" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-panel">
          <div className="mb-1 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Incident severity</h2>
              <p className="mt-1 text-xs text-muted">Open and resolved incidents in this workspace</p>
            </div>
            <span className="rounded-md border border-border px-2 py-1 text-[11px] text-slate-300">All incidents</span>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" /> Open</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-slate-700" /> Resolved</span>
          </div>
          <SeverityChart data={chartData} />
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-panel">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-foreground">Analyst activity</h2>
            <p className="mt-1 text-xs text-muted">Recent incident updates</p>
          </div>
          <ol className="space-y-4">
            {incidents.slice(0, 4).map((item, index) => (
              <li key={item.id} className="flex gap-3">
                <span aria-hidden="true" className={`mt-1 h-[11px] w-[11px] shrink-0 rounded-full ${item.severity === "Critical" ? "bg-critical" : item.severity === "High" ? "bg-orange-400" : item.severity === "Medium" ? "bg-warning" : "bg-sky-400"}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200">{item.status}: {item.title}</p>
                  <p className="mt-1 truncate text-[11px] text-muted">{item.id} · {item.asset} · {index === 0 ? "latest" : item.updatedAt}</p>
                </div>
              </li>
            ))}
            {!incidents.length && !loading && <li className="text-xs text-muted">No incident activity yet.</li>}
          </ol>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">High-priority incidents</h2>
            <p className="mt-1 text-xs text-muted">Critical and high severity cases needing analyst attention</p>
          </div>
          <Link href="/incidents" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-elevated">
            View all incidents <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
        {loading ? <p className="px-5 pb-5 text-xs text-muted">Loading incidents…</p> : highPriorityIncidents.length ? <IncidentTable incidents={highPriorityIncidents.slice(0, 5)} /> : <p className="px-5 pb-5 text-xs text-muted">No high-priority incidents. Good work.</p>}
        <div className="border-t border-border px-5 py-3 text-xs text-muted">
          Showing <span className="font-medium text-slate-300">{Math.min(highPriorityIncidents.length, 5)}</span> of <span className="font-medium text-slate-300">{highPriorityIncidents.length}</span> high-priority incidents
        </div>
      </section>
    </div>
  );
}
