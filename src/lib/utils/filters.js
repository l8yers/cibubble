// src/lib/utils/filters.js

// ---- Constants ----
export const ALL_LEVELS = ['easy', 'intermediate', 'advanced'];

// ---- Filter state -> query string ----
export function filtersToQuery({
  levels = new Set(ALL_LEVELS),
  tags = new Set(),
  country = '',
  channel = '',
  playlist = '',
  sort = 'new',
  search = ''
} = {}) {
  const params = new URLSearchParams();

  // Only set 'level' if *not* all levels are selected
  if (
    levels &&
    (levels.size !== ALL_LEVELS.length || !ALL_LEVELS.every(lvl => levels.has(lvl)))
  ) {
    params.set('level', Array.from(levels).join(','));
  }

  if (tags?.size) {
    params.set('tags', Array.from(tags).join(','));
  }

  if (country) params.set('country', country);
  if (channel) params.set('channel', channel);
  if (playlist) params.set('playlist', playlist);

  // **Always include sort param (including 'new')**
  if (sort) params.set('sort', sort);

  if (search) params.set('search', search);

  return params.toString();
}

// ---- Query string -> filter state ----
export function queryToFilters(qs = '') {
  const params = new URLSearchParams(qs);

  let levelParam = params.get('level');
  const levels = levelParam && levelParam.trim()
    ? new Set(levelParam.split(',').filter(Boolean))
    : new Set(ALL_LEVELS);

  let tagParam = params.get('tags');
  const tags = tagParam && tagParam.trim()
    ? new Set(tagParam.split(',').filter(Boolean))
    : new Set();

  return {
    levels,
    tags,
    country: params.get('country') || '',
    channel: params.get('channel') || '',
    playlist: params.get('playlist') || '',
    sort: params.get('sort') || 'new',
    search: params.get('search') || ''
  };
}

// ---- (Optional) Utility: are all levels selected? ----
export function isAllLevelsSelected(levels) {
  if (!levels) return false;
  return (
    levels.size === ALL_LEVELS.length &&
    ALL_LEVELS.every(lvl => levels.has(lvl))
  );
}

export function isDefaultFilters(filters) {
  return (
    isAllLevelsSelected(filters.levels) &&
    (!filters.tags || filters.tags.size === 0) &&
    !filters.country &&
    !filters.channel &&
    !filters.playlist &&
    (!filters.sort || filters.sort === 'new') &&
    !filters.search
  );
}

// ---- NEW: Apply all query filters to Svelte filter stores ----
import {
  selectedLevels,
  selectedTags,
  selectedCountry,
  selectedChannel,
  selectedPlaylist,
  sortBy,
  searchTerm
} from '$lib/stores/videos.js';

export function applyFiltersFromQueryString(qs) {
  const filters = queryToFilters(qs);
  const safeLevels = new Set(
    Array.from(filters.levels).filter((lvl) => ALL_LEVELS.includes(lvl))
  );
  selectedLevels.set(
    safeLevels.size ? safeLevels : new Set(ALL_LEVELS)
  );
  selectedTags.set(filters.tags.size ? filters.tags : new Set());
  selectedCountry.set(filters.country || '');
  selectedChannel.set(filters.channel || '');
  selectedPlaylist.set(filters.playlist || '');
  sortBy.set(filters.sort || 'new');
  searchTerm.set(filters.search || '');
}
