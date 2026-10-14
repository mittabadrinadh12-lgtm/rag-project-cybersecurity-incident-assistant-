"use client";

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { BookOpen, FileText, LoaderCircle, UploadCloud } from "lucide-react";
import { api, formatTimestamp } from "@/lib/api";

interface DocumentSummary {
  id: string;
  title: string;
  source: string;
  status: string;
  chunkCount: number;
  embeddingState: string;
  accessScope: string;
  createdAt: string;
  sizeBytes: number;
}

const accepted = ".pdf,.md,.txt,.csv,.json";

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [accessScope, setAccessScope] = useState("SOC");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setDocuments(await api<DocumentSummary[]>("/documents"));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api<DocumentSummary>(`/documents/upload?access_scope=${encodeURIComponent(accessScope)}`, { method: "POST", body: form });
      setMessage(`${result.title} indexed successfully (${result.chunkCount} chunks).`);
      setDocuments((current) => [result, ...current]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Document upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const readyCount = documents.filter((document) => document.status === "Ready").length;
  const chunkCount = documents.reduce((total, document) => total + document.chunkCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">Retrieved knowledge</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">Knowledge base</h1>
        <p className="mt-2 text-sm text-muted">Ingest defensive references and retrieve cited chunks during incident investigations.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs text-muted">Documents</p><p className="mt-2 text-2xl font-semibold text-foreground">{loading ? "—" : documents.length}</p></div>
        <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs text-muted">Indexed</p><p className="mt-2 text-2xl font-semibold text-success">{loading ? "—" : readyCount}</p></div>
        <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs text-muted">Retrieval chunks</p><p className="mt-2 text-2xl font-semibold text-primary">{loading ? "—" : chunkCount}</p></div>
      </section>
      <section className="rounded-xl border border-border bg-surface p-5 shadow-panel">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3"><div className="rounded-lg bg-primary/10 p-2.5 text-primary"><UploadCloud aria-hidden="true" size={19} /></div><div><h2 className="text-sm font-semibold text-foreground">Add trusted source</h2><p className="mt-1 text-xs leading-5 text-muted">PDF, Markdown, TXT, CSV, or JSON · up to 20 MB · content is stored locally.</p></div></div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="access-scope" className="sr-only">Document access scope</label>
            <select id="access-scope" value={accessScope} onChange={(event) => setAccessScope(event.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-slate-200"><option>SOC</option><option>IR</option><option>Global</option><option>Restricted</option></select>
            <label className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-slate-950 hover:bg-sky-300 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
              {uploading ? <LoaderCircle aria-hidden="true" size={14} className="animate-spin" /> : <UploadCloud aria-hidden="true" size={14} />}
              {uploading ? "Indexing…" : "Upload document"}
              <input type="file" accept={accepted} disabled={uploading} onChange={upload} className="sr-only" />
            </label>
          </div>
        </div>
        {message && <p role="status" className="mt-4 rounded-lg border border-success/20 bg-success/5 p-3 text-xs text-green-200">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg border border-critical/30 bg-critical/10 p-3 text-xs text-red-200">Document operation failed: {error}</p>}
      </section>
      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-panel">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold text-foreground">Indexed sources</h2><p className="mt-1 text-xs text-muted">Source, ingestion status, chunk and embedding state, and access scope</p></div><BookOpen aria-hidden="true" size={18} className="text-muted" /></div>
        {loading ? <p className="p-5 text-sm text-muted">Loading knowledge sources…</p> : error && documents.length === 0 ? <div className="p-8 text-sm text-muted">Could not load sources. <button type="button" onClick={() => void load()} className="text-primary underline">Retry</button></div> : documents.length === 0 ? <div className="p-12 text-center"><FileText aria-hidden="true" size={24} className="mx-auto text-muted" /><p className="mt-3 text-sm text-slate-200">No documents indexed</p><p className="mt-1 text-xs text-muted">Upload a trusted reference to get started.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[750px] text-left">
            <thead><tr className="border-b border-border text-xs uppercase tracking-wider text-muted"><th scope="col" className="px-5 py-3 font-medium">Document</th><th scope="col" className="px-4 py-3 font-medium">Status</th><th scope="col" className="px-4 py-3 font-medium">Chunks</th><th scope="col" className="px-4 py-3 font-medium">Embedding</th><th scope="col" className="px-4 py-3 font-medium">Scope</th><th scope="col" className="px-4 py-3 font-medium">Added</th></tr></thead>
            <tbody className="divide-y divide-border/70">{documents.map((document) => <tr key={document.id} className="hover:bg-elevated/40"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="rounded-md bg-elevated p-2 text-primary"><FileText aria-hidden="true" size={15} /></span><span><span className="block text-sm font-medium text-slate-200">{document.title}</span><span className="mt-1 block text-xs text-muted">{document.source} · {document.id}</span></span></div></td><td className="px-4 py-4"><span className="rounded-full bg-success/10 px-2.5 py-1 text-xs text-green-300">{document.status}</span></td><td className="px-4 py-4 text-sm text-slate-300">{document.chunkCount}</td><td className="px-4 py-4 text-xs text-slate-300">{document.embeddingState}</td><td className="px-4 py-4"><span className="rounded-md bg-elevated px-2 py-1 text-xs text-slate-300">{document.accessScope}</span></td><td className="px-4 py-4 text-xs text-muted">{formatTimestamp(document.createdAt)}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>
      <p className="text-xs leading-5 text-slate-500">Retrieval uses a local deterministic embedding for offline indexing with keyword reranking. Uploaded content remains on this machine; review access scope and source trust before relying on a result.</p>
    </div>
  );
}
