# SentinelRAG — Cybersecurity Incident Assistant

SentinelRAG is a defensive security operations workspace. The responsive frontend connects to the FastAPI service for dashboard data, incident workflows, local RAG queries, knowledge documents, ATT&CK mappings, reports, and settings.

## Folder structure

```text
sentinelrag/
├── frontend/
│   ├── app/
│   │   ├── assistant/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── login/page.tsx
│   │   ├── incidents/[id]/page.tsx
│   │   ├── incidents/page.tsx
│   │   ├── knowledge-base/page.tsx
│   │   ├── mitre/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── incident-table.tsx
│   │   │   ├── kpi-card.tsx
│   │   │   └── severity-chart.tsx
│   │   ├── layout/
│   │   │   ├── console-shell.tsx
│   │   │   ├── header.tsx
│   │   │   └── sidebar.tsx
│   │   └── ui/severity-badge.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── mock-data.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── .env.example
│   ├── .gitignore
│   ├── next.config.mjs
│   ├── package.json
│   ├── postcss.config.js
│   ├── eslint.config.mjs
│   └── tsconfig.json
└── backend/                 # See the repository README for setup
```

## UI design system

- **Canvas / surfaces:** `#0B1120` background, `#111827` panels, and `#1F2937` elevated UI.
- **Primary / status:** sky `#38BDF8`, green `#22C55E`, amber `#F59E0B`, and critical red `#EF4444`.
- **Typography:** high-contrast slate/white labels with muted `#94A3B8` supporting text.
- **Interaction:** keyboard-visible focus, semantic landmarks, responsive collapsible navigation, labeled controls, and severity conveyed by text as well as color.
- **Components:** Tailwind utility styling following shadcn/ui composition conventions; Lucide React icons and Recharts visualization.

## Run the frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000/dashboard>. Run FastAPI, the embedded ChromaDB index, and Ollama as described in the repository-level `README.md`.
