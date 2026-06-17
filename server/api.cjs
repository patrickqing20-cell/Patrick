const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = 3012;
const DATA_DIR = path.join(__dirname, '..', 'data');
const TASKS_DIR = path.join(DATA_DIR, 'tasks');
const PROD_DIR = path.join(DATA_DIR, 'production');

// Ensure dirs
[DATA_DIR, TASKS_DIR, PROD_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ===== Helpers =====
function getTaskDir(taskId) { return path.join(TASKS_DIR, taskId); }
function getLabelsDir(taskId) { return path.join(getTaskDir(taskId), 'labels'); }
function getTokensFile(taskId) { return path.join(getTaskDir(taskId), 'tokens.json'); }
function getVersionFile(taskId) { return path.join(getTaskDir(taskId), 'version.txt'); }
function getTaskFile(taskId) { return path.join(getTaskDir(taskId), 'task.json'); }

function ensureTask(taskId) {
  const d = getTaskDir(taskId);
  const ld = getLabelsDir(taskId);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  if (!fs.existsSync(ld)) fs.mkdirSync(ld, { recursive: true });
}

function getVersion(taskId) {
  try { return parseInt(fs.readFileSync(getVersionFile(taskId), 'utf-8').trim()) || 0; } catch { return 0; }
}
function bumpVersion(taskId) {
  const v = getVersion(taskId) + 1;
  fs.writeFileSync(getVersionFile(taskId), String(v));
  return v;
}
function loadTokens(taskId) {
  try { return JSON.parse(fs.readFileSync(getTokensFile(taskId), 'utf-8')); } catch { return {}; }
}
function saveTokens(taskId, t) { fs.writeFileSync(getTokensFile(taskId), JSON.stringify(t)); }

function loadLabels(taskId, user) {
  const f = path.join(getLabelsDir(taskId), user + '.json');
  try { return JSON.parse(fs.readFileSync(f, 'utf-8')); } catch { return {}; }
}
function saveLabels(taskId, user, data) {
  const f = path.join(getLabelsDir(taskId), user + '.json');
  const tmp = f + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, f);
}

function getAllSummary(taskId) {
  const ld = getLabelsDir(taskId);
  if (!fs.existsSync(ld)) return {};
  const files = fs.readdirSync(ld).filter(f => f.endsWith('.json'));
  const summary = {};
  for (const file of files) {
    const user = file.replace('.json', '');
    const labels = JSON.parse(fs.readFileSync(path.join(ld, file), 'utf-8'));
    for (const [itemId, label] of Object.entries(labels)) {
      if (!summary[itemId]) summary[itemId] = { picks: {}, ratings: {}, notes: [] };
      // Handle different review modes
      if (label.pick) {
        if (!summary[itemId].picks[label.pick]) summary[itemId].picks[label.pick] = [];
        summary[itemId].picks[label.pick].push(user);
      }
      if (label.rating) {
        summary[itemId].ratings[user] = label.rating;
      }
      if (label.note) {
        summary[itemId].notes.push({ user, note: label.note });
      }
    }
  }
  return summary;
}

function getAllUsers(taskId) {
  const ld = getLabelsDir(taskId);
  if (!fs.existsSync(ld)) return [];
  const files = fs.readdirSync(ld).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const user = f.replace('.json', '');
    const labels = JSON.parse(fs.readFileSync(path.join(ld, f), 'utf-8'));
    const total = Object.keys(labels).length;
    return { name: user, count: total };
  }).sort((a, b) => b.count - a.count);
}

function listTasks() {
  if (!fs.existsSync(TASKS_DIR)) return [];
  return fs.readdirSync(TASKS_DIR)
    .filter(d => fs.existsSync(path.join(TASKS_DIR, d, 'task.json')))
    .map(d => {
      const task = JSON.parse(fs.readFileSync(path.join(TASKS_DIR, d, 'task.json'), 'utf-8'));
      const users = getAllUsers(d);
      return { id: d, title: task.title, mode: task.mode, itemCount: (task.items || []).length, reviewers: users.length, ...task.meta };
    });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString())); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

