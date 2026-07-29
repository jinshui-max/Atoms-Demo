"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/store/session-store";
import { useSessionStore } from "@/store/session-store";

export function useSessionBootstrap() {
  const userId = useSessionStore((s) => s.userId);
  const onboardingDone = useSessionStore((s) => s.onboardingDone);
  const importSessions = useSessionStore((s) => s.importSessions);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!onboardingDone || !userId) {
      setReady(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/sessions?userId=${encodeURIComponent(userId)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { sessions?: Session[] };
        const remote = data.sessions;
        if (!remote?.length || cancelled) return;

        const local = useSessionStore.getState().sessions;
        importSessions(mergeSessions(local, remote));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, onboardingDone, importSessions]);

  useEffect(() => {
    if (!onboardingDone) setReady(true);
  }, [onboardingDone]);

  return ready;
}

function mergeSessions(local: Session[], remote: Session[]): Session[] {
  const map = new Map<string, Session>();
  for (const s of remote) map.set(s.id, s);
  for (const s of local) {
    const existing = map.get(s.id);
    if (!existing || s.updatedAt >= existing.updatedAt) {
      map.set(s.id, s);
    }
  }
  return [...map.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}
