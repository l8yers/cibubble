import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://iqglferuworovlmbcdwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ2xmZXJ1d29yb3ZsbWJjZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzA2NDcsImV4cCI6MjA2NDkwNjY0N30.K38r9VgYhAWCP-VBPWtOdsOfQjPDGWFuwS8DS5aT3QA';
const YOUTUBE_API_KEY = 'AIzaSyD8t2BvFZD0NSpR1oyNG0uN0a44kNSGXWc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to parse ISO 8601 duration to seconds
function parseISODuration(iso) {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const [, h, m, s] = match.map(x => (x ? parseInt(x, 10) : 0));
  return ((h || 0) * 3600) + ((m || 0) * 60) + (s || 0);
}

// Fetch durations from YouTube API in batches of 50
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

async function main() {
  // Fetch all video IDs with null length (limit to 1000 at a time for safety)
  let { data: videos, error } = await supabase
    .from('videos')
    .select('id')
    .is('length', null)
    .limit(1000);

  if (error) throw new Error('Failed to fetch videos: ' + error.message);

  if (!videos || !videos.length) {
    console.log('No videos with null length found.');
    return;
  }

  const videoIds = videos.map(v => v.id);
  console.log(`Backfilling ${videoIds.length} videos with missing length...`);

  const durations = await fetchDurationsForVideos(videoIds);

  // Patch lengths in Supabase
  let updated = 0;
  for (const vid of videoIds) {
    const length = durations[vid] ?? null;
    if (length && !isNaN(length)) {
      const { error: updateErr } = await supabase
        .from('videos')
        .update({ length })
        .eq('id', vid);
      if (updateErr) {
        console.log(`[FAIL] ${vid}: ${updateErr.message}`);
      } else {
        updated++;
        console.log(`[OK] ${vid}: length=${length}`);
      }
    } else {
      console.log(`[SKIP] ${vid}: Could not fetch duration`);
    }
    await new Promise(res => setTimeout(res, 110)); // be gentle to API/quota
  }

  console.log(`Done! Updated ${updated}/${videoIds.length} videos.`);
}

main();
