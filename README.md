# 日常生活痛点与需求调查问卷 + 数据看板

一份纯前端实现的 **16 题生活痛点调查问卷**，搭配 **带密码保护的数据统计看板**。
毛玻璃温暖视觉风格，移动优先适配，无需任何后端服务器。

---

## 📸 项目预览

| 问卷前端 (`index.html`) | 数据看板 (`dashboard.html`) |
|---|---|
| 分页答题、平滑动画、LocalStorage 自动保存 | 🔐 密码门禁 + 4 大分析模块 |
| 提交后数据自动存入浏览器，看板即填即看 | 💡 洞察 / 🔗 交叉分析 / 📈 图表 / 🏆 排行榜 |

---

## 🧩 题目覆盖的五大板块

| 板块 | 题目数 | 内容 |
|---|---|---|
| 🍽️ 日常决定与生活琐事 | Q1–Q4 | 吃什么、家务、作息、消费决策 |
| 💬 人际与沟通 | Q5–Q8 | 内耗、父母沟通、社恐、表达预演 |
| 💜 情绪与心态调整 | Q9–Q12 | 焦虑来源、情绪消化、情绪急救 |
| ⏳ 任务执行与拖延 | Q13–Q14 | 拖延状态、对抗方法 |
| 📋 背景与习惯 | Q15–Q16 | 人生阶段、AI 接受度 |

其中 Q1、Q9、Q14 为**多选题**，其余为**单选题**。

---

## 🚀 使用步骤

### 1️⃣ 填写问卷

直接用浏览器打开 `index.html`：

```bash
# 推荐使用 HTTP 服务器（避免跨域限制）
python3 -m http.server 8080
# 然后访问 http://localhost:8080/index.html
```

- 每页一题，顶部显示进度条和题号（如 3/16）
- 单选点击胶囊按钮，多选可勾选多项，实时显示「已选 X 项」
- **进度自动保存**到浏览器 LocalStorage，刷新/关闭不丢失
- 完成全部 16 题后点击「提交」，数据自动存储到 `survey_submissions`

> 键盘快捷键：`←` 上一题，`→` / `Enter` 下一题

### 2️⃣ 查看数据看板

打开 `dashboard.html`：

- **🔐 密码门禁**：默认密码 `dashboard2026`（可在源码中修改 `AUTH_HASH` 行）
- 通过验证后，看板自动从 LocalStorage 读取本机所有提交记录
- 四大分析模块：

| 模块 | 功能 |
|---|---|
| 💡 关键洞察 | 自动生成 6 项数据洞察（最普遍痛点、AI接受度、拖延率、社恐比例等） |
| 🔗 交叉分析 | 3 组交叉图表：拖延×情绪、阶段×AI、作息×拖延 |
| 📈 全部图表 | 13 个饼图 + 3 个条形图，按板块筛选，图表可下载 PNG |
| 🏆 痛点排行 | Top 20 高频选项排行榜，带可视化进度条 |

---

## 🔐 修改看板密码

编辑 `dashboard.html`，找到这一行：

```javascript
const AUTH_HASH = btoa('dashboard2026');
```

将 `'dashboard2026'` 替换为你自己的密码即可。

> ⚠️ 纯前端方案的密码保护仅用于阻挡非授权访问，无法做到真正的安全。如需严格鉴权，请部署后端服务。

---

## 🌐 部署到 GitHub Pages

```bash
cd /path/to/问卷2
git init && git checkout -b main
git add index.html dashboard.html README.md
git commit -m "Init: survey + dashboard with analysis"

# 在 GitHub 创建仓库后：
git remote add origin git@github.com:你的用户名/仓库名.git
git push -u origin main

# GitHub 仓库 → Settings → Pages → Source: main branch → Save
# 访问 https://你的用户名.github.io/仓库名/
```

### 注意事项

- GitHub Pages 是纯静态服务器，完美支持本项目
- 所有数据存储在用户本地浏览器（LocalStorage），不上传任何服务器
- 看板通过密码门禁保护，sessionStorage 保存认证状态（关闭浏览器后需重新输入）
- 如果页面不在根目录，相应调整 HTML 中的 `<a href="...">` 链接

---

## 🛠️ 技术栈

| 层级 | 技术 |
|---|---|
| 页面结构 | HTML5 语义化 |
| 样式 | CSS3（毛玻璃 Glassmorphism、渐变背景、动画过渡、弹性反馈） |
| 交互逻辑 | 原生 JavaScript（ES6+） |
| 数据持久化 | LocalStorage API |
| 图表库 | [Chart.js v4.4](https://www.chartjs.org/)（CDN 引入） |
| 字体 | [Google Fonts — Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC) + DM Serif Display |
| 部署 | GitHub Pages / 任意静态文件服务器 |

---

## 📁 文件结构

```
问卷2/
├── index.html        # 问卷前端（16题分页、LocalStorage保存、自动提交）
├── dashboard.html    # 数据看板（密码保护、洞察分析、交叉分析、图表、排行榜）
├── README.md         # 本文档
└── 问卷内容.txt       # 题目原始文本（参考用）
```

---

## ❓ 常见问题

**Q: 为什么刷新后进度还在？**
A: 每切换一题都自动保存到 LocalStorage，包括答案和计时。除非手动清除浏览器数据。

**Q: 看板如何获取数据？**
A: 同一浏览器填写并提交问卷后，数据自动存入 `survey_submissions` 键。看板从该键读取，无需手动上传。

**Q: 数据安全吗？**
A: 所有数据仅存储在用户本地浏览器中，不会发送到任何服务器。

**Q: 忘记看板密码怎么办？**
A: 打开浏览器开发者工具 → Application/存储 → 清除 `sessionStorage` 中的 `dashboard_authed` 键，页面会重新显示密码输入框。密码本身在源码中可查看。

---

## 📝 License

MIT — 自由使用、修改、分发。
