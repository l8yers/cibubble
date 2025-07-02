// src/routes/+page.server.js
import { supabase } from '$lib/supabaseClient';

export async function load() {
  const pageSize = 36; // Same as your front page

  const { data, error } = await supabase
    .from('videos')
    .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
    .limit(pageSize);

  return {
    initialVideos: data ?? [],
    errorMsg: error ? error.message : ''
  };
}
