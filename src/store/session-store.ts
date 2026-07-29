import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createDefaultPreview } from "@/lib/default-preview";
import type {
  AgentAction,
  AppVersion,
  BuildPlan,
  PreviewPayload,
  ProjectPhase,
  Session,
  StoredMessage,
  WorkspaceProfile,
} from "@/lib/types";

type SessionState = {
  userId: string | null;
  profile: WorkspaceProfile | null;
  onboardingDone: boolean;
  sessions: Session[];
  activeSessionId: string | null;
  completeOnboarding: (displayName: string) => void;
  ensureUser: () => string;
  createSession: (title?: string) => string;
  setActiveSession: (id: string) => void;
  updateActiveSession: (
    patch: Partial<
      Pick<
        Session,
        | "messages"
        | "preview"
        | "title"
        | "syncKey"
        | "phase"
        | "plan"
        | "versions"
        | "activeVersionId"
        | "agentActions"
      >
    >,
  ) => void;
  appendMessage: (
    message: Omit<StoredMessage, "id" | "createdAt"> & { id?: string },
  ) => void;
  setPhase: (phase: ProjectPhase) => void;
  setPlan: (plan: BuildPlan | null) => void;
  setAgentActions: (actions: AgentAction[]) => void;
  commitVersion: (input: {
    html: string;
    label: string;
    source: AppVersion["source"];
  }) => void;
  restoreVersion: (versionId: string) => void;
  deleteSession: (id: string) => void;
  resetActiveCanvas: () => void;
  getActiveSession: () => Session | null;
  importSessions: (sessions: Session[], activeId?: string) => void;
};

function newSession(title = "新项目"): Session {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    preview: createDefaultPreview(),
    phase: "idle",
    plan: null,
    versions: [],
    activeVersionId: null,
    agentActions: [],
    createdAt: now,
    updatedAt: now,
    syncKey: 0,
  };
}

function migrateSession(raw: Partial<Session> & { id: string }): Session {
  const base = newSession(raw.title ?? "项目");
  return {
    ...base,
    ...raw,
    preview: raw.preview ?? base.preview,
    messages: Array.isArray(raw.messages) ? raw.messages : [],
    phase: raw.phase ?? (Array.isArray(raw.versions) && raw.versions.length > 0 ? "ready" : "idle"),
    plan: raw.plan ?? null,
    versions: Array.isArray(raw.versions) ? raw.versions : [],
    activeVersionId: raw.activeVersionId ?? null,
    agentActions: Array.isArray(raw.agentActions) ? raw.agentActions : [],
    syncKey: raw.syncKey ?? 0,
  };
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      userId: null,
      profile: null,
      onboardingDone: false,
      sessions: [],
      activeSessionId: null,

      completeOnboarding: (displayName) => {
        const userId = get().ensureUser();
        let { sessions, activeSessionId } = get();
        if (sessions.length === 0) {
          const session = newSession("我的第一个项目");
          sessions = [session];
          activeSessionId = session.id;
        }
        set({
          onboardingDone: true,
          userId,
          sessions,
          activeSessionId,
          profile: {
            displayName: displayName.trim() || "创作者",
            createdAt: Date.now(),
          },
        });
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

      appendMessage: (message) => {
        const active = get().getActiveSession();
        if (!active) return;
        const next: StoredMessage = {
          id: message.id ?? crypto.randomUUID(),
          role: message.role,
          content: message.content,
          createdAt: Date.now(),
          kind: message.kind,
        };
        get().updateActiveSession({
          messages: [...active.messages, next],
        });
      },

      setPhase: (phase) => get().updateActiveSession({ phase }),

      setPlan: (plan) => get().updateActiveSession({ plan }),

      setAgentActions: (actions) =>
        get().updateActiveSession({ agentActions: actions }),

      commitVersion: ({ html, label, source }) => {
        const active = get().getActiveSession();
        if (!active) return;
        const version: AppVersion = {
          id: crypto.randomUUID(),
          label,
          html,
          createdAt: Date.now(),
          source,
        };
        const preview: PreviewPayload = {
          title: active.plan?.title ?? active.title,
          html,
          updatedAt: Date.now(),
        };
        get().updateActiveSession({
          versions: [version, ...active.versions].slice(0, 20),
          activeVersionId: version.id,
          preview,
          phase: "ready",
        });
      },

      restoreVersion: (versionId) => {
        const active = get().getActiveSession();
        if (!active) return;
        const version = active.versions.find((v) => v.id === versionId);
        if (!version) return;
        get().updateActiveSession({
          activeVersionId: version.id,
          preview: {
            title: active.plan?.title ?? active.title,
            html: version.html,
            updatedAt: Date.now(),
          },
          phase: "ready",
        });
        get().appendMessage({
          role: "system",
          kind: "status",
          content: `已恢复版本：${version.label}`,
        });
      },

      deleteSession: (id) => {
        set((state) => {
          const sessions = state.sessions.filter((s) => s.id !== id);
          let activeSessionId = state.activeSessionId;
          if (activeSessionId === id) {
            activeSessionId = sessions[0]?.id ?? null;
          }
          if (sessions.length === 0) {
            const session = newSession("新项目");
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
          phase: "idle",
          plan: null,
          versions: [],
          activeVersionId: null,
          agentActions: [],
          syncKey: (current.syncKey ?? 0) + 1,
        });
      },

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId) ?? null;
      },

      importSessions: (sessions, activeId) => {
        if (sessions.length === 0) return;
        const normalized = sessions.map((s) => migrateSession(s));
        set({
          sessions: normalized,
          activeSessionId: activeId ?? normalized[0].id,
          onboardingDone: true,
        });
      },
    }),
    {
      name: "atoms-demo-sessions",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userId: state.userId,
        profile: state.profile,
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
          profile?: WorkspaceProfile | null;
        };
        if (state?.sessions) {
          state.sessions = state.sessions.map((s) => migrateSession(s));
        }
        return state;
      },
      version: 2,
    },
  ),
);

export type { PreviewPayload, Session, StoredMessage };
