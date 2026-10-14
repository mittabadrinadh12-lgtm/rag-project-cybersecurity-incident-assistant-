# SentinelRAG — Cybersecurity Incident Assistant

A defensive SOC workspace for incident triage, source-grounded analysis, MITRE ATT&CK mapping, and report generation. The application is designed to run locally: Next.js serves the UI, FastAPI serves the API, ChromaDB persists the vector index on disk, and the assistant uses your local Ollama `qwen3:4b` model.

## Project structure

```text
sentinelrag/
├── backend/
│   ├── app/
│   │   ├── api/routes.py
│   │   ├── core/config.py
│   │   ├── models/schemas.py
│   │   ├── services/
│   │   │   ├── assistant.py
│   │   │   ├── database.py
│   │   │   ├── knowledge.py
│   │   │   ├── mitre.py
│   │   │   └── reports.py
│   │   └── main.py
│   ├── tests/test_core.py
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── assistant/
    │   ├── dashboard/
    │   ├── incidents/[id]/
    │   ├── incidents/
    │   ├── knowledge-base/
    │   ├── login/
    │   ├── mitre/
    │   ├── reports/
    │   ├── settings/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── dashboard/
    │   ├── layout/
    │   └── ui/
    ├── lib/
    │   ├── api.ts
    │   ├── mock-data.ts
    │   └── types.ts
    ├── .env.example
    └── package.json
```

## Run locally (Windows PowerShell)

Prerequisites: Python 3.11+, Node.js 20+, npm, and Ollama. Your local `qwen3:4b` is used for answer generation.

### 1. Configure and run the API

```powershell
cd "C:\chatbot\rag project\backend"
Copy-Item .env.example .env
& "C:\Program Files\Python314\python.exe" -m venv .venv
& ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt
& ".\.venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API creates `backend\data\sentinelrag.db`, a persistent embedded ChromaDB index at `backend\data\chroma`, and the upload directory on first start. ChromaDB runs embedded in the API process, so no second Chroma server is required. API documentation: <http://localhost:8000/docs>.

### 2. Ensure Ollama is serving your local model

Ollama is configured at `http://localhost:11434` and `qwen3:4b` by default.

```powershell
ollama list
ollama run qwen3:4b
```

If Ollama is not already running as a service, start it in a separate terminal with `ollama serve`. Do not start a second server if the local Ollama API is already responding.

### 3. Run the frontend

```powershell
cd "C:\chatbot\rag project\frontend"
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>. Sign in with any display name and one of the demo roles; this mock session gates the UI only and is not production authentication. Use `/dashboard`, `/assistant`, `/incidents`, `/knowledge-base`, `/mitre`, `/reports`, and `/settings` for the workspaces. Frontend API URL can be set through `NEXT_PUBLIC_API_BASE_URL`.

### 4. Run backend tests

```powershell
cd "C:\chatbot\rag project\backend"
& ".\.venv\Scripts\python.exe" -m pytest
```

## Implemented features

- Dashboard KPIs, severity chart, activity summary, and high-priority incidents.
- Incident search and severity/status/date/technique/asset filters; incident details, evidence, timeline, analyst notes, assignment, and status changes.
- Local Qwen assistant with retrieved source chunks, citations, confidence, and human-review warnings.
- PDF, Markdown, TXT, CSV, and JSON ingestion, local chunk indexing, document metadata, and access-scope labels.
- Curated defensive starter knowledge for MITRE ATT&CK, OWASP-style logging, evidence handling, incident response, and sample SIEM data.
- ATT&CK technique mappings with defensive detection and mitigation ideas.
- Structured Markdown and print-friendly HTML report export.
- Editable mock analyst profile/role. This profile switcher is not production authentication or authorization.
- Mock role-based sign-in and sign-out for local demonstrations; it is not an authorization boundary.

## Local RAG and model notes

Generation uses Ollama's local `/api/chat` endpoint and `OLLAMA_MODEL=qwen3:4b`. The installed Qwen model did not implement Ollama's embedding endpoint when tested. To keep retrieval local and avoid requiring an additional model download, ChromaDB uses a deterministic token-hash embedding with lexical reranking. This is suitable for a runnable local starter, but it is not a semantic embedding model; validate retrieval quality before operational use. Replacing it with a locally installed Ollama embedding model is an environment/configuration follow-up.

Uploaded documents, SQLite state, and the Chroma index remain under `backend\data`. The initial UI profile is mock-only; do not treat this development application as an authenticated production SOC system.

## API endpoints

- `GET /api/health`
- `GET /api/incidents` and `GET /api/incidents/{id}`
- `PATCH /api/incidents/{id}` and `POST /api/incidents/{id}/notes`
- `POST /api/documents/upload` and `GET /api/documents`
- `POST /api/rag/query`
- `GET /api/mitre/techniques`
- `POST /api/reports/generate` (`format` is `markdown` or `html`)
- `POST /api/auth/mock` (local demonstration sign-in only)
- `GET /api/settings` and `PUT /api/settings`
