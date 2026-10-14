"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
interface SeverityCount {
  name: string;
  open: number;
  resolved: number;
}

export function SeverityChart({ data }: { data: SeverityCount[] }) {
  return (
    <div className="h-[250px] w-full" role="img" aria-label="Bar chart comparing open and resolved incidents by severity">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 0 }} barGap={8}>
          <CartesianGrid stroke="#263244" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.07)" }}
            contentStyle={{ background: "#111827", border: "1px solid #263244", borderRadius: 8, color: "#F8FAFC" }}
            labelStyle={{ color: "#CBD5E1", marginBottom: 4 }}
          />
          <Bar dataKey="open" name="Open" fill="#38BDF8" radius={[4, 4, 0, 0]} maxBarSize={25} />
          <Bar dataKey="resolved" name="Resolved" fill="#334155" radius={[4, 4, 0, 0]} maxBarSize={25} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
