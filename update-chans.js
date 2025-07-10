import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://iqglferuworovlmbcdwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ2xmZXJ1d29yb3ZsbWJjZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzA2NDcsImV4cCI6MjA2NDkwNjY0N30.K38r9VgYhAWCP-VBPWtOdsOfQjPDGWFuwS8DS5aT3QA';
const YOUTUBE_API_KEY = 'AIzaSyD8t2BvFZD0NSpR1oyNG0uN0a44kNSGXWc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: Get uploads playlist ID for a channel
async function getUploadsPlaylistId(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

// Helper: Fetch new uploads since a given date
async function fetchNewUploads(playlistId, sinceISO) {
  let all = [], nextPage = '', stop = false;
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50${nextPage ? '&pageToken=' + nextPage : ''}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items) break;

    for (const item of data.items) {
      const published = item.snippet?.publishedAt;
      if (!published || (sinceISO && published <= sinceISO)) {
        stop = true;
        break;
      }
      all.push(item);
    }
    nextPage = (!stop && data.nextPageToken) ? data.nextPageToken : '';
  } while (nextPage && !stop);
  return all;
}

// --- NEW: Fetch durations for videoIds using YouTube API --- //
async function fetchDurationsForVideos(videoIds) {
  const results = {};
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(',')}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) {
      for (const item of data.items) {
        results[item.id] = parseISODuration(item.contentDetails.duration);
      }
    }
  }
  return results;
}

// Helper to parse ISO 8601 duration to seconds
function parseISODuration(iso) {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const [, h, m, s] = match.map(x => (x ? parseInt(x, 10) : 0));
  return ((h || 0) * 3600) + ((m || 0) * 60) + (s || 0);
}

async function main() {
  // Only get channels with last_synced_at set
  const { data: channels, error } = await supabase
    .from('channels')
    .select('id, name, country, level, tags, last_synced_at')
    .not('last_synced_at', 'is', null);
  if (error) throw new Error('Failed to fetch channels: ' + error.message);

  for (const chan of channels) {
    try {
      const uploadsPlaylistId = await getUploadsPlaylistId(chan.id);
      if (!uploadsPlaylistId) {
        console.log(`[FAIL] ${chan.name}: No uploads playlist`);
        continue;
      }

      const newVids = await fetchNewUploads(uploadsPlaylistId, chan.last_synced_at);
      if (!newVids.length) {
        console.log(`[OK] ${chan.name}: No new videos`);
        continue;
      }

      const tagsArray = Array.isArray(chan.tags)
        ? chan.tags
        : (typeof chan.tags === 'string'
          ? chan.tags.split(',').map(t => t.trim()).filter(Boolean)
          : []);

      // Prepare base video objects
      const toInsert = newVids.map(v => ({
        id: v.contentDetails?.videoId,
        title: v.snippet?.title,
        channel_id: chan.id,
        channel_name: chan.name,
        thumbnail: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.default?.url || '',
        length: null, // Placeholder, will fill in a second
        playlist_id: null,
        published: v.snippet?.publishedAt,
        created: new Date().toISOString(),
        playlist_position: v.snippet?.position ?? null,
        tags: tagsArray,
        country: chan.country || null,
        level: chan.level || null
      })).filter(v => !!v.id);

      // --- NEW: Fetch lengths for all new videos (in batches of 50) --- //
      const videoIds = toInsert.map(v => v.id);
      const durations = await fetchDurationsForVideos(videoIds);

      const toInsertWithLengths = toInsert.map(v => ({
        ...v,
        length: durations[v.id] ?? null
      }));

      // Batch insert (300 per batch)
      for (let i = 0; i < toInsertWithLengths.length; i += 300) {
        const batch = toInsertWithLengths.slice(i, i + 300);
        if (batch.length) {
          const { error: insertErr } = await supabase.from('videos').upsert(batch, { onConflict: 'id' });
          if (insertErr) throw new Error(insertErr.message);
        }
      }

      // Update sync timestamp
      await supabase
        .from('channels')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', chan.id);

      console.log(`[OK] ${chan.name}: Inserted ${toInsertWithLengths.length} new videos`);
    } catch (err) {
      console.error(`[FAIL] ${chan.name}: ${err.message}`);
    }
    await new Promise(res => setTimeout(res, 350)); // avoid hammering APIs
  }
}

main();
