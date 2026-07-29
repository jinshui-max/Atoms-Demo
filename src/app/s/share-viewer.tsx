"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  decodeShareSnapshot,
  decompressSharePayload,
  type ShareSnapshot,
} from "@/lib/share-codec";

export function ShareViewer() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; snapshot: ShareSnapshot }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const hash = window.location.hash.replace(/^#/, "");
        if (!hash) {
          throw new Error("链接中没有预览数据，请从工作台重新分享");
        }
        const json = await decompressSharePayload(decodeURIComponent(hash));
        const snapshot = decodeShareSnapshot(json);
        if (!cancelled) setState({ status: "ready", snapshot });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "无法打开分享",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" />
        正在打开分享预览…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-red-300">{state.message}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
        >
          <ArrowLeft className="size-4" />
          回到工作台
        </Link>
      </div>
    );
  }

  const html = ensureDocument(state.snapshot.html);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-panel-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] tracking-wide text-accent">ATOMS DEMO · SHARED</p>
          <h1 className="truncate text-sm font-semibold">{state.snapshot.title}</h1>
        </div>
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-panel-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          打开工作台
        </Link>
      </header>
      <iframe
        title={state.snapshot.title}
        sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
        srcDoc={html}
        className="min-h-0 w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}

function ensureDocument(html: string): string {
  if (/<!DOCTYPE\s+html/i.test(html) || /<html[\s>]/i.test(html)) {
    return html;
  }
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body>${html}</body></html>`;
}
