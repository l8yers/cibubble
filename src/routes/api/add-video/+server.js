import { json } from '@sveltejs/kit';

const YOUTUBE_API_KEY =
  process.env.YOUTUBE_API_KEY ||
  process.env.VITE_YOUTUBE_API_KEY ||
  import.meta.env.VITE_YOUTUBE_API_KEY;

  console.log('YOUTUBE API KEY:', process.env.YOUTUBE_API_KEY, import.meta.env.VITE_YOUTUBE_API_KEY);

// Extracts channel ID or playlist ID from a YouTube URL
function extractInfo(url) {
  // Playlist: https://www.youtube.com/playlist?list=...
  const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };
  // Channel handle: https://www.youtube.com/@name
  const channelMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_]+)/);
  if (channelMatch) return { type: 'channel', handle: channelMatch[1] };
  return null;
}

// Gets channel ID from channel handle
async function getChannelIdFromHandle(handle) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items?.[0]?.snippet?.channelId || null;
}

// Gets all playlists for a channel
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
    channel_thumbnail: '', // can fetch if needed
    videoCount: p.contentDetails?.itemCount || 0
  }));
}

// Gets all videos for a playlist
async function getPlaylistVideos(playlistId) {
  let videos = [];
  let nextPage = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&pageToken=${nextPage}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    videos.push(...(data.items || []));
    nextPage = data.nextPageToken || '';
  } while (nextPage);
  return videos.map(v => ({
    id: v.snippet.resourceId.videoId,
    title: v.snippet.title,
    thumbnail: v.snippet.thumbnails?.default?.url || ''
  }));
}

// Gets playlist metadata
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
    channel_thumbnail: '', // could be fetched separately
  };
}

export async function POST({ request }) {
  try {
    let { url, playlistId } = await request.json();
    if (!YOUTUBE_API_KEY) return json({ error: 'Missing YouTube API key' }, { status: 500 });

    // Handle playlist import (direct or from channel page)
    if (playlistId) {
      // Get playlist info and videos
      const info = await getPlaylistInfo(playlistId);
      if (!info) return json({ error: 'Playlist not found' }, { status: 404 });
      const videos = await getPlaylistVideos(playlistId);
      return json({ type: 'playlist', playlist: { ...info, videos } });
    }

    // Handle main URL entry (playlist or channel)
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
