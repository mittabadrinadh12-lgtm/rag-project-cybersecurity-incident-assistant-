export type Severity = "Critical" | "High" | "Medium" | "Low";
export type IncidentStatus = "Open" | "In Progress" | "Contained" | "Resolved";

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  asset: string;
  analyst: string;
  updatedAt: string;
  technique: string;
}

export interface IncidentDetail extends Incident {
  description: string;
  createdAt: string;
  suspiciousIps: string[];
  domains: string[];
  hashes: string[];
  usernames: string[];
  endpoints: string[];
  affectedSystems: string[];
  evidence: Array<{ type: string; value: string; source: string }>;
  timeline: Array<{ time: string; event: string; actor: string }>;
  notes: Array<{ author: string; content: string; createdAt: string }>;
  techniques: Array<{
    id: string;
    name: string;
    tactic: string;
    confidence: number;
    justification: string;
    detection: string;
    mitigation: string;
  }>;
}
