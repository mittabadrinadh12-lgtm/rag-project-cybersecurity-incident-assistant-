import json
import re
from pathlib import Path
from uuid import uuid4

import httpx
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import HTMLResponse

from app.core.config import ALLOWED_EXTENSIONS, MAX_UPLOAD_MB
from app.models.schemas import IncidentUpdate, MockLoginRequest, NoteCreate, RagQuery, ReportRequest, UserSettings
from app.services import database
from app.services.assistant import answer_question
from app.services.database import connect, utc_now
from app.services.knowledge import add_uploaded_document, extract_text, list_documents, retrieve
from app.services.mitre import TECHNIQUES, for_incident
from app.services.reports import report_html, report_markdown

router = APIRouter(prefix="/api")


def incident_record(row, include_notes: bool = True) -> dict:
    record = {
        "id": row["id"], "title": row["title"], "severity": row["severity"], "status": row["status"],
        "asset": row["asset"], "analyst": row["analyst"], "updatedAt": row["updated_at"],
        "technique": row["technique"],
    }
    record.update(json.loads(row["detail_json"]))
    if include_notes:
        record["notes"] = get_notes(row["id"])
    return record


def get_notes(incident_id: str) -> list[dict[str, str]]:
    with connect() as db:
        rows = db.execute(
            "SELECT author,content,created_at FROM notes WHERE incident_id=? ORDER BY id DESC",
            (incident_id,),
        ).fetchall()
    return [{"author": row["author"], "content": row["content"], "createdAt": row["created_at"]} for row in rows]


