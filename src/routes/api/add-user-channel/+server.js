import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

// Only use VITE_ variables!
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// (Reuse all helpers from your working admin logic here! Copy/paste from your add-video endpoint.)
// e.g. normalizeTags, normalizeCountry, extractChannelIdOrHandle, getChannelIdFromHandle, getChannelInfo, getPlaylists, getPlaylistVideos, fetchVideoDurations, getAllUploads, etc.

export async function POST({ request, locals }) {
  try {
    // --- AUTH: Get current user ---
    // If you use locals, or get user some other way (adjust as needed)
    const user = locals.user;
    if (!user?.id) return json({ error: 'Not logged in.' }, { status: 401 });

    const { url, tags, level, country } = await request.json();

    // --- Insert all the same logic from your add-video endpoint, but change just this bit: ---
    // When you upsert to channels, add pending:true and user_id:user.id
    const tagArr = normalizeTags(tags);
    const normCountry = normalizeCountry(country);

    // ... extractChannelIdOrHandle etc ...
    // ... get channelId ...
    // ... getChannelInfo etc ...

    // --- Upsert channel (add pending and user_id!) ---
    const channelObj = {
      id: channel.id,
      name: channel.name,
      thumbnail: channel.thumbnail || '',
      description: channel.description || '',
      tags: tagArr.join(','),
      country: normCountry,
      pending: true,
      user_id: user.id
    };
    const { error: channelError } = await supabase.from('channels').upsert([channelObj]);
    if (channelError) {
      return json({ error: 'Failed to upsert channel.' }, { status: 500 });
    }

    // ...add videos as you do in add-video...
    // (Optional: videos can get pending:true as well if you want to hide them until approval)

    return json({ success: true });
  } catch (err) {
    return json({ error: (err && err.message) || String(err) || 'Unknown error' }, { status: 500 });
  }
}
