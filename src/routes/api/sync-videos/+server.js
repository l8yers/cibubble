import { supabase } from '$lib/supabaseClient';

const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;

// --- YouTube API Helpers ---

// Fetch all playlists for a channel
async function getPlaylists(channelId) {
  let playlists = [];
  let nextPageToken = '';
  try {
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channelId}&maxResults=50&pageToken=${nextPageToken}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items) playlists.push(...data.items);
      nextPageToken = data.nextPageToken || '';
    } while (nextPageToken);
  } catch {}
  return playlists.map(pl => ({
    id: pl.id,
    channel_id: pl.snippet.channelId,
    title: pl.snippet.title,
    thumbnail: pl.snippet.thumbnails?.default?.url || '',
    description: pl.snippet.description,
  }));
}

// Fetch videos from a playlist (optionally after a certain date)
async function getPlaylistVideos(playlistId, publishedAfter = null) {
  let videos = [];
  let nextPageToken = '';
  try {
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.items) videos.push(...data.items);
      nextPageToken = data.nextPageToken || '';
    } while (nextPageToken);
  } catch {}
  return videos.filter(v => {
    if (!publishedAfter) return true;
    return new Date(v.snippet.publishedAt) >= new Date(publishedAfter);
  });
}

// Fetch video durations by batch (50 per API call)
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
          ...data.items.map(v => ({
            id: v.id,
            duration: v.contentDetails?.duration,
          }))
        );
      }
    } catch {}
  }
  // Returns: { videoId: seconds }
  function parseDuration(iso) {
    if (!iso || typeof iso !== 'string') return 0;
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + (parseInt(m[3] || 0));
  }
  const map = {};
  for (const v of results) map[v.id] = parseDuration(v.duration);
  return map;
}

// Filter/process videos for upsert
function prepareVideoForDB(v, durations, playlistId, channelId) {
  const vid = v.contentDetails.videoId;
  return {
    id: vid,
    playlist_id: playlistId,
    channel_id: channelId,
    title: v.snippet.title,
    channel_name: v.snippet.channelTitle,
    thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url || '',
    length: durations[vid] ?? null,
    published: v.snippet.publishedAt,
    created: new Date().toISOString(),
    playlist_position: v.snippet.position ?? null,
    level: 'notyet',
    country: null,
    tags: [],
    added_by: null,
  };
}

// --- MAIN HANDLER ---

export async function POST() {
  const report = [];
  try {
    // Get all channels
    const { data: channels, error: chanErr } = await supabase.from('channels').select('id, name');
    if (chanErr) return new Response(JSON.stringify({ error: chanErr.message }), { status: 500 });

    for (const channel of channels) {
      let channelReport = {
        id: channel.id,
        name: channel.name,
        added: 0,
        updated: 0,
        failed: false,
        failReason: '',
        total: 0,
        playlistsAdded: 0,
        playlistsUpdated: 0,
      };
      try {
        // Count videos for this channel
        const { count } = await supabase
          .from('videos')
          .select('id', { count: 'exact', head: true })
          .eq('channel_id', channel.id);

        // Always fetch playlists
        const playlists = await getPlaylists(channel.id);
        if (playlists?.length) {
          const { error: plErr } = await supabase.from('playlists').upsert(playlists);
          if (plErr) throw new Error('Failed to upsert playlists: ' + plErr.message);
          if (count === 0) channelReport.playlistsAdded = playlists.length;
          else channelReport.playlistsUpdated = playlists.length;
        }

        // Fetch videos from all playlists
        let allVideosRaw = [];
        for (const pl of playlists) {
          if (count === 0) {
            // No videos: fetch all
            const vids = await getPlaylistVideos(pl.id);
            allVideosRaw.push(...vids.map(v => ({ ...v, playlistId: pl.id })));
          } else {
            // Has videos: fetch last 24h
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const vids = await getPlaylistVideos(pl.id, since);
            allVideosRaw.push(...vids.map(v => ({ ...v, playlistId: pl.id })));
          }
        }
        // Remove any duplicates by videoId
        const seen = new Set();
        const videosToInsert = [];
        for (const v of allVideosRaw) {
          const vid = v.contentDetails.videoId;
          if (!seen.has(vid)) {
            seen.add(vid);
            videosToInsert.push(v);
          }
        }
        // Fetch durations for all new videos
        const videoIds = videosToInsert.map(v => v.contentDetails.videoId).filter(Boolean);
        let durations = {};
        if (videoIds.length) durations = await fetchVideoDurations(videoIds);

        // Final videos list for DB
        const dbVideos = videosToInsert
          .map(v => prepareVideoForDB(v, durations, v.playlistId, channel.id))
          .filter(v => v.length === null || v.length >= 180); // Filter out very short vids

        // Upsert into DB
        if (dbVideos.length) {
          const { error: insertError } = await supabase.from('videos').upsert(dbVideos);
          if (insertError) throw new Error(insertError.message);
          channelReport.added = dbVideos.length;
        }

        // Always report total video count at end
        const { count: total } = await supabase
          .from('videos')
          .select('id', { count: 'exact', head: true })
          .eq('channel_id', channel.id);
        channelReport.total = total || 0;

      } catch (err) {
        channelReport.failed = true;
        channelReport.failReason = err.message;
      }
      report.push(channelReport);
    }
    return new Response(JSON.stringify({ success: true, channels: report }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
