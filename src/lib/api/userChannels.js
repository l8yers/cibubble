// $lib/api/userChannels.js

import { supabase } from '$lib/supabaseClient';

/**
 * Get all channels saved by a user.
 * Returns an array of full channel objects, newest saved first.
 * @param {string} user_id - The Supabase user UUID.
 */
export async function getUserSavedChannels(user_id) {
  const { data, error } = await supabase
    .from('saved_channels')
    .select('channel_id, channels(*)') // Get full channel info
    .eq('user_id', user_id)
    .order('saved_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch saved channels:', error);
    return [];
  }

  // Return array of channel objects (not the join rows)
  return (data ?? []).map(row => row.channels).filter(Boolean);
}
