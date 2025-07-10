import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// ENV VARS
const SUPABASE_URL = 'https://iqglferuworovlmbcdwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ2xmZXJ1d29yb3ZsbWJjZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzA2NDcsImV4cCI6MjA2NDkwNjY0N30.K38r9VgYhAWCP-VBPWtOdsOfQjPDGWFuwS8DS5aT3QA';
const YOUTUBE_API_KEY = 'AIzaSyCVeNHjLfZpCEKTuqjzAtVLYC-gaeRcHf0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helpers

// CORRECTED! No 'id' or 'type=playlist' here.
async function getAllPlaylists(channelId) {
  let playlists = [];
  let nextPage = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channelId}&maxResults=50${nextPage ? `&pageToken=${nextPage}` : ''}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) playlists.push(...data.items);
    nextPage = data.nextPageToken || '';
  } while (nextPage);
  return playlists;
}

async function getAllPlaylistVideoIds(playlistId) {
  let ids = [], nextPage = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50${nextPage ? `&pageToken=${nextPage}` : ''}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) {
      data.items.forEach(item => {
        if (item.contentDetails?.videoId) ids.push(item.contentDetails.videoId);
      });
    }
    nextPage = data.nextPageToken || '';
  } while (nextPage);
  return ids;
}

async function main() {
  // Grab all channels where playlists_last_synced is null
  const { data: channels, error } = await supabase
    .from('channels')
    .select('id, name')
    .is('playlists_last_synced', null);

  if (error) throw new Error('Failed to fetch channels: ' + error.message);

  for (const chan of channels) {
    try {
      const playlists = await getAllPlaylists(chan.id);
      let batch = [];

      for (const pl of playlists) {
        const videoIds = await getAllPlaylistVideoIds(pl.id);
        batch.push({
          id: pl.id,
          channel_id: chan.id,
          title: pl.snippet?.title || '',
          thumbnail: pl.snippet?.thumbnails?.high?.url || pl.snippet?.thumbnails?.default?.url || '',
          description: pl.snippet?.description || '',
          videos: videoIds, // text[] in PG
        });
      }

      // Upsert all playlists for this channel in one go
      if (batch.length) {
        const { error: upsertErr } = await supabase.from('playlists').upsert(batch, { onConflict: 'id' });
        if (upsertErr) {
          console.error(`[INSERT ERROR] ${chan.name}: ${upsertErr.message}`);
          continue;
        }
      }

      // Set last synced
      await supabase
        .from('channels')
        .update({ playlists_last_synced: new Date().toISOString() })
        .eq('id', chan.id);

      console.log(`[OK] ${chan.name}: Inserted/updated ${batch.length} playlists`);
    } catch (err) {
      console.error(`[FAIL] ${chan.name}: ${err.message}`);
    }
  }
}

main();