function json(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

// ===== Server =====
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;

  try {
    // GET /api/tasks — list all tasks
    if (p === '/api/tasks' && req.method === 'GET') {
      return json(res, 200, { tasks: listTasks() });
    }

    // POST /api/tasks — create task
    if (p === '/api/tasks' && req.method === 'POST') {
      const body = await parseBody(req);
      const taskId = body.id || randomUUID().slice(0, 8);
      ensureTask(taskId);
      fs.writeFileSync(getTaskFile(taskId), JSON.stringify(body, null, 2));
      return json(res, 200, { id: taskId, ok: true });
    }

    // GET /api/tasks/:id — get task detail
    const taskMatch = p.match(/^\/api\/tasks\/([^/]+)$/);
    if (taskMatch && req.method === 'GET') {
      const taskId = taskMatch[1];
      const tf = getTaskFile(taskId);
      if (!fs.existsSync(tf)) return json(res, 404, { error: 'Task not found' });
      const task = JSON.parse(fs.readFileSync(tf, 'utf-8'));
      return json(res, 200, task);
    }

    // POST /api/tasks/:id/register
    const regMatch = p.match(/^\/api\/tasks\/([^/]+)\/register$/);
    if (regMatch && req.method === 'POST') {
      const taskId = regMatch[1];
      ensureTask(taskId);
      const { user, token: savedToken } = await parseBody(req);
      if (!user || !/^[\u4e00-\u9fffa-zA-Z0-9_-]{1,20}$/.test(user)) return json(res, 400, { error: 'Invalid name' });
      const tokens = loadTokens(taskId);
      // Internal network: no token validation, just issue/reuse token
      if (!tokens[user]) { tokens[user] = randomUUID(); saveTokens(taskId, tokens); }
      return json(res, 200, { token: tokens[user] });
    }

    // GET /api/tasks/:id/labels?user=xxx
    const labelsGetMatch = p.match(/^\/api\/tasks\/([^/]+)\/labels$/);
    if (labelsGetMatch && req.method === 'GET') {
      const taskId = labelsGetMatch[1];
      const user = url.searchParams.get('user');
      if (!user) return json(res, 400, { error: 'Missing user' });
      return json(res, 200, loadLabels(taskId, user));
    }

    // POST /api/tasks/:id/labels
    if (labelsGetMatch && req.method === 'POST') {
      const taskId = labelsGetMatch[1];
      const { user, token, itemId, pick, rating, note } = await parseBody(req);
      if (!user) return json(res, 400, { error: 'Missing user' });
      // Internal network: auto-register if not exists, no strict token check
      const tokens = loadTokens(taskId);
      if (!tokens[user]) { tokens[user] = randomUUID(); saveTokens(taskId, tokens); }
      
      const labels = loadLabels(taskId, user);
      const key = String(itemId);
      if (pick === 'remove' && !rating) {
        delete labels[key];
      } else {
        labels[key] = {
          pick: pick || labels[key]?.pick,
          rating: rating || labels[key]?.rating,
          note: note !== undefined ? note : (labels[key]?.note || ''),
          time: new Date().toISOString()
        };
      }
      saveLabels(taskId, user, labels);
      bumpVersion(taskId);
      return json(res, 200, { ok: true });
    }

    // GET /api/tasks/:id/summary
    const summaryMatch = p.match(/^\/api\/tasks\/([^/]+)\/summary$/);
    if (summaryMatch && req.method === 'GET') {
      const taskId = summaryMatch[1];
      return json(res, 200, { summary: getAllSummary(taskId), version: getVersion(taskId) });
    }

    // GET /api/tasks/:id/users
    const usersMatch = p.match(/^\/api\/tasks\/([^/]+)\/users$/);
    if (usersMatch && req.method === 'GET') {
      const taskId = usersMatch[1];
      return json(res, 200, getAllUsers(taskId));
    }

    // GET /api/tasks/:id/export
    const exportMatch = p.match(/^\/api\/tasks\/([^/]+)\/export$/);
    if (exportMatch && req.method === 'GET') {
      const taskId = exportMatch[1];
      const summary = getAllSummary(taskId);
      const result = Object.entries(summary).map(([itemId, s]) => {
        const totalVoters = new Set();
        Object.values(s.picks).forEach(users => users.forEach(u => totalVoters.add(u)));
        let winner = null, maxVotes = 0;
        for (const [opt, users] of Object.entries(s.picks)) {
          if (users.length > maxVotes) { maxVotes = users.length; winner = opt; }
        }
        return { itemId, picks: s.picks, ratings: s.ratings, notes: s.notes, voters: totalVoters.size, winner, winnerVotes: maxVotes };
      });
      return json(res, 200, { total: result.length, items: result });
    }

    // ===== Production Tasks (TaskHub) =====
    
    // GET /api/production — list all production tasks
    if (p === '/api/production' && req.method === 'GET') {
      const tasks = [];
      if (fs.existsSync(PROD_DIR)) {
        for (const f of fs.readdirSync(PROD_DIR).filter(f => f.endsWith('.json')).sort().reverse()) {
          try {
            const t = JSON.parse(fs.readFileSync(path.join(PROD_DIR, f), 'utf-8'));
            // Read progress file if exists
            if (t.progressFile && fs.existsSync(t.progressFile)) {
              try {
                const prog = JSON.parse(fs.readFileSync(t.progressFile, 'utf-8'));
                t.progress = prog.progress || t.progress;
                t.status = prog.status || t.status;
                t.eta = prog.eta || t.eta;
              } catch {}
            }
            // Read result file to get actual count
            if (t.resultFile && fs.existsSync(t.resultFile)) {
              try {
                const results = JSON.parse(fs.readFileSync(t.resultFile, 'utf-8'));
                const done = Array.isArray(results) ? results.filter(r => r.voices && r.voices.length >= 3).length : 0;
                t.progress = { ...t.progress, done, total: t.progress?.total || done };
              } catch {}
            }
            tasks.push(t);
          } catch {}
        }
      }
      return json(res, 200, { tasks });
    }

    // POST /api/production — create production task
    if (p === '/api/production' && req.method === 'POST') {
      const body = await parseBody(req);
      const taskId = body.taskId || `prod-${Date.now()}`;
      body.taskId = taskId;
      body.created = body.created || new Date().toISOString();
      body.status = body.status || 'pending';
      body.progress = body.progress || { done: 0, total: 0, failed: 0 };
      fs.writeFileSync(path.join(PROD_DIR, taskId + '.json'), JSON.stringify(body, null, 2));
      return json(res, 200, { taskId, ok: true });
    }

    // GET /api/production/:id — get task detail
    const prodMatch = p.match(/^\/api\/production\/([^/]+)$/);
    if (prodMatch && req.method === 'GET') {
      const taskId = prodMatch[1];
      const f = path.join(PROD_DIR, taskId + '.json');
      if (!fs.existsSync(f)) return json(res, 404, { error: 'Task not found' });
      const t = JSON.parse(fs.readFileSync(f, 'utf-8'));
      // Refresh progress
      if (t.resultFile && fs.existsSync(t.resultFile)) {
        try {
          const results = JSON.parse(fs.readFileSync(t.resultFile, 'utf-8'));
          const done = Array.isArray(results) ? results.filter(r => r.voices && r.voices.length >= 3).length : 0;
          t.progress = { ...t.progress, done };
          if (done >= (t.progress.total || 0) && t.progress.total > 0) t.status = 'completed';
        } catch {}
      }
      // Read logs
      if (t.logFile && fs.existsSync(t.logFile)) {
        try { t.logs = fs.readFileSync(t.logFile, 'utf-8').split('\n').filter(l => l.trim()).slice(-100); } catch {}
      }
      return json(res, 200, t);
    }

    // PUT /api/production/:id — update task status / resume
    if (prodMatch && req.method === 'PUT') {
      const taskId = prodMatch[1];
      const f = path.join(PROD_DIR, taskId + '.json');
      if (!fs.existsSync(f)) return json(res, 404, { error: 'Task not found' });
      const existing = JSON.parse(fs.readFileSync(f, 'utf-8'));
      const updates = await parseBody(req);
      
      // Handle resume specifically
      if (updates.action === 'resume') {
        existing.status = 'running';
        existing.resumeTime = new Date().toISOString();
        existing.progress = { ...existing.progress, failed: 0 };
        // Clear old logs if requested
        if (updates.clearLogs && existing.logFile && fs.existsSync(existing.logFile)) {
          fs.writeFileSync(existing.logFile, '');
        }
      } else {
        Object.assign(existing, updates);
      }
      fs.writeFileSync(f, JSON.stringify(existing, null, 2));
      return json(res, 200, { ok: true });
    }

    // DELETE /api/production/:id
    if (prodMatch && req.method === 'DELETE') {
      const taskId = prodMatch[1];
      const f = path.join(PROD_DIR, taskId + '.json');
      if (fs.existsSync(f)) fs.unlinkSync(f);
      return json(res, 200, { ok: true });
    }

    // GET /api/production/:id/logs — tail logs
    const logsMatch = p.match(/^\/api\/production\/([^/]+)\/logs$/);
    if (logsMatch && req.method === 'GET') {
      const taskId = logsMatch[1];
      const f = path.join(PROD_DIR, taskId + '.json');
      if (!fs.existsSync(f)) return json(res, 404, { error: 'Task not found' });
      const t = JSON.parse(fs.readFileSync(f, 'utf-8'));
      let logs = [];
      if (t.logFile && fs.existsSync(t.logFile)) {
        try {
          logs = fs.readFileSync(t.logFile, 'utf-8').split('\n').filter(l => l.trim());
          // Return last 50 lines
          logs = logs.slice(-50);
        } catch {}
      }
      return json(res, 200, { logs });
    }

    json(res, 404, { error: 'Not found' });
  } catch (e) {
    console.error(e);
    json(res, 500, { error: e.message });
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`ReviewHub API on :${PORT}`));
