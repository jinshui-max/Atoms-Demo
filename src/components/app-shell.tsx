"use client";

import { CanvasPreview } from "@/components/canvas-preview";
import { ChatPanel } from "@/components/chat-panel";
import { SessionSidebar } from "@/components/session-sidebar";
import { WelcomeModal } from "@/components/welcome-modal";
import { useSessionBootstrap } from "@/hooks/use-session-bootstrap";
import { useSessionSync } from "@/hooks/use-session-sync";
import { useSessionStore } from "@/store/session-store";

export function AppShell() {
  const ready = useSessionBootstrap();
  useSessionSync();
  const onboardingDone = useSessionStore((s) => s.onboardingDone);
      const activeSession = useSessionStore((s) =>
        s.sessions.find((x) => x.id === s.activeSessionId) ?? null,
      );

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted">
        加载会话…
      </div>
    );
  }

  return (
    <>
      <WelcomeModal />
      <main className="flex h-screen flex-col overflow-hidden md:flex-row">
        <SessionSidebar />
        <section
          className="flex h-[45vh] min-h-0 w-full flex-col border-b border-panel-border bg-background md:h-full md:min-w-0 md:flex-1 md:border-b-0 md:border-r"
          aria-label="Chat"
        >
          {onboardingDone && activeSession ? (
            <ChatPanel key={activeSession.id} session={activeSession} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted">
              完成引导后开始对话
            </div>
          )}
        </section>
        <section
          className="flex h-[55vh] min-h-0 w-full flex-col bg-background md:h-full md:flex-1"
          aria-label="Canvas preview"
        >
          {activeSession ? (
            <CanvasPreview preview={activeSession.preview} />
          ) : null}
        </section>
      </main>
    </>
  );
}
