import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// === HARDCODED ENVS ===
const SUPABASE_URL = 'https://iqglferuworovlmbcdwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ2xmZXJ1d29yb3ZsbWJjZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzA2NDcsImV4cCI6MjA2NDkwNjY0N30.K38r9VgYhAWCP-VBPWtOdsOfQjPDGWFuwS8DS5aT3QA';
const YOUTUBE_API_KEY = 'AIzaSyAzRowhM9LUtWDY5QnaEc70vzgiSFHilus';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === Helpers ===

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

async function getPlaylists(channelId) {
  let playlists = [];
  let nextPage = '';
  try {
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channelId}&maxResults=50${nextPage ? '&pageToken=' + nextPage : ''}&key=${YOUTUBE_API_KEY}`;
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

async function getPlaylistVideos(playlistId) {
  let videos = [];
  let nextPage = '';
  try {
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50${nextPage ? '&pageToken=' + nextPage : ''}&key=${YOUTUBE_API_KEY}`;
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
      playlist_position: v.snippet.position ?? null,
    }));
}

// === MAIN SYNC LOGIC ===

async function main() {
  console.log('Syncing all channels: all playlists and uploads');
  const { data: channels, error: chanErr } = await supabase
    .from('channels')
    .select('*');

  if (chanErr) throw new Error('Failed to fetch channels: ' + chanErr.message);

  let grandTotalPlaylists = 0, grandTotalVideos = 0, grandTotalUploads = 0;
  let summary = [];

  for (const channel of channels) {
    let report = {
      channel_id: channel.id,
      channel_name: channel.name,
      playlist_count: 0,
      playlist_video_count: 0,
      uploads_video_count: 0,
      total_videos: 0,
      error: null,
    };
    try {
      // 1. Fetch and upsert all playlists
      const playlists = await getPlaylists(channel.id);
      report.playlist_count = playlists.length;
      grandTotalPlaylists += playlists.length;

      if (playlists.length) {
        await supabase.from('playlists').upsert(playlists, { onConflict: 'id' });
      }

      // 2. For each playlist, get videos and upsert with correct playlist_id
      let playlistVideoIds = new Set();
      let videosToInsert = [];
      for (const pl of playlists) {
        const vids = await getPlaylistVideos(pl.id);
        vids.forEach(v => {
          playlistVideoIds.add(v.id);
          videosToInsert.push({ ...v, playlist_id: pl.id });
        });
      }
      report.playlist_video_count = playlistVideoIds.size;

      // 3. Get uploads playlist id and videos
      const chanDataUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channel.id}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(chanDataUrl);
      const chanData = await res.json();
      const uploadsPlaylistId = chanData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) {
        report.error = 'No uploads playlist';
        summary.push(report);
        continue;
      }
      const uploadsVideos = await getPlaylistVideos(uploadsPlaylistId);

      // 4. Add uploads videos not already in a playlist, with playlist_id: null
      let uploadsOnly = 0;
      uploadsVideos.forEach(v => {
        if (!playlistVideoIds.has(v.id)) {
          videosToInsert.push({ ...v, playlist_id: null });
          uploadsOnly += 1;
        }
      });
      report.uploads_video_count = uploadsOnly;
      report.total_videos = videosToInsert.length;

      grandTotalVideos += videosToInsert.length;
      grandTotalUploads += uploadsOnly;

      // 5. Batch upsert videos (in batches of e.g. 300)
      for (let i = 0; i < videosToInsert.length; i += 300) {
        const batch = videosToInsert.slice(i, i + 300);
        if (batch.length) {
          await supabase.from('videos').upsert(batch, { onConflict: 'id' });
        }
      }

      // 6. Mark channel as synced
      await supabase.from('channels').update({ last_synced_at: new Date().toISOString() }).eq('id', channel.id);

      console.log(`[OK] ${channel.name}: Playlists=${report.playlist_count}, Playlist videos=${report.playlist_video_count}, Uploads-only=${report.uploads_video_count}, Total videos=${report.total_videos}`);
    } catch (err) {
      report.error = err.message;
      console.error(`[FAIL] ${channel.name}: ${err.message}`);
    }
    summary.push(report);
    await new Promise(res => setTimeout(res, 350)); // optional: avoid hammering APIs
  }

  // === Summary Report ===
  console.log('\n=== SUMMARY REPORT ===');
  summary.forEach(r => {
    if (r.error) {
      console.log(`[FAIL] ${r.channel_name}: ${r.error}`);
    } else {
      console.log(
        `[OK] ${r.channel_name} | Playlists: ${r.playlist_count} | Playlist vids: ${r.playlist_video_count} | Uploads-only vids: ${r.uploads_video_count} | Total: ${r.total_videos}`
      );
    }
  });
  console.log('\n==== GRAND TOTALS ====');
  console.log(`Channels processed: ${summary.length}`);
  console.log(`Playlists found: ${grandTotalPlaylists}`);
  console.log(`Videos inserted: ${grandTotalVideos}`);
  console.log(`Uploads-only (not in playlist): ${grandTotalUploads}`);
}

main();
