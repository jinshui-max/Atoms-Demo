import { createOpenAI, openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText, type UIMessage } from "ai";

export const maxDuration = 60;

function getApiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || undefined;
}

function getChatModel() {
  const modelId = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  const apiKey = getApiKey();
  if (baseURL && apiKey) {
    return createOpenAI({ baseURL, apiKey })(modelId);
  }
  return openai(modelId);
}

function formatStreamError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (/incorrect api key|invalid_api_key|401/i.test(msg)) {
      return "API Key 无效，请在 OpenAI 控制台重新创建密钥并更新 .env.local";
    }
    if (/insufficient_quota|billing|429/i.test(msg)) {
      return "账户余额或配额不足，请在 OpenAI Billing 充值或检查额度";
    }
    if (/connect|timeout|ECONNREFUSED|fetch failed|network/i.test(msg)) {
      return "无法连接 OpenAI（多为网络限制）：请使用可访问 OpenAI 的网络，或在 .env.local 配置 OPENAI_BASE_URL 中转地址";
    }
    return msg;
  }
  return "OpenAI 请求失败";
}

export async function GET() {
  return Response.json({ openaiConfigured: Boolean(getApiKey()) });
}

const system = `You are a UI assistant for Atoms-Demo. Help the user build interfaces.
When you produce HTML for the live preview, wrap it in a fenced code block with language html, e.g.:

\`\`\`html
<div>...</div>
\`\`\`

Keep HTML self-contained (inline styles). Respond in the user's language.`;

export async function POST(req: Request) {
  const { messages } = (await req.json()) as {
    messages: UIMessage[];
  };

  if (!getApiKey()) {
    return Response.json(
      {
        error:
          "未配置 OPENAI_API_KEY：请在项目根目录 .env.local 中填写 OPENAI_API_KEY=sk-... 后重启 npm run dev",
      },
      { status: 500 },
    );
  }

  try {
    const coreMessages = convertToCoreMessages(messages);

    const result = streamText({
      model: getChatModel(),
      system,
      messages: coreMessages,
    });

    return result.toDataStreamResponse({
      getErrorMessage: formatStreamError,
    });
  } catch (err) {
    return Response.json(
      { error: formatStreamError(err) },
      { status: 500 },
    );
  }
}
