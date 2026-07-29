import type { AgentAction, AgentActionName, AgentName } from "@/lib/types";

export function createAction(
  agent: AgentName,
  action: AgentActionName,
  label: string,
  status: AgentAction["status"] = "pending",
  detail?: string,
): AgentAction {
  return {
    id: crypto.randomUUID(),
    agent,
    action,
    label,
    status,
    detail,
  };
}

export function patchActions(
  actions: AgentAction[],
  action: AgentActionName,
  status: AgentAction["status"],
  detail?: string,
): AgentAction[] {
  return actions.map((item) =>
    item.action === action
      ? { ...item, status, ...(detail ? { detail } : {}) }
      : item,
  );
}

export const AGENT_LABEL: Record<AgentName, string> = {
  mike: "Mike · 协调",
  emma: "Emma · 产品",
  alex: "Alex · 工程",
};
