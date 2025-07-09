import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// ENV VARS
const SUPABASE_URL = 'https://iqglferuworovlmbcdwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ2xmZXJ1d29yb3ZsbWJjZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzA2NDcsImV4cCI6MjA2NDkwNjY0N30.K38r9VgYhAWCP-VBPWtOdsOfQjPDGWFuwS8DS5aT3QA';
const YOUTUBE_API_KEY = 'AIzaSyCVeNHjLfZpCEKTuqjzAtVLYC-gaeRcHf0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helpers
async function getUploadsPlaylistId(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return {
    uploadsPlaylistId: data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null,
    channelName: data.items?.[0]?.snippet?.title || channelId
  };
}

async function getUploadsPlaylistVideos(playlistId) {
  let videos = [], nextPage = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50${nextPage ? '&pageToken=' + nextPage : ''}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items) break;
    videos.push(...data.items);
    nextPage = data.nextPageToken || '';
  } while (nextPage);
  return videos;
}

async function fetchVideoDurations(videoIds) {
  let durations = {};
  for (let i = 0; i < videoIds.length; i += 50) {
    const ids = videoIds.slice(i, i + 50).join(',');
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) {
      data.items.forEach(item => {
        const iso = item.contentDetails?.duration || '';
        const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        let seconds =
          (parseInt(match?.[1] || 0) * 3600) +
          (parseInt(match?.[2] || 0) * 60) +
          (parseInt(match?.[3] || 0));
        durations[item.id] = seconds;
      });
    }
  }
  return durations;
}

async function main() {
  // ✅ Only get channels where last_synced_at is NULL
  const { data: channels, error } = await supabase
    .from('channels')
    .select('id, name, tags, level, country')
    .is('last_synced_at', null);

  if (error) throw new Error('Failed to fetch channels: ' + error.message);

  for (const chan of channels) {
    try {
      const { uploadsPlaylistId, channelName } = await getUploadsPlaylistId(chan.id);
      if (!uploadsPlaylistId) {
        console.log(`[FAIL] ${channelName}: No uploads playlist`);
        continue;
      }

      const playlistVideos = await getUploadsPlaylistVideos(uploadsPlaylistId);
      const videoIds = playlistVideos.map(v => v.contentDetails?.videoId).filter(Boolean);
      const durations = await fetchVideoDurations(videoIds);

      const videosToInsert = playlistVideos
        .filter(v => {
          const title = v.snippet?.title?.toLowerCase() || '';
          if (!title || title === 'deleted video' || title === 'private video') return false;
          const vid = v.contentDetails?.videoId;
          if (!vid || !durations[vid] || durations[vid] < 180) return false;
          return true;
        })
        .map(v => ({
          id: v.contentDetails.videoId,
          title: v.snippet.title,
          channel_id: chan.id,
          channel_name: chan.name,
          thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url || '',
          length: durations[v.contentDetails.videoId] ?? null,
          playlist_id: null,
          published: v.snippet.publishedAt,
          created: new Date().toISOString(),
          playlist_position: v.snippet.position ?? null,
          tags: chan.tags ? (
            Array.isArray(chan.tags)
              ? chan.tags
              : String(chan.tags).split(',').map(t => t.trim()).filter(Boolean)
          ) : [],
          country: chan.country || null,
          level: chan.level || null,
        }));

      let totalInserted = 0;
      for (let i = 0; i < videosToInsert.length; i += 200) {
        const batch = videosToInsert.slice(i, i + 200);
        const { error: insertErr } = await supabase.from('videos').upsert(batch, { onConflict: 'id' });
        if (insertErr) {
          console.error(`[INSERT ERROR] ${channelName}: ${insertErr.message}`);
        } else {
          totalInserted += batch.length;
        }
      }

      await supabase
        .from('channels')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', chan.id);

      console.log(`[OK] ${channelName}: Inserted ${totalInserted} videos from uploads playlist`);
    } catch (err) {
      console.error(`[FAIL] ${chan.name}: ${err.message}`);
    }
  }
}

main();
