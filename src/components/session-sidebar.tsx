"use client";

import { Plus, Trash2, FolderOpen } from "lucide-react";
import { useSessionStore } from "@/store/session-store";

export function SessionSidebar() {
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const createSession = useSessionStore((s) => s.createSession);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const onboardingDone = useSessionStore((s) => s.onboardingDone);

  if (!onboardingDone) return null;

  return (
    <aside
      className="flex h-full w-full min-h-0 flex-col border-b border-panel-border bg-[#0c0c0e] md:h-full md:w-52 md:shrink-0 md:border-b-0 md:border-r"
      aria-label="会话列表"
    >
      <div className="flex items-center justify-between border-b border-panel-border px-3 py-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <FolderOpen className="size-4" />
          我的会话
        </div>
        <button
          type="button"
          onClick={() => createSession()}
          className="rounded-md p-1.5 text-muted hover:bg-panel hover:text-foreground"
          title="新建会话"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {sessions.map((s) => {
          const active = s.id === activeSessionId;
          return (
            <li key={s.id} className="mb-1">
              <div
                className={`group flex items-center gap-1 rounded-lg border px-2 py-2 text-left text-xs transition ${
                  active
                    ? "border-accent/40 bg-accent/10 text-foreground"
                    : "border-transparent text-muted hover:border-panel-border hover:bg-panel"
                }`}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left"
                  onClick={() => setActiveSession(s.id)}
                >
                  {s.title}
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded p-1 opacity-0 hover:text-red-400 group-hover:opacity-100"
                  onClick={() => deleteSession(s.id)}
                  title="删除会话"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
