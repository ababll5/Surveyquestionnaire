# 日常生活痛点与需求调查问卷 + 数据看板

**16 题生活痛点调查问卷** + **密码保护数据看板** + **Express + SQLite 后端 API**

毛玻璃温暖视觉风格，移动优先适配。数据统一存储在服务器 SQLite 数据库中，所有用户提交自动汇总。

---

## 🏗️ 架构

```
┌──────────────┐    POST /api/submit    ┌──────────────┐
│  index.html  │ ──────────────────────→ │  server.js   │
│  问卷前端     │                        │  Express API │
│  GitHub Pages│ ←────────────────────── │  SQLite DB   │
└──────────────┘    GET /api/stats       └──────────────┘
       │                 (需 token)            │
       │                                       │
┌──────┴────────┐                              │
│ dashboard.html│ ←────────────────────────────┘
│  数据看板      │   拉取聚合统计 + 渲染图表
│  GitHub Pages │
└───────────────┘
```

- **前端**：部署在 GitHub Pages（纯静态）
- **后端**：部署在 Render / Railway（Node.js + SQLite）
- **数据流**：问卷提交 → API → SQLite → 看板拉取聚合数据 → Chart.js 渲染

---

## 🧩 题目覆盖

| 板块 | 题目数 | 内容 |
|---|---|---|
| 🍽️ 日常决定与生活琐事 | Q1–Q4 | 吃什么、家务、作息、消费决策 |
| 💬 人际与沟通 | Q5–Q8 | 内耗、父母沟通、社恐、表达预演 |
| 💜 情绪与心态调整 | Q9–Q12 | 焦虑来源、情绪消化、情绪急救 |
| ⏳ 任务执行与拖延 | Q13–Q14 | 拖延状态、对抗方法 |
| 📋 背景与习惯 | Q15–Q16 | 人生阶段、AI 接受度 |

Q1、Q9、Q14 为**多选题**，其余为**单选题**。

---

## 🚀 本地运行

### 1. 启动后端

```bash
cd server
npm install
npm start
# → http://localhost:3000
```

### 2. 启动前端

```bash
# 在项目根目录
python3 -m http.server 8080
# → http://localhost:8080/index.html
```

### 3. 配置 API 地址

编辑前端文件中 `API_BASE_URL`：

- `index.html` 第 637 行附近
- `dashboard.html` 第 518 行附近

本地开发保持 `http://localhost:3000` 即可。

---

## 🌐 部署

### 前端 → GitHub Pages

```bash
git add index.html dashboard.html .nojekyll
git commit -m "deploy"
git push origin main
```

仓库 Settings → Pages → Source: `Deploy from a branch` → `main` → `/ (root)` → Save

### 后端 → Render（推荐）

1. 新建 Web Service，连接 GitHub 仓库
2. **Root Directory**: `server`
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - `PORT` = `3000`（Render 会自动注入）
   - `ADMIN_TOKEN` = 自定义一个安全的管理令牌

部署完成后，将前端 `API_BASE_URL` 改为 Render 提供的 URL（如 `https://survey-api.onrender.com`）。

### 后端 → Railway

类似流程：连接仓库 → 设置 Root Directory 为 `server` → 部署。

---

## 📊 看板四大模块

| Tab | 功能 |
|---|---|
| 💡 关键洞察 | 6 项自动数据洞察（最普遍痛点、AI接受度、拖延率等） |
| 🔗 交叉分析 | 3 组堆叠条形图（拖延×情绪、阶段×AI、作息×拖延） |
| 📈 全部图表 | 13 饼图 + 3 条形图，按板块筛选，可下载 PNG |
| 🏆 痛点排行 | Top 20 高频选项排行榜 |

---

## 🔐 安全

| 层级 | 机制 |
|---|---|
| 看板页面 | 密码门禁（`sessionStorage`，关闭浏览器失效） |
| 统计 API | `token` 参数鉴权（`ADMIN_TOKEN` 环境变量） |
| 提交 API | 公开（任何人可提交问卷） |
| 数据 | SQLite 持久化存储 |

---

## 📁 文件结构

```
问卷2/
├── index.html           # 问卷前端
├── dashboard.html       # 数据看板
├── README.md
├── 问卷内容.txt
├── .nojekyll
└── server/
    ├── package.json
    ├── server.js         # Express API + SQLite
    └── .gitignore
```

---

## 🛠️ 技术栈

| 前端 | 后端 |
|---|---|
| HTML5 + CSS3 + Vanilla JS | Node.js + Express |
| Chart.js v4.4 | better-sqlite3 |
| LocalStorage (离线回退) | SQLite (WAL 模式) |
| Google Fonts (Noto Sans SC) | CORS 中间件 |

---

## 📝 License

MIT
