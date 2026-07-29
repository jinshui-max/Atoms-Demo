import type { PreviewPayload } from "@/lib/types";

export const defaultPreviewHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Atoms Demo</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: system-ui, sans-serif; background: #0f0f12; color: #fafafa;
    }
    .card {
      max-width: 420px; padding: 2rem; border: 1px solid #27272a; border-radius: 16px;
      background: #141416;
    }
    h1 { margin: 0 0 .5rem; font-size: 1.35rem; }
    p { margin: 0; color: #a1a1aa; line-height: 1.6; font-size: .95rem; }
    .hint { margin-top: 1rem; font-size: .8rem; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <h1>等待 Agent 生成应用</h1>
    <p>在左侧描述你想做的产品，Emma 会先出方案，批准后 Alex 生成可交互网页并在此预览。</p>
    <p class="hint">也可从模板一键启动。</p>
  </div>
</body>
</html>`;

export function createDefaultPreview(): PreviewPayload {
  return {
    title: "Canvas",
    html: defaultPreviewHtml,
    updatedAt: Date.now(),
  };
}