def find_incident(incident_id: str) -> dict:
    with connect() as db:
        row = db.execute("SELECT * FROM incidents WHERE id=?", (incident_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} was not found.")
    record = incident_record(row)
    record["techniques"] = for_incident(record["technique"])
    return record


@router.get("/health")
async def health():
    try:
        from app.core.config import OLLAMA_BASE_URL, OLLAMA_MODEL

        async with httpx.AsyncClient(timeout=3) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            models = [item["name"] for item in response.json().get("models", [])]
        ollama_ready = any(name == OLLAMA_MODEL for name in models)
    except httpx.HTTPError:
        ollama_ready = False
    with connect() as db:
        incident_count = db.execute("SELECT COUNT(*) FROM incidents").fetchone()[0]
        document_count = db.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    from app.core.config import OLLAMA_MODEL

    return {
        "status": "ok", "model": OLLAMA_MODEL, "ollamaReady": ollama_ready,
        "incidents": incident_count, "documents": document_count,
    }


@router.get("/incidents")
def list_incidents(
    search: str = Query(default="", max_length=200),
    severity: str | None = None,
    status: str | None = None,
    technique: str | None = None,
    asset: str | None = None,
    date_from: str | None = Query(default=None, alias="dateFrom"),
    date_to: str | None = Query(default=None, alias="dateTo"),
):
    clauses: list[str] = []
    values: list[str] = []
    if severity:
        clauses.append("severity = ?")
        values.append(severity)
    if status:
        clauses.append("status = ?")
        values.append(status)
    if technique:
        clauses.append("technique LIKE ?")
        values.append(f"%{technique}%")
    if asset:
        clauses.append("asset LIKE ?")
        values.append(f"%{asset}%")
    if date_from:
        clauses.append("updated_at >= ?")
        values.append(date_from)
    if date_to:
        clauses.append("updated_at <= ?")
        values.append(date_to)
    if search:
        clauses.append("(id LIKE ? OR title LIKE ? OR asset LIKE ? OR analyst LIKE ?)")
        values.extend([f"%{search}%"] * 4)
    where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    with connect() as db:
        rows = db.execute(f"SELECT * FROM incidents{where} ORDER BY updated_at DESC", values).fetchall()
    return [incident_record(row, include_notes=False) for row in rows]


@router.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    return find_incident(incident_id)


@router.patch("/incidents/{incident_id}")
def update_incident(incident_id: str, update: IncidentUpdate):
    changes = update.model_dump(exclude_unset=True, exclude_none=True)
    if not changes:
        raise HTTPException(status_code=400, detail="Provide a status or analyst to update.")
    allowed = {"status", "analyst"}
    if set(changes) - allowed:
        raise HTTPException(status_code=400, detail="Unsupported incident update.")
    with connect() as db:
        row = db.execute("SELECT * FROM incidents WHERE id=?", (incident_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} was not found.")
        status_value = changes.get("status", row["status"])
        analyst_value = changes.get("analyst", row["analyst"])
        db.execute(
            "UPDATE incidents SET status=?,analyst=?,updated_at=? WHERE id=?",
            (status_value, analyst_value, utc_now(), incident_id),
        )
    return find_incident(incident_id)


@router.post("/incidents/{incident_id}/notes")
def create_note(incident_id: str, note: NoteCreate):
    find_incident(incident_id)
    with connect() as db:
        db.execute(
            "INSERT INTO notes(incident_id,author,content,created_at) VALUES(?,?,?,?)",
            (incident_id, note.author.strip(), note.content.strip(), utc_now()),
        )
        db.execute("UPDATE incidents SET updated_at=? WHERE id=?", (utc_now(), incident_id))
    return find_incident(incident_id)


@router.get("/documents")
def documents():
    return list_documents()


@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    access_scope: str = Query(default="SOC"),
):
    filename = Path(file.filename or "document").name
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Supported files: PDF, Markdown, TXT, CSV, and JSON.")
    if access_scope not in {"SOC", "IR", "Global", "Restricted"}:
        raise HTTPException(status_code=422, detail="Access scope must be SOC, IR, Global, or Restricted.")
    raw = await file.read(MAX_UPLOAD_MB * 1024 * 1024 + 1)
    await file.close()
    if len(raw) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Files must be {MAX_UPLOAD_MB} MB or smaller.")
    try:
        text = extract_text(filename, raw)
        document_id = f"DOC-{uuid4().hex[:10].upper()}"
        saved_path = None
        from app.core.config import UPLOAD_PATH

        UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
        saved_path = UPLOAD_PATH / f"{document_id}{extension}"
        saved_path.write_bytes(raw)
        try:
            record = add_uploaded_document(document_id, filename, "Analyst upload", text, access_scope, len(raw))
        except Exception:
            saved_path.unlink(missing_ok=True)
            raise
    except (UnicodeDecodeError, ValueError) as error:
        raise HTTPException(status_code=422, detail=f"Could not ingest document: {error}") from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Document indexing failed: {error}") from error
    return record


@router.post("/rag/query")
async def rag_query(request: RagQuery):
    incident = find_incident(request.incident_id) if request.incident_id else None
    try:
        return await answer_question(request.question.strip(), incident)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@router.get("/mitre/techniques")
def mitre_techniques():
    return TECHNIQUES


@router.post("/reports/generate")
def generate_report(request: ReportRequest):
    incident = find_incident(request.incident_id)
    if request.format == "html":
        return HTMLResponse(report_html(incident))
    markdown = report_markdown(incident)
    return {"incidentId": request.incident_id, "format": "markdown", "report": markdown}


@router.get("/settings")
def get_settings():
    with connect() as db:
        row = db.execute("SELECT value FROM settings WHERE key='user'").fetchone()
    return json.loads(row["value"])


@router.post("/auth/mock")
def mock_login(profile: MockLoginRequest):
    user = profile.model_dump()
    with connect() as db:
        db.execute(
            "INSERT INTO settings(key,value) VALUES('user',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (json.dumps(user),),
        )
    return user


@router.put("/settings")
def update_settings(settings: UserSettings):
    with connect() as db:
        db.execute(
            "INSERT INTO settings(key,value) VALUES('user',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (settings.model_dump_json(),),
        )
    return settings.model_dump()
