// src/lib/utils/filters.js

// ---- Constants ----
export const ALL_LEVELS = ['easy', 'intermediate', 'advanced']; // add more as needed

// If you want "all tags" to work similarly, you could make an ALL_TAGS constant if your tags are static
// But usually tags are dynamic, so we just use blank as "all tags".

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

  // Only set 'tags' if not empty
  if (tags?.size) {
    params.set('tags', Array.from(tags).join(','));
  }

  // Country, channel, playlist: only set if not blank
  if (country) params.set('country', country);
  if (channel) params.set('channel', channel);
  if (playlist) params.set('playlist', playlist);

  // Sort: only set if not default ('new')
  if (sort && sort !== 'new') params.set('sort', sort);

  // Search: only set if not blank
  if (search) params.set('search', search);

  return params.toString();
}

// ---- Query string -> filter state ----
export function queryToFilters(qs = '') {
  const params = new URLSearchParams(qs);

  // Levels: if param is missing or empty, default to ALL_LEVELS (all selected)
  let levelParam = params.get('level');
  const levels = levelParam && levelParam.trim()
    ? new Set(levelParam.split(',').filter(Boolean))
    : new Set(ALL_LEVELS);

  // Tags: empty set means "all"
  let tagParam = params.get('tags');
  const tags = tagParam && tagParam.trim()
    ? new Set(tagParam.split(',').filter(Boolean))
    : new Set();

  // Everything else is just its value or default
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

// ---- (Optional) Utility: are filters at default? ----
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
