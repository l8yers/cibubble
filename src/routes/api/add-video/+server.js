import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Extract ID helpers (improved to support all cases)
function extractIds(url) {
  let match;
  if ((match = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]{24})/))) return { type: 'channel', id: match[1] };
  if ((match = url.match(/youtube\.com\/user\/([a-zA-Z0-9_-]+)/))) return { type: 'user', username: match[1] };
  if ((match = url.match(/youtube\.com\/@([a-zA-Z0-9._-]+)/))) return { type: 'handle', handle: match[1] };
  if ((match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/))) return { type: 'playlist', id: match[1] };
  if ((match = url.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/))) return { type: 'video', id: match[1] };
  return null;
}
async function getChannelIdByUserOrHandle({ username, handle }, apiKey) {
  let url, res, data;
  if (username) {
    url = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${username}&key=${apiKey}`;
    res = await fetch(url); data = await res.json();
    if (data.items && data.items[0]?.id) return data.items[0].id;
  }
  if (handle) {
    url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=%40${handle}&key=${apiKey}`;
    res = await fetch(url); data = await res.json();
    if (data.items && data.items[0]?.snippet?.channelId) return data.items[0].snippet.channelId;
  }
  return null;
}
async function fetchPlaylistVideos(playlistId, apiKey) {
  let videos = [], nextPageToken = '';
  do {
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.items) videos.push(...data.items);
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);
  return videos
    .map(item => ({
      id: item.contentDetails?.videoId,
      title: item.snippet?.title || '',
      channel_id: item.snippet?.channelId || '',
      channel_name: item.snippet?.channelTitle || '',
      thumbnail: item.snippet?.thumbnails?.medium?.url || '',
      // Don't fetch duration yet (extra API calls)
    }))
    .filter(v => v.id && v.title && v.title !== "Private video" && v.title !== "Deleted video");
}
async function fetchPlaylistMeta(playlistId, apiKey) {
  const apiUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
  const res = await fetch(apiUrl);
  const data = await res.json();
  if (data.items && data.items[0]) {
    return {
      id: data.items[0].id,
      title: data.items[0].snippet?.title,
      thumbnail: data.items[0].snippet?.thumbnails?.medium?.url || '',
    };
  }
  return null;
}
async function fetchChannelPlaylists(channelId, apiKey) {
  let playlists = [], nextPageToken = '';
  do {
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=50&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.items) playlists.push(...data.items);
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);
  return playlists
    .filter(pl => pl.snippet?.title && pl.contentDetails?.itemCount > 0)
    .map(pl => ({
      id: pl.id,
      title: pl.snippet.title,
      thumbnail: pl.snippet.thumbnails?.medium?.url || '',
      videoCount: pl.contentDetails.itemCount,
    }));
}

export async function POST({ request }) {
  const { url, playlistId } = await request.json();
  if (!url && !playlistId) return json({ error: 'No URL or playlistId provided.' }, { status: 400 });

  // --- Playlist Import (if playlistId is posted) ---
  if (playlistId) {
    // Fetch playlist meta and all videos for it:
    const meta = await fetchPlaylistMeta(playlistId, env.YOUTUBE_API_KEY);
    const videos = await fetchPlaylistVideos(playlistId, env.YOUTUBE_API_KEY);
    return json({ type: 'playlist', playlist: { ...meta, videos } });
  }

  // --- Initial Import via URL ---
  const info = extractIds(url);
  if (!info) return json({ error: 'Invalid YouTube link.' }, { status: 400 });

  // Single Video:
  if (info.type === 'video') {
    // Fetch meta only:
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${info.id}&key=${env.YOUTUBE_API_KEY}`;
    const res = await fetch(apiUrl); const data = await res.json();
    if (!data.items?.length) return json({ error: 'Video not found.' }, { status: 404 });
    const vid = data.items[0];
    return json({
      type: 'video',
      video: {
        id: vid.id,
        title: vid.snippet?.title,
        channel_id: vid.snippet?.channelId,
        channel_name: vid.snippet?.channelTitle,
        thumbnail: `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`
      }
    });
  }

  // Playlist:
  if (info.type === 'playlist') {
    const meta = await fetchPlaylistMeta(info.id, env.YOUTUBE_API_KEY);
    const videos = await fetchPlaylistVideos(info.id, env.YOUTUBE_API_KEY);
    return json({ type: 'playlist', playlist: { ...meta, videos } });
  }

  // Channel (by id/user/handle):
  let channelId = null;
  if (info.type === 'channel') channelId = info.id;
  else if (info.type === 'user' || info.type === 'handle') {
    channelId = await getChannelIdByUserOrHandle(info, env.YOUTUBE_API_KEY);
    if (!channelId) return json({ error: 'Could not resolve channel.' }, { status: 400 });
  }
  if (channelId) {
    const playlists = await fetchChannelPlaylists(channelId, env.YOUTUBE_API_KEY);
    return json({ type: 'channel', playlists });
  }

  return json({ error: 'Unsupported or invalid link.' }, { status: 400 });
}
