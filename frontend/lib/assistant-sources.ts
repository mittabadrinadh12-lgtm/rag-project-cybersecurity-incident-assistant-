export interface AssistantSource {
  id: string;
  title: string;
  source: string;
  content: string;
  keywords: string[];
}

export const assistantSources: AssistantSource[] = [
  {
    id: "KB-MITRE-T1059",
    title: "Command and Scripting Interpreter (T1059)",
    source: "MITRE ATT&CK Enterprise",
    content:
      "T1059 covers adversary use of command and scripting interpreters. For defensive investigation, review process creation telemetry, parent-child process relationships, command-line audit records, script-block logging where enabled, and endpoint detections. Validate the activity with the asset owner before containment.",
    keywords: ["command", "scripting", "powershell", "script", "process", "interpreter", "T1059"],
  },
  {
    id: "KB-MITRE-T1110",
    title: "Brute Force (T1110)",
    source: "MITRE ATT&CK Enterprise",
    content:
      "T1110 covers repeated attempts to guess credentials. Defenders can correlate authentication failures by account, source, and time window; check for successful sign-ins following failures; review MFA outcomes and identity-provider risk signals; and apply approved rate-limits or account-protection controls.",
    keywords: ["brute", "force", "login", "authentication", "password", "credential", "sign-in", "T1110"],
  },
  {
    id: "KB-MITRE-T1078",
    title: "Valid Accounts (T1078)",
    source: "MITRE ATT&CK Enterprise",
    content:
      "T1078 describes misuse of valid accounts. Review sign-in context, device and location changes, MFA events, privilege changes, and activity inconsistent with the account's normal pattern. Confirm with the account owner and follow identity-response procedures before revoking sessions or credentials.",
    keywords: ["valid", "account", "identity", "sign-in", "authentication", "privilege", "MFA", "T1078"],
  },
  {
    id: "KB-MITRE-T1566",
    title: "Phishing (T1566)",
    source: "MITRE ATT&CK Enterprise",
    content:
      "T1566 covers phishing delivered through messages or services. Preserve the original message and headers, identify recipients, review URL and attachment detonation results from approved tools, and search mail telemetry for related messages. Use the organization's reporting and message-removal process.",
    keywords: ["phishing", "email", "mail", "attachment", "URL", "message", "T1566"],
  },
  {
    id: "KB-IR-TRIAGE",
    title: "Incident triage and containment checklist",
    source: "SentinelRAG defensive response playbook",
    content:
      "Establish scope and timeline from trusted telemetry; preserve relevant logs and evidence with chain-of-custody procedures; identify affected identities and assets; validate indicators using approved internal tools; coordinate containment with system owners; document each action; and confirm recovery and monitoring before closure. Follow the organization's incident-response policy and escalate when impact or confidence is uncertain.",
    keywords: ["incident", "investigate", "evidence", "containment", "recovery", "response", "triage", "safe", "next", "steps"],
  },
];

const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "i", "in",
  "is", "it", "me", "of", "on", "or", "our", "should", "summarize", "the", "this",
  "to", "we", "what", "which", "with",
]);

export function retrieveAssistantSources(query: string): Array<AssistantSource & { score: number }> {
  const terms = [...new Set(query.toLowerCase().match(/[a-z0-9.]+/g) ?? [])]
    .filter((term) => term.length > 2 && !stopWords.has(term));

  const ranked = assistantSources
    .map((source) => {
      const searchable = `${source.title} ${source.content} ${source.keywords.join(" ")}`.toLowerCase();
      const matches = terms.filter((term) => searchable.includes(term));
      return { ...source, score: terms.length ? matches.length / terms.length : 0 };
    })
    .filter((source) => source.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  return ranked;
}
