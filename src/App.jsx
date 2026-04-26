import React, { useState, useEffect } from 'react';
import { Plus, Download, Calendar, Clock, CheckCircle2, Circle, Trash2, Edit2, Database, RefreshCw, Activity, User, Mail, X, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_URL = '/api';

const PRIORITY = {
  low:      { color: '#10b981', bg: '#d1fae5' },
  medium:   { color: '#f59e0b', bg: '#fef3c7' },
  high:     { color: '#ef4444', bg: '#fee2e2' },
  critical: { color: '#dc2626', bg: '#fee2e2' },
};

const COLS = [
  { id: 'backlog',     label: 'Backlog',      Icon: Circle },
  { id: 'in-progress', label: 'In Progress',  Icon: Clock },
  { id: 'done',        label: 'Done',         Icon: CheckCircle2 },
];

const BLANK_FORM = {
  title: '', description: '', priority: 'medium', dueDate: '',
  status: 'backlog', assigneeName: '', assigneeEmail: '', reporterName: '',
};

// ── Email helpers ──────────────────────────────────────────────────────────────

async function sendAssignEmail(taskId) {
  try {
    await fetch(`${API_URL}/notify?action=assign&taskId=${taskId}`);
  } catch (e) {
    console.error('Assignment email failed:', e);
  }
}

// ── Login screen ───────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!username.trim()) return setError('Please enter your username.');
    if (!password.trim()) return setError('Please enter your password.');
    if (isRegistering) {
      if (!fullName.trim()) return setError('Please enter your full name.');
      if (password.length < 6) return setError('Password must be at least 6 characters.');
      if (password !== confirm) return setError('Passwords do not match.');
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isRegistering ? 'register' : 'login', username: username.toLowerCase().trim(), name: fullName.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Something went wrong.');
      onLogin(data.user);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .lr{min-height:100vh;background:linear-gradient(135deg,#1e3a5f 0%,#0f2342 100%);display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;}
        .lc{width:100%;max-width:400px;margin:20px;background:white;border-radius:16px;padding:40px;box-shadow:0 20px 60px rgba(0,0,0,0.3);}
        .lh{text-align:center;margin-bottom:32px;}
        .li{width:56px;height:56px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;}
        .lt{font-size:22px;font-weight:700;color:#111827;}
        .ls{font-size:13px;color:#6b7280;margin-top:4px;}
        .lf{margin-bottom:16px;}
        .lf label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;}
        .lf input{width:100%;padding:10px 14px;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;outline:none;transition:border-color .2s;}
        .lf input:focus{border-color:#3b82f6;}
        .pw{position:relative;}.pw input{padding-right:40px;}
        .pt{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;color:#9ca3af;}
        .eb{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:13px;color:#dc2626;}
        .sb{width:100%;padding:12px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px;}
        .sb:disabled{opacity:.6;cursor:not-allowed;}
        .sl{text-align:center;margin-top:16px;font-size:13px;color:#6b7280;}
        .sl button{background:none;border:none;color:#3b82f6;font-weight:600;cursor:pointer;font-size:13px;}
      `}</style>
      <div className="lr">
        <div className="lc">
          <div className="lh">
            <div className="li">📋</div>
            <div className="lt">Athens EC Tasks</div>
            <div className="ls">Tasks Dashboard</div>
          </div>
          {error && <div className="eb">{error}</div>}
          {isRegistering && (
            <div className="lf">
              <label>Full Name</label>
              <input type="text" placeholder="Your full name" value={fullName} onChange={e => { setFullName(e.target.value); setError(''); }} onKeyPress={e => e.key === 'Enter' && submit()} autoFocus />
            </div>
          )}
          <div className="lf">
            <label>Username</label>
            <input type="text" placeholder="Enter username" value={username} onChange={e => { setUsername(e.target.value); setError(''); }} onKeyPress={e => e.key === 'Enter' && submit()} autoFocus={!isRegistering} />
          </div>
          <div className="lf">
            <label>Password</label>
            <div className="pw">
              <input type={showPass ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} onKeyPress={e => e.key === 'Enter' && submit()} />
              <button type="button" className="pt" onClick={() => setShowPass(v => !v)}>{showPass ? '🙈' : '👁'}</button>
            </div>
          </div>
          {isRegistering && (
            <div className="lf">
              <label>Confirm Password</label>
              <input type={showPass ? 'text' : 'password'} placeholder="Confirm password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }} onKeyPress={e => e.key === 'Enter' && submit()} />
            </div>
          )}
          <button className="sb" onClick={submit} disabled={loading}>{loading ? 'Please wait…' : isRegistering ? 'Create Account' : 'Sign In'}</button>
          <div className="sl">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => { setIsRegistering(v => !v); setError(''); setPassword(''); setConfirm(''); }}>{isRegistering ? 'Sign In' : 'Register'}</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Due-date badge ─────────────────────────────────────────────────────────────

function DueBadge({ dueDate, status }) {
  if (!dueDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.ceil((due - today) / 86400000);
  const overdue = diff < 0 && status !== 'done';
  const dueToday = diff === 0 && status !== 'done';
  let label = '';
  let bg = '#dbeafe'; let color = '#3b82f6'; let border = '#3b82f6';
  if (overdue) { label = `⚠️ ${Math.abs(diff)}d overdue`; bg = '#fee2e2'; color = '#ef4444'; border = '#ef4444'; }
  else if (dueToday) { label = '⏰ Due today!'; bg = '#fef3c7'; color = '#f59e0b'; border = '#f59e0b'; }
  else if (diff === 1) { label = '📅 Due tomorrow'; }
  else if (diff > 1) { label = `📅 ${diff}d remaining`; }
  if (!label) return null;
  return <div style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 8px', borderRadius: 6, marginBottom: 8, background: bg, color, border: `2px solid ${border}` }}>{label}</div>;
}

// ── Task Card ──────────────────────────────────────────────────────────────────

function TaskCard({ task, user, onEdit, onDelete, onMove }) {
  const p = PRIORITY[task.priority] || PRIORITY.medium;
  return (
    <div style={{ background: 'white', borderRadius: 10, padding: '1rem', border: '1px solid #e5e7eb', borderLeft: `4px solid ${p.color}`, marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', flex: 1 }}>{task.title}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onEdit(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}><Edit2 size={15} /></button>
          {user.role === 'admin' && <button onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}><Trash2 size={15} /></button>}
        </div>
      </div>

      {task.description && <div style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 8 }}>{task.description}</div>}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: p.bg, color: p.color }}>{(task.priority || '').toUpperCase()}</span>
      </div>

      {task.dueDate && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} />Due: {task.dueDate}</div>}

      <DueBadge dueDate={task.dueDate} status={task.status} />

      {task.startDate && (
        <div style={{ fontSize: '0.75rem', color: '#059669', padding: '4px 8px', background: '#f0fdf4', borderRadius: 6, marginBottom: 6, border: '1px solid #bbf7d0' }}>
          <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />Started: {task.startDate}{task.startTime ? ` at ${task.startTime}` : ''}
        </div>
      )}

      {task.completionDate && (
        <div style={{ fontSize: '0.75rem', color: '#059669', padding: '4px 8px', background: '#f0fdf4', borderRadius: 6, marginBottom: 6, border: '1px solid #bbf7d0' }}>
          <CheckCircle2 size={10} style={{ display: 'inline', marginRight: 4 }} />Completed: {task.completionDate}{task.completionTime ? ` at ${task.completionTime}` : ''}
        </div>
      )}

      {task.reporterName && (
        <div style={{ fontSize: '0.75rem', color: '#6b7280', padding: '4px 8px', background: '#f9fafb', borderRadius: 6, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <User size={10} />Reporter: <strong>{task.reporterName}</strong>
        </div>
      )}

      {task.assigneeName && (
        <div style={{ fontSize: '0.75rem', color: '#1d4ed8', padding: '4px 8px', background: '#eff6ff', borderRadius: 6, marginBottom: 8, border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <User size={10} />Assignee: <strong>{task.assigneeName}</strong>
          {task.assigneeEmail && <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>({task.assigneeEmail})</span>}
        </div>
      )}

      {task.status !== 'done' && (
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {task.status === 'backlog' && (
            <button onClick={() => onMove(task.id, 'in-progress')} style={{ flex: 1, padding: '6px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Start</button>
          )}
          {task.status === 'in-progress' && (
            <>
              <button onClick={() => onMove(task.id, 'backlog')} style={{ flex: 1, padding: '6px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Back</button>
              <button onClick={() => onMove(task.id, 'done')} style={{ flex: 1, padding: '6px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Done</button>
            </>
          )}
        </div>
      )}
      {task.status === 'done' && (
        <button onClick={() => onMove(task.id, 'in-progress')} style={{ width: '100%', padding: '6px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', marginTop: 4 }}>Reopen</button>
      )}
    </div>
  );
}

// ── Task Modal ─────────────────────────────────────────────────────────────────

function TaskModal({ form, setForm, onSave, onClose, isEdit }) {
  const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12, outline: 'none' };
  const lbl = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, padding: '2rem', margin: 'auto', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>{isEdit ? 'Edit Task' : 'New Task'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <label style={lbl}>Title *</label>
        <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" />

        <label style={lbl}>Description</label>
        <textarea style={{ ...inp, resize: 'vertical' }} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>Priority</label>
            <select style={{ ...inp, marginBottom: 0 }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select style={{ ...inp, marginBottom: 0 }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="backlog">Backlog</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={lbl}>Due Date *</label>
          <input style={inp} type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
        </div>

        <div style={{ borderTop: '2px solid #f3f4f6', paddingTop: 16, marginTop: 4 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={13} /> People
          </div>

          <label style={lbl}>Reporter Name</label>
          <input style={inp} value={form.reporterName} onChange={e => setForm(f => ({ ...f, reporterName: e.target.value }))} placeholder="Reported by" />

          <label style={lbl}>Assignee Name</label>
          <input style={inp} value={form.assigneeName} onChange={e => setForm(f => ({ ...f, assigneeName: e.target.value }))} placeholder="Assigned to (name)" />

          <label style={lbl}>Assignee Email</label>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input style={{ ...inp, paddingLeft: 32, marginBottom: 0 }} type="email" value={form.assigneeEmail} onChange={e => setForm(f => ({ ...f, assigneeEmail: e.target.value }))} placeholder="assignee@email.com" />
          </div>
          {form.assigneeEmail && (
            <div style={{ fontSize: '12px', color: '#3b82f6', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '6px 10px', marginBottom: 12 }}>
              An email notification will be sent to {form.assigneeEmail} when saved.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onSave} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            {isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Log Modal ──────────────────────────────────────────────────────────────────

function LogModal({ logs, onClose }) {
  const colors = { CREATED: '#10b981', UPDATED: '#3b82f6', DELETED: '#ef4444', COMPLETED: '#059669', MOVED: '#f59e0b', LOGIN: '#7c3aed', LOGOUT: '#6b7280', EXPORTED: '#0284c7', SYSTEM: '#6b7280', REGISTERED: '#8b5cf6', ASSIGNED: '#3b82f6' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '80vh', overflow: 'auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 700 }}><Activity size={20} />Activity Log</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {logs.length === 0 && <div style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No activity yet.</div>}
          {logs.map(l => (
            <div key={l.id} style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: 8, borderLeft: `4px solid ${colors[l.action] || '#6b7280'}` }}>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: 2 }}>{new Date(l.timestamp).toLocaleString()}</div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{l.userName} — {l.action}</div>
              {l.taskTitle && <div style={{ fontSize: '0.83rem', color: '#6b7280' }}>Task: {l.taskTitle}</div>}
              {l.details && <div style={{ fontSize: '0.83rem', color: '#6b7280', fontStyle: 'italic' }}>{l.details}</div>}
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: '10px', marginTop: 16, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('loading');
  const [modal, setModal] = useState(false);
  const [logModal, setLogModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);

  // ── Data loading ─────────────────────────────────────────────────────────────

  const loadData = async (isInitial = false) => {
    try {
      setStatus('loading');
      const [tasksRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/tasks`),
        fetch(`${API_URL}/logs`),
      ]);
      const tasksData = await tasksRes.json();
      const logsData = await logsRes.json();
      if (Array.isArray(tasksData) && (tasksData.length > 0 || !isInitial)) setTasks(tasksData);
      else if (isInitial) setTasks(sampleTasks());
      if (Array.isArray(logsData) && logsData.length > 0) setLogs(logsData);
      setStatus('ready');
    } catch {
      if (isInitial) setTasks(sampleTasks());
      setStatus('error');
    }
  };

  useEffect(() => {
    if (user) {
      loadData(true);
      const iv = setInterval(() => loadData(false), 30000);
      return () => clearInterval(iv);
    }
  }, [user]);

  const sampleTasks = () => {
    const d = o => { const x = new Date(); x.setDate(x.getDate() + o); return x.toISOString().split('T')[0]; };
    return [
      { id: 1, title: 'Quarterly EC Review', description: 'Review Q2 financials', priority: 'high', dueDate: d(5), status: 'backlog', reporterName: 'Admin', assigneeName: '', assigneeEmail: '', createdAt: new Date().toISOString(), createdBy: 'system' },
      { id: 2, title: 'Update Member Notices', description: 'Send AGM notices to all members', priority: 'critical', dueDate: d(2), status: 'in-progress', reporterName: 'Admin', assigneeName: 'Guruprasath', assigneeEmail: '', startDate: d(0), startTime: new Date().toLocaleTimeString(), createdAt: new Date().toISOString(), createdBy: 'system' },
      { id: 3, title: 'Prepare Budget Report', description: 'Annual budget presentation', priority: 'medium', dueDate: d(14), status: 'backlog', reporterName: 'Admin', assigneeName: '', assigneeEmail: '', createdAt: new Date().toISOString(), createdBy: 'system' },
      { id: 4, title: 'Vendor Invoice Check', description: 'Verify outstanding invoices', priority: 'low', dueDate: d(-2), status: 'done', reporterName: 'Admin', assigneeName: '', assigneeEmail: '', completionDate: d(-1), completionTime: '14:30:00', createdAt: new Date().toISOString(), createdBy: 'system' },
    ];
  };

  // ── API helpers ──────────────────────────────────────────────────────────────

  const saveTasks = async (t) => {
    setStatus('syncing');
    try {
      await fetch(`${API_URL}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tasks: t }) });
      setStatus('ready');
    } catch { setStatus('error'); }
  };

  const saveLogs = async (l) => {
    try { await fetch(`${API_URL}/logs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logs: l }) }); } catch {}
  };

  const addLog = (action, taskTitle, details = '') => {
    const entry = { id: Date.now(), timestamp: new Date().toISOString(), user: user.username, userName: user.name, action, taskTitle, details };
    const updated = [entry, ...logs];
    setLogs(updated);
    return updated;
  };

  // ── Auth ─────────────────────────────────────────────────────────────────────

  const handleLogin = async (loggedInUser) => {
    setUser(loggedInUser);
    try {
      const logsRes = await fetch(`${API_URL}/logs`);
      const existingLogs = await logsRes.json() || [];
      const loginLog = { id: Date.now(), timestamp: new Date().toISOString(), user: loggedInUser.username, userName: loggedInUser.name, action: 'LOGIN', taskTitle: '', details: 'User logged in' };
      const updated = [loginLog, ...existingLogs];
      setLogs(updated);
      await saveLogs(updated);
    } catch {}
  };

  const logout = () => {
    const l = addLog('LOGOUT', '', 'User logged out');
    saveLogs(l);
    setTimeout(() => { setUser(null); setTasks([]); setLogs([]); }, 300);
  };

  // ── Task CRUD ─────────────────────────────────────────────────────────────────

  const openNew = (defaultStatus = 'backlog') => {
    setEdit(null);
    setForm({ ...BLANK_FORM, status: defaultStatus, reporterName: user.name });
    setModal(true);
  };

  const openEdit = (task) => {
    setEdit(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      dueDate: task.dueDate || '',
      status: task.status || 'backlog',
      assigneeName: task.assigneeName || '',
      assigneeEmail: task.assigneeEmail || '',
      reporterName: task.reporterName || '',
    });
    setModal(true);
  };

  const saveTask = async () => {
    if (!form.title.trim()) return alert('Title is required.');
    if (!form.dueDate) return alert('Due date is required.');

    const now = new Date();
    let updatedTasks, updatedLogs, taskId;
    const prevAssigneeEmail = edit?.assigneeEmail || '';

    if (edit) {
      taskId = edit.id;
      updatedTasks = tasks.map(t => {
        if (t.id !== taskId) return t;
        const n = { ...t, ...form, id: taskId, lastModifiedBy: user.username, lastModifiedAt: now.toISOString() };
        if (form.status === 'in-progress' && !t.startDate) { n.startDate = now.toISOString().split('T')[0]; n.startTime = now.toLocaleTimeString(); }
        if (form.status === 'done' && !t.completionDate) { n.completionDate = now.toISOString().split('T')[0]; n.completionTime = now.toLocaleTimeString(); }
        return n;
      });
      updatedLogs = addLog('UPDATED', form.title, form.assigneeName ? `Assigned to ${form.assigneeName}` : '');
    } else {
      taskId = Date.now();
      const newTask = { ...form, id: taskId, createdAt: now.toISOString(), createdBy: user.username, createdByName: user.name };
      if (form.status === 'in-progress') { newTask.startDate = now.toISOString().split('T')[0]; newTask.startTime = now.toLocaleTimeString(); }
      if (form.status === 'done') { newTask.completionDate = now.toISOString().split('T')[0]; newTask.completionTime = now.toLocaleTimeString(); }
      updatedTasks = [...tasks, newTask];
      updatedLogs = addLog('CREATED', form.title, form.assigneeName ? `Assigned to ${form.assigneeName}` : `Priority: ${form.priority}`);
    }

    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    await saveLogs(updatedLogs);

    // Send assignment email if assignee email is new or changed
    if (form.assigneeEmail && form.assigneeEmail !== prevAssigneeEmail) {
      sendAssignEmail(taskId);
    }

    setModal(false);
  };

  const deleteTask = async (id) => {
    if (user.role !== 'admin') return alert('Only admins can delete tasks.');
    const task = tasks.find(t => t.id === id);
    if (!task || !confirm(`Delete "${task.title}"?`)) return;
    const updated = tasks.filter(t => t.id !== id);
    const l = addLog('DELETED', task.title, '');
    setTasks(updated);
    await saveTasks(updated);
    await saveLogs(l);
  };

  const moveTask = async (id, newStatus) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const now = new Date();
    const updated = tasks.map(t => {
      if (t.id !== id) return t;
      const n = { ...t, status: newStatus };
      if (newStatus === 'in-progress' && !t.startDate) { n.startDate = now.toISOString().split('T')[0]; n.startTime = now.toLocaleTimeString(); }
      if (newStatus === 'done') { n.completionDate = now.toISOString().split('T')[0]; n.completionTime = now.toLocaleTimeString(); }
      return n;
    });
    const l = addLog(newStatus === 'done' ? 'COMPLETED' : 'MOVED', task.title, `→ ${newStatus}`);
    setTasks(updated);
    await saveTasks(updated);
    await saveLogs(l);
  };

  const clearAll = async () => {
    if (user.role !== 'admin') return alert('Only admins can clear all tasks.');
    if (!confirm('Delete ALL tasks?')) return;
    const l = addLog('SYSTEM', '', 'All tasks cleared');
    setTasks([]);
    await fetch(`${API_URL}/tasks`, { method: 'DELETE' });
    await saveLogs(l);
  };

  const exportXLSX = () => {
    const td = tasks.map(t => ({ Title: t.title, Description: t.description, Priority: t.priority, Status: t.status, 'Due Date': t.dueDate, Reporter: t.reporterName, Assignee: t.assigneeName, 'Assignee Email': t.assigneeEmail, 'Start Date': t.startDate, 'Completion Date': t.completionDate, 'Created By': t.createdByName }));
    const ld = logs.map(l => ({ Time: new Date(l.timestamp).toLocaleString(), User: l.userName, Action: l.action, Task: l.taskTitle, Details: l.details }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(td), 'Tasks');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ld), 'Logs');
    XLSX.writeFile(wb, `AthensEC_${new Date().toISOString().split('T')[0]}.xlsx`);
    const l = addLog('EXPORTED', '', 'Data exported to Excel');
    saveLogs(l);
  };

  // ── Stats ────────────────────────────────────────────────────────────────────

  const stats = {
    total: tasks.length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate + 'T00:00:00') < new Date().setHours(0, 0, 0, 0) && t.status !== 'done').length,
    done: tasks.filter(t => t.status === 'done').length,
    assigned: tasks.filter(t => t.assigneeEmail).length,
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const statusColors = { ready: { bg: '#d1fae5', color: '#10b981' }, syncing: { bg: '#fef3c7', color: '#f59e0b' }, loading: { bg: '#dbeafe', color: '#3b82f6' }, error: { bg: '#fee2e2', color: '#ef4444' } };
  const sc = statusColors[status] || statusColors.ready;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1e3a5f 0%,#0f2342 100%)', padding: '1.5rem', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem 2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: '1.25rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#111827' }}>Athens EC Tasks Dashboard</h1>
              <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Executive Committee Task Management</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ padding: '6px 12px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 50, fontWeight: 600, fontSize: '0.85rem', display: 'flex', gap: 6, alignItems: 'center' }}>
                <User size={14} />{user.name}
                {user.role === 'admin' && <span style={{ background: '#fbbf24', color: '#92400e', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>ADMIN</span>}
              </div>
              <div style={{ padding: '6px 12px', background: sc.bg, color: sc.color, borderRadius: 8, fontWeight: 600, fontSize: '0.82rem', display: 'flex', gap: 4, alignItems: 'center' }}>
                <Database size={13} />{status}
              </div>
              <button onClick={() => setLogModal(true)} style={{ padding: '6px 12px', background: 'white', color: '#3b82f6', border: '2px solid #3b82f6', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center', fontSize: '0.83rem' }}><Activity size={14} />Log</button>
              <button onClick={() => loadData(false)} style={{ padding: '6px 12px', background: 'white', color: '#3b82f6', border: '2px solid #3b82f6', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center', fontSize: '0.83rem' }}><RefreshCw size={14} />Refresh</button>
              <button onClick={exportXLSX} style={{ padding: '6px 12px', background: 'white', color: '#3b82f6', border: '2px solid #3b82f6', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center', fontSize: '0.83rem' }}><Download size={14} />Export</button>
              <button onClick={() => openNew()} style={{ padding: '6px 14px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center', fontSize: '0.83rem' }}><Plus size={14} />New Task</button>
              {user.role === 'admin' && <button onClick={clearAll} style={{ padding: '6px 12px', background: 'white', color: '#ef4444', border: '2px solid #ef4444', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center', fontSize: '0.83rem' }}><Trash2 size={14} />Clear</button>}
              <button onClick={logout} style={{ padding: '6px 12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.83rem' }}>Logout</button>
            </div>
          </div>

          {/* ── Stats ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 12, paddingTop: '1rem', borderTop: '2px solid #f3f4f6' }}>
            {[
              { label: 'Total', value: stats.total, color: '#3b82f6' },
              { label: 'Overdue', value: stats.overdue, color: '#ef4444', icon: stats.overdue > 0 ? <AlertTriangle size={14} /> : null },
              { label: 'Done', value: stats.done, color: '#10b981' },
              { label: 'Assigned', value: stats.assigned, color: '#7c3aed' },
            ].map(s => (
              <div key={s.label} style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{s.value}{s.icon}</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Kanban Board ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: '1.25rem' }}>
          {COLS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            const ColIcon = col.Icon;
            return (
              <div key={col.id} style={{ background: 'white', borderRadius: 16, padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.875rem', borderBottom: '2px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <ColIcon size={20} style={{ color: '#3b82f6' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{col.label}</span>
                  </div>
                  <span style={{ background: '#3b82f6', color: 'white', padding: '2px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.82rem' }}>{colTasks.length}</span>
                </div>

                <div style={{ minHeight: 120 }}>
                  {colTasks.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#d1d5db', padding: '2rem 0', fontSize: '0.85rem' }}>No tasks here</div>
                  )}
                  {colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      user={user}
                      onEdit={openEdit}
                      onDelete={deleteTask}
                      onMove={moveTask}
                    />
                  ))}
                </div>

                <button
                  onClick={() => openNew(col.id)}
                  style={{ width: '100%', padding: '8px', border: '2px dashed #d1d5db', background: 'transparent', borderRadius: 8, color: '#9ca3af', fontWeight: 600, cursor: 'pointer', fontSize: '0.83rem', marginTop: 4 }}
                >
                  + Add to {col.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <TaskModal
          form={form}
          setForm={setForm}
          onSave={saveTask}
          onClose={() => setModal(false)}
          isEdit={!!edit}
        />
      )}

      {logModal && <LogModal logs={logs} onClose={() => setLogModal(false)} />}
    </div>
  );
}
