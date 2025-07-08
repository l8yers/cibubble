import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// --- Config ---
const SUPABASE_URL = 'https://iqglferuworovlmbcdwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ2xmZXJ1d29yb3ZsbWJjZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzA2NDcsImV4cCI6MjA2NDkwNjY0N30.K38r9VgYhAWCP-VBPWtOdsOfQjPDGWFuwS8DS5aT3QA';
const YOUTUBE_API_KEY = 'AIzaSyAzRowhM9LUtWDY5QnaEc70vzgiSFHilus';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getAllChannels() {
  const { data, error } = await supabase.from('channels').select('id, name');
  if (error) throw new Error(error.message);
  return data;
}

async function getPlaylists(channelId) {
  let playlists = [];
  let nextPage = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channelId}&maxResults=50${nextPage ? `&pageToken=${nextPage}` : ''}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) playlists.push(...data.items);
    nextPage = data.nextPageToken || '';
  } while (nextPage);
  return playlists.map(pl => ({
    id: pl.id,
    title: pl.snippet.title
  }));
}

async function getPlaylistVideos(playlistId) {
  let vids = [];
  let nextPage = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50${nextPage ? `&pageToken=${nextPage}` : ''}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) vids.push(...data.items);
    nextPage = data.nextPageToken || '';
  } while (nextPage);
  return vids.map(v => v.contentDetails.videoId);
}

async function backfillPlaylistIds() {
  const channels = await getAllChannels();
  let updatedCount = 0;
  for (const channel of channels) {
    console.log(`Processing channel ${channel.name} (${channel.id})`);
    const playlists = await getPlaylists(channel.id);
    for (const playlist of playlists) {
      const videoIds = await getPlaylistVideos(playlist.id);
      if (!videoIds.length) continue;
      // Update each video’s playlist_id if it exists in the DB
      const { error } = await supabase
        .from('videos')
        .update({ playlist_id: playlist.id })
        .in('id', videoIds);
      if (!error) {
        console.log(`  Updated ${videoIds.length} videos for playlist ${playlist.title}`);
        updatedCount += videoIds.length;
      } else {
        console.error(`  Failed to update playlist ${playlist.title}:`, error.message);
      }
      await new Promise(res => setTimeout(res, 300)); // Throttle
    }
  }
  console.log(`\nFinished. Total videos updated: ${updatedCount}`);
}

backfillPlaylistIds();