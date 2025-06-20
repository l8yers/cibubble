import { writable, derived } from 'svelte/store';
import { fetchAllVideos } from '../api/videos.js';
import { filterAndSortVideos } from '../services/videoFilters.js';
import { supabase } from '$lib/supabaseClient';
import { user } from '$lib/stores/user.js';

// Core video state
export const allVideos = writable([]);
export const loading = writable(false);
export const errorMsg = writable('');

// UI filter state
export const selectedChannel = writable('');
export const selectedPlaylist = writable('');
export const selectedLevels = writable(new Set(['easy', 'intermediate', 'advanced']));
export const sortBy = writable('new'); // <- default is now "new"
export const selectedCountry = writable('');
export const selectedTags = writable(new Set());
export const hideWatched = writable(false);
export const watchedIds = writable(new Set());
export const searchTerm = writable('');

// Fetch all videos and set store
export async function loadVideos() {
  loading.set(true);
  errorMsg.set('');
  const { data, error } = await fetchAllVideos();
  if (error) errorMsg.set(error.message);
  allVideos.set(data || []);
  loading.set(false);
}

// Fetch watched video IDs for the current user
export async function loadWatchedVideos() {
  const { data: currentUser } = await supabase.auth.getUser();
  const userId = currentUser?.user?.id;
  if (!userId) {
    watchedIds.set(new Set());
    return;
  }

  let { data, error } = await supabase
    .from('watch_sessions')
    .select('video_id')
    .eq('user_id', userId);

  if (error || !data) {
    watchedIds.set(new Set());
    return;
  }
  watchedIds.set(new Set(data.map(row => row.video_id)));
}

// Derived store (if used)
export const filteredVideos = derived(
  [
    allVideos, selectedChannel, selectedPlaylist, selectedLevels,
    sortBy, selectedCountry, selectedTags, hideWatched, watchedIds, searchTerm
  ],
  ([
    $allVideos, $selectedChannel, $selectedPlaylist, $selectedLevels,
    $sortBy, $selectedCountry, $selectedTags, $hideWatched, $watchedIds, $searchTerm
  ]) => {
    return filterAndSortVideos($allVideos, {
      selectedChannel: $selectedChannel,
      selectedPlaylist: $selectedPlaylist,
      selectedLevels: $selectedLevels,
      sortBy: $sortBy,
      selectedCountry: $selectedCountry,
      selectedTags: $selectedTags,
      hideWatched: $hideWatched,
      watchedIds: $watchedIds,
      searchTerm: $searchTerm
    });
  }
);

export function markVideoWatched(videoId) {
  watchedIds.update(ids => {
    const next = new Set(ids);
    next.add(videoId);
    return next;
  });
}