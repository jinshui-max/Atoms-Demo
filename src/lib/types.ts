export type AgentName = "mike" | "emma" | "alex";

export type AgentActionName =
  | "coordinate"
  | "scope_plan"
  | "await_approval"
  | "build_app"
  | "iterate_app";

export type AgentActionStatus = "pending" | "running" | "completed" | "failed";

export type AgentAction = {
  id: string;
  agent: AgentName;
  action: AgentActionName;
  status: AgentActionStatus;
  label: string;
  detail?: string;
};

export type ProjectPhase =
  | "idle"
  | "planning"
  | "awaiting_approval"
  | "building"
  | "ready"
  | "iterating"
  | "error";

export type BuildPlan = {
  title: string;
  summary: string;
  productType: "website" | "web_app" | "landing" | "tool";
  pages: Array<{ name: string; purpose: string }>;
  features: string[];
  styleDirection: string;
  acceptanceChecks: string[];
};

export type AppVersion = {
  id: string;
  label: string;
  html: string;
  createdAt: number;
  source: "build" | "iterate" | "restore" | "template";
};

export type PreviewPayload = {
  title: string;
  html: string;
  updatedAt: number;
};

export type StoredMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  kind?: "chat" | "plan" | "build" | "status";
};

export type Session = {
  id: string;
  title: string;
  messages: StoredMessage[];
  preview: PreviewPayload;
  phase: ProjectPhase;
  plan: BuildPlan | null;
  versions: AppVersion[];
  activeVersionId: string | null;
  agentActions: AgentAction[];
  createdAt: number;
  updatedAt: number;
  syncKey: number;
};

export type WorkspaceProfile = {
  displayName: string;
  createdAt: number;
};
