import type { BuildPlan } from "@/lib/types";

export function extractHtmlDocument(text: string): string | null {
  const fenced = text.match(/```html\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] ?? text).trim();
  if (!raw) return null;

  if (/<!DOCTYPE\s+html/i.test(raw) || /<html[\s>]/i.test(raw)) {
    return raw;
  }

  // Model sometimes returns a fragment — wrap into a runnable document.
  if (/<(div|main|section|body|header|form|nav)\b/i.test(raw)) {
    return wrapFragment(raw);
  }

  return null;
}

export function wrapFragment(fragment: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Atoms Demo App</title>
  <style>
    :root { color-scheme: dark light; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
${fragment}
</body>
</html>`;
}

export function parseBuildPlan(text: string): BuildPlan | null {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();

  try {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    const parsed = JSON.parse(candidate.slice(start, end + 1)) as Partial<BuildPlan>;
    return normalizePlan(parsed);
  } catch {
    return null;
  }
}

function normalizePlan(parsed: Partial<BuildPlan>): BuildPlan | null {
  if (!parsed.title || !parsed.summary) return null;

  const productType =
    parsed.productType === "website" ||
    parsed.productType === "web_app" ||
    parsed.productType === "landing" ||
    parsed.productType === "tool"
      ? parsed.productType
      : "web_app";

  const pages = Array.isArray(parsed.pages)
    ? parsed.pages
        .map((p) => ({
          name: String((p as { name?: string }).name ?? "页面"),
          purpose: String((p as { purpose?: string }).purpose ?? ""),
        }))
        .filter((p) => p.name)
    : [{ name: "首页", purpose: "核心体验" }];

  const features = Array.isArray(parsed.features)
    ? parsed.features.map(String).filter(Boolean)
    : ["核心交互"];

  return {
    title: String(parsed.title).slice(0, 80),
    summary: String(parsed.summary).slice(0, 400),
    productType,
    pages: pages.slice(0, 8),
    features: features.slice(0, 12),
    styleDirection: String(parsed.styleDirection ?? "现代、清晰、移动端友好").slice(0, 200),
    acceptanceChecks: Array.isArray(parsed.acceptanceChecks)
      ? parsed.acceptanceChecks.map(String).slice(0, 8)
      : ["核心流程可点通", "移动端可用"],
  };
}

export function planToPrompt(plan: BuildPlan, userIdea: string): string {
  return [
    `用户原始需求：${userIdea}`,
    `产品标题：${plan.title}`,
    `摘要：${plan.summary}`,
    `类型：${plan.productType}`,
    `页面：${plan.pages.map((p) => `${p.name}（${p.purpose}）`).join("；")}`,
    `功能：${plan.features.join("、")}`,
    `视觉方向：${plan.styleDirection}`,
    `验收：${plan.acceptanceChecks.join("、")}`,
  ].join("\n");
}
