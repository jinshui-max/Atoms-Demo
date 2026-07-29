"use client";

import { motion } from "framer-motion";
import {
  Check,
  Download,
  History,
  Link2,
  Loader2,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useState } from "react";
import {
  compressToSharePayload,
  encodeShareSnapshot,
} from "@/lib/share-codec";
import type { PreviewPayload, Session } from "@/lib/types";
import { useSessionStore } from "@/store/session-store";

type Device = "desktop" | "tablet" | "mobile";

type CanvasPreviewProps = {
  preview: PreviewPayload;
  session: Session;
};

export function CanvasPreview({ preview, session }: CanvasPreviewProps) {
  const resetActiveCanvas = useSessionStore((s) => s.resetActiveCanvas);
  const restoreVersion = useSessionStore((s) => s.restoreVersion);
  const [device, setDevice] = useState<Device>("desktop");
  const [showVersions, setShowVersions] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "working" | "copied" | "error">(
    "idle",
  );
  const [shareError, setShareError] = useState<string | null>(null);

  const canShare =
    session.phase === "ready" &&
    Boolean(session.activeVersionId) &&
    preview.html.trim().length > 0;

  const exportHtml = () => {
    const doc = ensureDocument(preview.html);
    const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atoms-demo-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sharePreview = async () => {
    if (!canShare || shareState === "working") return;
    setShareState("working");
    setShareError(null);
    try {
      const payload = await compressToSharePayload(
        encodeShareSnapshot({
          v: 1,
          title: preview.title || session.plan?.title || session.title,
          html: ensureDocument(preview.html),
          createdAt: Date.now(),
        }),
      );
      const url = `${window.location.origin}/s#${encodeURIComponent(payload)}`;
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2000);
    } catch (err) {
      setShareState("error");
      setShareError(err instanceof Error ? err.message : "分享失败");
      window.setTimeout(() => setShareState("idle"), 2500);
    }
  };

  const frameClass =
    device === "mobile"
      ? "w-[390px] max-w-full"
      : device === "tablet"
        ? "w-[768px] max-w-full"
        : "w-full";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-panel-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{preview.title}</h2>
          <p className="text-xs text-muted">
            {session.phase === "ready"
              ? "Live preview · 可在 iframe 内真实交互"
              : "预览画布"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <DeviceButton
            active={device === "desktop"}
            onClick={() => setDevice("desktop")}
            label="桌面"
            icon={<Monitor className="size-3.5" />}
          />
          <DeviceButton
            active={device === "tablet"}
            onClick={() => setDevice("tablet")}
            label="平板"
            icon={<Tablet className="size-3.5" />}
          />
          <DeviceButton
            active={device === "mobile"}
            onClick={() => setDevice("mobile")}
            label="手机"
            icon={<Smartphone className="size-3.5" />}
          />
          <button
            type="button"
            onClick={() => setShowVersions((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-panel-border px-2.5 py-1.5 text-xs text-muted transition hover:border-accent/40 hover:text-foreground"
          >
            <History className="size-3.5" aria-hidden />
            版本
            {session.versions.length > 0 ? ` (${session.versions.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => void sharePreview()}
            disabled={!canShare || shareState === "working"}
            className="flex items-center gap-1.5 rounded-lg border border-panel-border px-2.5 py-1.5 text-xs text-muted transition hover:border-accent/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            title={canShare ? "复制可公开打开的预览链接" : "生成应用后可分享"}
          >
            {shareState === "working" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : shareState === "copied" ? (
              <Check className="size-3.5 text-emerald-300" aria-hidden />
            ) : (
              <Link2 className="size-3.5" aria-hidden />
            )}
            {shareState === "copied" ? "已复制" : "分享预览"}
          </button>
          <button
            type="button"
            onClick={exportHtml}
            className="flex items-center gap-1.5 rounded-lg border border-panel-border px-2.5 py-1.5 text-xs text-muted transition hover:border-accent/40 hover:text-foreground"
          >
            <Download className="size-3.5" aria-hidden />
            导出 HTML
          </button>
          <button
            type="button"
            onClick={resetActiveCanvas}
            className="flex items-center gap-1.5 rounded-lg border border-panel-border px-2.5 py-1.5 text-xs text-muted transition hover:border-accent/40 hover:text-foreground"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            重置
          </button>
        </div>
        {shareError && (
          <p className="basis-full text-[11px] text-red-300">{shareError}</p>
        )}
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0f0f12]">
        {showVersions && (
          <aside className="absolute right-0 top-0 z-10 flex h-full w-64 flex-col border-l border-panel-border bg-panel/95 backdrop-blur">
            <div className="border-b border-panel-border px-3 py-2 text-xs font-medium">
              版本历史
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto p-2">
              {session.versions.length === 0 ? (
                <li className="px-2 py-4 text-xs text-muted">生成后会出现版本</li>
              ) : (
                session.versions.map((v) => {
                  const active = v.id === session.activeVersionId;
                  return (
                    <li key={v.id} className="mb-1">
                      <button
                        type="button"
                        onClick={() => {
                          restoreVersion(v.id);
                          setShowVersions(false);
                        }}
                        className={`w-full rounded-lg border px-2 py-2 text-left text-xs ${
                          active
                            ? "border-accent/40 bg-accent/10 text-foreground"
                            : "border-transparent text-muted hover:border-panel-border hover:bg-background"
                        }`}
                      >
                        <div className="font-medium">{v.label}</div>
                        <div className="mt-0.5 text-[10px] opacity-70">
                          {v.source} ·{" "}
                          {new Date(v.createdAt).toLocaleString("zh-CN")}
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>
        )}

        <div className="flex h-full items-stretch justify-center overflow-auto p-3 md:p-4">
          <motion.div
            key={`${preview.updatedAt}-${device}`}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            className={`${frameClass} flex min-h-full flex-col overflow-hidden rounded-xl border border-panel-border bg-white shadow-lg shadow-black/40`}
          >
            <iframe
              title="Canvas preview"
              sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
              srcDoc={ensureDocument(preview.html)}
              className="h-full min-h-[480px] w-full flex-1 border-0 bg-white"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function DeviceButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition ${
        active
          ? "border-accent/40 bg-accent/10 text-foreground"
          : "border-panel-border text-muted hover:text-foreground"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ensureDocument(html: string): string {
  if (/<!DOCTYPE\s+html/i.test(html) || /<html[\s>]/i.test(html)) {
    return html;
  }
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body>${html}</body></html>`;
}
