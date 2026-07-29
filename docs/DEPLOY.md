# 部署指南（Vercel + DeepSeek）

本文说明如何拿到 **可公网访问的 Demo 链接**，并使用 **DeepSeek** 作为默认 AI 后端（国内网络通常可直接访问）。

仓库：https://github.com/jinshui-max/Atoms-Demo

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

保存后执行 `npm run dev`，访问 http://localhost:3000：进入工作区 → 选模板或描述需求 → 批准方案 → 确认右侧可交互预览。

---

## 二、推送代码到 GitHub

```bash
git add .
git commit -m "Atoms-Demo: agent studio + share preview"
git push -u origin main
```

> 切勿提交 `.env.local`（已在 `.gitignore` 中）。

---

## 三、方式 A：Vercel 网页一键导入（推荐）

1. 打开 [Vercel New Project](https://vercel.com/new)  
2. **Import** `jinshui-max/Atoms-Demo`  
3. Framework 应自动识别为 **Next.js**；保留默认 Build / Install  
4. 展开 **Environment Variables**，添加（三个环境都勾选）：

| Name | Value |
|------|--------|
| `OPENAI_API_KEY` | 你的 DeepSeek Key |
| `OPENAI_BASE_URL` | `https://api.deepseek.com/v1` |
| `OPENAI_MODEL` | `deepseek-chat` |

5. 点击 **Deploy**，等待约 1–3 分钟  
6. 复制 Production URL，写回 `README.md` 的 Demo URL 表格  

### 部署配置检查清单

| 项 | 预期 |
|----|------|
| Framework | Next.js |
| Root Directory | `.`（仓库根） |
| Build Command | `npm run build`（与 `vercel.json` 一致） |
| Install Command | `npm install` |
| Node.js | 20.x（Vercel 项目 Settings → General） |
| `/api/agent` maxDuration | 60s（见 `vercel.json`；Hobby 可能仍受套餐限制） |
| 环境变量 | 上述 3 个，Production + Preview |

### 一键 Deploy 按钮

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjinshui-max%2FAtoms-Demo&env=OPENAI_API_KEY&env=OPENAI_BASE_URL&env=OPENAI_MODEL&project-name=atoms-demo)
```

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

或：

```bash
npm run deploy:prod
```

---

## 五、部署后自检

1. 打开 Production URL → 填写显示名 → **进入工作区**  
2. 选模板「看板待办」→ **批准并生成** → 右侧可交互  
3. 点 **分享预览** → 新标签打开 `/s#...` 可独立预览  
4. 刷新工作台 → 项目仍在（localStorage）  
5. **导出 HTML** → 能下载  

若生成失败，在 Vercel **Deployments → Functions / Logs** 查看 `/api/agent`；常见原因是 Key 未配、额度不足，或函数超时（需更高 `maxDuration` 套餐）。

---

## 六、改用 OpenAI 官方

- `OPENAI_API_KEY` = OpenAI 官方 Key  
- 删除 `OPENAI_BASE_URL` 或留空  
- `OPENAI_MODEL` = `gpt-4o-mini`  

需保证运行环境能访问 `api.openai.com`。

---

## 七、持久化与分享说明

| 能力 | Vercel | 本地 |
|------|--------|------|
| 工作区 localStorage | ✅ | ✅ |
| `data/sessions/*.json` | ❌ 无持久磁盘 | ✅ 双写备份 |
| 分享预览链接 | ✅ URL hash 快照，不依赖服务器存储 | ✅ |

分享链接把当前应用 HTML 压缩进 hash，任何人打开即可预览；不包含你的 API Key 与工作区历史。
