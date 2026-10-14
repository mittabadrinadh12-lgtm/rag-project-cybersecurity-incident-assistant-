from html import escape
from typing import Any


def report_markdown(incident: dict[str, Any]) -> str:
    evidence = incident.get("evidence", [])
    timeline = incident.get("timeline", [])
    techniques = incident.get("techniques", [])
    lines = [
        f"# Incident Report: {incident['id']} — {incident['title']}",
        "",
        "## Executive summary",
        incident["description"],
        "",
        "## Severity and impact",
        f"- **Severity:** {incident['severity']}",
        f"- **Status:** {incident['status']}",
        f"- **Affected asset:** {incident['asset']}",
        f"- **Analyst:** {incident['analyst']}",
        f"- **Affected systems:** {', '.join(incident.get('affectedSystems', [])) or 'Not recorded'}",
        "",
        "## Timeline",
    ]
    lines.extend([f"- {event.get('time', 'Time not recorded')}: {event.get('event', 'Event not recorded')} ({event.get('actor', 'Unknown actor')})" for event in timeline] or ["- No timeline events recorded."])
    lines.extend(["", "## Evidence"])
    lines.extend([f"- **{item.get('type', 'Evidence')}:** {item.get('value', 'Not recorded')} — source: {item.get('source', 'Not recorded')}" for item in evidence] or ["- No evidence recorded."])
    lines.extend(["", "## MITRE ATT&CK mappings"])
    lines.extend([f"- **{item.get('id')} {item.get('name')}** ({item.get('tactic')}) — confidence {item.get('confidence')}: {item.get('justification')}" for item in techniques] or [f"- {incident['technique']} — validate mapping against incident evidence."])
    lines.extend(["", "## Recommended defensive actions", "- Preserve relevant logs and evidence according to policy.", "- Validate indicators and scope with trusted telemetry and asset owners.", "- Coordinate containment and recovery using approved incident-response procedures.", "", "## Sources and confidence", "- Incident evidence and timeline recorded in SentinelRAG.", "- MITRE ATT&CK technique mapping is a triage aid; analyst validation is required.", "- AI-generated content should be validated by a human analyst.", ""])
    return "\n".join(lines)


def report_html(incident: dict[str, Any]) -> str:
    markdown = escape(report_markdown(incident))
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Incident report {escape(incident['id'])}</title>
<style>body{{font:16px/1.6 Arial,sans-serif;max-width:900px;margin:3rem auto;padding:0 1.5rem;color:#172033}}pre{{white-space:pre-wrap;font:inherit}}@media print{{body{{margin:0;max-width:none}}}}</style>
</head><body><pre>{markdown}</pre></body></html>"""
