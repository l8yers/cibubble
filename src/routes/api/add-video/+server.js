import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function normalizeTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return [...new Set(raw.map(t => String(t || '').trim().toLowerCase()).filter(Boolean))];
  }
  return [...new Set(String(raw)
    .replace(/\//g, ',')
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
  )];
}
function normalizeCountry(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const val = raw.trim().toLowerCase();
  return val === '' ? null : val;
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
            if (!dur || typeof dur !== "string") {
              return { id: v.id, length: 0 };
            }
            return {
              id: v.id,
              length: parseDuration(dur),
            };
          })
        );
      }
    } catch (err) {
      console.log('[fetchVideoDurations] Failed to fetch durations:', err.message);
    }
  }
  return results.reduce((acc, v) => ({ ...acc, [v.id]: v.length }), {});
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
    let url = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet,contentDetails&forHandle=${encodeURIComponent(handleOnly)}&key=${YOUTUBE_API_KEY}`;
    let res = await fetch(url);
    let data = await res.json();
    if (data.items && data.items.length > 0) return data.items[0].id;
    url = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet,contentDetails&forUsername=${encodeURIComponent(handleOnly)}&key=${YOUTUBE_API_KEY}`;
    res = await fetch(url);
    data = await res.json();
    if (data.items && data.items.length > 0) return data.items[0].id;
    url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handleOnly)}&key=${YOUTUBE_API_KEY}`;
    res = await fetch(url);
    data = await res.json();
    if (data.items && data.items.length > 0) {
      const channelId = data.items[0].snippet.channelId;
      return channelId;
    }
  } catch (err) {
    console.log(`[getChannelIdFromHandle] Failed for handle "${handle}":`, err.message);
  }
  return null;
}
async function getChannelInfo(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error?.code === 403 || data.error?.code === 429) {
      throw new Error(`[getChannelInfo] API quota exceeded! code ${data.error.code}`);
    }
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
    console.log('[getChannelInfo] Fetch error:', err.message);
    throw err;
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
      if (data.error?.code === 403 || data.error?.code === 429) {
        throw new Error(`[getPlaylists] API quota exceeded! code ${data.error.code}`);
      }
      if (data.items) playlists.push(...data.items);
      nextPage = data.nextPageToken || '';
    } while (nextPage);
  } catch (err) {
    console.log(`[getPlaylists] Channel ${channelId} error:`, err.message);
    throw err;
  }
  return playlists.map((pl) => ({
    id: pl.id,
    channel_id: pl.snippet.channelId,
    title: pl.snippet.title,
    thumbnail: pl.snippet.thumbnails?.default?.url || '',
    description: pl.snippet.description,
  }));
}
function isGoodVideo(v, durations) {
  const title = v.snippet?.title?.toLowerCase() ?? '';
  if (!title) return false;
  if (title === 'deleted video' || title === 'private video') return false;
  const vid = v.contentDetails?.videoId;
  if (!vid || !durations[vid]) return false;
  if (durations[vid] < 180) return false;
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
      if (data.error?.code === 403 || data.error?.code === 429) {
        throw new Error(`[getPlaylistVideos] API quota exceeded! code ${data.error.code}`);
      }
      if (data.items) videos.push(...data.items);
      nextPage = data.nextPageToken || '';
    } while (nextPage);
  } catch (err) {
    console.log(`[getPlaylistVideos] Playlist ${playlistId} error:`, err.message);
    throw err;
  }
  const videoIds = videos.map((v) => v.contentDetails.videoId).filter(Boolean);
  let durations = {};
  if (videoIds.length) {
    durations = await fetchVideoDurations(videoIds);
  }
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
  return await getPlaylistVideos(uploadsPlaylistId);
}

export async function POST({ request }) {
  let channelNameForDebug = 'Unknown';
  try {
    if (!YOUTUBE_API_KEY) {
      return json({ error: 'Missing YouTube API key' }, { status: 500 });
    }
    const { url, tags, level, added_by, country } = await request.json();

    const tagArr = normalizeTags(tags);
    const normCountry = normalizeCountry(country);

    const extracted = extractChannelIdOrHandle(url);
    if (!extracted) {
      console.log('[UPLOAD] Skipping: could not extract channel ID/handle from url:', url);
      return json({ error: 'Invalid YouTube channel link.' }, { status: 400 });
    }

    let channelId = extracted.id;
    if (!channelId && extracted.handle) {
      channelId = await getChannelIdFromHandle(extracted.handle);
      if (!channelId) {
        console.log(`[UPLOAD] Could not resolve handle: ${extracted.handle}`);
        return json({ error: 'Channel not found (handle could not be resolved).' }, { status: 404 });
      }
    }

    console.log(`[UPLOAD] Processing channel: ${channelId} (${url})`);

    let channel;
    try {
      channel = await getChannelInfo(channelId);
    } catch (err) {
      if (err.message && err.message.includes('quota')) {
        return json({ error: `YouTube API quota exceeded while fetching channel info for: ${channelId}`, channelId }, { status: 503 });
      }
      return json({ error: `Could not fetch channel info: ${err.message}`, channelId }, { status: 404 });
    }

    if (!channel) {
      return json({ error: 'Could not fetch channel info.', channelId }, { status: 404 });
    }
    channelNameForDebug = channel.name;
    if (!channel.name || !channel.name.trim()) {
      return json({
        error: `Channel "${channelId}" is missing a name. This can happen if the YouTube API did not return info, the channel is deleted/private, or your API quota is exceeded.`,
        channelId
      }, { status: 400 });
    }

    // Upsert channel
    const channelObj = {
      id: channel.id,
      name: channel.name,
      thumbnail: channel.thumbnail || '',
      description: channel.description || '',
      tags: tagArr.join(','),
      country: normCountry,
      level: level || null
    };
    console.log(`[UPLOAD] Upserting channel: "${channel.name}" (${channel.id})`);
    const { error: channelError } = await supabase.from('channels').upsert([channelObj]);
    if (channelError) {
      console.log(`[UPLOAD][FAIL] Channel upsert error for "${channel.name}": ${channelError.message}`);
      return json({ error: `Failed to upsert channel "${channel.name}"`, channelId }, { status: 500 });
    }

    // Upsert playlists
    let playlists = [];
    try {
      playlists = await getPlaylists(channel.id);
      console.log(`[UPLOAD] Fetched ${playlists.length} playlists for channel "${channel.name}"`);
    } catch (err) {
      if (err.message && err.message.includes('quota')) {
        return json({ error: `YouTube API quota exceeded while fetching playlists for: ${channel.name}`, channelId }, { status: 503 });
      }
      return json({ error: `Failed to fetch playlists for channel "${channel.name}": ${err.message}`, channelId }, { status: 500 });
    }
    if (playlists.length > 0) {
      const { error: playlistError } = await supabase.from('playlists').upsert(playlists);
      if (playlistError) {
        console.log(`[UPLOAD][FAIL] Playlists upsert error for "${channel.name}": ${playlistError.message}`);
        return json({ error: `Failed to upsert playlists for "${channel.name}"`, channelId }, { status: 500 });
      }
    }

    // Gather all videos
    const allVideoObjs = {};
    // All uploads
    if (channel.uploadsPlaylistId) {
      try {
        const uploadVids = await getAllUploads(channel.uploadsPlaylistId);
        for (const v of uploadVids) {
          allVideoObjs[v.id] = v;
        }
        console.log(`[UPLOAD] Fetched ${uploadVids.length} upload videos for "${channel.name}"`);
      } catch (err) {
        if (err.message && err.message.includes('quota')) {
          return json({ error: `YouTube API quota exceeded while fetching uploads for: ${channel.name}`, channelId }, { status: 503 });
        }
        return json({ error: `Failed to fetch upload videos for channel "${channel.name}": ${err.message}`, channelId }, { status: 500 });
      }
    }
    // All playlist videos
    let totalPlaylistVideos = 0;
    for (const pl of playlists) {
      try {
        const vids = await getPlaylistVideos(pl.id);
        for (const v of vids) {
          allVideoObjs[v.id] = v;
        }
        totalPlaylistVideos += vids.length;
      } catch (err) {
        if (err.message && err.message.includes('quota')) {
          return json({ error: `YouTube API quota exceeded while fetching playlist videos for: ${channel.name} / playlist ${pl.title}`, channelId, playlist: pl.title }, { status: 503 });
        }
        return json({ error: `Failed to fetch playlist videos for channel "${channel.name}" (playlist "${pl.title}"): ${err.message}`, channelId, playlist: pl.title }, { status: 500 });
      }
    }
    console.log(`[UPLOAD] Fetched ${totalPlaylistVideos} videos from all playlists for "${channel.name}"`);

    // Upsert all videos
    const videosToUpsert = Object.values(allVideoObjs).map((v) => ({
      id: v.id,
      playlist_id: v.playlist_id || null,
      channel_id: v.channel_id || channel.id,
      title: v.title || '',
      channel_name: v.channel_name || channel.name,
      thumbnail: v.thumbnail || '',
      length: v.length || null,
      published: v.published || null,
      created: v.created || null,
      playlist_position: v.playlist_position || null,
      level: level || 'notyet',
      country: normCountry,
      tags: tagArr,
      added_by: added_by || null
    }));
    if (videosToUpsert.length > 0) {
      const { error: videoError } = await supabase.from('videos').upsert(videosToUpsert);
      if (videoError) {
        console.log(`[UPLOAD][FAIL] Videos upsert error for "${channel.name}": ${videoError.message}`);
        return json({ error: `Failed to upsert videos for "${channel.name}": ${videoError.message}`, channelId }, { status: 500 });
      }
      console.log(`[UPLOAD] Upserted ${videosToUpsert.length} videos for "${channel.name}"`);
    } else {
      console.log(`[UPLOAD] No videos found to upsert for "${channel.name}"`);
    }

    return json({
      success: true,
      channel,
      playlists_count: playlists.length,
      videos_added: videosToUpsert.length,
    });
  } catch (err) {
    console.log('[UPLOAD][FAIL][UNCAUGHT]', channelNameForDebug, err.message || err);
    return json({
      error: (err && err.message) || String(err) || 'Unknown error',
      channel: channelNameForDebug
    }, { status: 500 });
  }
}
