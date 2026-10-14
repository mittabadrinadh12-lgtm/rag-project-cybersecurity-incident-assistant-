import hashlib
import json
import math
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

import chromadb
from chromadb.api.types import Documents, Embeddings, EmbeddingFunction

from app.core.config import CHROMA_PATH, DATA_DIR
from app.services.database import connect, utc_now

BUILT_IN_SOURCES = [
    {
        "id": "KB-MITRE-T1059", "title": "Command and Scripting Interpreter (T1059)",
        "source": "MITRE ATT&CK Enterprise", "accessScope": "Global",
        "content": "T1059 covers adversary use of command and scripting interpreters. For defensive investigation, review process creation telemetry, parent-child process relationships, command-line audit records, script-block logging where enabled, and endpoint detections. Validate the activity with the asset owner before containment.",
    },
    {
        "id": "KB-MITRE-T1110", "title": "Brute Force (T1110)",
        "source": "MITRE ATT&CK Enterprise", "accessScope": "Global",
        "content": "T1110 covers repeated attempts to guess credentials. Defenders can correlate authentication failures by account, source, and time window; check for successful sign-ins following failures; review MFA outcomes and identity-provider risk signals; and apply approved rate-limits or account-protection controls.",
    },
    {
        "id": "KB-MITRE-T1078", "title": "Valid Accounts (T1078)",
        "source": "MITRE ATT&CK Enterprise", "accessScope": "Global",
        "content": "T1078 describes misuse of valid accounts. Review sign-in context, device and location changes, MFA events, privilege changes, and activity inconsistent with the account's normal pattern. Confirm with the account owner and follow identity-response procedures before revoking sessions or credentials.",
    },
    {
        "id": "KB-MITRE-T1566", "title": "Phishing (T1566)",
        "source": "MITRE ATT&CK Enterprise", "accessScope": "Global",
        "content": "T1566 covers phishing delivered through messages or services. Preserve the original message and headers, identify recipients, review URL and attachment results from approved tools, and search mail telemetry for related messages. Use the organization's reporting and message-removal process.",
    },
    {
        "id": "KB-IR-TRIAGE", "title": "Incident triage and containment checklist",
        "source": "SentinelRAG defensive response playbook", "accessScope": "Global",
        "content": "Establish scope and timeline from trusted telemetry; preserve relevant logs and evidence with chain-of-custody procedures; identify affected identities and assets; validate indicators using approved internal tools; coordinate containment with system owners; document each action; and confirm recovery and monitoring before closure. Follow the organization's incident-response policy and escalate when impact or confidence is uncertain.",
    },
    {
        "id": "KB-OWASP-LOGGING", "title": "Logging and monitoring guidance",
        "source": "OWASP Logging Cheat Sheet", "accessScope": "Global",
        "content": "Defensive logging should capture sufficient context for investigation while protecting sensitive data. Review authentication and authorization events, application errors, and administrative activity. Restrict access to logs, synchronize timestamps, protect integrity, and follow retention and privacy policy.",
    },
    {
        "id": "KB-POLICY-EVIDENCE", "title": "Security incident evidence handling policy",
        "source": "Example security policy", "accessScope": "Global",
        "content": "Record who collected evidence, when it was collected, the source system, and any handling or transfer. Preserve original evidence, work from verified copies when practical, restrict access to authorized responders, and follow legal, privacy, retention, and chain-of-custody requirements.",
    },
    {
        "id": "KB-SIEM-SAMPLE", "title": "Sample SIEM authentication alert",
        "source": "SentinelRAG sample SIEM event", "accessScope": "Global",
        "content": "Example event summary: authentication failures for a service account increased above its baseline from one network location. This is sample data only and is not evidence for any live incident. Analysts should correlate source, account, time window, and any subsequent successful sign-in using trusted telemetry.",
    },
]

TOKEN_RE = re.compile(r"[a-zA-Z0-9_.-]{2,}")


class LocalHashEmbedding(EmbeddingFunction):
    """Small deterministic embedding for offline Chroma use; lexical reranking refines matches."""

    dimensions = 384

    def __init__(self) -> None:
        pass

    @staticmethod
    def name() -> str:
        return "sentinelrag-local-hash"

    @staticmethod
    def build_from_config(config: dict[str, Any]) -> "LocalHashEmbedding":
        return LocalHashEmbedding()

    def get_config(self) -> dict[str, Any]:
        return {}

    def __call__(self, input: Documents) -> Embeddings:
        vectors: list[list[float]] = []
        for document in input:
            vector = [0.0] * self.dimensions
            tokens = TOKEN_RE.findall(document.lower())
            for token in tokens:
                digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
                number = int.from_bytes(digest[:4], "little")
                index = number % self.dimensions
                sign = 1.0 if digest[4] & 1 else -1.0
                vector[index] += sign
            norm = math.sqrt(sum(value * value for value in vector)) or 1.0
            vectors.append([value / norm for value in vector])
        return vectors


_client: Any = None
_collection: Any = None


