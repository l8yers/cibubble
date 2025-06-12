// src/routes/+page.server.js
import { supabase } from '$lib/supabaseClient';
import dotenv from 'dotenv';
dotenv.config();

console.log('SUPABASE ENV VARS', {
  url: process.env.PRIVATE_SUPABASE_URL,
  key: process.env.PRIVATE_SUPABASE_ANON_KEY,
  allEnv: process.env // just for debug, remove after!
});

export async function load() {
  const pageSize = 30; // Same as your front page

  const { data, error } = await supabase
    .from('videos')
    .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
    .limit(pageSize);

  return {
    initialVideos: data ?? [],
    errorMsg: error ? error.message : ''
  };
}
