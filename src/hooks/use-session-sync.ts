"use client";

import { useEffect, useRef } from "react";
import { useSessionStore } from "@/store/session-store";

const SYNC_DELAY_MS = 800;

/** 将会话同步到服务端 JSON 存储（本地/自有服务器）；与 localStorage 双写 */
export function useSessionSync() {
  const userId = useSessionStore((s) => s.userId);
  const sessions = useSessionStore((s) => s.sessions);
  const onboardingDone = useSessionStore((s) => s.onboardingDone);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!onboardingDone || !userId || sessions.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessions }),
      });
    }, SYNC_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userId, sessions, onboardingDone]);
}
