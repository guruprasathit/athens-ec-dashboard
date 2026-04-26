// api/_storage.js — Athens EC Tasks Dashboard
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

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

const kvConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

async function withRetry(fn, retries = 3, delayMs = 300) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try { return await fn(); } catch (err) {
      const retriable = err.message?.includes('fetch failed') || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET';
      if (retriable && attempt < retries) { await new Promise(r => setTimeout(r, delayMs * attempt)); continue; }
      throw err;
    }
  }
}

export async function get(key) {
  if (kvConfigured) {
    try { const { kv } = await import('@vercel/kv'); return await withRetry(() => kv.get(key)); }
    catch (err) { console.error(`[Storage] KV get("${key}") failed, using file. ${err.message}`); return fileGet(key); }
  }
  return fileGet(key);
}

export async function set(key, value) {
  if (kvConfigured) {
    try { const { kv } = await import('@vercel/kv'); return await withRetry(() => kv.set(key, value)); }
    catch (err) { console.error(`[Storage] KV set("${key}") failed, using file. ${err.message}`); fileSet(key, value); return; }
  }
  fileSet(key, value);
}

export async function del(key) {
  if (kvConfigured) {
    try { const { kv } = await import('@vercel/kv'); return await withRetry(() => kv.del(key)); }
    catch (err) { console.error(`[Storage] KV del("${key}") failed, using file. ${err.message}`); fileDel(key); return; }
  }
  fileDel(key);
}

export const usingKv = kvConfigured;
