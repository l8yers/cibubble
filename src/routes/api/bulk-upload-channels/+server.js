import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Minimal fetch for channel info
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;
async function getChannelInfo(urlOrHandle) {
  // Accepts URL or handle
  let id = null;
  let handle = null;

  // Raw channel ID
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(urlOrHandle)) id = urlOrHandle;

  // @handle (raw or in url)
  const at = urlOrHandle.match(/@([a-zA-Z0-9_]+)/);
  if (at) handle = at[1];

  // /channel/ID URL
  const ch = urlOrHandle.match(/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (ch) id = ch[1];

  if (!id && !handle) {
    // Try to extract from full URL
    try {
      const u = new URL(urlOrHandle);
      if (u.pathname.startsWith('/channel/')) id = u.pathname.split('/')[2];
      if (u.pathname.startsWith('/@')) handle = u.pathname.slice(2);
    } catch {}
  }

  // If handle, resolve to ID
  if (!id && handle) {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forHandle=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items && data.items.length) id = data.items[0].id;
  }

  if (!id) return null;

  // Fetch minimal channel info
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${id}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.items || !data.items[0]) return null;
  const c = data.items[0];
  return {
    id: c.id,
    name: c.snippet?.title ?? null,
    thumbnail: c.snippet?.thumbnails?.default?.url ?? null
  };
}

export async function POST({ request }) {
  try {
    const { rows } = await request.json(); // Array of {url, tags, country, level}
    if (!rows || !Array.isArray(rows) || !rows.length)
      return json({ error: "No rows provided" }, { status: 400 });

    const results = [];

    for (const row of rows) {
      // If every cell is blank, skip
      if (
        (!row.url || !row.url.trim()) &&
        (!row.tags || !row.tags.trim()) &&
        (!row.country || !row.country.trim()) &&
        (!row.level || !row.level.trim())
      ) continue;

      let channelInfo = null;
      try {
        channelInfo = await getChannelInfo(row.url?.trim());
      } catch (err) {
        results.push({ url: row.url, error: 'Failed to fetch channel info' });
        continue;
      }

      if (!channelInfo) {
        results.push({ url: row.url, error: 'Invalid or missing channel' });
        continue;
      }

      // Prepare upsert
      const obj = {
        id: channelInfo.id,
        name: channelInfo.name,
        thumbnail: channelInfo.thumbnail,
        country: row.country && row.country.trim() ? row.country.trim() : null,
        tags: row.tags && row.tags.trim() ? row.tags.trim() : null,
        level: row.level && row.level.trim() ? row.level.trim() : null,
      };

      // Required: id, name
      if (!obj.id || !obj.name) {
        results.push({ url: row.url, error: 'Missing id or name' });
        continue;
      }

      // Upsert to channels
      const { error } = await supabase.from('channels').upsert([obj]);
      if (error) {
        results.push({ url: row.url, error: error.message });
      } else {
        results.push({ url: row.url, id: obj.id, ok: true });
      }
    }
    return json({ results });
  } catch (err) {
    return json({ error: err.message }, { status: 500 });
  }
}
