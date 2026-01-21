import jwt from 'jsonwebtoken';
import { getSupabaseClient } from './_supabase.js';

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'administradoricpa@cr').trim().toLowerCase();
  const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'administradorEfesios220').trim();
  const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

  let body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    try {
      body = await parseJsonBody(req);
    } catch (e) {
      return res.status(400).json({ error: 'invalid json' });
    }
  }

  const email = (body?.email || '').trim().toLowerCase();
  const password = (body?.password || '').trim();
  if (!email || !password || email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  // simple connectivity check to supabase so login fails if backend is misconfigured
  try {
    const supabase = getSupabaseClient();
    await supabase.from('checkins').select('id', { count: 'exact', head: true }).limit(1);
  } catch (e) {
    return res.status(500).json({ error: 'backend not configured' });
  }

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '12h' });
  return res.status(200).json({ token });
}
