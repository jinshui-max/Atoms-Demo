import type { PreviewPayload } from "@/store/session-store";

export const defaultPreviewHtml = `<div style="padding:2rem;font-family:system-ui,sans-serif;color:#fafafa;">
  <h1 style="font-size:1.5rem;margin:0 0 0.5rem;">Welcome to Atoms-Demo</h1>
  <p style="color:#a1a1aa;margin:0;line-height:1.6;">在左侧描述界面，右侧会实时预览。会话会自动保存。</p>
</div>`;

export function createDefaultPreview(): PreviewPayload {
  return {
    title: "Canvas",
    html: defaultPreviewHtml,
    updatedAt: Date.now(),
  };
}
