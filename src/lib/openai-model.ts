import { createOpenAI, openai } from "@ai-sdk/openai";

export function getApiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || undefined;
}

export function getChatModel() {
  const modelId = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  const apiKey = getApiKey();
  if (baseURL && apiKey) {
    return createOpenAI({ baseURL, apiKey })(modelId);
  }
  return openai(modelId);
}

export function formatModelError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (/incorrect api key|invalid_api_key|401/i.test(msg)) {
      return "API Key 无效，请检查 .env.local 后重启服务";
    }
    if (/insufficient_quota|billing|429/i.test(msg)) {
      return "账户余额或配额不足，请充值或更换模型";
    }
    if (/connect|timeout|ECONNREFUSED|fetch failed|network/i.test(msg)) {
      return "无法连接模型服务：请检查网络或 OPENAI_BASE_URL";
    }
    return msg;
  }
  return "模型请求失败";
}
