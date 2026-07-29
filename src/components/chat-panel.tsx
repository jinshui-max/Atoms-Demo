"use client";

import { useChat, type Message } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Session, StoredMessage } from "@/store/session-store";
import { useSessionStore } from "@/store/session-store";

function formatChatError(error: Error | undefined): string | null {
  if (!error) return null;
  const msg = error.message || String(error);
  if (/An error occurred/i.test(msg)) {
    return "请求失败：OpenAI 返回错误（常见原因：网络无法访问 api.openai.com、Key 无效或账户无余额）。";
  }
  if (/OPENAI_API_KEY|not configured|未配置/i.test(msg)) {
    return "未配置 API Key：请在 .env.local 填写 OPENAI_API_KEY，保存后重启 npm run dev。";
  }
  return `请求失败：${msg}`;
}

function extractHtmlFromAssistantText(text: string): string | null {
  const match = text.match(/```html\n([\s\S]*?)```/);
  return match?.[1]?.trim() ?? null;
}

function toChatMessages(stored: StoredMessage[]): Message[] {
  return stored.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }));
}

function fromChatMessages(messages: Message[]): StoredMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      createdAt: Date.now(),
    }));
}

type ChatPanelProps = {
  session: Session & { syncKey?: number };
};

export function ChatPanel({ session }: ChatPanelProps) {
  const updateActiveSession = useSessionStore((s) => s.updateActiveSession);
  const listRef = useRef<HTMLDivElement>(null);
  const [openaiConfigured, setOpenaiConfigured] = useState<boolean | null>(null);
  const persistSkipRef = useRef(true);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data: { openaiConfigured?: boolean }) =>
        setOpenaiConfigured(Boolean(data.openaiConfigured)),
      )
      .catch(() => setOpenaiConfigured(null));
  }, []);

  const { messages, input, setInput, handleSubmit, status, error, setMessages } =
    useChat({
      api: "/api/chat",
      id: session.id,
      initialMessages: toChatMessages(session.messages),
      onFinish: (message) => {
        const html = extractHtmlFromAssistantText(message.content);
        if (html) {
          updateActiveSession({
            preview: {
              title: "Generated preview",
              html,
              updatedAt: Date.now(),
            },
          });
        }
      },
    });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    persistSkipRef.current = true;
    setMessages(toChatMessages(session.messages));
    const t = setTimeout(() => {
      persistSkipRef.current = false;
    }, 0);
    return () => clearTimeout(t);
  }, [session.id, session.syncKey ?? 0, setMessages]);

  useEffect(() => {
    if (persistSkipRef.current || isStreaming) return;
    const stored = fromChatMessages(messages);
    const firstUser = stored.find((m) => m.role === "user");
    const title =
      firstUser && firstUser.content.length > 0
        ? firstUser.content.slice(0, 24) +
          (firstUser.content.length > 24 ? "…" : "")
        : session.title;
    updateActiveSession({ messages: stored, title });
  }, [messages, isStreaming, updateActiveSession]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        void handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-panel-border px-4 py-3">
        <Sparkles className="size-5 text-accent" aria-hidden />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            {session.title}
          </h1>
          <p className="text-xs text-muted">Describe UI — preview on the right</p>
        </div>
      </header>

      {openaiConfigured === false && (
        <div className="mx-4 mt-3 shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
          尚未配置 API Key：编辑 <code className="text-amber-100">.env.local</code>{" "}
          后重启 <code className="text-amber-100">npm run dev</code>。
        </div>
      )}

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="rounded-lg border border-dashed border-panel-border bg-panel/50 px-4 py-8 text-center text-sm text-muted">
            例如：「做一个深色主题的登录卡片，带邮箱和密码输入框」
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-panel-border bg-panel">
                  <Bot className="size-4 text-accent" aria-hidden />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-accent text-white"
                    : "border border-panel-border bg-panel text-foreground"
                }`}
              >
                {msg.content ||
                  (isStreaming && msg.role === "assistant" ? (
                    <Loader2 className="size-4 animate-spin text-muted" aria-label="Loading" />
                  ) : null)}
              </div>
              {msg.role === "user" && (
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-panel-border bg-panel">
                  <User className="size-4 text-muted" aria-hidden />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {formatChatError(error) && (
          <p className="text-xs leading-relaxed text-red-400">
            {formatChatError(error)}
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-panel-border p-4"
      >
        <div className="flex gap-2 rounded-xl border border-panel-border bg-panel p-2 focus-within:border-accent/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="输入需求… Enter 发送，Shift+Enter 换行"
            rows={3}
            disabled={isStreaming}
            className="min-h-[72px] flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="self-end rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isStreaming ? "生成中…" : "发送"}
          </button>
        </div>
      </form>
    </div>
  );
}
