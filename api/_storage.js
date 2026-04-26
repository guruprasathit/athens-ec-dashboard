// api/_storage.js — Athens EC Tasks Dashboard
// Uses Upstash Redis when KV_REST_API_URL + KV_REST_API_TOKEN are set (Vercel KV / Upstash).
// Falls back to local file storage for development.
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

// ── File storage (local dev) ───────────────────────────────────────────────────
const DATA_DIR = process.env.VERCEL ? '/tmp/athens-ec-data' : join(process.cwd(), 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function fileGet(key) {
  const file = join(DATA_DIR, `${key}.json`);
  if (!existsSync(file)) return null;
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}
function fileSet(key, value) {
  writeFileSync(join(DATA_DIR, `${key}.json`), JSON.stringify(value, null, 2));
}
function fileDel(key) {
  const file = join(DATA_DIR, `${key}.json`);
  if (existsSync(file)) { try { unlinkSync(file); } catch {} }
}

// ── Upstash Redis (production) ────────────────────────────────────────────────
const kvConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

function getRedisClient() {
  const { Redis } = require('@upstash/redis');
  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

// ── Unified API ───────────────────────────────────────────────────────────────
export async function get(key) {
  if (kvConfigured) {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
      return await redis.get(key);
    } catch (err) {
      console.error(`[Storage] Redis get("${key}") failed, using file. ${err.message}`);
      return fileGet(key);
    }
  }
  return fileGet(key);
}

export async function set(key, value) {
  if (kvConfigured) {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
      await redis.set(key, value);
      return;
    } catch (err) {
      console.error(`[Storage] Redis set("${key}") failed, using file. ${err.message}`);
      fileSet(key, value);
      return;
    }
  }
  fileSet(key, value);
}

export async function del(key) {
  if (kvConfigured) {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
      await redis.del(key);
      return;
    } catch (err) {
      console.error(`[Storage] Redis del("${key}") failed, using file. ${err.message}`);
      fileDel(key);
      return;
    }
  }
  fileDel(key);
}

export const usingKv = kvConfigured;
