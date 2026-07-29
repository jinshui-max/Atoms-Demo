"use client";

import { useCompletion } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Check,
  Loader2,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { extractHtmlDocument } from "@/lib/agent-parse";
import {
  AGENT_LABEL,
  createAction,
  patchActions,
} from "@/lib/agent-actions";
import { PROJECT_TEMPLATES } from "@/lib/templates";
import type { BuildPlan, Session, StoredMessage } from "@/lib/types";
import { useSessionStore } from "@/store/session-store";

type ChatPanelProps = {
  session: Session & { syncKey?: number };
};

export function ChatPanel({ session }: ChatPanelProps) {
  const updateActiveSession = useSessionStore((s) => s.updateActiveSession);
  const appendMessage = useSessionStore((s) => s.appendMessage);
  const setPhase = useSessionStore((s) => s.setPhase);
  const setPlan = useSessionStore((s) => s.setPlan);
  const setAgentActions = useSessionStore((s) => s.setAgentActions);
  const commitVersion = useSessionStore((s) => s.commitVersion);
  const createSession = useSessionStore((s) => s.createSession);

  const listRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openaiConfigured, setOpenaiConfigured] = useState<boolean | null>(null);
  const ideaRef = useRef(session.messages.find((m) => m.role === "user")?.content ?? "");
  const pendingActionRef = useRef<"build" | "iterate" | null>(null);

  const {
    completion,
    complete,
    isLoading: isStreaming,
    setCompletion,
  } = useCompletion({
    api: "/api/agent",
    streamProtocol: "data",
    onFinish: (_prompt, completionText) => {
      const html = extractHtmlDocument(completionText);
      const action = pendingActionRef.current;
      pendingActionRef.current = null;

      if (!html) {
        setError("未能从模型输出中解析出完整 HTML，请重试或换一种描述。");
        setPhase("error");
        setAgentActions(
          patchActions(
            useSessionStore.getState().getActiveSession()?.agentActions ?? [],
            action === "iterate" ? "iterate_app" : "build_app",
            "failed",
            "解析失败",
          ),
        );
        appendMessage({
          role: "assistant",
          kind: "status",
          content: "生成结束，但未能解析出可运行 HTML。请重试或调整需求。",
        });
        setBusy(false);
        return;
      }

      const label =
        action === "iterate"
          ? `迭代 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
          : `首版 ${session.plan?.title ?? "应用"}`;

      commitVersion({
        html,
        label,
        source: action === "iterate" ? "iterate" : "build",
      });
      setAgentActions(
        patchActions(
          useSessionStore.getState().getActiveSession()?.agentActions ?? [],
          action === "iterate" ? "iterate_app" : "build_app",
          "completed",
          "预览已更新",
        ),
      );
      appendMessage({
        role: "assistant",
        kind: "build",
        content:
          action === "iterate"
            ? "Alex 已完成迭代，右侧预览已更新。可继续提修改，或在版本历史中回滚。"
            : "Alex 已生成可交互应用。右侧可预览；继续对话即可迭代。",
      });
      setBusy(false);
      setCompletion("");
    },
    onError: (err) => {
      pendingActionRef.current = null;
      setError(err.message || "生成失败");
      setPhase("error");
      setBusy(false);
    },
  });

  useEffect(() => {
    fetch("/api/agent")
      .then((r) => r.json())
      .then((data: { openaiConfigured?: boolean }) =>
        setOpenaiConfigured(Boolean(data.openaiConfigured)),
      )
      .catch(() => setOpenaiConfigured(null));
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session.messages, completion, busy]);

  const phaseHint = useMemo(() => {
    switch (session.phase) {
      case "awaiting_approval":
        return "请审核 Emma 的方案后批准生成";
      case "building":
        return "Alex 正在生成应用…";
      case "iterating":
        return "Alex 正在按你的反馈迭代…";
      case "planning":
        return "Emma 正在梳理产品方案…";
      case "ready":
        return "应用已就绪，继续对话可迭代";
      default:
        return "描述产品想法，或从模板启动";
    }
  }, [session.phase]);

  const runPlan = async (prompt: string, seedPlan?: BuildPlan) => {
    setError(null);
    setBusy(true);
    ideaRef.current = prompt;
    appendMessage({ role: "user", kind: "chat", content: prompt });

    if (seedPlan) {
      const actions = [
        createAction("mike", "coordinate", "启动模板项目", "completed"),
        createAction("emma", "scope_plan", "载入产品方案", "completed"),
        createAction("mike", "await_approval", "等待你批准方案", "running"),
      ];
      setAgentActions(actions);
      setPlan(seedPlan);
      setPhase("awaiting_approval");
      updateActiveSession({ title: seedPlan.title.slice(0, 24) });
      appendMessage({
        role: "assistant",
        kind: "plan",
        content: `已载入模板方案「${seedPlan.title}」。确认后将由 Alex 生成完整应用。`,
      });
      setBusy(false);
      return;
    }

    const actions = [
      createAction("mike", "coordinate", "接收需求并分派", "completed"),
      createAction("emma", "scope_plan", "梳理产品范围与验收", "running"),
      createAction("mike", "await_approval", "等待批准", "pending"),
      createAction("alex", "build_app", "生成可运行应用", "pending"),
    ];
    setAgentActions(actions);
    setPhase("planning");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "plan", prompt }),
      });
      const data = (await res.json()) as { plan?: BuildPlan; error?: string };
      if (!res.ok || !data.plan) {
        throw new Error(data.error || "规划失败");
      }

      setPlan(data.plan);
      setPhase("awaiting_approval");
      updateActiveSession({ title: data.plan.title.slice(0, 24) });
      setAgentActions(
        patchActions(
          patchActions(actions, "scope_plan", "completed"),
          "await_approval",
          "running",
        ),
      );
      appendMessage({
        role: "assistant",
        kind: "plan",
        content: `Emma 已完成方案「${data.plan.title}」。请在下方卡片中批准或修改需求。`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "规划失败";
      setError(msg);
      setPhase("error");
      setAgentActions(patchActions(actions, "scope_plan", "failed", msg));
      appendMessage({ role: "assistant", kind: "status", content: `规划失败：${msg}` });
    } finally {
      setBusy(false);
    }
  };

  const runBuild = async () => {
    const plan = useSessionStore.getState().getActiveSession()?.plan;
    if (!plan) return;

    setError(null);
    setBusy(true);
    setPhase("building");
    setCompletion("");
    pendingActionRef.current = "build";

    const currentActions =
      useSessionStore.getState().getActiveSession()?.agentActions ?? [];
    const withAlex = currentActions.some((a) => a.action === "build_app")
      ? currentActions
      : [
          ...currentActions,
          createAction("alex", "build_app", "生成可运行应用", "pending"),
        ];

    setAgentActions(
      patchActions(
        patchActions(withAlex, "await_approval", "completed", "方案已批准"),
        "build_app",
        "running",
      ),
    );
    appendMessage({
      role: "system",
      kind: "status",
      content: "Mike：方案已批准，正在呼叫 Alex 生成应用…",
    });

    try {
      await complete("build", {
        body: {
          action: "build",
          prompt: ideaRef.current,
          plan,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "生成失败";
      setError(msg);
      setPhase("error");
      setBusy(false);
    }
  };

  const runIterate = async (prompt: string) => {
    const active = useSessionStore.getState().getActiveSession();
    const html = active?.preview.html;
    if (!html) return;

    setError(null);
    setBusy(true);
    setPhase("iterating");
    setCompletion("");
    pendingActionRef.current = "iterate";
    appendMessage({ role: "user", kind: "chat", content: prompt });

    const actions = [
      createAction("mike", "coordinate", "接收修改请求", "completed"),
      createAction("alex", "iterate_app", "迭代应用代码", "running"),
    ];
    setAgentActions(actions);

    try {
      await complete("iterate", {
        body: {
          action: "iterate",
          prompt,
          currentHtml: html,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "迭代失败";
      setError(msg);
      setPhase("error");
      setBusy(false);
    }
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy || isStreaming) return;
    setInput("");

    const phase = useSessionStore.getState().getActiveSession()?.phase;
    if (!phase || phase === "idle" || phase === "error") {
      await runPlan(text);
      return;
    }
    if (phase === "awaiting_approval") {
      await runPlan(text);
      return;
    }
    if (phase === "ready") {
      await runIterate(text);
      return;
    }
  };

  const rejectPlan = () => {
    setPlan(null);
    setPhase("idle");
    setAgentActions([]);
    appendMessage({
      role: "system",
      kind: "status",
      content: "已退回方案。请重新描述需求。",
    });
  };

  const isWorking = busy || isStreaming;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-panel-border px-4 py-3">
        <Sparkles className="size-5 text-accent" aria-hidden />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            {session.title}
          </h1>
          <p className="text-xs text-muted">{phaseHint}</p>
        </div>
      </header>

      {openaiConfigured === false && (
        <div className="mx-4 mt-3 shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
          尚未配置 API Key：编辑 <code className="text-amber-100">.env.local</code>{" "}
          后重启 <code className="text-amber-100">npm run dev</code>。
        </div>
      )}

      <AgentActionStrip actions={session.agentActions} />

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        {session.messages.length === 0 && session.phase === "idle" && (
          <EmptyStarter
            disabled={isWorking}
            onPickTemplate={(templateId) => {
              const tpl = PROJECT_TEMPLATES.find((t) => t.id === templateId);
              if (!tpl) return;
              void runPlan(tpl.prompt, tpl.seedPlan);
            }}
            onQuickPrompt={(text) => setInput(text)}
          />
        )}

        <AnimatePresence initial={false}>
          {session.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {session.phase === "awaiting_approval" && session.plan && (
          <PlanApprovalCard
            plan={session.plan}
            disabled={isWorking}
            onApprove={() => void runBuild()}
            onReject={rejectPlan}
          />
        )}

        {(session.phase === "building" || session.phase === "iterating") && (
          <div className="rounded-xl border border-panel-border bg-panel px-3 py-3 text-xs text-muted">
            <div className="mb-2 flex items-center gap-2 text-foreground">
              <Loader2 className="size-3.5 animate-spin text-accent" />
              Alex 正在输出代码…
            </div>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted">
              {completion.slice(-1200) || "连接模型中…"}
            </pre>
          </div>
        )}

        {error && <p className="text-xs leading-relaxed text-red-400">{error}</p>}
      </div>

      <form onSubmit={onSubmit} className="shrink-0 border-t border-panel-border p-4">
        <div className="flex gap-2 rounded-xl border border-panel-border bg-panel p-2 focus-within:border-accent/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !isWorking) void onSubmit();
              }
            }}
            placeholder={
              session.phase === "ready"
                ? "描述要改的地方，例如：把主色换成绿色，并加大标题…"
                : session.phase === "awaiting_approval"
                  ? "不满意？直接输入新需求重新规划…"
                  : "描述你想做的网站或 Web 应用…"
            }
            rows={3}
            disabled={
              isWorking ||
              session.phase === "building" ||
              session.phase === "planning" ||
              session.phase === "iterating"
            }
            className="min-h-[72px] flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isWorking}
            className="self-end rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isWorking ? "处理中…" : session.phase === "ready" ? "迭代" : "发送"}
          </button>
        </div>
        {session.phase === "ready" && (
          <button
            type="button"
            className="mt-2 text-xs text-muted hover:text-foreground"
            onClick={() => createSession()}
          >
            或新建另一个项目 →
          </button>
        )}
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: StoredMessage }) {
  if (message.role === "system") {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-[11px] text-muted"
      >
        {message.content}
      </motion.p>
    );
  }

  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-panel-border bg-panel">
          <Bot className="size-4 text-accent" aria-hidden />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-accent text-white"
            : "border border-panel-border bg-panel text-foreground"
        }`}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-panel-border bg-panel">
          <User className="size-4 text-muted" aria-hidden />
        </div>
      )}
    </motion.div>
  );
}

