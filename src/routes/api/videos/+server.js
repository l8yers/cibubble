// src/routes/api/videos/+server.js
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

// Path to your local JSON "database"
const dbPath = path.resolve('src/lib/videos.json');
const YT_API_KEY = process.env.YOUTUBE_API_KEY;

// Helper: fetch all videos in a playlist using YouTube API
async function fetchPlaylistVideos(playlistId) {
  let videos = [];
  let nextPage = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&pageToken=${nextPage}&key=${YT_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) {
      videos = videos.concat(
        data.items.map(item => ({
          type: 'video',
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          playlist: playlistId,
        }))
      );
    }
    nextPage = data.nextPageToken || '';
  } while (nextPage);
  return videos;
}

// Helper: fetch all uploads from a channel using YouTube API
async function fetchChannelUploads(channelId) {
  // 1. Get the uploads playlist ID for the channel
  const url1 = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YT_API_KEY}`;
  const res1 = await fetch(url1);
  const data1 = await res1.json();
  const playlistId = data1.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) return [];
  // 2. Fetch all videos from uploads playlist
  return fetchPlaylistVideos(playlistId);
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
      newVideos = [body];
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
