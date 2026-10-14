TECHNIQUES = [
    {
        "id": "T1078", "name": "Valid Accounts", "tactic": "Initial Access, Persistence, Privilege Escalation, Defense Evasion",
        "confidence": 0.86, "justification": "Relevant when identity telemetry shows unusual use of a valid account; validate with account owner and sign-in context.",
        "detection": "Correlate identity sign-in events, device and location changes, MFA outcomes, and privilege changes.",
        "mitigation": "Apply approved identity protection, least privilege, MFA, and session revocation procedures.",
    },
    {
        "id": "T1059", "name": "Command and Scripting Interpreter", "tactic": "Execution",
        "confidence": 0.91, "justification": "Relevant to suspicious command interpreter or script activity in endpoint telemetry.",
        "detection": "Review process creation, parent-child relationships, command-line audit records, and endpoint detections.",
        "mitigation": "Use application control and logging policy; validate business context before containment.",
    },
    {
        "id": "T1110", "name": "Brute Force", "tactic": "Credential Access",
        "confidence": 0.79, "justification": "Relevant when repeated authentication failures appear within a short period.",
        "detection": "Correlate authentication failures by account, source, and time; inspect successful sign-ins and MFA results.",
        "mitigation": "Use approved rate limiting and account protection controls; follow identity-response procedures.",
    },
    {
        "id": "T1566", "name": "Phishing", "tactic": "Initial Access",
        "confidence": 0.82, "justification": "Relevant to user-reported suspicious email, links, or attachments.",
        "detection": "Preserve message headers; review recipients, URL and attachment analysis from approved tools, and mail telemetry.",
        "mitigation": "Use approved message reporting and removal workflows; communicate with affected users.",
    },
    {
        "id": "T1071", "name": "Application Layer Protocol", "tactic": "Command and Control",
        "confidence": 0.66, "justification": "Consider only when network evidence supports suspicious application-layer communication.",
        "detection": "Correlate proxy, DNS, and endpoint network telemetry against the asset's normal behavior.",
        "mitigation": "Validate business ownership and apply approved network controls when supported by evidence.",
    },
    {
        "id": "T1530", "name": "Data from Cloud Storage Object", "tactic": "Collection",
        "confidence": 0.61, "justification": "Potentially relevant to atypical access to shared or cloud-hosted data.",
        "detection": "Review cloud audit events, user context, object access patterns, and owner validation.",
        "mitigation": "Review access scope and follow approved cloud identity and data-protection procedures.",
    },
]


def for_incident(technique_id: str) -> list[dict[str, object]]:
    normalized = technique_id.split(".")[0]
    return [item for item in TECHNIQUES if item["id"] == normalized]
