// api/counter.js — Athens EC Tasks Dashboard
// POST /api/counter → increments task counter and returns next CAAOA-XXXX id
import { get, set } from './_storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const count = (await get('taskCounter')) || 0;
      return res.status(200).json({ count, next: `CAAOA-${String(count + 1).padStart(4, '0')}` });
    }
    if (req.method === 'POST') {
      const count = ((await get('taskCounter')) || 0) + 1;
      await set('taskCounter', count);
      return res.status(200).json({ taskId: `CAAOA-${String(count).padStart(4, '0')}`, count });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
