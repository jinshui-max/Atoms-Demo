# Atoms-Demo

智能体驱动的 **Atoms 风格 Demo**：用中文描述想法 → Emma 规划 → 你批准 → Alex 生成可交互网页 → 右侧 Canvas 实时预览与对话迭代。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjinshui-max%2FAtoms-Demo&project-name=atoms-demo&env=OPENAI_API_KEY&env=OPENAI_BASE_URL&env=OPENAI_MODEL)

> 部署步骤见 [docs/DEPLOY.md](./docs/DEPLOY.md)。仓库：https://github.com/jinshui-max/Atoms-Demo

## 在线演示

| 项 | 说明 |
|----|------|
| **Demo URL** | `https://你的项目.vercel.app`（部署后替换） |
| **测试账号** | 无需注册；首次打开填写显示名即可进入工作区 |

### 评审自测清单（约 5 分钟）

1. 打开 Demo → 填写显示名 → **进入工作区**
2. 点模板「看板待办」或输入：「做一个本地保存的习惯打卡」
3. 查看 Emma 方案卡片 → **批准并生成**
4. 右侧 Canvas 出现可交互应用（增删、表单、localStorage 等）
5. 切换手机/平板预览；对话「把主色换成绿色」触发迭代
6. 打开 **版本** 回滚上一版；点 **分享预览** 复制链接，新标签打开可独立查看
7. **导出 HTML** 下载可离线打开的文件；**刷新页面** → 项目与预览仍在

## 笔试要求对照

| 要求 | 实现 |
|------|------|
| 智能体驱动生成应用 | Mike 协调 / Emma 规划 / Alex 生成与迭代；动作条可见 |
| 可视化网页展示 | Sandboxed iframe Canvas，桌面/平板/手机预览 |
| 真实交互 | 生成物为可点击的完整 HTML 应用，非静态截图 |
| 数据持久化 | 浏览器 localStorage（项目/对话/方案/版本）；本地开发另有服务端 JSON 双写 |
| 初始化 / 主流程 | 工作区引导 → 需求/模板 → 方案批准 → 生成 → 迭代 |
| 延展能力 | 模板启动、版本回滚、多端预览、导出 HTML、**分享预览链接**、多项目 |
| 在线可访问 | Vercel 部署（见 DEPLOY.md） |

## 主流程

```text
进入工作区
  → 描述需求 或 选择模板
  → Emma 产出方案（页面 / 功能 / 视觉 / 验收）
  → 你批准（或退回 / 重述需求）
  → Alex 流式生成完整 HTML 应用
  → Canvas 预览 + 对话迭代 + 版本回滚
```

## 本地开发（默认 DeepSeek）

1. 复制环境变量并填写密钥：

```bash
cp .env.example .env.local
```

```env
OPENAI_API_KEY=你的DeepSeek密钥
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

2. 安装并启动：

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。修改 `.env.local` 后需重启。

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `OPENAI_API_KEY` | 是 | DeepSeek / OpenAI 等兼容平台密钥 |
| `OPENAI_BASE_URL` | DeepSeek 必填 | 例：`https://api.deepseek.com/v1` |
| `OPENAI_MODEL` | 建议 | DeepSeek：`deepseek-chat` |

## 目录结构（关键）

```
src/app/api/agent/route.ts     # plan / build / iterate 智能体入口
src/components/chat-panel.tsx  # 方案批准、动作条、模板、流式生成
src/components/canvas-preview.tsx  # 多端预览、版本、导出
src/store/session-store.ts     # 工作区持久化
src/lib/templates.ts           # 可 Remix 模板
docs/DEPLOY.md                 # 公网部署
```

## 边界说明

- 生成物是**自包含 HTML 应用**（可含 localStorage），不是多文件 React 工程或独立后端。
- Vercel 等无持久磁盘环境以**浏览器 localStorage** 为权威存储；`/api/sessions` 文件备份主要用于本地开发。
- 分享预览把应用快照压缩进 URL hash（不经服务器存储）；链接可公开打开，但过长时个别聊天软件可能截断。
- 不包含真实支付、OAuth、自动部署生成应用等生产能力。
- Vercel Hobby 默认函数超时较短；`maxDuration: 60` 在 Pro / Fluid 更稳。若生成中途超时，请升级时长或缩短需求。
