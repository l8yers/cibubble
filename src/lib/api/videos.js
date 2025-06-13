// src/lib/api/videos.js
import { supabase } from '../supabaseClient.js';

export async function fetchAllVideos() {
  return await supabase
    .from('videos')
    .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
    .limit(2000);
}
