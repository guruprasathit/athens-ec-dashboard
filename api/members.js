// api/members.js — Athens EC Tasks Dashboard
import { get } from './_storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const members = (await get('members')) || [];
    return res.status(200).json(members);
  } catch {
    return res.status(500).json({ error: 'Failed to load members.' });
  }
}
