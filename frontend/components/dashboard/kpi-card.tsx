import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  iconColor: string;
  description: string;
}

export function KpiCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  iconColor,
  description,
}: KpiCardProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-panel">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <span className={`rounded-lg bg-elevated p-2.5 ${iconColor}`}>
          <Icon aria-hidden="true" size={19} />
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-0.5 font-semibold ${trend === "down" ? "text-success" : "text-orange-300"}`}>
          <TrendIcon aria-hidden="true" size={14} />
          {change}
        </span>
        <span className="text-muted">{description}</span>
      </div>
    </section>
  );
}
