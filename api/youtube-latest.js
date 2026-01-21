const DEFAULT_CHANNEL = process.env.YOUTUBE_CHANNEL_ID || 'UC_8F7KKQ47MDJYko_CvRq2w';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function getVideoFlags(videoId) {
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(watchUrl, {
      headers: {
        'User-Agent': 'icpa-web/1.0',
        'Accept-Language': 'es-CR,es;q=0.9,en;q=0.8'
      },
      next: { revalidate: 0 },
      cache: 'no-store',
    });
    if (!res.ok) return { isLive: false, isUpcoming: false };
    const html = await res.text();
    const isLiveFlag = /"isLive":true/.test(html) || /"isLiveContent":true/.test(html);
    const isUpcomingFlag = /"isUpcoming":true/.test(html);
    return { isLive: isLiveFlag, isUpcoming: isUpcomingFlag };
  } catch (e) {
    return { isLive: false, isUpcoming: false };
  }
}

function parseFeedEntries(xml) {
  const entries = [];
  const regex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const entry = match[1];
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || null;
    const title = entry.match(/<title>([^<]+)<\/title>/)?.[1] || null;
    const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1] || null;
    if (videoId) entries.push({ videoId, title, publishedAt });
  }
  return entries;
}

async function fetchWithTimeout(url, ms = 8000, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const channelId = req.query?.channelId || DEFAULT_CHANNEL;
  if (!channelId) {
    return res.status(400).json({ error: 'channelId required' });
  }

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  try {
    let response = await fetchWithTimeout(feedUrl, 8000, {
      headers: {
        'User-Agent': 'icpa-web/1.0',
        'Accept-Language': 'es-CR,es;q=0.9,en;q=0.8'
      },
      next: { revalidate: 0 },
      cache: 'no-store',
    });

    if (!response.ok) {
      // fallback con proxy público para evitar bloqueos
      const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`;
      response = await fetchWithTimeout(proxy, 8000, { next: { revalidate: 0 }, cache: 'no-store' });
      if (!response.ok) {
        return res.status(200).json({ error: 'youtube feed unavailable' });
      }
      const wrapped = await response.json();
      response = { ok: true, text: async () => wrapped.contents };
    }

    const xml = await response.text();
    const entries = parseFeedEntries(xml);

    if (!entries.length) {
      return res.status(200).json({ error: 'video not found' });
    }

    const inspect = entries.slice(0, 5); // limitar para evitar timeouts
    let firstLive = null;
    for (const entry of inspect) {
      const flags = await getVideoFlags(entry.videoId);
      if (flags.isUpcoming) continue; // skip programados
      if (flags.isLive && !firstLive) {
        firstLive = { entry, flags };
        continue; // sigue buscando uno terminado
      }
      if (!flags.isLive) {
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=900');
        return res.status(200).json({ channelId, ...entry, source: 'finished' });
      }
    }

    if (firstLive) {
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
      return res.status(200).json({ channelId, ...firstLive.entry, source: 'live' });
    }

    // si todo es upcoming, devuelve el más reciente para no dejar vacío
    const fallback = entries[0];
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300');
    return res.status(200).json({ channelId, ...fallback, source: 'upcoming-fallback' });
  } catch (error) {
    console.error('youtube feed error', error);
    return res.status(200).json({ error: 'failed to fetch feed' });
  }
}
