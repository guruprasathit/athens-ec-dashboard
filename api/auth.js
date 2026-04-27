// api/auth.js — Athens EC Tasks Dashboard
import { get, set } from './_storage.js';

const COMMUNITY_ROLES = ['EC Member', 'Sub-committee Member'];

const FALLBACK_USERS = {
  admin: { password: process.env.ADMIN_PASSWORD || 'athens2026', role: 'admin', name: 'Admin' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, username, name, password, newPassword, communityRole } = req.body || {};
  const identifier = (username || '').toLowerCase().trim();

  if (action === 'update-role') {
    const { targetUsername, newCommunityRole } = req.body || {};
    const target = (targetUsername || '').toLowerCase().trim();
    if (!target) return res.status(400).json({ error: 'Target username is required.' });
    if (!COMMUNITY_ROLES.includes(newCommunityRole)) return res.status(400).json({ error: 'Invalid role.' });
    try {
      const userData = await get(`user:${target}`);
      if (!userData) return res.status(404).json({ error: 'User not found.' });
      await set(`user:${target}`, { ...userData, communityRole: newCommunityRole });
      const members = (await get('members')) || [];
      const idx = members.findIndex(m => m.username === target);
      if (idx !== -1) { members[idx].communityRole = newCommunityRole; await set('members', members); }
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Failed to update role. Please try again.' });
    }
  }

  if (!identifier) return res.status(400).json({ error: 'Email is required.' });

  if (action === 'reset-password') {
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    try {
      const userData = await get(`user:${identifier}`);
      if (!userData) return res.status(404).json({ error: 'Email not found.' });
      await set(`user:${identifier}`, { ...userData, password: newPassword });
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Password reset failed. Please try again.' });
    }
  }

  if (!password) return res.status(400).json({ error: 'Password is required.' });

  if (action === 'register') {
    if (!name?.trim()) return res.status(400).json({ error: 'Full name is required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    if (!communityRole || !COMMUNITY_ROLES.includes(communityRole)) return res.status(400).json({ error: 'Please select a valid role.' });
    try {
      const existing = await get(`user:${identifier}`);
      if (existing) return res.status(409).json({ error: 'This email is already registered.' });
      const userCount = (await get('userCount')) || 0;
      const systemRole = userCount === 0 ? 'admin' : 'member';
      const userData = { username: identifier, name: name.trim(), password, role: systemRole, communityRole, createdAt: new Date().toISOString() };
      await set(`user:${identifier}`, userData);
      await set('userCount', userCount + 1);
      // Maintain members list for assignee dropdown
      const members = (await get('members')) || [];
      members.push({ username: identifier, name: name.trim(), communityRole, role: systemRole });
      await set('members', members);
      return res.status(200).json({ success: true, user: { username: identifier, name: name.trim(), role: systemRole, communityRole } });
    } catch (err) {
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }

  // Login — check fallback first
  const fallback = FALLBACK_USERS[identifier];
  if (fallback && fallback.password === password) {
    return res.status(200).json({ success: true, user: { username: identifier, name: fallback.name, role: fallback.role, communityRole: null } });
  }

  try {
    const userData = await get(`user:${identifier}`);
    if (!userData || userData.password !== password) return res.status(401).json({ error: 'Invalid email or password.' });
    // Track lastSeen in members list
    try {
      const members = (await get('members')) || [];
      const idx = members.findIndex(m => m.username === identifier);
      if (idx !== -1) { members[idx].lastSeen = new Date().toISOString(); await set('members', members); }
    } catch {}
    return res.status(200).json({ success: true, user: { username: identifier, name: userData.name, role: userData.role, communityRole: userData.communityRole } });
  } catch {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
}
