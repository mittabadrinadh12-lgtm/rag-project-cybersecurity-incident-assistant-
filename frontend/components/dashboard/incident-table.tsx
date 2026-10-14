import Link from "next/link";
import { ArrowUpRight, MoreHorizontal } from "lucide-react";
import type { Incident, IncidentStatus } from "@/lib/types";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { formatTimestamp } from "@/lib/api";

const statusStyles: Record<IncidentStatus, string> = {
  Open: "bg-sky-400/10 text-sky-200",
  "In Progress": "bg-primary/10 text-primary",
  Contained: "bg-warning/10 text-amber-200",
  Resolved: "bg-success/10 text-green-300",
};

export function IncidentTable({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
            <th scope="col" className="px-5 py-3 font-medium">Incident</th>
            <th scope="col" className="px-4 py-3 font-medium">Severity</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium">Affected asset</th>
            <th scope="col" className="px-4 py-3 font-medium">Analyst</th>
            <th scope="col" className="px-4 py-3 font-medium">Updated</th>
            <th scope="col" aria-label="Actions" className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {incidents.map((incident) => (
            <tr key={incident.id} className="transition-colors hover:bg-elevated/50">
              <td className="px-5 py-4">
                <Link href={`/incidents/${incident.id}`} className="group flex items-center gap-2">
                  <span>
                    <span className="block text-xs text-muted">{incident.id}</span>
                    <span className="mt-1 block max-w-[280px] truncate text-sm font-medium text-foreground group-hover:text-primary">
                      {incident.title}
                    </span>
                  </span>
                  <ArrowUpRight aria-hidden="true" size={14} className="shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </td>
              <td className="px-4 py-4"><SeverityBadge severity={incident.severity} /></td>
              <td className="px-4 py-4">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[incident.status]}`}>
                  {incident.status}
                </span>
              </td>
              <td className="px-4 py-4 font-mono text-xs text-slate-300">{incident.asset}</td>
              <td className="px-4 py-4 text-sm text-slate-300">{incident.analyst}</td>
              <td className="px-4 py-4 text-sm text-muted">{formatTimestamp(incident.updatedAt)}</td>
              <td className="px-4 py-4">
                <button
                  type="button"
                  aria-label={`More actions for ${incident.id}`}
                  className="rounded-md p-1.5 text-muted hover:bg-elevated hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <MoreHorizontal aria-hidden="true" size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
