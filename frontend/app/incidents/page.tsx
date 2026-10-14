"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { api, formatTimestamp } from "@/lib/api";
import type { Incident, IncidentStatus, Severity } from "@/lib/types";

const severities: Severity[] = ["Critical", "High", "Medium", "Low"];
const statuses: IncidentStatus[] = ["Open", "In Progress", "Contained", "Resolved"];

export default function IncidentsPage() {
  const [items, setItems] = useState<Incident[]>([]);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [technique, setTechnique] = useState("");
  const [asset, setAsset] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (severity) query.set("severity", severity);
      if (status) query.set("status", status);
      if (technique.trim()) query.set("technique", technique.trim());
      if (asset.trim()) query.set("asset", asset.trim());
      if (dateFrom) query.set("dateFrom", new Date(dateFrom).toISOString());
      if (dateTo) query.set("dateTo", new Date(`${dateTo}T23:59:59`).toISOString());
      const result = await api<Incident[]>(`/incidents?${query.toString()}`);
      setItems(result);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load incidents.");
    } finally {
      setLoading(false);
    }
  }, [asset, dateFrom, dateTo, search, severity, status, technique]);

  useEffect(() => {
    void load();
  }, [load]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    void load();
  }

  function clearFilters() {
    setSearch("");
    setSeverity("");
    setStatus("");
    setTechnique("");
    setAsset("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">Case management</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">Incidents</h1>
        <p className="mt-2 text-sm text-muted">Search, filter, and investigate security events across affected assets.</p>
      </div>
      <form onSubmit={submit} className="rounded-xl border border-border bg-surface p-4 shadow-panel">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative sm:col-span-2 xl:col-span-1">
            <span className="sr-only">Search incidents</span>
            <Search aria-hidden="true" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, title, analyst…" className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-slate-500 focus:border-primary/60" />
          </label>
          <label className="text-xs text-muted">
            <span className="sr-only">Severity</span>
            <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-slate-200 outline-none focus:border-primary/60">
              <option value="">All severities</option>{severities.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted">
            <span className="sr-only">Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-slate-200 outline-none focus:border-primary/60">
              <option value="">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">MITRE technique</span>
            <input value={technique} onChange={(event) => setTechnique(event.target.value)} placeholder="MITRE technique (e.g. T1059)" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-slate-500 focus:border-primary/60" />
          </label>
          <label>
            <span className="sr-only">Affected asset</span>
            <input value={asset} onChange={(event) => setAsset(event.target.value)} placeholder="Affected asset" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-slate-500 focus:border-primary/60" />
          </label>
          <label>
            <span className="sr-only">Updated from</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-slate-300 outline-none focus:border-primary/60" />
          </label>
          <label>
            <span className="sr-only">Updated through</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-slate-300 outline-none focus:border-primary/60" />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="h-10 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-slate-950 hover:bg-sky-300">Apply filters</button>
            <button type="button" onClick={clearFilters} aria-label="Clear all filters" className="h-10 rounded-lg border border-border px-3 text-muted hover:bg-elevated hover:text-foreground"><X aria-hidden="true" size={16} /></button>
          </div>
        </div>
      </form>

      {error && <div role="alert" className="rounded-lg border border-critical/30 bg-critical/10 p-3 text-sm text-red-200">Could not load incidents: {error} <button type="button" onClick={() => void load()} className="ml-2 underline">Retry</button></div>}
      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-panel">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div><h2 className="text-sm font-semibold text-foreground">Incident queue</h2><p className="mt-1 text-xs text-muted">{loading ? "Loading…" : `${items.length} matching incidents`}</p></div>
        </div>
        {loading ? <p className="p-5 text-sm text-muted">Loading incident queue…</p> : items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[790px] text-left">
              <thead><tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="px-5 py-3 font-medium">Incident</th><th scope="col" className="px-4 py-3 font-medium">Severity</th><th scope="col" className="px-4 py-3 font-medium">Status</th><th scope="col" className="px-4 py-3 font-medium">Asset</th><th scope="col" className="px-4 py-3 font-medium">Analyst</th><th scope="col" className="px-4 py-3 font-medium">MITRE</th><th scope="col" className="px-4 py-3 font-medium">Updated</th>
              </tr></thead>
              <tbody className="divide-y divide-border/70">{items.map((item) => (
                <tr key={item.id} className="hover:bg-elevated/50">
                  <td className="px-5 py-4"><Link href={`/incidents/${item.id}`} className="group"><span className="block text-xs text-muted">{item.id}</span><span className="mt-1 block max-w-[300px] truncate text-sm font-medium text-slate-200 group-hover:text-primary">{item.title}</span></Link></td>
                  <td className="px-4 py-4"><SeverityBadge severity={item.severity} /></td>
                  <td className="px-4 py-4 text-xs text-slate-300">{item.status}</td><td className="px-4 py-4 font-mono text-xs text-slate-300">{item.asset}</td>
                  <td className="px-4 py-4 text-sm text-slate-300">{item.analyst}</td><td className="px-4 py-4 font-mono text-xs text-primary">{item.technique}</td>
                  <td className="px-4 py-4 text-xs text-muted">{formatTimestamp(item.updatedAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="p-12 text-center"><p className="text-sm font-medium text-slate-200">No incidents match these filters</p><p className="mt-1 text-xs text-muted">Adjust filters or clear them to view all incidents.</p></div>}
      </section>
    </div>
  );
}
