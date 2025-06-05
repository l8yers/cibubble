// src/routes/api/videos/+server.js
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const dbPath = path.resolve('src/lib/videos.json');
const YT_API_KEY = process.env.YOUTUBE_API_KEY;

// Fetches all metadata for a single video
async function fetchVideoDetails(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  return {
    id: videoId,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    title: item.snippet.title,
    duration: item.contentDetails.duration,
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    rating: "not rated yet",
    addedAt: new Date().toISOString(),
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
  };
}

// Fetches all video details in a playlist
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

// Fetches all uploads for a channel
async function fetchChannelUploads(channelId) {
  const url1 = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YT_API_KEY}`;
  const res1 = await fetch(url1);
  const data1 = await res1.json();
  const playlistId = data1.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) return [];
  return fetchPlaylistVideos(playlistId);
}

// Batch-fetches metadata for multiple videos
async function fetchMultipleVideoDetails(videoIds) {
  const ids = videoIds.join(',');
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${ids}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items.map(item => ({
    id: item.id,
    youtubeUrl: `https://www.youtube.com/watch?v=${item.id}`,
    title: item.snippet.title,
    duration: item.contentDetails.duration,
    thumbnail: `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
    rating: "not rated yet",
    addedAt: new Date().toISOString(),
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
  }));
}

// GET handler: returns all videos
export async function GET() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return new Response(data, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST handler: adds a video, playlist, or channel
export async function POST({ request }) {
  try {
    const body = await request.json();
    const raw = await fs.readFile(dbPath, 'utf8');
    const dbVideos = JSON.parse(raw);
    let newVideos = [];

    if (body.type === 'video') {
      const details = await fetchVideoDetails(body.id);
      if (details) newVideos = [details];
    } else if (body.type === 'playlist') {
      newVideos = await fetchPlaylistVideos(body.id);
    } else if (body.type === 'channel') {
      newVideos = await fetchChannelUploads(body.id);
    }

    // Deduplicate by video ID
    const allVideos = [...dbVideos];
    newVideos.forEach(video => {
      if (!allVideos.some(v => v.id === video.id)) {
        allVideos.push(video);
      }
    });

    await fs.writeFile(dbPath, JSON.stringify(allVideos, null, 2));
    return new Response(JSON.stringify({ success: true, added: newVideos.length }), {
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

// DELETE handler: clears the video database
export async function DELETE() {
  try {
    await fs.writeFile(dbPath, '[]');
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
