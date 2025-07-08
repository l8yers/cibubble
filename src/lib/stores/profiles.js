// src/lib/stores/profile.js
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { user } from './user.js';

export const profile = writable(null);        // Profile row, or null
export const profileLoading = writable(true); // Loading state

// Fetch profile by user ID
export async function loadProfile(userId) {
  profileLoading.set(true);
  if (!userId) {
    profile.set(null);
    profileLoading.set(false);
    return;
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  profile.set(data || null);
  profileLoading.set(false);
}

// When the user changes, reload the profile row
user.subscribe(($user) => {
  if ($user?.id) loadProfile($user.id);
  else profile.set(null);
});