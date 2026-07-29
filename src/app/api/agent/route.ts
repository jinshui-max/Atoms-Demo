import { generateText, streamText } from "ai";
import { formatModelError, getApiKey, getChatModel } from "@/lib/openai-model";
import { parseBuildPlan } from "@/lib/agent-parse";
import type { BuildPlan } from "@/lib/types";

export const maxDuration = 60;

const PLAN_SYSTEM = `你是 Atoms Demo 中的产品经理 Emma。根据用户中文需求，输出一份可执行的产品方案。
只输出一个 JSON 代码块，不要其它解释。JSON schema:
{
  "title": string,
  "summary": string,
  "productType": "website" | "web_app" | "landing" | "tool",
  "pages": [{ "name": string, "purpose": string }],
  "features": string[],
  "styleDirection": string,
  "acceptanceChecks": string[]
}
约束：面向纯前端 HTML 单页应用（可多视图切换）；需要持久化时用 localStorage；不要后端 API；功能要能在 1 个 HTML 文件内演示闭环。`;

const BUILD_SYSTEM = `你是 Atoms Demo 中的工程师 Alex。根据已批准方案生成一个完整、可运行的单文件 HTML 应用。
要求：
1. 输出完整 HTML 文档，包在 \`\`\`html 代码块中。
2. 必须自包含：CSS 与 JS 都写在同一文件；可用 CDN（如仅用无构建依赖）。
3. 真实可交互：按钮、表单、列表增删、视图切换等至少打通主流程。
4. 若方案需要持久化，用 localStorage，并在 UI 上可感知（刷新仍在）。
5. 中文界面；移动端可用；不要外链图片依赖（可用 CSS/SVG/emoji）。
6. 不要 markdown 解释，不要省略关键实现。`;

const ITERATE_SYSTEM = `你是 Atoms Demo 中的工程师 Alex。在现有 HTML 应用上按用户中文指令迭代。
要求：
1. 返回完整替换后的 HTML 文档（\`\`\`html 代码块），不是 diff。
2. 保留已有可用功能，除非用户明确要求删除。
3. 保持自包含与可交互；持久化继续用 localStorage。
4. 不要只输出片段或解释文字。`;

type AgentBody = {
  action?: "plan" | "build" | "iterate";
  prompt?: string;
  plan?: BuildPlan;
  currentHtml?: string;
};

export async function GET() {
  return Response.json({ openaiConfigured: Boolean(getApiKey()) });
}

export async function POST(req: Request) {
  if (!getApiKey()) {
    return Response.json(
      {
        error:
          "未配置 OPENAI_API_KEY：请在 .env.local 填写后重启 npm run dev",
      },
      { status: 500 },
    );
  }

  let body: AgentBody;
  try {
    body = (await req.json()) as AgentBody;
  } catch {
    return Response.json({ error: "请求体无效" }, { status: 400 });
  }

  const action = body.action;
  if (action !== "plan" && action !== "build" && action !== "iterate") {
    return Response.json({ error: "action 必须是 plan | build | iterate" }, { status: 400 });
  }

  try {
    if (action === "plan") {
      const prompt = body.prompt?.trim();
      if (!prompt) {
        return Response.json({ error: "prompt 必填" }, { status: 400 });
      }

      const result = await generateText({
        model: getChatModel(),
        system: PLAN_SYSTEM,
        prompt: `用户需求：\n${prompt}`,
      });

      const plan = parseBuildPlan(result.text);
      if (!plan) {
        return Response.json(
          {
            error: "方案解析失败，请重试",
            raw: result.text.slice(0, 2000),
          },
          { status: 502 },
        );
      }

      return Response.json({ plan, agent: "emma" });
    }

    if (action === "build") {
      const prompt = body.prompt?.trim() || "";
      const plan = body.plan;
      if (!plan) {
        return Response.json({ error: "plan 必填" }, { status: 400 });
      }

      const result = streamText({
        model: getChatModel(),
        system: BUILD_SYSTEM,
        maxTokens: 8192,
        prompt: [
          `原始需求：${prompt || plan.summary}`,
          `批准方案：`,
          JSON.stringify(plan, null, 2),
          `请生成完整 HTML 应用。`,
        ].join("\n"),
      });

      return result.toDataStreamResponse({
        getErrorMessage: formatModelError,
      });
    }

    // iterate
    const prompt = body.prompt?.trim();
    const currentHtml = body.currentHtml?.trim();
    if (!prompt || !currentHtml) {
      return Response.json({ error: "prompt 与 currentHtml 必填" }, { status: 400 });
    }

    const result = streamText({
      model: getChatModel(),
      system: ITERATE_SYSTEM,
      maxTokens: 8192,
      prompt: [
        `用户修改要求：${prompt}`,
        `当前 HTML：`,
        currentHtml.slice(0, 120_000),
      ].join("\n\n"),
    });

    return result.toDataStreamResponse({
      getErrorMessage: formatModelError,
    });
  } catch (err) {
    return Response.json({ error: formatModelError(err) }, { status: 500 });
  }
}
