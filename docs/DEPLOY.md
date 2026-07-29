# 部署指南（Vercel + DeepSeek）

本文说明如何拿到 **可公网访问的 Demo 链接**，并使用 **DeepSeek** 作为默认 AI 后端（国内网络通常可直接访问）。

---

## 一、准备 DeepSeek API Key

1. 打开 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 并登录  
2. 创建 API Key，复制 `sk-` 开头的密钥  
3. 确保账户有余额（按量计费）

本地 `.env.local` 示例（**等号后不要加引号，行首不要空格**）：

```env
OPENAI_API_KEY=你的DeepSeek密钥
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

保存后执行 `npm run dev`，访问 http://localhost:3000 验证对话是否正常。

---

## 二、推送代码到 GitHub

在项目根目录：

```bash
git init
git add .
git commit -m "Atoms-Demo: chat + canvas with persistence"
git branch -M main
git remote add origin https://github.com/<你的用户名>/Atoms-Demo.git
git push -u origin main
```

> 切勿提交 `.env.local`（已在 `.gitignore` 中）。

---

## 三、方式 A：Vercel 网页一键导入（推荐）

1. 打开 [Vercel New Project](https://vercel.com/new)  
2. **Import** 你的 `Atoms-Demo` GitHub 仓库  
3. Framework 应自动识别为 **Next.js**，无需改 Build 命令  
4. 展开 **Environment Variables**，添加：

| Name | Value | 环境 |
|------|--------|------|
| `OPENAI_API_KEY` | 你的 DeepSeek Key | Production, Preview, Development |
| `OPENAI_BASE_URL` | `https://api.deepseek.com/v1` | Production, Preview, Development |
| `OPENAI_MODEL` | `deepseek-chat` | Production, Preview, Development |

5. 点击 **Deploy**，等待约 1–3 分钟  
6. 部署完成后复制 **Visit** 链接，例如：`https://atoms-demo-xxx.vercel.app`  
7. 将该链接写回仓库 `README.md` 的 **Demo URL** 表格  

### 一键 Deploy 按钮（需先推到 GitHub）

把下面链接中的 `YOUR_GITHUB_REPO_URL` 换成你的仓库地址（URL 编码），可放在 README 顶部：

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_GITHUB_REPO_URL_ENCODED&env=OPENAI_API_KEY&env=OPENAI_BASE_URL&env=OPENAI_MODEL&project-name=atoms-demo)
```

导入后 Vercel 会提示填写三个环境变量；`OPENAI_BASE_URL` 填 `https://api.deepseek.com/v1`，`OPENAI_MODEL` 填 `deepseek-chat`。

---

## 四、方式 B：Vercel CLI

```bash
npm i -g vercel
vercel login
cd Atoms-Demo
vercel link
vercel env add OPENAI_API_KEY
vercel env add OPENAI_BASE_URL
vercel env add OPENAI_MODEL
vercel --prod
```

或使用项目脚本：

```bash
npm run deploy
```

CLI 会输出 Production URL。

---

## 五、部署后自检

1. 打开 Production URL → **开始创建**  
2. 发送：「做一个深色登录卡片」→ 右侧应有预览  
3. 刷新页面 → 会话仍在（localStorage）  
4. **导出 HTML** → 能下载文件  

若报错，在 Vercel 项目 **Deployments → 某次部署 → Functions / Logs** 查看 `/api/chat` 日志。

---

## 六、改用 OpenAI 官方

在 Vercel 环境变量中：

- `OPENAI_API_KEY` = OpenAI 官方 Key  
- 删除 `OPENAI_BASE_URL` 或留空  
- `OPENAI_MODEL` = `gpt-4o-mini`（或留空使用代码默认值）

需保证 Vercel 运行环境能访问 `api.openai.com`（国内常需代理或中转）。

---

## 七、持久化说明

| 存储 | 部署到 Vercel | 本地 `npm run dev` |
|------|----------------|---------------------|
| 浏览器 localStorage | ✅ 主持久化 | ✅ |
| `data/sessions/*.json` | ❌ 无持久磁盘 | ✅ 双写备份 |

评审演示时强调：**刷新后会话仍在** 即可；多设备共享需后续接数据库（非本 Demo 范围）。
