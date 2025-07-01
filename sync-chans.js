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

function isGoodVideo(v, durations) {
  const title = v.snippet?.title?.toLowerCase() ?? '';
  if (!title || title === 'deleted video' || title === 'private video') return false;
  const vid = v.contentDetails?.videoId;
  if (!vid || !durations[vid] || durations[vid] < 180) return false;
  return true;
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
  console.log('Starting video sync for unsynced channels (using uploads playlist)...');
  // Only fetch channels that haven't been synced yet
  const { data: channels, error: chanErr } = await supabase
    .from('channels')
    .select('*')
    .is('last_synced_at', null);
  if (chanErr) throw new Error('Failed to fetch channels: ' + chanErr.message);

  if (!channels.length) {
    console.log('No unsynced channels to process.');
    return;
  }

  let report = [];
  for (const channel of channels) {
    let channelResult = { id: channel.id, name: channel.name, added: 0, error: null };
    try {
      // --- 1. Upsert all manual playlists for UI ---
      const plists = await getPlaylists(channel.id);
      if (plists.length) {
        let { error: plErr } = await supabase.from('playlists').upsert(plists, { onConflict: 'id' });
        if (plErr) throw new Error('Failed to upsert playlists: ' + plErr.message);
      }

      // --- 2. Fetch uploads playlist ID and metadata ---
      const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channel.id}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const uploadsPlaylistId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      const channelTitle = data.items?.[0]?.snippet?.title || '';
      if (!uploadsPlaylistId) throw new Error('No uploads playlist found for channel');

      // --- 3. Upsert uploads playlist (even if not in user playlists) ---
      let uploadsPlaylistMeta = {
        id: uploadsPlaylistId,
        channel_id: channel.id,
        title: 'Uploads',
        thumbnail: '', // optional: can fetch or leave blank
        description: `All uploads for ${channelTitle}`
      };
      await supabase.from('playlists').upsert([uploadsPlaylistMeta], { onConflict: 'id' });

      // --- 4. Fetch ALL videos from uploads playlist ---
      const allVideos = await getPlaylistVideos(uploadsPlaylistId);

      // --- 5. De-duplicate by video id ---
      const seen = new Set();
      const dedupedVideos = [];
      for (const v of allVideos) {
        if (!seen.has(v.id)) {
          dedupedVideos.push(v);
          seen.add(v.id);
        }
      }

      if (dedupedVideos.length === 0) {
        channelResult.info = 'No videos found';
      } else {
        // Set video fields from channel for consistency
        const channelTags = channel.tags
          ? Array.isArray(channel.tags)
            ? channel.tags
            : String(channel.tags).split(',').map(t => t.trim()).filter(Boolean)
          : [];
        const country = channel.country || null;
        const level = channel.level || null;
        const toUpsert = dedupedVideos.map(v => ({
          ...v,
          tags: channelTags, // array for Postgres text[]
          country,
          level,
        }));

        let { error: insErr } = await supabase.from('videos').upsert(toUpsert, { onConflict: 'id' });
        if (insErr) throw new Error(insErr.message);

        channelResult.added = toUpsert.length;
      }

      // === The crucial bit: update last_synced_at! ===
      await supabase.from('channels').update({ last_synced_at: new Date().toISOString() }).eq('id', channel.id);

      console.log(`[OK] ${channel.name}: +${channelResult.added} videos`);
    } catch (err) {
      channelResult.error = err.message;
      console.error(`[FAIL] ${channel.name}: ${err.message}`);
    }
    report.push(channelResult);
    await new Promise(res => setTimeout(res, 300)); // avoid hammering APIs
  }

  // === Summary Report ===
  const addedTotal = report.reduce((sum, r) => sum + (r.added || 0), 0);
  console.log(`\n=== SYNC COMPLETE ===`);
  report.forEach(r =>
    console.log(`${r.name}: +${r.added || 0} ${r.error ? '❌ ' + r.error : ''}`)
  );
  console.log(`Total channels processed: ${report.length}`);
  console.log(`Total videos added: ${addedTotal}`);
}

main();
