"use client";

import { FormEvent, useState } from "react";
import { Bot, BookOpen, LoaderCircle, Send, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

interface AssistantResult {
  answer: string;
  confidence: number;
  humanReview: boolean;
  sources: Array<{ id: string; title: string; source: string; content: string }>;
  nextActions: string[];
  model: string;
}

const suggestions = [
  "Summarize the available incident response guidance.",
  "What evidence should I investigate for suspicious PowerShell?",
  "Which MITRE ATT&CK techniques relate to phishing?",
  "Suggest safe containment and recovery steps.",
];

export default function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;

    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await api<AssistantResult>("/rag/query", {
        method: "POST",
        body: JSON.stringify({ question: trimmedQuestion }),
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The assistant request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
          <Sparkles aria-hidden="true" size={14} /> Local AI · grounded responses
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">AI Investigation Assistant</h1>
        <p className="mt-2 text-sm text-muted">
          Ask defensive investigation questions. Answers use retrieved reference chunks and run locally on your Ollama model.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="flex min-h-[560px] flex-col rounded-xl border border-border bg-surface shadow-panel">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot aria-hidden="true" size={19} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">SentinelRAG Assistant</h2>
              <p className="mt-0.5 text-xs text-muted">Model: qwen3:4b · served by local Ollama</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-green-300">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Local
            </span>
          </div>

          <div className="flex flex-1 flex-col p-5">
            {!result && !loading && !error && (
              <div className="my-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-elevated text-primary">
                  <ShieldCheck aria-hidden="true" size={23} />
                </div>
                <h3 className="mt-4 text-center text-base font-semibold text-foreground">How can I help investigate?</h3>
                <p className="mx-auto mt-2 max-w-md text-center text-sm leading-6 text-muted">
                  Answers are grounded in the local reference set. Retrieved sources and confidence are shown with every response.
                </p>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setQuestion(suggestion)}
                      className="rounded-lg border border-border bg-background/60 p-3 text-left text-xs leading-5 text-slate-300 transition-colors hover:border-slate-500 hover:bg-elevated"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="my-auto flex flex-col items-center gap-3 text-sm text-muted" role="status">
                <LoaderCircle aria-hidden="true" size={24} className="animate-spin text-primary" />
                Waiting for the local qwen3:4b model…
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-lg border border-critical/30 bg-critical/10 p-4 text-sm text-red-200">
                <p className="font-semibold">Could not get an answer</p>
                <p className="mt-1 break-words text-xs leading-5 text-red-200/80">{error}</p>
                <p className="mt-3 text-xs text-red-200/80">Confirm Ollama is running and `qwen3:4b` is available locally.</p>
              </div>
            )}

            {result && (
              <div className="space-y-5">
                <div className={`rounded-lg border p-4 ${result.humanReview ? "border-warning/30 bg-warning/5" : "border-border bg-background/60"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Assistant response</p>
                    <span className="rounded-full bg-elevated px-2.5 py-1 text-[11px] text-slate-300">
                      Confidence {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{result.answer}</p>
                  {result.humanReview && (
                    <p className="mt-4 border-t border-warning/20 pt-3 text-xs font-medium text-amber-200">
                      Human review needed: source relevance is limited or the answer did not cite a retrieved source.
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                    <ShieldCheck aria-hidden="true" size={15} className="text-success" /> Safe recommended next actions
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {result.nextActions.map((action) => (
                      <li key={action} className="flex gap-2 text-xs leading-5 text-slate-300">
                        <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-success" /> {action}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                    <BookOpen aria-hidden="true" size={15} className="text-primary" /> Retrieved sources ({result.sources.length})
                  </h3>
                  {result.sources.length ? (
                    <ul className="mt-3 space-y-2">
                      {result.sources.map((source) => (
                        <li key={source.id} className="rounded-lg border border-border bg-background/50 p-3">
                          <p className="text-xs font-medium text-foreground">
                            <span className="font-mono text-primary">[{source.id}]</span> {source.title}
                          </p>
                          <p className="mt-1 text-[11px] text-muted">{source.source}</p>
                          <p className="mt-2 text-xs leading-5 text-slate-400">{source.content}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-muted">No relevant local source chunks were retrieved.</p>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">Generated with {result.model}. Confidence indicates source relevance, not model certainty.</p>
              </div>
            )}
          </div>

          <form onSubmit={askAssistant} className="border-t border-border p-4">
            <label htmlFor="assistant-question" className="sr-only">Ask a defensive investigation question</label>
            <div className="flex items-end gap-2 rounded-lg border border-border bg-background p-2 focus-within:border-primary/60">
              <textarea
                id="assistant-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={2000}
                rows={2}
                placeholder="Ask about evidence, ATT&CK mapping, or safe response steps…"
                className="max-h-36 min-h-[48px] flex-1 resize-y bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!question.trim() || loading}
                aria-label="Send question"
                className="mb-0.5 rounded-md bg-primary p-2 text-slate-950 transition-colors hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? <LoaderCircle aria-hidden="true" size={17} className="animate-spin" /> : <Send aria-hidden="true" size={17} />}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">Enter to send · Shift+Enter for a new line · Keep sensitive incident details within approved systems.</p>
          </form>
        </section>

        <aside className="h-fit rounded-xl border border-border bg-surface p-5 shadow-panel">
          <h2 className="text-sm font-semibold text-foreground">Local model settings</h2>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">Provider</dt>
              <dd className="mt-1 text-sm text-slate-200">Ollama · localhost</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">Model</dt>
              <dd className="mt-1 font-mono text-sm text-primary">qwen3:4b</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">Endpoint</dt>
              <dd className="mt-1 break-all font-mono text-xs text-slate-300">{process.env.NEXT_PUBLIC_OLLAMA_DISPLAY_URL ?? "http://localhost:11434"}</dd>
            </div>
          </dl>
          <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-medium text-sky-200">Privacy by design</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-400">Prompts go from the browser to the local FastAPI service and Ollama. No hosted model API is used.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
