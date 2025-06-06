// src/routes/+page.server.js
import { supabase } from '$lib/supabaseClient.js';

export async function load() {
  const { data, error } = await supabase.from('videos').select('*').order('addedat', { ascending: false });
  if (error) {
    return { videos: [] };
  }
  return { videos: data };
}
