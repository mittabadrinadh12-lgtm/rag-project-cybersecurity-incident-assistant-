import json
import sqlite3
from datetime import UTC, datetime
from typing import Any

from app.core.config import DATABASE_PATH


def utc_now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


class ManagedConnection(sqlite3.Connection):
    def __exit__(self, exception_type, exception, traceback):
        try:
            return super().__exit__(exception_type, exception, traceback)
        finally:
            self.close()


def connect() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH, timeout=15, factory=ManagedConnection)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database() -> None:
    with connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                severity TEXT NOT NULL CHECK (severity IN ('Critical','High','Medium','Low')),
                status TEXT NOT NULL CHECK (status IN ('Open','In Progress','Contained','Resolved')),
                asset TEXT NOT NULL,
                analyst TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                technique TEXT NOT NULL,
                detail_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
                author TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                source TEXT NOT NULL,
                status TEXT NOT NULL,
                chunk_count INTEGER NOT NULL DEFAULT 0,
                embedding_state TEXT NOT NULL,
                access_scope TEXT NOT NULL,
                created_at TEXT NOT NULL,
                size_bytes INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            """
        )
        db.execute(
            "INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)",
            ("user", json.dumps({"displayName": "Maya Chen", "role": "SOC Analyst"})),
        )
        if db.execute("SELECT COUNT(*) FROM incidents").fetchone()[0] == 0:
            seed_incidents(db)


def seed_incidents(db: sqlite3.Connection) -> None:
    now = utc_now()
    seed: list[dict[str, Any]] = [
        {
            "id": "INC-2025", "title": "Suspicious PowerShell activity on finance endpoint", "severity": "Critical",
            "status": "In Progress", "asset": "FIN-WS-042", "analyst": "Maya Chen", "technique": "T1059.001",
            "description": "Endpoint telemetry flagged unusual PowerShell process activity on a finance workstation. Review the parent process, command-line audit records, and endpoint detections before determining scope.",
            "suspiciousIps": ["203.0.113.42"], "domains": ["updates-cdn.example.net"],
            "hashes": ["6f1ed002ab5595859014ebf0951522d9"], "usernames": ["mchen"],
            "endpoints": ["FIN-WS-042"], "affectedSystems": ["FIN-WS-042", "finance-file-share"],
            "evidence": [{"type": "Process", "value": "powershell.exe spawned by an office application", "source": "EDR process telemetry"}, {"type": "Network", "value": "Outbound request to updates-cdn.example.net", "source": "DNS and proxy logs"}],
            "timeline": [{"time": "2026-10-14T09:58:00+00:00", "event": "Endpoint alert created", "actor": "EDR"}, {"time": "2026-10-14T10:14:00+00:00", "event": "Incident assigned to Maya Chen", "actor": "SOC"}],
        },
        {
            "id": "INC-2024", "title": "Multiple failed logins from unfamiliar location", "severity": "High",
            "status": "Open", "asset": "auth-gateway-01", "analyst": "Unassigned", "technique": "T1110",
            "description": "Identity telemetry recorded a burst of failed sign-ins. Review source context and any subsequent successful authentication.",
            "suspiciousIps": ["198.51.100.73"], "domains": [], "hashes": [], "usernames": ["jdoe", "svc-reports"],
            "endpoints": ["auth-gateway-01"], "affectedSystems": ["identity-provider"],
            "evidence": [{"type": "Identity", "value": "37 failed sign-in events in 6 minutes", "source": "Identity provider audit"}],
            "timeline": [{"time": "2026-10-14T10:06:00+00:00", "event": "Authentication alert created", "actor": "Identity provider"}],
        },
        {
            "id": "INC-2023", "title": "Potential phishing attachment reported by user", "severity": "High",
            "status": "In Progress", "asset": "mail-prod-02", "analyst": "Jordan Lee", "technique": "T1566.001",
            "description": "A user reported an unexpected email attachment. Preserve the original message and review delivery scope using approved mail-security tools.",
            "suspiciousIps": [], "domains": ["invoice-review.example.org"], "hashes": ["d41d8cd98f00b204e9800998ecf8427e"],
            "usernames": ["rgarcia"], "endpoints": ["mail-prod-02"], "affectedSystems": ["mail-prod-02"],
            "evidence": [{"type": "Email", "value": "Unexpected attachment reported by recipient", "source": "User-reported message"}],
            "timeline": [{"time": "2026-10-14T09:42:00+00:00", "event": "User submitted message for review", "actor": "rgarcia"}],
        },
        {
            "id": "INC-2022", "title": "Unusual outbound connection to new domain", "severity": "Medium",
            "status": "Open", "asset": "ENG-LT-118", "analyst": "Avery Patel", "technique": "T1071.001",
            "description": "Proxy telemetry shows an unusual connection to a newly observed domain from an engineering laptop.",
            "suspiciousIps": ["192.0.2.81"], "domains": ["docs-cache.example.org"], "hashes": [],
            "usernames": ["apatel"], "endpoints": ["ENG-LT-118"], "affectedSystems": ["ENG-LT-118"],
            "evidence": [{"type": "Network", "value": "First-seen domain connection", "source": "Web proxy"}],
            "timeline": [{"time": "2026-10-14T08:55:00+00:00", "event": "Proxy anomaly detected", "actor": "Network monitoring"}],
        },
        {
            "id": "INC-2021", "title": "Unexpected admin sign-in outside business hours", "severity": "Medium",
            "status": "Contained", "asset": "idp-cluster-01", "analyst": "Sam Rivera", "technique": "T1078",
            "description": "Identity provider flagged an administrator sign-in outside the user's normal activity window. Session revocation is recorded as completed.",
            "suspiciousIps": ["203.0.113.18"], "domains": [], "hashes": [], "usernames": ["admin.ops"],
            "endpoints": ["idp-cluster-01"], "affectedSystems": ["identity-provider"],
            "evidence": [{"type": "Identity", "value": "Privileged sign-in outside baseline hours", "source": "Identity provider audit"}],
            "timeline": [{"time": "2026-10-14T07:40:00+00:00", "event": "Session revoked following owner validation", "actor": "Sam Rivera"}],
        },
        {
            "id": "INC-2020", "title": "Endpoint protection detected suspicious script", "severity": "Low",
            "status": "Resolved", "asset": "HR-WS-027", "analyst": "Maya Chen", "technique": "T1059",
            "description": "Endpoint protection blocked an untrusted script. Analyst review found no additional affected assets.",
            "suspiciousIps": [], "domains": [], "hashes": ["098f6bcd4621d373cade4e832627b4f6"], "usernames": ["hr.user"],
            "endpoints": ["HR-WS-027"], "affectedSystems": ["HR-WS-027"],
            "evidence": [{"type": "Endpoint", "value": "Script blocked before execution", "source": "Endpoint protection"}],
            "timeline": [{"time": "2026-10-13T15:10:00+00:00", "event": "Incident resolved after validation", "actor": "Maya Chen"}],
        },
        {
            "id": "INC-2019", "title": "Repeated DNS lookups to newly registered domain", "severity": "Medium",
            "status": "Open", "asset": "dns-resolver-03", "analyst": "Unassigned", "technique": "T1583.001",
            "description": "Resolver logs show repeated lookups to a recently registered domain. Validate the requesting clients and business context.",
            "suspiciousIps": [], "domains": ["portal-files.example.com"], "hashes": [], "usernames": [],
            "endpoints": ["dns-resolver-03"], "affectedSystems": ["dns-resolver-03"],
            "evidence": [{"type": "DNS", "value": "Repeated queries to a newly observed domain", "source": "Resolver logs"}],
            "timeline": [{"time": "2026-10-14T06:45:00+00:00", "event": "DNS alert created", "actor": "Network monitoring"}],
        },
        {
            "id": "INC-2018", "title": "Unusual data access on shared project folder", "severity": "Low",
            "status": "Resolved", "asset": "FS-PROD-01", "analyst": "Jordan Lee", "technique": "T1530",
            "description": "File audit logs showed atypical access to a shared project folder. The owner confirmed a scheduled review.",
            "suspiciousIps": [], "domains": [], "hashes": [], "usernames": ["contractor.temp"],
            "endpoints": ["FS-PROD-01"], "affectedSystems": ["FS-PROD-01"],
            "evidence": [{"type": "File access", "value": "Atypical access pattern confirmed as expected", "source": "File audit logs"}],
            "timeline": [{"time": "2026-10-13T13:20:00+00:00", "event": "Owner validated activity; incident resolved", "actor": "Jordan Lee"}],
        },
        {
            "id": "INC-2017", "title": "New OAuth application requested broad permissions", "severity": "High",
            "status": "In Progress", "asset": "tenant-prod", "analyst": "Avery Patel", "technique": "T1098.003",
            "description": "An OAuth application registration requested broad permissions. Review application ownership, consent, and identity audit events.",
            "suspiciousIps": [], "domains": ["login.example-app.net"], "hashes": [], "usernames": ["svc-integrations"],
            "endpoints": ["tenant-prod"], "affectedSystems": ["identity-provider"],
            "evidence": [{"type": "Identity", "value": "New application requested elevated API permissions", "source": "Cloud audit"}],
            "timeline": [{"time": "2026-10-13T11:35:00+00:00", "event": "Application consent flagged for review", "actor": "Cloud audit"}],
        },
        {
            "id": "INC-2016", "title": "Endpoint isolation requested after malware alert", "severity": "Critical",
            "status": "Contained", "asset": "OPS-WS-009", "analyst": "Sam Rivera", "technique": "T1204.002",
            "description": "Endpoint protection raised an alert and the device was isolated under the response playbook. Preserve telemetry for follow-up.",
            "suspiciousIps": ["198.51.100.91"], "domains": ["cdn-assets.example.net"], "hashes": ["5d41402abc4b2a76b9719d911017c592"],
            "usernames": ["ops.user"], "endpoints": ["OPS-WS-009"], "affectedSystems": ["OPS-WS-009"],
            "evidence": [{"type": "Endpoint", "value": "Endpoint isolated by approved response workflow", "source": "EDR"}],
            "timeline": [{"time": "2026-10-13T09:15:00+00:00", "event": "Endpoint isolation confirmed", "actor": "Sam Rivera"}],
        },
    ]
    for item in seed:
        detail = {key: value for key, value in item.items() if key not in {"id", "title", "severity", "status", "asset", "analyst", "technique"}}
        detail["createdAt"] = now
        detail["notes"] = []
        detail["techniques"] = []
        db.execute(
            """INSERT INTO incidents(id,title,severity,status,asset,analyst,updated_at,technique,detail_json)
            VALUES(?,?,?,?,?,?,?,?,?)""",
            (item["id"], item["title"], item["severity"], item["status"], item["asset"], item["analyst"], now, item["technique"], json.dumps(detail)),
        )
