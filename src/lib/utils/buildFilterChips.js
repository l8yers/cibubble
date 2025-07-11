// src/lib/utils/buildFilterChips.js

export function buildFilterChips({
  selectedLevels,
  levels,
  utils,
  selectedTags,
  selectedCountry,
  countryOptions,
  sortBy,
  sortChoices,
  searchTerm,
  selectedChannel,
  videos
}) {
  return [
    ...(selectedLevels.size && selectedLevels.size < levels.length
      ? Array.from(selectedLevels).map(lvl => ({
          type: 'level',
          label: utils.difficultyLabel ? utils.difficultyLabel(lvl) : lvl,
          value: '',
          clearClass: 'clear-btn--green'
        }))
      : []
    ),
    ...(selectedTags.size
      ? Array.from(selectedTags).map(tag => ({
          type: 'tag',
          label: tag,
          value: '',
          clearClass: 'clear-btn--red'
        }))
      : []
    ),
    ...(selectedCountry
      ? [{
          type: 'country',
          label: countryOptions.find(c => c.value === selectedCountry)?.label ?? selectedCountry,
          value: '',
          clearClass: 'clear-btn--blue'
        }]
      : []
    ),
    ...(sortBy && sortBy !== 'new'
      ? [{
          type: 'sort',
          label: sortChoices.find(sc => sc.value === sortBy)?.label ?? sortBy,
          value: '',
          clearClass: 'clear-btn--purple'
        }]
      : []
    ),
    ...(searchTerm && searchTerm.trim().length
      ? [{
          type: 'search',
          label: `Search: "${searchTerm}"`,
          value: '',
          clearClass: 'clear-btn--gray'
        }]
      : []
    ),
    ...(selectedChannel === '__WATCH_LATER__'
      ? [{
          type: 'watchlater',
          label: 'Watch Later',
          value: '',
          clearClass: 'clear-btn--blue'
        }]
      : selectedChannel === '__ALL__'
        ? [{
            type: 'channel',
            label: 'All Saved Channels',
            value: '',
            clearClass: 'clear-btn--blue'
          }]
        : selectedChannel && selectedChannel !== ''
          ? [{
              type: 'channel',
              label:
                videos.length > 0
                  ? (videos[0].channel?.name ?? videos[0].channel_name ?? selectedChannel)
                  : selectedChannel,
              value: '',
              clearClass: 'clear-btn--blue'
            }]
          : []
    ),
  ];
}
