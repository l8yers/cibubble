import { createClient } from '@supabase/supabase-js';

// ===== CONFIG =====
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== HELPERS =====
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
  if (!title) return false;
  if (title === 'deleted video' || title === 'private video') return false;
  const vid = v.contentDetails?.videoId;
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

async function getKnownVideoIdsForChannel(channelId) {
  const { data, error } = await supabase
    .from('videos')
    .select('id')
    .eq('channel_id', channelId);
  if (error) throw new Error(error.message);
  return new Set(data.map(v => v.id));
}

async function getRecentUploads(uploadsPlaylistId, knownIds, publishedAfter = null) {
  let videos = [];
  let nextPage = '';
  let stop = false;
  do {
    let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`;
    if (nextPage) url += `&pageToken=${nextPage}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) {
      for (const v of data.items) {
        const vid = v.contentDetails.videoId;
        const published = v.snippet.publishedAt;
        if (knownIds.has(vid)) { stop = true; break; }
        if (publishedAfter && new Date(published) < publishedAfter) { stop = true; break; }
        videos.push(v);
      }
    }
    nextPage = data.nextPageToken || '';
  } while (nextPage && !stop);

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
      playlist_id: uploadsPlaylistId,
      published: v.snippet.publishedAt,
      created: new Date().toISOString(),
      level: 'notyet',
      playlist_position: v.snippet.position ?? null,
    }));
}

// ===== MAIN LOGIC =====

async function getAllChannels() {
  const { data, error } = await supabase.from('channels').select('*');
  if (error) throw new Error('Failed to fetch channels: ' + error.message);
  return data;
}

async function updateChannelAndVideos(channel) {
  const channelInfo = await getChannelInfo(channel.id);
  if (!channelInfo) {
    console.log(`Failed to fetch info for ${channel.name} (${channel.id})`);
    return { error: true, channel_id: channel.id, count: 0 };
  }
  // Playlists FIRST!
  const playlists = await getPlaylists(channel.id);
  if (playlists.length > 0) {
    const { error: playlistError } = await supabase.from('playlists').upsert(playlists);
    if (playlistError) {
      console.log(`Failed to upsert playlists for channel ${channel.id}: ${playlistError.message}`);
    }
  }
  if (!channelInfo.uploadsPlaylistId) {
    console.log(`No uploads playlist for channel: ${channel.id}`);
    return { error: true, channel_id: channel.id, count: 0 };
  }
  const knownIds = await getKnownVideoIdsForChannel(channel.id);
  let publishedAfter = null;
  if (knownIds.size === 0) {
    publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }
  const newVideos = await getRecentUploads(channelInfo.uploadsPlaylistId, knownIds, publishedAfter);
  const tagArr = normalizeTags(channel.tags);
  const normCountry = normalizeCountry(channel.country);
  const videosToUpsert = newVideos.map((v) => ({
    id: v.id,
    playlist_id: v.playlist_id || null,
    channel_id: v.channel_id || null,
    title: v.title || '',
    channel_name: v.channel_name || '',
    thumbnail: v.thumbnail || '',
    length: v.length || null,
    published: v.published || null,
    created: v.created || null,
    playlist_position: v.playlist_position || null,
    level: v.level || 'notyet',
    country: normCountry,
    tags: tagArr,
    added_by: null
  }));

  if (videosToUpsert.length > 0) {
    const { error: videoError } = await supabase.from('videos').upsert(videosToUpsert);
    if (videoError) {
      console.log(`Failed to upsert videos for channel ${channel.id}: ${videoError.message}`);
    } else {
      console.log(`Added/updated ${videosToUpsert.length} new videos for "${channel.name}" (${channel.id})`);
    }
  } else {
    console.log(`No new videos for "${channel.name}" (${channel.id})`);
  }
  return { error: false, channel_id: channel.id, count: videosToUpsert.length };
}

async function main() {
  const channels = await getAllChannels();
  if (!channels || channels.length === 0) {
    console.log('No channels found.');
    return;
  }
  let totalVideos = 0;
  for (const ch of channels) {
    console.log(`Updating: ${ch.name} (${ch.id})`);
    const result = await updateChannelAndVideos(ch);
    if (!result.error) {
      totalVideos += result.count;
    }
  }
  console.log(`Done. Total new videos upserted: ${totalVideos}`);
}
main();
