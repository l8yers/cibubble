import { createClient } from '@supabase/supabase-js';

// ==== CONFIG ====
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_CHANNEL_ID = 'UC4Xs0dO3omM54v882RT4cQA';
const ADDED_BY = null; // or your test user id

// --- Helpers (same as before) ---

function normalizeTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return [...new Set(raw.map(t => String(t || '').trim().toLowerCase()).filter(Boolean))];
  }
  return [...new Set(String(raw)
    .replace(/\//g, ',')
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
  )];
}

function normalizeCountry(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const val = raw.trim().toLowerCase();
  return val === '' ? null : val;
}

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
            if (!dur || typeof dur !== "string") {
              return { id: v.id, length: 0 };
            }
            return {
              id: v.id,
              length: parseDuration(dur),
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
  const vid = v.contentDetails?.videoId;
  if (!title) return false;
  if (title === 'deleted video' || title === 'private video') return false;
  if (!vid || !durations[vid]) return false;
  if (durations[vid] < 180) return false;
  return true;
}

async function getChannelInfo(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items || data.items.length === 0) return null;
    const c = data.items[0];
    return {
      id: c.id,
      name: c.snippet.title,
      thumbnail: c.snippet.thumbnails?.default?.url || '',
      description: c.snippet.description,
      uploadsPlaylistId: c.contentDetails?.relatedPlaylists?.uploads,
    };
  } catch (err) {
    return null;
  }
}

async function getPlaylists(channelId) {
  let playlists = [];
  let nextPage = '';
  try {
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channelId}&maxResults=50&pageToken=${nextPage}&key=${YOUTUBE_API_KEY}`;
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
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&pageToken=${nextPage}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items) videos.push(...data.items);
      nextPage = data.nextPageToken || '';
    } while (nextPage);
  } catch (err) {}
  return videos;
}

async function getKnownVideoIdsForChannel(channelId) {
  const { data, error } = await supabase
    .from('videos')
    .select('id')
    .eq('channel_id', channelId);
  if (error) throw new Error(error.message);
  return new Set(data.map(v => v.id));
}

// --- Main ---
async function main() {
  // Set the channel's level in the channels table before running!
  const { data: dbData, error: dbError } = await supabase.from('channels').select('*').eq('id', TEST_CHANNEL_ID);
  if (dbError) throw new Error('Failed to fetch channel: ' + dbError.message);
  if (!dbData || dbData.length === 0) {
    console.log('Channel not found:', TEST_CHANNEL_ID);
    return;
  }
  const channel = dbData[0];
  const tagArr = normalizeTags(channel.tags);
  const normCountry = normalizeCountry(channel.country);
  const level = channel.level || 'notyet';

  // Upsert playlists for FK
  const playlists = await getPlaylists(channel.id);
  if (playlists.length > 0) {
    const { error: playlistError } = await supabase.from('playlists').upsert(playlists);
    if (playlistError) {
      console.log(`Failed to upsert playlists for channel ${channel.id}: ${playlistError.message}`);
    }
  }

  // Get all videos from all playlists (including uploads, but don't set playlist_id for uploads!)
  let allVideos = [];
  for (const pl of playlists) {
    const vids = await getPlaylistVideos(pl.id);
    if (vids && vids.length) {
      // Attach playlist_id for these videos
      allVideos.push(...vids.map(v => ({ ...v, playlist_id: pl.id })));
    }
  }

  // Deduplicate by videoId (most videos only in one playlist, but just in case)
  const seen = new Set();
  const dedupedVideos = [];
  for (const v of allVideos) {
    const vid = v.contentDetails?.videoId;
    if (vid && !seen.has(vid)) {
      dedupedVideos.push(v);
      seen.add(vid);
    }
  }

  // Get known IDs for this channel
  const knownIds = await getKnownVideoIdsForChannel(channel.id);

  // Get durations
  const videoIds = dedupedVideos.map((v) => v.contentDetails.videoId).filter(Boolean);
  let durations = {};
  if (videoIds.length) durations = await fetchVideoDurations(videoIds);

  // Filter, build upsert array
  const videosToUpsert = dedupedVideos
    .filter((v) => isGoodVideo(v, durations) && !knownIds.has(v.contentDetails.videoId))
    .map((v) => ({
      id: v.contentDetails.videoId,
      playlist_id: v.playlist_id || null,
      channel_id: channel.id,
      title: v.snippet.title,
      channel_name: channel.name,
      thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url || '',
      length: durations[v.contentDetails.videoId] ?? null,
      published: v.snippet.publishedAt,
      created: new Date().toISOString(),
      playlist_position: v.snippet.position ?? null,
      level,
      country: normCountry,
      tags: tagArr,
      added_by: ADDED_BY
    }));

  if (videosToUpsert.length > 0) {
    console.log(`About to upsert ${videosToUpsert.length} videos for "${channel.name}" (${channel.id})`);
    videosToUpsert.forEach((v, i) =>
      console.log(`  [${i+1}] ${v.title} (${v.id}) | Level: ${v.level} | Playlist: ${v.playlist_id} | Position: ${v.playlist_position}`)
    );
    const { data: upserted, error: videoError } = await supabase.from('videos').upsert(videosToUpsert);
    if (videoError) {
      console.log(`Failed to upsert videos for channel ${channel.id}: ${videoError.message}`);
    } else {
      console.log(`Added/updated ${videosToUpsert.length} new videos for "${channel.name}" (${channel.id})`);
    }
  } else {
    console.log(`No new videos for "${channel.name}" (${channel.id})`);
  }
}
main();
