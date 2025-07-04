import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

// ENVIRONMENT VARIABLES
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- HELPERS ----

function normalizeTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return [...new Set(raw.map(t => String(t).trim().toLowerCase()).filter(Boolean))];
  return [...new Set(String(raw).replace(/\//g, ',').split(',').map(t => t.trim().toLowerCase()).filter(Boolean))];
}
function extractChannelIdOrHandle(url) {
  const channelIdMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
  if (channelIdMatch) return { id: channelIdMatch[1], type: 'id' };
  const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_]+)/);
  if (handleMatch) return { handle: handleMatch[1], type: 'handle' };
  return null;
}
async function getChannelIdFromHandle(handle) {
  const handleOnly = handle.startsWith('@') ? handle.slice(1) : handle;
  try {
    let url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handleOnly)}&key=${YOUTUBE_API_KEY}`;
    let res = await fetch(url);
    let data = await res.json();
    if (data.items && data.items.length > 0) return data.items[0].id;
    url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handleOnly)}&key=${YOUTUBE_API_KEY}`;
    res = await fetch(url);
    data = await res.json();
    if (data.items && data.items.length > 0) return data.items[0].snippet.channelId;
  } catch (err) {}
  return null;
}
async function getChannelInfo(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items || data.items.length === 0) return null;
    const c = data.items[0];
    return {
      id: c.id,
      name: c.snippet.title,
      thumbnail: c.snippet.thumbnails?.default?.url || '',
      description: c.snippet.description,
      uploadsPlaylistId: c.contentDetails?.relatedPlaylists?.uploads,
    };
  } catch (err) {
    return null;
  }
}
async function getPlaylists(channelId) {
  let playlists = [];
  let nextPage = '';
  try {
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channelId}&maxResults=50&pageToken=${nextPage}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items) playlists.push(...data.items);
      nextPage = data.nextPageToken || '';
    } while (nextPage);
  } catch (err) {}
  return playlists.map((pl) => ({
    id: pl.id,
    channel_id: pl.snippet.channelId,
    title: pl.snippet.title,
    thumbnail: pl.snippet.thumbnails?.default?.url || '',
    description: pl.snippet.description,
  }));
}
function parseDuration(iso) {
  if (!iso || typeof iso !== 'string') return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + (parseInt(m[3] || 0));
}
async function fetchVideoDurations(videoIds) {
  let results = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const ids = videoIds.slice(i, i + 50).join(',');
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.items) {
        results.push(
          ...data.items.map((v) => {
            const dur = v.contentDetails?.duration;
            return {
              id: v.id,
              length: dur ? parseDuration(dur) : 0,
            };
          })
        );
      }
    } catch (err) {}
  }
  return results.reduce((acc, v) => ({ ...acc, [v.id]: v.length }), {});
}
function isGoodVideo(v, durations) {
  const title = v.snippet?.title?.toLowerCase() ?? '';
  if (!title || title === 'deleted video' || title === 'private video') return false;
  const vid = v.contentDetails?.videoId;
  if (!vid || !durations[vid] || durations[vid] < 180) return false;
  return true;
}
async function getPlaylistVideos(playlistId) {
  let videos = [];
  let nextPage = '';
  try {
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&pageToken=${nextPage}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items) videos.push(...data.items);
      nextPage = data.nextPageToken || '';
    } while (nextPage);
  } catch (err) {}
  const videoIds = videos.map((v) => v.contentDetails.videoId).filter(Boolean);
  let durations = {};
  if (videoIds.length) durations = await fetchVideoDurations(videoIds);
  return videos
    .filter((v) => isGoodVideo(v, durations))
    .map((v) => ({
      id: v.contentDetails.videoId,
      title: v.snippet.title,
      channel_id: v.snippet.channelId,
      channel_name: v.snippet.channelTitle,
      thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url || '',
      length: durations[v.contentDetails.videoId] ?? null,
      playlist_id: playlistId,
      published: v.snippet.publishedAt,
      created: new Date().toISOString(),
      level: 'notyet',
      playlist_position: v.snippet.position ?? null,
    }));
}
async function getAllUploads(uploadsPlaylistId) {
  const videos = await getPlaylistVideos(uploadsPlaylistId);
  return videos.map((v) => ({ ...v, playlist_id: null }));
}

