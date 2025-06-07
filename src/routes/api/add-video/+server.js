import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

function extractIds(url) {
  let match;
  if ((match = url.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/))) {
    return { type: 'video', id: match[1] };
  }
  if ((match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/))) {
    return { type: 'playlist', id: match[1] };
  }
  if ((match = url.match(/channel\/([a-zA-Z0-9_-]+)/))) {
    return { type: 'channel', id: match[1] };
  }
  return null;
}

function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return (
    (parseInt(m?.[1] || 0) * 3600) +
    (parseInt(m?.[2] || 0) * 60) +
    (parseInt(m?.[3] || 0))
  );
}

async function fetchPlaylistVideos(playlistId, apiKey) {
  let videos = [];
  let nextPageToken = '';
  do {
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.items) videos.push(...data.items);
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return videos.map(item => item.contentDetails.videoId);
}

async function fetchUploadsPlaylistId(channelId, apiKey) {
  const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
  const res = await fetch(apiUrl);
  const data = await res.json();
  if (
    data.items &&
    data.items.length > 0 &&
    data.items[0].contentDetails &&
    data.items[0].contentDetails.relatedPlaylists &&
    data.items[0].contentDetails.relatedPlaylists.uploads
  ) {
    return data.items[0].contentDetails.relatedPlaylists.uploads;
  }
  return null;
}

async function fetchVideoMetadatas(videoIds, apiKey) {
  const batches = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    batches.push(videoIds.slice(i, i + 50));
  }

  let metaList = [];
  for (const batch of batches) {
    const ids = batch.join(',');
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${ids}&key=${apiKey}`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.items) metaList.push(...data.items);
  }
  return metaList;
}

export async function POST({ request }) {
  const { url } = await request.json();
  const info = extractIds(url);
  if (!info) return json({ error: 'Invalid YouTube link.' }, { status: 400 });

  let videoIds = [];

  if (info.type === 'video') {
    videoIds = [info.id];
  } else if (info.type === 'playlist') {
    videoIds = await fetchPlaylistVideos(info.id, env.YOUTUBE_API_KEY);
    if (videoIds.length === 0) return json({ error: 'No videos found in playlist.' }, { status: 404 });
  } else if (info.type === 'channel') {
    const uploadsPlaylist = await fetchUploadsPlaylistId(info.id, env.YOUTUBE_API_KEY);
    if (!uploadsPlaylist) return json({ error: 'Could not find uploads for channel.' }, { status: 404 });
    videoIds = await fetchPlaylistVideos(uploadsPlaylist, env.YOUTUBE_API_KEY);
    if (videoIds.length === 0) return json({ error: 'No videos found in channel.' }, { status: 404 });
  } else {
    return json({ error: 'Unsupported link type.' }, { status: 400 });
  }

  // Get metadata for all video IDs
  const videosMeta = await fetchVideoMetadatas(videoIds, env.YOUTUBE_API_KEY);

  // Insert each video into Supabase (can optimize with upsert or skip existing IDs)
  let added = 0;
  for (const vid of videosMeta) {
    const { id, snippet, contentDetails } = vid;
    const { title, channelId, channelTitle } = snippet;
    const length = parseDuration(contentDetails.duration);

    // Optional: Skip if video already exists
    const { data: existing } = await supabase.from('videos').select('id').eq('id', id).maybeSingle();
    if (existing) continue;

    const { error } = await supabase.from('videos').insert({
      id,
      title,
      channel_id: channelId,
      channel_name: channelTitle,
      length,
      added_by: null,
      created: new Date().toISOString()
    });
    if (!error) added++;
  }

  return json({ success: true, added });
}
