import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/types";

const severityStyles: Record<Severity, string> = {
  Critical: "border-critical/30 bg-critical/10 text-red-300",
  High: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  Medium: "border-warning/30 bg-warning/10 text-amber-200",
  Low: "border-sky-400/30 bg-sky-400/10 text-sky-200",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        severityStyles[severity],
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-critical": severity === "Critical",
          "bg-orange-400": severity === "High",
          "bg-warning": severity === "Medium",
          "bg-sky-400": severity === "Low",
        })}
      />
      {severity}
    </span>
  );
}