// ---- MAIN HANDLER ----

export async function POST({ request }) {
  try {
    const { url, tags, level, added_by, country } = await request.json();
    const tagArr = normalizeTags(tags);
    const tagStr = tagArr.join(',');
    const normCountry = country ? country.trim().toLowerCase() : null;

    const extracted = extractChannelIdOrHandle(url);
    if (!extracted) return json({ error: 'Invalid YouTube channel link.' }, { status: 400 });
    let channelId = extracted.id;
    if (!channelId && extracted.handle) {
      channelId = await getChannelIdFromHandle(extracted.handle);
      if (!channelId) return json({ error: 'Channel not found (handle could not be resolved).' }, { status: 404 });
    }

    const channel = await getChannelInfo(channelId);
    if (!channel || !channel.name || !channel.name.trim()) {
      return json({ error: 'Could not fetch channel info.' }, { status: 404 });
    }

    const channelObj = {
      id: channel.id,
      name: channel.name,
      thumbnail: channel.thumbnail || null,
      description: channel.description || null,
      country: normCountry,
      tags: tagStr,
      level: level || 'notyet'
    };

    const playlists = await getPlaylists(channel.id);

    let playlistVideos = [];
    for (const pl of playlists) {
      const vids = await getPlaylistVideos(pl.id);
      playlistVideos.push(...vids);
    }
    let uploadsVideos = [];
    if (channel.uploadsPlaylistId) {
      uploadsVideos = await getAllUploads(channel.uploadsPlaylistId);
    }

    const seen = new Set();
    const allVideos = [];
    for (const v of playlistVideos) {
      if (!seen.has(v.id)) {
        allVideos.push(v);
        seen.add(v.id);
      }
    }
    for (const v of uploadsVideos) {
      if (!seen.has(v.id)) {
        allVideos.push(v);
        seen.add(v.id);
      }
    }

    const videosToUpsert = allVideos.map((v) => ({
      id: v.id,
      playlist_id: v.playlist_id || null,
      channel_id: v.channel_id || channel.id,
      title: v.title || '',
      channel_name: v.channel_name || null,
      thumbnail: v.thumbnail || null,
      length: v.length || null,
      level: level || v.level || 'notyet',
      created: v.created || null,
      playlist_position: v.playlist_position || null,
      added_by: added_by || null,
      published: v.published || null,
      tags: tagArr,
      country: normCountry
    }));

    // -- Upsert channel
    const { error: channelError } = await supabase.from('channels').upsert([channelObj]);
    if (channelError) return json({ error: 'Failed to upsert channel.' }, { status: 500 });

    // -- Upsert playlists
    if (playlists.length > 0) {
      const { error: playlistError } = await supabase.from('playlists').upsert(playlists);
      if (playlistError) return json({ error: 'Failed to upsert playlists.' }, { status: 500 });
    }

    // -- Wait 2s for DB
    await new Promise(r => setTimeout(r, 2000));

    // -- Upsert videos
    let result = await supabase.from('videos').upsert(videosToUpsert);
    let inserted = Array.isArray(result.data) ? result.data.length : 0;

    // -- If nothing, wait 2s and try again
    if (inserted === 0 && videosToUpsert.length > 0) {
      await new Promise(r => setTimeout(r, 2000));
      result = await supabase.from('videos').upsert(videosToUpsert);
      inserted = Array.isArray(result.data) ? result.data.length : 0;
    }

    return json({
      ok: true,
      channel,
      playlists_count: playlists.length,
      videos_attempted: videosToUpsert.length,
      videos_added: inserted,
      supabase_return: result,
    });

  } catch (err) {
    return json({ error: (err && err.message) || String(err) || 'Unknown error' }, { status: 500 });
  }
}
