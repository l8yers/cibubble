// src/lib/services/videoFilters.js

// Utility for ordering levels, etc. Adjust as needed.
const LEVEL_ORDER = { beginner: 1, intermediate: 2, advanced: 3, easy: 1 };

export function filterAndSortVideos(videos, {
  selectedChannel = "",
  selectedPlaylist = "",
  selectedLevels = new Set(['easy', 'beginner', 'intermediate', 'advanced']),
  sortBy = 'new',
  selectedCountry = "",
  selectedTags = new Set(),
  hideWatched = false,
  watchedIds = new Set(),
  searchTerm = ""
} = {}) {
  let filtered = videos;

  if (selectedChannel) filtered = filtered.filter(v => v.channel_name === selectedChannel);
  if (selectedPlaylist) filtered = filtered.filter(v => v.playlist?.title === selectedPlaylist);

  // PATCH: If selectedLevels is not empty, filter by levels. If empty, show all.
  if (selectedLevels && selectedLevels.size > 0) {
    filtered = filtered.filter(
      v => v.title && v.title !== 'Private video' && v.title !== 'Deleted video' && selectedLevels.has(v.level)
    );
  } else {
    // Only filter out private/deleted/no-title videos if showing all
    filtered = filtered.filter(
      v => v.title && v.title !== 'Private video' && v.title !== 'Deleted video'
    );
  }

  if (hideWatched) filtered = filtered.filter(v => !watchedIds.has(String(v.id)));
  if (selectedCountry) {
    filtered = filtered.filter(v =>
      (v.channel?.country || "").trim().toLowerCase() === selectedCountry.trim().toLowerCase()
    );
  }

  // ---- FIXED TAG FILTER ----
  if (selectedTags.size > 0) {
    // Convert selectedTags Set to lower-case array once for comparison
    const tagList = Array.from(selectedTags, t => t.toLowerCase().trim());
    filtered = filtered.filter(v => {
      // Accept tags as array or comma-separated string
      let tags = [];
      if (Array.isArray(v.tags)) {
        tags = v.tags.map(t => t.toLowerCase().trim());
      } else if (typeof v.tags === 'string') {
        tags = v.tags.split(',').map(t => t.toLowerCase().trim());
      } else if (v.channel?.tags) {
        tags = v.channel.tags.split(',').map(t => t.toLowerCase().trim());
      }
      // Does this video have ANY of the selected tags?
      return tagList.some(tag => tags.includes(tag));
    });
  }

  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(v =>
      v.title?.toLowerCase().includes(s) || v.channel_name?.toLowerCase().includes(s)
    );
  }

  // Removed: random path (was: if (sortBy === 'random') return shuffleArray(filtered);)
  if (sortBy === 'easy') return filtered.slice().sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
  if (sortBy === 'hard') return filtered.slice().sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level]);
  if (sortBy === 'long') return filtered.slice().sort((a, b) => (b.length || 0) - (a.length || 0));
  if (sortBy === 'short') return filtered.slice().sort((a, b) => (a.length || 0) - (b.length || 0));
  if (sortBy === 'new') return filtered.slice().sort((a, b) => new Date(b.published) - new Date(a.published));
  if (sortBy === 'old') return filtered.slice().sort((a, b) => new Date(a.published) - new Date(b.published));
  return filtered;
}
