// src/lib/stores/videos.js
import { writable, derived } from 'svelte/store';
import { fetchAllVideos } from '../api/videos.js';
import { filterAndSortVideos } from '../services/videoFilters.js';

// Core video state
export const allVideos = writable([]);
export const loading = writable(false);
export const errorMsg = writable('');

// UI filter state
export const selectedChannel = writable('');
export const selectedPlaylist = writable('');
export const selectedLevels = writable(new Set(['easy', 'intermediate', 'advanced']));
export const sortBy = writable('random');
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

// The derived store gives you the filtered/sorted video list for the grid
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
