// /lib/utils/filters.js

// Takes filter state and returns a query string for URL/search
export function filtersToQuery({ levels, tags, country, channel, playlist, sort, search }) {
  const params = new URLSearchParams();
  params.set('level', Array.from(levels).join(','));
  if (tags?.size) params.set('tags', Array.from(tags).join(','));
  if (country) params.set('country', country);
  if (channel) params.set('channel', channel);
  if (playlist) params.set('playlist', playlist);
  if (sort && sort !== 'random') params.set('sort', sort);
  if (search) params.set('search', search);
  return params.toString();
}

// Parses query string to filter state
export function queryToFilters(qs) {
  const params = new URLSearchParams(qs);
  return {
    levels: new Set((params.get('level') || '').split(',').filter(Boolean)),
    tags: new Set((params.get('tags') || '').split(',').filter(Boolean)),
    country: params.get('country') || '',
    channel: params.get('channel') || '',
    playlist: params.get('playlist') || '',
    sort: params.get('sort') || 'new',  // Default to "new"
    search: params.get('search') || ''
  };
}
