// api/auth.js — Athens EC Tasks Dashboard
import { get, set } from './_storage.js';

const FALLBACK_USERS = {
  admin: { password: process.env.ADMIN_PASSWORD || 'athens2024', role: 'admin', name: 'Admin' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, username, name, password } = req.body || {};
  const identifier = (username || '').toLowerCase().trim();

  if (!identifier || !password) return res.status(400).json({ error: 'Username and password are required.' });

  if (action === 'register') {
    if (!name?.trim()) return res.status(400).json({ error: 'Full name is required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    try {
      const existing = await get(`user:${identifier}`);
      if (existing) return res.status(409).json({ error: 'Username already exists.' });
      const userCount = (await get('userCount')) || 0;
      const role = userCount === 0 ? 'admin' : 'member';
      await set(`user:${identifier}`, { username: identifier, name: name.trim(), password, role, createdAt: new Date().toISOString() });
      await set('userCount', userCount + 1);
      return res.status(200).json({ success: true, user: { username: identifier, name: name.trim(), role } });
    } catch (err) {
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }

  // Login — check fallback first
  const fallback = FALLBACK_USERS[identifier];
  if (fallback && fallback.password === password) {
    return res.status(200).json({ success: true, user: { username: identifier, name: fallback.name, role: fallback.role } });
  }

  try {
    const userData = await get(`user:${identifier}`);
    if (!userData || userData.password !== password) return res.status(401).json({ error: 'Invalid username or password.' });
    return res.status(200).json({ success: true, user: { username: identifier, name: userData.name, role: userData.role } });
  } catch {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
}
