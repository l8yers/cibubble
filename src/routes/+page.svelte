<script>
  import { onMount } from 'svelte';
  import VideoGrid from '$lib/components/VideoGrid.svelte';
  import SortBar from '$lib/components/SortBar.svelte';
  import { writable, get } from 'svelte/store';
  import * as utils from '$lib/utils.js';
  import '../app.css';

  import {
    filteredVideos,
    loading,
    errorMsg,
    loadVideos,
    selectedChannel,
    selectedPlaylist,
    selectedLevels,
    sortBy,
    selectedCountry,
    selectedTags,
    hideWatched,
    watchedIds,
    searchTerm
  } from '$lib/stores/videos.js';

  // --- THE FIX: Use a writable store for searchOpen
  let searchOpen = writable(false);

  // --- URL <-> Filters helpers ---
  function filtersToQuery({
    levels,
    tags,
    country,
    channel,
    playlist,
    sort,
    hideWatched,
    search,
    searchOpen // (optional: include if you want search bar open state in URL)
  }) {
    const params = new URLSearchParams();
    if (levels?.size && levels.size < 3) params.set('level', Array.from(levels).join(',')); // Only set if not all
    if (tags?.size) params.set('tags', Array.from(tags).join(','));
    if (country) params.set('country', country);
    if (channel) params.set('channel', channel);
    if (playlist) params.set('playlist', playlist);
    if (sort && sort !== 'random') params.set('sort', sort);
    if (hideWatched) params.set('hideWatched', '1');
    if (search) params.set('search', search);
    // Uncomment if you want to sync search bar open state:
    // if (searchOpen) params.set('searchOpen', '1');
    return params.toString();
  }

  function queryToFilters(qs) {
    const params = new URLSearchParams(qs);
    return {
      levels: new Set((params.get('level') || '').split(',').filter(Boolean)),
      tags: new Set((params.get('tags') || '').split(',').filter(Boolean)),
      country: params.get('country') || '',
      channel: params.get('channel') || '',
      playlist: params.get('playlist') || '',
      sort: params.get('sort') || 'random',
      hideWatched: params.get('hideWatched') === '1',
      search: params.get('search') || '',
      searchOpen: params.get('searchOpen') === '1'
    };
  }

  // --- Update URL from current filters ---
  function updateUrlFromFilters() {
    const query = filtersToQuery({
      levels: get(selectedLevels),
      tags: get(selectedTags),
      country: get(selectedCountry),
      channel: get(selectedChannel),
      playlist: get(selectedPlaylist),
      sort: get(sortBy),
      hideWatched: get(hideWatched),
      search: get(searchTerm)
      // searchOpen: get(searchOpen) // Uncomment if you want to sync this state
    });
    const url = query ? `?${query}` : window.location.pathname;
    history.replaceState({}, '', url);
  }

  // --- Set filter stores from querystring on mount ---
  onMount(() => {
    const filters = queryToFilters(window.location.search);
    if (filters.levels.size) selectedLevels.set(filters.levels);
    if (filters.tags.size) selectedTags.set(filters.tags);
    if (filters.country) selectedCountry.set(filters.country);
    if (filters.channel) selectedChannel.set(filters.channel);
    if (filters.playlist) selectedPlaylist.set(filters.playlist);
    sortBy.set(filters.sort);
    hideWatched.set(filters.hideWatched);
    searchTerm.set(filters.search);
    if ('searchOpen' in filters) searchOpen.set(filters.searchOpen);

    loadVideos();
  });

  // --- When filters change, update URL ---
  function handleSortBarChange(e) {
    selectedLevels.set(e.detail.selectedLevels);
    sortBy.set(e.detail.sortBy);
    selectedCountry.set(e.detail.selectedCountry);
    selectedTags.set(e.detail.selectedTags);
    hideWatched.set(e.detail.hideWatched);
    searchTerm.set(e.detail.searchTerm);
    if ('searchOpen' in e.detail) searchOpen.set(e.detail.searchOpen);
    updateUrlFromFilters();
  }

  function filterByChannel(channelName) {
    selectedChannel.set(channelName);
    updateUrlFromFilters();
  }
  function clearChannelFilter() {
    selectedChannel.set('');
    updateUrlFromFilters();
  }
  function filterByPlaylist(playlistTitle) {
    selectedPlaylist.set(playlistTitle);
    updateUrlFromFilters();
  }
  function clearPlaylistFilter() {
    selectedPlaylist.set('');
    updateUrlFromFilters();
  }

  // Filter/Sort options (should live in a config file or constants ideally)
  const levels = [
    { value: 'easy', label: 'Easy' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];
  const sortChoices = [
    { value: 'random', label: 'Random' },
    { value: 'easy', label: 'Easy' },
    { value: 'hard', label: 'Hard' },
    { value: 'long', label: 'Long' },
    { value: 'short', label: 'Short' },
    { value: 'new', label: 'New' },
    { value: 'old', label: 'Old' }
  ];
  let countryOptions = [
    'Spain', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Various', 'Peru',
    'Guatemala', 'Uruguay', 'Dominican Republic', 'Venezuela', 'Costa Rica', 'Cuba',
    'Ecuador', 'Paraguay', 'Panama', 'Canary Islands', 'Italy', 'Puerto Rico',
    'Equatorial Guinea', 'DUBS', 'Not Native Speaker', 'AI Voice', 'Latin America'
  ].sort();
  let tagOptions = [
    'For Learners', 'Kids Show', 'Dubbed Show', 'Videogames', 'News', 'History', 'Science',
    'Travel', 'Lifestyle', 'Personal Development', 'Cooking', 'Music', 'Comedy',
    'Native Show', 'Education', 'Sports', 'Current Events'
  ].sort();
</script>

<div class="page-container">
  <div class="sortbar-container">
    <SortBar
      {levels}
      {sortChoices}
      {countryOptions}
      {tagOptions}
      selectedLevels={$selectedLevels}
      sortBy={$sortBy}
      selectedCountry={$selectedCountry}
      selectedTags={$selectedTags}
      hideWatched={$hideWatched}
      searchTerm={$searchTerm}
      searchOpen={$searchOpen}
      on:change={handleSortBarChange}
    />
  </div>

  {#if $selectedChannel}
    <div class="chip-info">
      <span><b>Filtered by channel:</b> {$selectedChannel}</span>
      <button on:click={clearChannelFilter} class="clear-btn clear-btn--blue">✕ Clear</button>
    </div>
  {/if}
  {#if $selectedPlaylist}
    <div class="chip-warning">
      <span><b>Filtered by playlist:</b> {$selectedPlaylist}</span>
      <button on:click={clearPlaylistFilter} class="clear-btn clear-btn--purple">✕ Clear</button>
    </div>
  {/if}

  {#if $loading}
    <p class="loading-more">Loading videos…</p>
  {:else if $errorMsg}
    <div class="error">{$errorMsg}</div>
  {:else if $filteredVideos.length === 0}
    <div class="loading-more text-muted">No videos match your filters.</div>
  {:else}
    <VideoGrid
      videos={$filteredVideos}
      getBestThumbnail={utils.getBestThumbnail}
      difficultyColor={utils.difficultyColor}
      difficultyLabel={utils.difficultyLabel}
      formatLength={utils.formatLength}
      {filterByChannel}
      {filterByPlaylist}
    />
  {/if}
</div>

