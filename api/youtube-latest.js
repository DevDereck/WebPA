const DEFAULT_CHANNEL = process.env.YOUTUBE_CHANNEL_ID || 'UC_8F7KKQ47MDJYko_CvRq2w';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function fetchLiveVideoId(channelId) {
  const liveUrl = `https://www.youtube.com/channel/${channelId}/live`;
  const res = await fetch(liveUrl, {
    headers: {
      'User-Agent': 'icpa-web/1.0',
      'Accept-Language': 'es-CR,es;q=0.9,en;q=0.8'
    }
  });

  if (!res.ok) return null;

  const html = await res.text();
  // YouTube live page usually includes the current live videoId in the markup
  const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
  return match?.[1] || null;
}

function parseLatestEntry(xml) {
  const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
  if (!entryMatch) return null;
  const entry = entryMatch[1];
  const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || null;
  const title = entry.match(/<title>([^<]+)<\/title>/)?.[1] || null;
  const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1] || null;
  if (!videoId) return null;
  return { videoId, title, publishedAt };
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
    // 1) Try to get the live stream (if any)
    const liveVideoId = await fetchLiveVideoId(channelId);
    if (liveVideoId) {
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
      return res.status(200).json({ channelId, videoId: liveVideoId, source: 'live' });
    }

    // 2) Fallback to the RSS feed (latest upload)
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'icpa-web/1.0',
        'Accept-Language': 'es-CR,es;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'youtube feed unavailable' });
    }

    const xml = await response.text();
    const latest = parseLatestEntry(xml);

    if (!latest) {
      return res.status(502).json({ error: 'video not found' });
    }

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=900');
    return res.status(200).json({ channelId, ...latest, source: 'feed' });
  } catch (error) {
    console.error('youtube feed error', error);
    return res.status(500).json({ error: 'failed to fetch feed' });
  }
}
