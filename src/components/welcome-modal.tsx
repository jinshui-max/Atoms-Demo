"use client";

import { motion } from "framer-motion";
import { ArrowRight, Layers, MessageSquare, Save, Users } from "lucide-react";
import { useState } from "react";
import { useSessionStore } from "@/store/session-store";

export function WelcomeModal() {
  const onboardingDone = useSessionStore((s) => s.onboardingDone);
  const completeOnboarding = useSessionStore((s) => s.completeOnboarding);
  const [name, setName] = useState("");

  if (onboardingDone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-panel-border bg-panel p-6 shadow-xl"
      >
        <p className="text-xs font-medium tracking-wide text-accent">ATOMS DEMO</p>
        <h2 className="mt-1 text-lg font-semibold">创建你的 AI 产品工作区</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          用自然语言描述想法。Mike 协调，Emma 出方案，你批准后 Alex
          生成可交互网页，并在右侧实时预览与迭代。
        </p>

        <label className="mt-5 block text-xs text-muted" htmlFor="display-name">
          怎么称呼你（工作区显示名）
        </label>
        <input
          id="display-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：Alex"
          className="mt-1.5 w-full rounded-xl border border-panel-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent/50"
        />

        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex gap-3">
            <Users className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              <strong className="text-foreground">智能体驱动</strong>
              ：规划 → 批准 → 生成 → 对话迭代
            </span>
          </li>
          <li className="flex gap-3">
            <MessageSquare className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              <strong className="text-foreground">真实交互</strong>
              ：生成应用在 Canvas 中可点击、可表单、可本地存储
            </span>
          </li>
          <li className="flex gap-3">
            <Save className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              <strong className="text-foreground">持久化</strong>
              ：项目 / 对话 / 方案 / 版本写入浏览器；本地可同步服务端备份
            </span>
          </li>
          <li className="flex gap-3">
            <Layers className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              <strong className="text-foreground">延展</strong>
              ：模板启动、版本回滚、多端预览、导出 HTML
            </span>
          </li>
        </ul>

        <button
          type="button"
          onClick={() => completeOnboarding(name)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          进入工作区
          <ArrowRight className="size-4" />
        </button>
      </motion.div>
    </div>
  );
}
