"use client";

import { motion } from "framer-motion";
import { ArrowRight, Layers, MessageSquare, Save } from "lucide-react";
import { useSessionStore } from "@/store/session-store";

export function WelcomeModal() {
  const onboardingDone = useSessionStore((s) => s.onboardingDone);
  const completeOnboarding = useSessionStore((s) => s.completeOnboarding);

  if (onboardingDone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-panel-border bg-panel p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold">欢迎使用 Atoms-Demo</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          用自然语言描述界面，右侧 Canvas 实时预览。会话会自动保存到浏览器，并同步到服务端。
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex gap-3">
            <MessageSquare className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              <strong className="text-foreground">主流程</strong>：新建会话 → 对话生成 UI →
              预览与迭代
            </span>
          </li>
          <li className="flex gap-3">
            <Save className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              <strong className="text-foreground">持久化</strong>：localStorage +
              服务端 JSON 双写，刷新不丢
            </span>
          </li>
          <li className="flex gap-3">
            <Layers className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              <strong className="text-foreground">延展</strong>：多会话历史、导出 HTML
            </span>
          </li>
        </ul>
        <button
          type="button"
          onClick={completeOnboarding}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          开始创建
          <ArrowRight className="size-4" />
        </button>
      </motion.div>
    </div>
  );
}
