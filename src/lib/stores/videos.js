import { writable, derived } from 'svelte/store';
import { fetchAllVideos } from '../api/videos.js';
import { filterAndSortVideos } from '../services/videoFilters.js';
import { supabase } from '$lib/supabaseClient';

// --- VIDEO STATE ---
export const allVideos = writable([]);
export const loading = writable(false);
export const errorMsg = writable('');

// --- FILTER STATE ---
export const selectedChannel = writable('');
export const selectedPlaylist = writable('');
export const selectedLevels = writable(new Set(['easy', 'intermediate', 'advanced']));
export const sortBy = writable('new');
export const selectedCountry = writable('');
export const selectedTags = writable(new Set());
export const hideWatched = writable(false);
export const watchedIds = writable(new Set());
export const searchTerm = writable('');

// --- WATCH LATER STATE ---
export const watchLaterIds = writable(new Set());
export const watchLaterLoading = writable(false);

// -- FETCH: All Videos --
export async function loadVideos() {
  loading.set(true);
  errorMsg.set('');
  const { data, error } = await fetchAllVideos();
  if (error) errorMsg.set(error.message);
  allVideos.set(data || []);
  loading.set(false);
}

// -- FETCH: Watched Video IDs --
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

// -- FETCH: Watch Later Video IDs --
export async function loadWatchLaterVideos() {
  watchLaterLoading.set(true);
  const { data: currentUser } = await supabase.auth.getUser();
  const userId = currentUser?.user?.id;
  if (!userId) {
    watchLaterIds.set(new Set());
    watchLaterLoading.set(false);
    return;
  }

  let { data, error } = await supabase
    .from('watch_later')
    .select('video_id')
    .eq('user_id', userId);

  if (error || !data) {
    watchLaterIds.set(new Set());
    watchLaterLoading.set(false);
    return;
  }
  watchLaterIds.set(new Set(data.map(row => row.video_id)));
  watchLaterLoading.set(false);
}

// -- ADD: Watch Later --
export async function addToWatchLater(videoId) {
  const { data: currentUser } = await supabase.auth.getUser();
  const userId = currentUser?.user?.id;
  if (!userId || !videoId) return;

  let { error } = await supabase
    .from('watch_later')
    .insert({ user_id: userId, video_id: videoId })
    .single();

  if (!error) {
    watchLaterIds.update(ids => {
      const next = new Set(ids);
      next.add(videoId);
      return next;
    });
  }
  return error;
}

// -- REMOVE: Watch Later --
export async function removeFromWatchLater(videoId) {
  const { data: currentUser } = await supabase.auth.getUser();
  const userId = currentUser?.user?.id;
  if (!userId || !videoId) return;

  let { error } = await supabase
    .from('watch_later')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId);

  if (!error) {
    watchLaterIds.update(ids => {
      const next = new Set(ids);
      next.delete(videoId);
      return next;
    });
  }
  return error;
}

// -- DERIVED: Filtered Videos --
export const filteredVideos = derived(
  [
    allVideos, selectedChannel, selectedPlaylist, selectedLevels,
    sortBy, selectedCountry, selectedTags, hideWatched, watchedIds, searchTerm, watchLaterIds
  ],
  ([
    $allVideos, $selectedChannel, $selectedPlaylist, $selectedLevels,
    $sortBy, $selectedCountry, $selectedTags, $hideWatched, $watchedIds, $searchTerm, $watchLaterIds
  ]) => {
    // WATCH LATER IS PURELY CLIENT-SIDE FILTER
    if ($selectedChannel === '__WATCH_LATER__') {
      return $allVideos.filter(v => $watchLaterIds.has(v.id));
    }
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

// -- MARK VIDEO WATCHED --
export function markVideoWatched(videoId) {
  watchedIds.update(ids => {
    const next = new Set(ids);
    next.add(videoId);
    return next;
  });
}
