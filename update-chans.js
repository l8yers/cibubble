import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://iqglferuworovlmbcdwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ2xmZXJ1d29yb3ZsbWJjZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzA2NDcsImV4cCI6MjA2NDkwNjY0N30.K38r9VgYhAWCP-VBPWtOdsOfQjPDGWFuwS8DS5aT3QA';
const YOUTUBE_API_KEY = 'AIzaSyD8t2BvFZD0NSpR1oyNG0uN0a44kNSGXWc';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getUploadsPlaylistId(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

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

      const toInsert = newVids.map(v => ({
        id: v.contentDetails?.videoId,
        title: v.snippet?.title,
        channel_id: chan.id,
        channel_name: chan.name,
        thumbnail: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.default?.url || '',
        length: null, // You can fetch durations in a separate step if needed.
        playlist_id: null,
        published: v.snippet?.publishedAt,
        created: new Date().toISOString(),
        playlist_position: v.snippet?.position ?? null,
        tags: tagsArray,
        country: chan.country || null,
        level: chan.level || null
      })).filter(v => !!v.id);

      // Batch insert (300 per batch)
      for (let i = 0; i < toInsert.length; i += 300) {
        const batch = toInsert.slice(i, i + 300);
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

      console.log(`[OK] ${chan.name}: Inserted ${toInsert.length} new videos`);
    } catch (err) {
      console.error(`[FAIL] ${chan.name}: ${err.message}`);
    }
    await new Promise(res => setTimeout(res, 350)); // avoid hammering APIs
  }
}

main();
