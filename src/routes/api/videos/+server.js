// src/routes/api/videos/+server.js
import { supabase } from '$lib/supabaseClient.js';
import 'dotenv/config';

const YT_API_KEY = process.env.YOUTUBE_API_KEY;

// Helper: Fetch single video metadata
async function fetchVideoDetails(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  return {
    id: videoId,
    youtubeurl: `https://www.youtube.com/watch?v=${videoId}`,
    title: item.snippet.title,
    duration: item.contentDetails.duration,
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    rating: "not rated yet",
    addedat: new Date().toISOString(),
    channeltitle: item.snippet.channelTitle,
    channelid: item.snippet.channelId,
  };
}

// Helper: Batch fetch multiple video details
async function fetchMultipleVideoDetails(videoIds) {
  if (videoIds.length === 0) return [];
  const ids = videoIds.join(',');
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${ids}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.items ?? []).map(item => ({
    id: item.id,
    youtubeurl: `https://www.youtube.com/watch?v=${item.id}`,
    title: item.snippet.title,
    duration: item.contentDetails.duration,
    thumbnail: `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
    rating: "not rated yet",
    addedat: new Date().toISOString(),
    channeltitle: item.snippet.channelTitle,
    channelid: item.snippet.channelId,
  }));
}

// Helper: Fetch all videos in a playlist
async function fetchPlaylistVideos(playlistId) {
  let videoIds = [];
  let nextPage = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&pageToken=${nextPage}&key=${YT_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) {
      videoIds = videoIds.concat(
        data.items
          .filter(item => item.snippet.resourceId.kind === "youtube#video")
          .map(item => item.snippet.resourceId.videoId)
      );
    }
    nextPage = data.nextPageToken || '';
  } while (nextPage);

  // Batch fetch details for all videoIds
  let videos = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batchIds = videoIds.slice(i, i + 50);
    const details = await fetchMultipleVideoDetails(batchIds);
    videos = videos.concat(details);
  }
  return videos;
}

// Helper: Fetch all uploads for a channel
async function fetchChannelUploads(channelId) {
  const url1 = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YT_API_KEY}`;
  const res1 = await fetch(url1);
  const data1 = await res1.json();
  const playlistId = data1.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) return [];
  return fetchPlaylistVideos(playlistId);
}

// --- API HANDLERS ---

// GET: Return all videos in DB
export async function GET() {
  const { data, error } = await supabase.from('videos').select('*').order('addedat', { ascending: false });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST: Add a video, playlist, or channel
export async function POST({ request }) {
  try {
    const body = await request.json();
    if (!body.type || !body.id) {
      return new Response(JSON.stringify({ error: 'Missing type or id' }), { status: 400 });
    }

    let newVideos = [];
    if (body.type === 'video') {
      const details = await fetchVideoDetails(body.id);
      if (details) newVideos = [details];
    } else if (body.type === 'playlist') {
      newVideos = await fetchPlaylistVideos(body.id);
    } else if (body.type === 'channel') {
      newVideos = await fetchChannelUploads(body.id);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
    }

    if (newVideos.length === 0) {
      return new Response(JSON.stringify({ success: false, added: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Deduplicate by video ID (against DB)
    const { data: existing, error: fetchErr } = await supabase.from('videos').select('id');
    const existingIds = (existing || []).map(v => v.id);

    const videosToAdd = newVideos.filter(v => !existingIds.includes(v.id));
    let addedCount = 0;
    if (videosToAdd.length > 0) {
      const { error } = await supabase.from('videos').insert(videosToAdd);
      if (error) throw error;
      addedCount = videosToAdd.length;
    }

    return new Response(JSON.stringify({ success: true, added: addedCount }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('API ERROR:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE: Remove all videos (for testing/dev only)
export async function DELETE() {
  try {
    const { error } = await supabase.from('videos').delete().neq('id', '');
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
