
export function handleClearChip({
  chip,
  selectedLevels,
  selectedTags,
  selectedCountry,
  selectedChannel,
  sortBy,
  searchTerm,
  updateUrlFromFilters,
  resetAndFetch,
  get
}) {
  switch (chip.type) {
    case 'level': {
      const newLevels = new Set(get(selectedLevels));
      newLevels.delete(chip.value || chip.label?.toLowerCase());
      selectedLevels.set(newLevels);
      break;
    }
    case 'tag': {
      const newTags = new Set(get(selectedTags));
      newTags.delete(chip.label);
      selectedTags.set(newTags);
      break;
    }
    case 'country':
      selectedCountry.set('');
      break;
    case 'sort':
      sortBy.set('new');
      break;
    case 'search':
      searchTerm.set('');
      break;
    case 'channel':
    case 'watchlater':
      selectedChannel.set('');
      break;
  }
  updateUrlFromFilters({
    selectedLevels,
    selectedTags,
    selectedCountry,
    selectedChannel,
    sortBy,
    searchTerm,
    get
  });
  resetAndFetch();
}

/**
 * Handles resetting all filters to default state
 */
export function handleResetFilters({
  selectedLevels,
  selectedTags,
  selectedCountry,
  selectedChannel,
  sortBy,
  searchTerm,
  hideWatched,
  updateUrlFromFilters,
  resetAndFetch,
  get
}) {
  selectedLevels.set(new Set(['easy', 'intermediate', 'advanced']));
  selectedTags.set(new Set());
  selectedCountry.set('');
  selectedChannel.set('');
  sortBy.set('new');
  searchTerm.set('');
  hideWatched.set(false);
  updateUrlFromFilters({
    selectedLevels,
    selectedTags,
    selectedCountry,
    selectedChannel,
    sortBy,
    searchTerm,
    get
  });
  resetAndFetch();
}