def collection() -> Any:
    global _client, _collection
    if _collection is None:
        CHROMA_PATH.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        _collection = _client.get_or_create_collection(
            name="sentinelrag_knowledge",
            embedding_function=LocalHashEmbedding(),
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def chunks(text: str, size: int = 900, overlap: int = 140) -> list[str]:
    clean = re.sub(r"\s+", " ", text).strip()
    if not clean:
        return []
    result: list[str] = []
    start = 0
    while start < len(clean):
        end = min(start + size, len(clean))
        if end < len(clean):
            boundary = clean.rfind(" ", start + size // 2, end)
            if boundary > start:
                end = boundary
        result.append(clean[start:end].strip())
        if end >= len(clean):
            break
        start = max(end - overlap, start + 1)
    return result


def index_document(
    document_id: str, title: str, source: str, text: str, access_scope: str
) -> int:
    parts = chunks(text)
    if not parts:
        raise ValueError("Document contains no indexable text.")
    store = collection()
    ids = [f"{document_id}:{index}" for index in range(len(parts))]
    metadatas = [
        {"document_id": document_id, "title": title, "source": source, "chunk_index": index, "access_scope": access_scope}
        for index in range(len(parts))
    ]
    store.upsert(ids=ids, documents=parts, metadatas=metadatas)
    return len(parts)


def initialize_knowledge() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    store = collection()
    with connect() as db:
        count = db.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
        if count == 0:
            for item in BUILT_IN_SOURCES:
                chunk_count = index_document(item["id"], item["title"], item["source"], item["content"], item["accessScope"])
                db.execute(
                    """INSERT OR IGNORE INTO documents
                    (id,title,source,status,chunk_count,embedding_state,access_scope,created_at,size_bytes)
                    VALUES(?,?,?,'Ready',?,'Indexed',?,?,?)""",
                    (item["id"], item["title"], item["source"], chunk_count, item["accessScope"], utc_now(), len(item["content"].encode())),
                )
        elif store.count() == 0:
            for item in BUILT_IN_SOURCES:
                index_document(item["id"], item["title"], item["source"], item["content"], item["accessScope"])


def retrieve(query: str, limit: int = 5) -> list[dict[str, Any]]:
    store = collection()
    if not query.strip() or store.count() == 0:
        return []
    response = store.query(
        query_texts=[query],
        n_results=min(max(limit * 3, limit), store.count()),
        where={"access_scope": {"$ne": "Restricted"}},
        include=["documents", "metadatas", "distances"],
    )
    documents = response.get("documents", [[]])[0]
    metadatas = response.get("metadatas", [[]])[0]
    distances = response.get("distances", [[]])[0]
    query_terms = {term.lower() for term in TOKEN_RE.findall(query) if len(term) > 2}
    results = []
    for document, metadata, distance in zip(documents, metadatas, distances):
        searchable = f"{metadata.get('title', '')} {document}".lower()
        terms = set(TOKEN_RE.findall(searchable))
        lexical = len(query_terms & terms) / max(len(query_terms), 1)
        vector_score = max(0.0, min(1.0, 1.0 - float(distance)))
        score = 0.75 * lexical + 0.25 * vector_score
        if score > 0.025:
            results.append({
                "id": metadata["document_id"],
                "title": metadata["title"],
                "source": metadata["source"],
                "content": document,
                "score": round(score, 3),
                "chunk": metadata["chunk_index"],
            })
    return sorted(results, key=lambda item: item["score"], reverse=True)[:limit]


def list_documents() -> list[dict[str, Any]]:
    with connect() as db:
        rows = db.execute("SELECT * FROM documents ORDER BY created_at DESC").fetchall()
    return [
        {
            "id": row["id"], "title": row["title"], "source": row["source"], "status": row["status"],
            "chunkCount": row["chunk_count"], "embeddingState": row["embedding_state"],
            "accessScope": row["access_scope"], "createdAt": row["created_at"], "sizeBytes": row["size_bytes"],
        }
        for row in rows
    ]


def add_uploaded_document(
    document_id: str, title: str, source: str, text: str, access_scope: str, size_bytes: int
) -> dict[str, Any]:
    count = index_document(document_id, title, source, text, access_scope)
    created_at = utc_now()
    with connect() as db:
        db.execute(
            """INSERT INTO documents
            (id,title,source,status,chunk_count,embedding_state,access_scope,created_at,size_bytes)
            VALUES(?,?,?,'Ready',?,'Indexed',?,?,?)""",
            (document_id, title, source, count, access_scope, created_at, size_bytes),
        )
    return {
        "id": document_id, "title": title, "source": source, "status": "Ready",
        "chunkCount": count, "embeddingState": "Indexed", "accessScope": access_scope,
        "createdAt": created_at, "sizeBytes": size_bytes,
    }


def extract_text(filename: str, raw: bytes) -> str:
    extension = Path(filename).suffix.lower()
    if extension == ".pdf":
        from pypdf import PdfReader

        import io

        reader = PdfReader(io.BytesIO(raw))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    elif extension == ".json":
        parsed = json.loads(raw.decode("utf-8-sig"))
        text = json.dumps(parsed, ensure_ascii=False, indent=2)
    else:
        text = raw.decode("utf-8-sig")
    if not text.strip():
        raise ValueError("No readable text was found in the uploaded document.")
    return text
