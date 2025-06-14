import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

// Server keys for SSR
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || import.meta.env.VITE_YOUTUBE_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Duration Parsing Utility ---
function parseDuration(iso) {
  // "PT1H2M10S" → seconds
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return (
    (parseInt(m?.[1] || 0) * 3600) +
    (parseInt(m?.[2] || 0) * 60) +
    (parseInt(m?.[3] || 0))
  );
}

// --- Fetch durations for an array of video IDs ---
async function fetchVideoDurations(videoIds) {
  let results = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const ids = videoIds.slice(i, i + 50).join(",");
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) {
      results.push(...data.items.map(v => ({
        id: v.id,
        length: parseDuration(v.contentDetails.duration)
      })));
    }
  }
  // Reduce to { id: length, ... }
  return results.reduce((acc, v) => ({ ...acc, [v.id]: v.length }), {});
}

// --- Extracts channel ID or handle from a YouTube URL ---
function extractChannelIdOrHandle(url) {
  const channelIdMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
  if (channelIdMatch) return { id: channelIdMatch[1], type: "id" };
  const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_]+)/);
  if (handleMatch) return { handle: handleMatch[1], type: "handle" };
  return null;
}

// --- Robust channel ID resolution for @handles, usernames, etc. ---
async function getChannelIdFromHandle(handle) {
  const handleOnly = handle.startsWith('@') ? handle.slice(1) : handle;

  // 1. Try forHandle (new YouTube @handle system)
  let url = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet,contentDetails&forHandle=${encodeURIComponent(handleOnly)}&key=${YOUTUBE_API_KEY}`;
  let res = await fetch(url);
  let data = await res.json();

  if (data.items && data.items.length > 0) {
    console.log('Found channel via forHandle:', data.items[0].id, data.items[0].snippet.title);
    return data.items[0].id;
  } else {
    console.warn('Channel not found via forHandle:', handleOnly, data);
  }

  // 2. Try legacy forUsername
  url = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet,contentDetails&forUsername=${encodeURIComponent(handleOnly)}&key=${YOUTUBE_API_KEY}`;
  res = await fetch(url);
  data = await res.json();

  if (data.items && data.items.length > 0) {
    console.log('Found channel via forUsername:', data.items[0].id, data.items[0].snippet.title);
    return data.items[0].id;
  } else {
    console.warn('Channel not found via forUsername:', handleOnly, data);
  }

  // 3. Fallback: Search (last resort, not as reliable)
  url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handleOnly)}&key=${YOUTUBE_API_KEY}`;
  res = await fetch(url);
  data = await res.json();

  if (data.items && data.items.length > 0) {
    const channelId = data.items[0].snippet.channelId;
    console.log('Found channel via search:', channelId, data.items[0].snippet.title);
    return channelId;
  } else {
    console.error('Channel not found via any method:', handleOnly, data);
    return null;
  }
}

async function getChannelInfo(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
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
}

async function getPlaylists(channelId) {
  let playlists = [];
  let nextPage = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channelId}&maxResults=50&pageToken=${nextPage}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) playlists.push(...data.items);
    nextPage = data.nextPageToken || '';
  } while (nextPage);
  return playlists.map(pl => ({
    id: pl.id,
    channel_id: pl.snippet.channelId,
    title: pl.snippet.title,
    thumbnail: pl.snippet.thumbnails?.default?.url || '',
    description: pl.snippet.description,
  }));
}

async function getPlaylistVideos(playlistId) {
  let videos = [];
  let nextPage = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&pageToken=${nextPage}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) videos.push(...data.items);
    nextPage = data.nextPageToken || '';
  } while (nextPage);

  const videoIds = videos.map(v => v.contentDetails.videoId).filter(Boolean);
  let durations = {};
  if (videoIds.length) {
    durations = await fetchVideoDurations(videoIds);
  }

  return videos.map(v => ({
    id: v.contentDetails.videoId,
    title: v.snippet.title,
    channel_id: v.snippet.channelId,
    channel_name: v.snippet.channelTitle,
    thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url || '',
    length: durations[v.contentDetails.videoId] ?? null,
    playlist_id: playlistId,
    created: new Date().toISOString(),
    level: "notyet",
    playlist_position: v.snippet.position ?? null,
  }));
}

async function getAllUploads(uploadsPlaylistId) {
  const videos = await getPlaylistVideos(uploadsPlaylistId);
  return videos.map(v => ({ ...v, playlist_id: null }));
}

// --- MAIN ENTRY POINT ---
export async function POST({ request }) {
  try {
    if (!YOUTUBE_API_KEY) return json({ error: 'Missing YouTube API key' }, { status: 500 });

    const { url } = await request.json();
    const extracted = extractChannelIdOrHandle(url);
    if (!extracted) return json({ error: 'Invalid YouTube channel link.' }, { status: 400 });

    let channelId = extracted.id;
    let resolvedVia = 'direct';

    if (!channelId && extracted.handle) {
      channelId = await getChannelIdFromHandle(extracted.handle);
      resolvedVia = 'handle';
      if (!channelId) {
        return json({ error: 'Channel not found (handle could not be resolved).' }, { status: 404 });
      }
    }

    console.log(`[IMPORT] Importing channel with ID: ${channelId} (via: ${resolvedVia})`);

    // Get channel info
    const channel = await getChannelInfo(channelId);
    if (!channel) {
      console.error(`[IMPORT] Could not fetch channel info for ID: ${channelId}`);
      return json({ error: 'Could not fetch channel info.' }, { status: 404 });
    }
    console.log(`[IMPORT] Fetched channel info: ${channel.id} "${channel.name}"`);

    // Insert/update channel
    const { error: channelError } = await supabase.from('channels').upsert([{
      id: channel.id,
      name: channel.name,
      thumbnail: channel.thumbnail,
      description: channel.description
    }]);
    if (channelError) {
      console.error(`[IMPORT] Error upserting channel:`, channelError);
      return json({ error: 'Failed to upsert channel.' }, { status: 500 });
    }

    // Get and upsert playlists
    const playlists = await getPlaylists(channelId);
    if (playlists.length > 0) {
      const { error: playlistError } = await supabase.from('playlists').upsert(playlists);
      if (playlistError) {
        console.error(`[IMPORT] Error upserting playlists:`, playlistError);
        return json({ error: 'Failed to upsert playlists.' }, { status: 500 });
      }
    }

    // Get all playlist videos (with durations)
    let playlistVideos = [];
    for (const pl of playlists) {
      const vids = await getPlaylistVideos(pl.id);
      playlistVideos.push(...vids);
    }

    // Get "uploads" videos (videos not necessarily in playlists)
    let uploadsVideos = [];
    if (channel.uploadsPlaylistId) {
      uploadsVideos = await getAllUploads(channel.uploadsPlaylistId);
    }

    // Merge playlist videos and uploads, prefer playlist if duplicate id
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

    // Upsert videos with durations!
    if (allVideos.length > 0) {
      const { error: videoError } = await supabase.from('videos').upsert(allVideos.map(v => ({
        id: v.id,
        playlist_id: v.playlist_id,
        channel_id: v.channel_id,
        title: v.title,
        channel_name: v.channel_name,
        thumbnail: v.thumbnail,
        length: v.length,
        level: v.level,
        created: v.created,
        playlist_position: v.playlist_position
      })));
      if (videoError) {
        console.error(`[IMPORT] Error upserting videos:`, videoError);
        return json({ error: 'Failed to upsert videos.' }, { status: 500 });
      }
    }

    return json({
      success: true,
      channel,
      playlists_count: playlists.length,
      videos_added: allVideos.length
    });
  } catch (err) {
    console.error("[IMPORT ERROR]", err);
    return json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
