// Local dev server — mirrors Vercel API routes
import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3001;
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const fileGet = (key) => {
  const f = path.join(DATA_DIR, `${key}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
};
const fileSet = (key, val) => fs.writeFileSync(path.join(DATA_DIR, `${key}.json`), JSON.stringify(val, null, 2));
const fileDel = (key) => { const f = path.join(DATA_DIR, `${key}.json`); if (fs.existsSync(f)) fs.unlinkSync(f); };

// Auth
app.post('/api/auth', (req, res) => {
  const { action, username, name, password } = req.body;
  const id = (username || '').toLowerCase().trim();
  if (action === 'register') {
    const users = fileGet('users') || {};
    if (users[id]) return res.status(409).json({ error: 'Username already exists.' });
    const count = Object.keys(users).length;
    users[id] = { username: id, name, password, role: count === 0 ? 'admin' : 'member', createdAt: new Date().toISOString() };
    fileSet('users', users);
    return res.json({ success: true, user: { username: id, name, role: users[id].role } });
  }
  if (action === 'login') {
    if (id === 'admin' && password === (process.env.ADMIN_PASSWORD || 'athens2026')) return res.json({ success: true, user: { username: id, name: 'Admin', role: 'admin' } });
    const users = fileGet('users') || {};
    const u = users[id];
    if (!u || u.password !== password) return res.status(401).json({ error: 'Invalid username or password.' });
    return res.json({ success: true, user: { username: id, name: u.name, role: u.role } });
  }
  res.status(400).json({ error: 'Invalid action' });
});

// Tasks
app.get('/api/tasks', (req, res) => res.json(fileGet('tasks') || []));
app.post('/api/tasks', (req, res) => { fileSet('tasks', req.body.tasks); res.json({ success: true }); });
app.delete('/api/tasks', (req, res) => { fileDel('tasks'); res.json({ success: true }); });

// Logs
app.get('/api/logs', (req, res) => res.json(fileGet('logs') || []));
app.post('/api/logs', (req, res) => { fileSet('logs', req.body.logs); res.json({ success: true }); });

// Counter
app.get('/api/counter', (req, res) => {
  const count = fileGet('taskCounter') || 0;
  res.json({ count, next: `CAAOA-${String(count + 1).padStart(4, '0')}` });
});
app.post('/api/counter', (req, res) => {
  const count = (fileGet('taskCounter') || 0) + 1;
  fileSet('taskCounter', count);
  res.json({ taskId: `CAAOA-${String(count).padStart(4, '0')}`, count });
});

// Notify (local stub)
app.get('/api/notify', (req, res) => {
  const { action, taskId } = req.query;
  if (action === 'assign') {
    const tasks = fileGet('tasks') || [];
    const task = tasks.find(t => String(t.id) === String(taskId));
    console.log(`[Notify] Assignment email stub — task: "${task?.title || taskId}" → ${task?.assigneeEmail || 'no email'}`);
    return res.json({ success: true, _devNote: 'Dev mode — email not sent. Set RESEND_API_KEY in production.' });
  }
  res.json({ message: 'Notify endpoint active in production with RESEND_API_KEY set.' });
});

app.listen(PORT, () => console.log(`Dev server running on http://localhost:${PORT}`));
