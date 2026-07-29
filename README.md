# Atoms-Demo

对话驱动 UI 的 Next.js 全栈 Demo：**Chat + Canvas**，支持会话持久化、历史管理与 HTML 导出。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2FAtoms-Demo&project-name=atoms-demo&env=OPENAI_API_KEY&env=OPENAI_BASE_URL&env=OPENAI_MODEL)

> 使用前请将按钮链接里的 `YOUR_USERNAME/Atoms-Demo` 改成你的 GitHub 仓库路径。详细步骤见 [docs/DEPLOY.md](./docs/DEPLOY.md)。

## 在线演示

| 项 | 说明 |
|----|------|
| **Demo URL** | `https://你的项目.vercel.app`（部署后替换） |
| **测试账号** | 无需注册；首次打开完成引导即可使用 |

### 评审自测清单（约 3 分钟）

1. 打开 Demo URL → 点击 **「开始创建」** 完成初始化  
2. 输入：「做一个深色登录卡片」→ 确认右侧 Canvas 有预览  
3. **刷新页面** → 会话与预览仍在（localStorage 持久化）  
4. 左侧 **新建会话** → 切换历史会话  
5. 右侧 **导出 HTML** → 下载可打开的 `.html` 文件  

## 功能与评审对照

| 要求 | 实现 |
|------|------|
| 真实交互 | 流式 AI 对话 + 实时 Canvas 预览 |
| 数据持久化 | 浏览器 `localStorage` + `/api/sessions` 服务端 JSON 双写（本地） |
| 主流程 | 引导初始化 → 新建/切换会话 → 多轮对话改 UI |
| 延展能力 | 多会话历史、导出 HTML |
| 在线访问 | Vercel 部署（见 [docs/DEPLOY.md](./docs/DEPLOY.md)） |

## 本地开发（默认 DeepSeek）

国内推荐 **DeepSeek**（OpenAI 兼容，无需改代码，只配环境变量）：

1. 在 [DeepSeek API Keys](https://platform.deepseek.com/api_keys) 创建密钥  
2. 复制 `.env.example` 为 `.env.local` 并填写：

```env
OPENAI_API_KEY=你的DeepSeek密钥
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

3. 安装并启动：

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

修改 `.env.local` 后必须 **重启** `npm run dev`。

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `OPENAI_API_KEY` | 是 | DeepSeek 或 OpenAI 等兼容平台的密钥 |
| `OPENAI_BASE_URL` | DeepSeek 必填 | 例：`https://api.deepseek.com/v1`；OpenAI 官方可省略 |
| `OPENAI_MODEL` | 建议填 | DeepSeek：`deepseek-chat`；OpenAI 默认：`gpt-4o-mini` |

## 快速部署 Vercel

**网页：** [vercel.com/new](https://vercel.com/new) → Import 仓库 → 添加上表三个环境变量 → Deploy。

**CLI：**

```bash
npm run deploy        # 预览环境
npm run deploy:prod   # 生产环境
```

完整图文说明：[docs/DEPLOY.md](./docs/DEPLOY.md)

## 目录结构

```
src/app/api/chat/route.ts      # AI 流式对话
src/app/api/sessions/route.ts  # 会话服务端存储
src/store/session-store.ts     # Zustand + localStorage
docs/DEPLOY.md                 # 部署与 DeepSeek 配置
data/sessions/                 # 本地 JSON 备份（git 忽略）
```
