import { json } from '@sveltejs/kit';

const YOUTUBE_API_KEY =
  process.env.YOUTUBE_API_KEY ||
  process.env.VITE_YOUTUBE_API_KEY ||
  import.meta.env.VITE_YOUTUBE_API_KEY;

// Utility: Parse ISO 8601 duration (e.g. PT1H2M3S) to seconds
function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return (
    (parseInt(m?.[1] || 0) * 3600) +
    (parseInt(m?.[2] || 0) * 60) +
    (parseInt(m?.[3] || 0))
  );
}

// Fetch meta (title, id, thumbnail, length) for up to 50 video IDs
async function getVideosMeta(videoIds) {
  if (!videoIds.length) return [];
  const idsStr = videoIds.join(',');
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${idsStr}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.items || []).map(v => ({
    id: v.id,
    title: v.snippet.title,
    thumbnail: v.snippet.thumbnails?.default?.url || '',
    length: parseDuration(v.contentDetails.duration)
  }));
}

// Get all video IDs in a playlist
async function getPlaylistVideoIds(playlistId) {
  let videoIds = [];
  let nextPage = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&pageToken=${nextPage}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    videoIds.push(...(data.items || []).map(v => v.snippet.resourceId.videoId));
    nextPage = data.nextPageToken || '';
  } while (nextPage);
  return videoIds;
}

// Get all videos (with duration) for a playlist
async function getPlaylistVideos(playlistId) {
  const videoIds = await getPlaylistVideoIds(playlistId);
  let allVideos = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const meta = await getVideosMeta(batch);
    allVideos.push(...meta);
  }
  return allVideos;
}

// Extracts playlist or channel info from YouTube URL
function extractInfo(url) {
  // Playlist: https://www.youtube.com/playlist?list=...
  const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };
  // Channel handle: https://www.youtube.com/@name
  const channelMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_]+)/);
  if (channelMatch) return { type: 'channel', handle: channelMatch[1] };
  return null;
}

// Get channel ID from handle
async function getChannelIdFromHandle(handle) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items?.[0]?.snippet?.channelId || null;
}

// Get all playlists for a channel
async function getPlaylistsForChannel(channelId) {
  let playlists = [];
  let nextPage = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channelId}&maxResults=50&pageToken=${nextPage}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    playlists.push(...(data.items || []));
    nextPage = data.nextPageToken || '';
  } while (nextPage);
  return playlists.map(p => ({
    id: p.id,
    title: p.snippet.title,
    thumbnail: p.snippet.thumbnails?.default?.url || '',
    channel_id: p.snippet.channelId,
    channel_name: p.snippet.channelTitle,
    channel_thumbnail: '', // Can be fetched if needed
    videoCount: p.contentDetails?.itemCount || 0
  }));
}

// Get playlist meta (channel, title, etc)
async function getPlaylistInfo(playlistId) {
  const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const p = data.items?.[0];
  if (!p) return null;
  return {
    id: p.id,
    title: p.snippet.title,
    thumbnail: p.snippet.thumbnails?.default?.url || '',
    channel_id: p.snippet.channelId,
    channel_name: p.snippet.channelTitle,
    channel_thumbnail: '',
  };
}

export async function POST({ request }) {
  try {
    let { url, playlistId } = await request.json();
    if (!YOUTUBE_API_KEY) return json({ error: 'Missing YouTube API key' }, { status: 500 });

    // Playlist import (direct or from channel page)
    if (playlistId) {
      // Get playlist info and videos with durations
      const info = await getPlaylistInfo(playlistId);
      if (!info) return json({ error: 'Playlist not found' }, { status: 404 });
      const videos = await getPlaylistVideos(playlistId);
      return json({ type: 'playlist', playlist: { ...info, videos } });
    }

    // Main URL entry (playlist or channel)
    const parsed = extractInfo(url);
    if (!parsed) return json({ error: 'Invalid YouTube link.' }, { status: 400 });

    if (parsed.type === 'playlist') {
      // Single playlist
      const info = await getPlaylistInfo(parsed.id);
      if (!info) return json({ error: 'Playlist not found' }, { status: 404 });
      const videos = await getPlaylistVideos(parsed.id);
      return json({ type: 'playlist', playlist: { ...info, videos } });
    } else if (parsed.type === 'channel') {
      // Channel handle: look up channel ID
      const channelId = await getChannelIdFromHandle(parsed.handle);
      if (!channelId) return json({ error: 'Channel not found' }, { status: 404 });
      const playlists = await getPlaylistsForChannel(channelId);
      if (!playlists.length) return json({ error: 'No playlists found for channel.' }, { status: 404 });
      return json({ type: 'channel', playlists });
    }

    return json({ error: 'Invalid link.' }, { status: 400 });
  } catch (err) {
    console.error('API ERROR:', err);
    return json({ error: err.message || 'Unknown server error' }, { status: 500 });
  }
}