function PlanApprovalCard({
  plan,
  disabled,
  onApprove,
  onReject,
}: {
  plan: BuildPlan;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-accent/30 bg-accent/5 p-4"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{plan.title}</h3>
        <span className="rounded-md bg-panel px-2 py-0.5 text-[10px] text-muted">
          {plan.productType}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted">{plan.summary}</p>
      <div className="mt-3 grid gap-2 text-xs">
        <div>
          <p className="mb-1 font-medium text-foreground">页面</p>
          <ul className="space-y-1 text-muted">
            {plan.pages.map((p) => (
              <li key={p.name}>
                · {p.name} — {p.purpose}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 font-medium text-foreground">功能</p>
          <p className="text-muted">{plan.features.join(" · ")}</p>
        </div>
        <div>
          <p className="mb-1 font-medium text-foreground">视觉</p>
          <p className="text-muted">{plan.styleDirection}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onApprove}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
        >
          <Check className="size-4" />
          批准并生成
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onReject}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-panel-border px-3 py-2 text-sm text-muted hover:text-foreground disabled:opacity-40"
        >
          <X className="size-4" />
          退回
        </button>
      </div>
    </motion.div>
  );
}

function AgentActionStrip({
  actions,
}: {
  actions: Session["agentActions"];
}) {
  if (!actions.length) return null;
  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-panel-border px-4 py-2">
      {actions.map((action) => (
        <div
          key={action.id}
          className={`flex min-w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
            action.status === "running"
              ? "border-accent/40 bg-accent/10 text-foreground"
              : action.status === "completed"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : action.status === "failed"
                  ? "border-red-500/40 bg-red-500/10 text-red-200"
                  : "border-panel-border text-muted"
          }`}
        >
          {action.status === "running" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : action.status === "completed" ? (
            <Check className="size-3" />
          ) : null}
          <span>
            {AGENT_LABEL[action.agent]} · {action.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyStarter({
  disabled,
  onPickTemplate,
  onQuickPrompt,
}: {
  disabled: boolean;
  onPickTemplate: (id: string) => void;
  onQuickPrompt: (text: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-panel-border bg-panel/50 px-4 py-6 text-center text-sm text-muted">
        例如：「做一个需要本地保存的习惯打卡应用」
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {["深色登录页", "个人作品集", "番茄钟"].map((t) => (
            <button
              key={t}
              type="button"
              disabled={disabled}
              onClick={() =>
                onQuickPrompt(`做一个${t}，可交互，数据存 localStorage`)
              }
              className="rounded-full border border-panel-border px-3 py-1 text-xs hover:border-accent/40 hover:text-foreground disabled:opacity-40"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted">从模板启动</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PROJECT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              disabled={disabled}
              onClick={() => onPickTemplate(tpl.id)}
              className="rounded-xl border border-panel-border bg-panel p-3 text-left transition hover:border-accent/40 disabled:opacity-40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {tpl.title}
                </span>
                <span className="text-[10px] text-muted">{tpl.category}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{tpl.blurb}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
