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

function requireAuth(req, res, JWT_SECRET) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (e) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
}

export default async function handler(req, res) {
  const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
  const supabase = getSupabaseClient();

  if (req.method === 'GET') {
    if (!requireAuth(req, res, JWT_SECRET)) return;
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) return res.status(500).json({ error: 'failed to read data' });
    return res.status(200).json(data || []);
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      try {
        body = await parseJsonBody(req);
      } catch (e) {
        return res.status(400).json({ error: 'invalid json' });
      }
    }

    const { name, contact, isNew = false, guests = 0, eventId = 'asistencia', timestamp } = body || {};
    if (!name || !contact) {
      return res.status(400).json({ error: 'name and contact required' });
    }
    const record = {
      name: String(name).trim(),
      contact: String(contact).trim(),
      isNew: Boolean(isNew),
      guests: Number(guests) || 0,
      eventId: eventId || 'asistencia',
      timestamp: timestamp || new Date().toISOString(),
    };
    const { data, error } = await supabase.from('checkins').insert(record).select().single();
    if (error) {
      console.error('Supabase insert error', error);
      return res.status(500).json({ error: 'failed to save' });
    }
    return res.status(201).json(data);
  }

  if (req.method === 'PATCH') {
    if (!requireAuth(req, res, JWT_SECRET)) return;

    let body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      try {
        body = await parseJsonBody(req);
      } catch (e) {
        return res.status(400).json({ error: 'invalid json' });
      }
    }

    const { id, name, contact, guests, isNew } = body || {};
    if (!id) {
      return res.status(400).json({ error: 'id required' });
    }

    const updates = {};
    if (typeof name === 'string') updates.name = name.trim();
    if (typeof contact === 'string') updates.contact = contact.trim();
    if (typeof guests !== 'undefined') updates.guests = Number(guests) || 0;
    if (typeof isNew !== 'undefined') updates.isNew = Boolean(isNew);

    const { data, error } = await supabase
      .from('checkins')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error', error);
      return res.status(500).json({ error: 'failed to update' });
    }

    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    if (!requireAuth(req, res, JWT_SECRET)) return;

    let id = req.query?.id;
    if (!id) {
      try {
        const body = await parseJsonBody(req);
        id = body?.id;
      } catch (e) {
        // ignore
      }
    }

    if (!id) {
      return res.status(400).json({ error: 'id required' });
    }

    const { error } = await supabase.from('checkins').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete error', error);
      return res.status(500).json({ error: 'failed to delete' });
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
