import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createDefaultPreview } from "@/lib/default-preview";

export type PreviewPayload = {
  title: string;
  html: string;
  updatedAt: number;
};

export type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type Session = {
  id: string;
  title: string;
  messages: StoredMessage[];
  preview: PreviewPayload;
  createdAt: number;
  updatedAt: number;
  syncKey: number;
};

type SessionState = {
  userId: string | null;
  onboardingDone: boolean;
  sessions: Session[];
  activeSessionId: string | null;
  completeOnboarding: () => void;
  ensureUser: () => string;
  createSession: (title?: string) => string;
  setActiveSession: (id: string) => void;
  updateActiveSession: (
    patch: Partial<Pick<Session, "messages" | "preview" | "title" | "syncKey">>,
  ) => void;
  deleteSession: (id: string) => void;
  resetActiveCanvas: () => void;
  getActiveSession: () => Session | null;
  importSessions: (sessions: Session[], activeId?: string) => void;
};

function newSession(title = "新会话"): Session {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    preview: createDefaultPreview(),
    createdAt: now,
    updatedAt: now,
    syncKey: 0,
  };
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      userId: null,
      onboardingDone: false,
      sessions: [],
      activeSessionId: null,

      completeOnboarding: () => {
        const userId = get().ensureUser();
        let { sessions, activeSessionId } = get();
        if (sessions.length === 0) {
          const session = newSession("我的第一个项目");
          sessions = [session];
          activeSessionId = session.id;
        }
        set({ onboardingDone: true, userId, sessions, activeSessionId });
      },

      ensureUser: () => {
        let { userId } = get();
        if (!userId) {
          userId = crypto.randomUUID();
          set({ userId });
        }
        return userId;
      },

      createSession: (title) => {
        const session = newSession(title);
        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: session.id,
        }));
        return session.id;
      },

      setActiveSession: (id) => set({ activeSessionId: id }),

      updateActiveSession: (patch) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === activeSessionId
              ? { ...s, ...patch, updatedAt: Date.now() }
              : s,
          ),
        }));
      },

      deleteSession: (id) => {
        set((state) => {
          const sessions = state.sessions.filter((s) => s.id !== id);
          let activeSessionId = state.activeSessionId;
          if (activeSessionId === id) {
            activeSessionId = sessions[0]?.id ?? null;
          }
          if (sessions.length === 0) {
            const session = newSession("新会话");
            return {
              sessions: [session],
              activeSessionId: session.id,
            };
          }
          return { sessions, activeSessionId };
        });
      },

      resetActiveCanvas: () => {
        const current = get().getActiveSession();
        if (!current) return;
        get().updateActiveSession({
          preview: createDefaultPreview(),
          messages: [],
          syncKey: (current.syncKey ?? 0) + 1,
        });
      },

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId) ?? null;
      },

      importSessions: (sessions, activeId) => {
        if (sessions.length === 0) return;
        set({
          sessions,
          activeSessionId: activeId ?? sessions[0].id,
          onboardingDone: true,
        });
      },
    }),
    {
      name: "atoms-demo-sessions",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userId: state.userId,
        onboardingDone: state.onboardingDone,
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
      migrate: (persisted) => {
        const state = persisted as {
          sessions?: Session[];
          userId?: string | null;
          onboardingDone?: boolean;
          activeSessionId?: string | null;
        };
        if (state?.sessions) {
          state.sessions = state.sessions.map((s) => ({
            ...s,
            syncKey: s.syncKey ?? 0,
          }));
        }
        return state;
      },
      version: 1,
    },
  ),
);
