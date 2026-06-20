/* ============================================================
   日常生活痛点调查问卷 — 后端 API 服务器
   技术栈: Express + better-sqlite3 (SQLite)
   部署: Render / Railway / 任意 Node.js 主机
   ============================================================ */

const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

// ========== 配置 ==========
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'survey-admin-2026';

// ========== 初始化数据库 ==========
const db = new Database('survey_data.db');
db.pragma('journal_mode = WAL'); // 提升并发性能

// 建表
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submitted_at TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    answers_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_submitted_at ON submissions(submitted_at);
`);

// 预编译语句
const insertStmt = db.prepare(`
  INSERT INTO submissions (submitted_at, duration_seconds, answers_json)
  VALUES (?, ?, ?)
`);
const countStmt = db.prepare('SELECT COUNT(*) as count FROM submissions');
const allStmt = db.prepare('SELECT * FROM submissions ORDER BY submitted_at DESC');
const avgDurationStmt = db.prepare('SELECT AVG(duration_seconds) as avg_dur FROM submissions WHERE duration_seconds > 0');

// ========== Express 应用 ==========
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// 生产环境托管前端静态文件
app.use(express.static(path.join(__dirname, '..')));

// ========== 鉴权中间件 ==========
function requireAuth(req, res, next) {
  const token = req.query.token || req.headers['x-admin-token'];
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: 无效的管理令牌' });
  }
  next();
}

// ========== API 路由 ==========

// POST /api/submit — 提交问卷数据
app.post('/api/submit', (req, res) => {
  try {
    const { meta, answers } = req.body;

    // 基础校验
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: '无效数据：缺少 answers 字段' });
    }
    if (Object.keys(answers).length < 10) {
      return res.status(400).json({ error: '数据不完整：答案字段过少' });
    }

    const submittedAt = meta?.submittedAt || new Date().toISOString();
    const duration = meta?.durationSeconds || 0;

    // 写入 SQLite
    const result = insertStmt.run(submittedAt, duration, JSON.stringify(answers));

    console.log(`✅ 新提交 #${result.lastInsertRowid} | ${submittedAt} | ${duration}秒`);

    res.json({
      success: true,
      id: result.lastInsertRowid,
      message: '数据已成功提交到服务器',
    });

  } catch (err) {
    console.error('❌ 提交失败:', err.message);
    res.status(500).json({ error: '服务器内部错误: ' + err.message });
  }
});

// GET /api/stats — 获取聚合统计数据（需鉴权）
app.get('/api/stats', requireAuth, (req, res) => {
  try {
    const { count } = countStmt.get();
    const { avg_dur } = avgDurationStmt.get();
    const rows = allStmt.all();

    // 解析所有提交
    const submissions = [];
    for (const row of rows) {
      try {
        const answers = JSON.parse(row.answers_json);
        const parsed = parseAnswers(answers);
        submissions.push({
          id: row.id,
          submittedAt: row.submitted_at,
          durationSeconds: row.duration_seconds,
          parsed,
        });
      } catch (e) {
        console.warn(`⚠️ 跳过损坏数据 #${row.id}`);
      }
    }

    // 聚合各题选项计数
    const aggregation = aggregateAll(submissions);

    // 总参与人数
    const totalParticipants = submissions.length;
    const avgDuration = avg_dur ? Math.round(avg_dur) : null;

    res.json({
      meta: {
        totalParticipants,
        avgDurationSeconds: avgDuration,
        avgDurationReadable: avgDuration
          ? `${Math.floor(avgDuration / 60)}分${avgDuration % 60}秒`
          : null,
        generatedAt: new Date().toISOString(),
      },
      aggregation,      // { questionId: { optionIndex: count } }
      submissions: submissions.map(s => ({  // 返回解析后的完整数据供前端交叉分析
        id: s.id,
        submittedAt: s.submittedAt,
        durationSeconds: s.durationSeconds,
        parsed: s.parsed,
      })),
    });

    console.log(`📊 统计数据已生成 | ${totalParticipants} 人参与 | 查询者 IP: ${req.ip}`);

  } catch (err) {
    console.error('❌ 统计生成失败:', err.message);
    res.status(500).json({ error: '统计生成失败: ' + err.message });
  }
});

// GET /api/submissions — 获取原始提交列表（需鉴权）
app.get('/api/submissions', requireAuth, (req, res) => {
  try {
    const rows = allStmt.all();
    const data = rows.map(r => ({
      id: r.id,
      submittedAt: r.submitted_at,
      durationSeconds: r.duration_seconds,
      answers: JSON.parse(r.answers_json),
    }));
    res.json({ total: data.length, submissions: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/submissions/:id — 删除单条记录（需鉴权）
app.delete('/api/submissions/:id', requireAuth, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM submissions WHERE id = ?');
    const result = stmt.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }
    res.json({ success: true, message: `已删除 #${req.params.id}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  const { count } = countStmt.get();
  res.json({ status: 'ok', submissions: count, uptime: process.uptime() });
});

// ========== 辅助函数 ==========

// 从 answers JSON 中提取 qId → rawAnswer 映射
function parseAnswers(answers) {
  const parsed = {};
  for (const [key, value] of Object.entries(answers)) {
    const m = key.match(/^Q(\d+)_raw$/);
    if (m) {
      const qId = parseInt(m[1]);
      const type = answers[`Q${qId}_type`];
      if (type === 'multi') {
        parsed[qId] = Array.isArray(value) ? value : [];
      } else {
        parsed[qId] = typeof value === 'string' ? value : String(value);
      }
    }
  }
  return parsed;
}

// 聚合所有提交的选项计数
function aggregateAll(submissions) {
  const agg = {};
  submissions.forEach(s => {
    for (const [qIdStr, answer] of Object.entries(s.parsed)) {
      const qId = parseInt(qIdStr);
      if (!agg[qId]) agg[qId] = {};
      if (Array.isArray(answer)) {
        answer.forEach(k => { agg[qId][k] = (agg[qId][k] || 0) + 1; });
      } else {
        agg[qId][answer] = (agg[qId][answer] || 0) + 1;
      }
    }
  });
  return agg;
}

// ========== 启动 ==========
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('  📊 问卷后端 API 已启动');
  console.log(`  🔗 http://localhost:${PORT}`);
  console.log(`  📋 提交接口: POST /api/submit`);
  console.log(`  📊 统计接口: GET /api/stats?token=${ADMIN_TOKEN}`);
  console.log(`  🗄️  数据库: SQLite (survey_data.db)`);
  console.log(`  📦 已有 ${countStmt.get().count} 条记录`);
  console.log('═══════════════════════════════════════');
});
