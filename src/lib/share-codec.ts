/** Compress UTF-8 text to URL-safe base64 (gzip when available). */
export async function compressToSharePayload(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);

  if (typeof CompressionStream !== "undefined") {
    const stream = new Blob([toArrayBuffer(bytes)])
      .stream()
      .pipeThrough(new CompressionStream("gzip"));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return `g1.${bytesToBase64Url(compressed)}`;
  }

  return `r1.${bytesToBase64Url(bytes)}`;
}

export async function decompressSharePayload(payload: string): Promise<string> {
  const trimmed = payload.trim();
  const dot = trimmed.indexOf(".");
  if (dot <= 0) throw new Error("分享链接格式无效");

  const kind = trimmed.slice(0, dot);
  const data = trimmed.slice(dot + 1);
  const bytes = base64UrlToBytes(data);

  if (kind === "g1") {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("当前浏览器不支持解压分享内容");
    }
    const stream = new Blob([toArrayBuffer(bytes)])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    const raw = new Uint8Array(await new Response(stream).arrayBuffer());
    return new TextDecoder().decode(raw);
  }

  if (kind === "r1") {
    return new TextDecoder().decode(bytes);
  }

  throw new Error("不支持的分享版本");
}

export type ShareSnapshot = {
  v: 1;
  title: string;
  html: string;
  createdAt: number;
};

export function encodeShareSnapshot(snapshot: ShareSnapshot): string {
  return JSON.stringify(snapshot);
}

export function decodeShareSnapshot(text: string): ShareSnapshot {
  const parsed = JSON.parse(text) as Partial<ShareSnapshot>;
  if (parsed.v !== 1 || typeof parsed.html !== "string" || !parsed.html) {
    throw new Error("分享内容无效或已损坏");
  }
  return {
    v: 1,
    title: String(parsed.title || "Shared preview"),
    html: parsed.html,
    createdAt: Number(parsed.createdAt) || Date.now(),
  };
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLen);
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}
