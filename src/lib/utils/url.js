import { filtersToQuery } from './filters.js';

export function updateUrlFromFilters({ selectedLevels, selectedTags, selectedCountry, selectedChannel, selectedPlaylist, sortBy, searchTerm, get }) {
  const query = filtersToQuery({
    levels: get(selectedLevels),
    tags: get(selectedTags),
    country: get(selectedCountry),
    channel: get(selectedChannel),
    playlist: get(selectedPlaylist),
    sort: get(sortBy),
    search: get(searchTerm)
  });
  const url = query ? `?${query}` : window.location.pathname;
  history.replaceState({}, '', url);
}
