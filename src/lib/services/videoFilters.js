// src/lib/services/videoFilters.js

// Utility for ordering levels, etc. Adjust as needed.
const LEVEL_ORDER = { beginner: 1, intermediate: 2, advanced: 3, easy: 1 };

export function filterAndSortVideos(videos, {
  selectedChannel = "",
  selectedPlaylist = "",
  selectedLevels = new Set(['easy', 'beginner', 'intermediate', 'advanced']),
  sortBy = 'random',
  selectedCountry = "",
  selectedTags = new Set(),
  hideWatched = false,
  watchedIds = new Set(),
  searchTerm = ""
} = {}) {
  let filtered = videos;

  if (selectedChannel) filtered = filtered.filter(v => v.channel_name === selectedChannel);
  if (selectedPlaylist) filtered = filtered.filter(v => v.playlist?.title === selectedPlaylist);
  filtered = filtered.filter(
    v => v.title && v.title !== 'Private video' && v.title !== 'Deleted video' && selectedLevels.has(v.level)
  );
  if (hideWatched) filtered = filtered.filter(v => !watchedIds.has(String(v.id)));
  if (selectedCountry) {
    filtered = filtered.filter(v =>
      (v.channel?.country || "").trim().toLowerCase() === selectedCountry.trim().toLowerCase()
    );
  }

  // ---- FIXED TAG FILTER ----
  if (selectedTags.size > 0) {
    filtered = filtered.filter(v => {
      let tags = [];
      if (Array.isArray(v.tags)) {
        tags = v.tags.map(t => t.trim().toLowerCase());
      } else if (typeof v.tags === 'string') {
        tags = v.tags.split(',').map(t => t.trim().toLowerCase());
      } else if (v.channel?.tags) {
        tags = v.channel.tags.split(',').map(t => t.trim().toLowerCase());
      }

      for (let tag of selectedTags) {
        if (tags.includes(tag.toLowerCase())) return true;
      }
      return false;
    });
  }

  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(v =>
      v.title?.toLowerCase().includes(s) || v.channel_name?.toLowerCase().includes(s)
    );
  }

  if (sortBy === 'random') return shuffleArray(filtered);
  if (sortBy === 'easy') return filtered.slice().sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
  if (sortBy === 'hard') return filtered.slice().sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level]);
  if (sortBy === 'long') return filtered.slice().sort((a, b) => (b.length || 0) - (a.length || 0));
  if (sortBy === 'short') return filtered.slice().sort((a, b) => (a.length || 0) - (b.length || 0));
  if (sortBy === 'new') return filtered.slice().sort((a, b) => new Date(b.published) - new Date(a.published));
  if (sortBy === 'old') return filtered.slice().sort((a, b) => new Date(a.published) - new Date(b.published));
  return filtered;
}

// Randomize array order
function shuffleArray(arr) {
  return arr.map(v => [Math.random(), v]).sort(([a], [b]) => a - b).map(([, v]) => v);
}
