"use client";

import { motion } from "framer-motion";
import { Download, LayoutPanelLeft, RefreshCw } from "lucide-react";
import type { PreviewPayload } from "@/store/session-store";
import { useSessionStore } from "@/store/session-store";

type CanvasPreviewProps = {
  preview: PreviewPayload;
};

export function CanvasPreview({ preview }: CanvasPreviewProps) {
  const resetActiveCanvas = useSessionStore((s) => s.resetActiveCanvas);

  const exportHtml = () => {
    const doc = wrapPreviewDocument(preview.html);
    const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atoms-demo-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-panel-border px-4 py-3">
        <div className="flex items-center gap-2">
          <LayoutPanelLeft className="size-5 text-muted" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold">{preview.title}</h2>
            <p className="text-xs text-muted">Live canvas preview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
      </header>

      <motion.div
        key={preview.updatedAt}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="relative min-h-0 flex-1 overflow-hidden bg-[#0f0f12]"
      >
        <iframe
          title="Canvas preview"
          sandbox="allow-scripts"
          srcDoc={wrapPreviewDocument(preview.html)}
          className="h-full w-full border-0"
        />
      </motion.div>
    </div>
  );
}

function wrapPreviewDocument(fragment: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { margin: 0; min-height: 100%; background: #0f0f12; }
  </style>
</head>
<body>${fragment}</body>
</html>`;
}
