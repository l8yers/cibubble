<script>
  import { onMount } from 'svelte';
  import VideoGrid from '$lib/components/VideoGrid.svelte';
  import SortBar from '$lib/components/SortBar.svelte';
  import { writable, get } from 'svelte/store';
  import * as utils from '$lib/utils.js';
  import '../app.css';

  // --- Filter UI state ---
  import {
    selectedChannel, selectedPlaylist, selectedLevels, sortBy, selectedCountry,
    selectedTags, hideWatched, searchTerm
  } from '$lib/stores/videos.js';

  // --- Infinite loading state ---
  const PAGE_SIZE = 30;
  let videos = writable([]);
  let loading = writable(false);
  let errorMsg = writable('');
  let hasMore = writable(true);
  let page = writable(1);

  let searchOpen = writable(false);

  // --- URL <-> Filters helpers (as before) ---
  function filtersToQuery({
    levels,
    tags,
    country,
    channel,
    playlist,
    sort,
    search,
    // Optionally: hideWatched, searchOpen
  }) {
    const params = new URLSearchParams();
    if (levels?.size && levels.size < 3) params.set('level', Array.from(levels).join(','));
    if (tags?.size) params.set('tags', Array.from(tags).join(','));
    if (country) params.set('country', country);
    if (channel) params.set('channel', channel);
    if (playlist) params.set('playlist', playlist);
    if (sort && sort !== 'random') params.set('sort', sort);
    if (search) params.set('search', search);
    // Optionally: if (hideWatched) params.set('hideWatched', '1');
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
      search: params.get('search') || ''
    };
  }

  function updateUrlFromFilters() {
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

  // --- MAIN fetch function ---
  async function fetchVideos({ append = false } = {}) {
    loading.set(true);
    errorMsg.set('');
    const query = new URLSearchParams({
      page: get(page),
      pageSize: PAGE_SIZE,
      levels: Array.from(get(selectedLevels)).join(','),
      tags: Array.from(get(selectedTags)).join(','),
      country: get(selectedCountry),
      channel: get(selectedChannel),
      playlist: get(selectedPlaylist),
      sort: get(sortBy),
      search: get(searchTerm)
    });
const res = await fetch(`/api/videos?${query}`);
if (!res.ok) {
  const errText = await res.text();
  errorMsg.set('Error loading videos: ' + errText);
  loading.set(false);
  return;
}

    const { videos: fetched, hasMore: more } = await res.json();
    if (append) {
      videos.update(vs => [...vs, ...fetched]);
    } else {
      videos.set(fetched);
    }
    hasMore.set(more);
    loading.set(false);
  }

  // --- Load More Handler ---
  async function loadMore() {
    if (!get(hasMore) || get(loading)) return;
    page.update(p => p + 1);
    await fetchVideos({ append: true });
  }

  // --- Reset videos on filter/sort/search change ---
  function resetAndFetch() {
    page.set(1);
    fetchVideos({ append: false });
  }

  // --- On mount: get filters from URL, fetch first page ---
  onMount(() => {
    const filters = queryToFilters(window.location.search);
    if (filters.levels.size) selectedLevels.set(filters.levels);
    if (filters.tags.size) selectedTags.set(filters.tags);
    if (filters.country) selectedCountry.set(filters.country);
    if (filters.channel) selectedChannel.set(filters.channel);
    if (filters.playlist) selectedPlaylist.set(filters.playlist);
    sortBy.set(filters.sort);
    searchTerm.set(filters.search);
    // Optionally: searchOpen.set(filters.searchOpen);

    resetAndFetch();
  });

  // --- When filters change, update URL and refetch videos ---
  function handleSortBarChange(e) {
    selectedLevels.set(e.detail.selectedLevels);
    sortBy.set(e.detail.sortBy);
    selectedCountry.set(e.detail.selectedCountry);
    selectedTags.set(e.detail.selectedTags);
    searchTerm.set(e.detail.searchTerm);
    // Optionally: if ('searchOpen' in e.detail) searchOpen.set(e.detail.searchOpen);
    updateUrlFromFilters();
    resetAndFetch();
  }

  function filterByChannel(channelName) {
    selectedChannel.set(channelName);
    updateUrlFromFilters();
    resetAndFetch();
  }
  function clearChannelFilter() {
    selectedChannel.set('');
    updateUrlFromFilters();
    resetAndFetch();
  }
  function filterByPlaylist(playlistTitle) {
    selectedPlaylist.set(playlistTitle);
    updateUrlFromFilters();
    resetAndFetch();
  }
  function clearPlaylistFilter() {
    selectedPlaylist.set('');
    updateUrlFromFilters();
    resetAndFetch();
  }

  // Filter/Sort options (as before)
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

  {#if $loading && $videos.length === 0}
    <p class="loading-more">Loading videos…</p>
  {:else if $errorMsg}
    <div class="error">{$errorMsg}</div>
  {:else if $videos.length === 0}
    <div class="loading-more text-muted">No videos match your filters.</div>
  {:else}
    <VideoGrid
      videos={$videos}
      getBestThumbnail={utils.getBestThumbnail}
      difficultyColor={utils.difficultyColor}
      difficultyLabel={utils.difficultyLabel}
      formatLength={utils.formatLength}
      {filterByChannel}
      {filterByPlaylist}
    />
    {#if $hasMore}
      <button class="load-more-btn" on:click={loadMore} disabled={$loading} style="margin: 2em auto; display: block;">
        {#if $loading}Loading...{/if}
        {#if !$loading}Load More{/if}
      </button>
    {/if}
  {/if}
</div>

<style>
  .load-more-btn {
    padding: 0.9em 2.4em;
    font-size: 1.17em;
    background: #fafbff;
    border: 1.6px solid #d6d6ee;
    border-radius: 13px;
    box-shadow: 0 2px 12px #ececec80;
    font-weight: 700;
    cursor: pointer;
    margin: 2em auto 0 auto;
    transition: background 0.15s;
  }
  .load-more-btn:disabled {
    opacity: 0.66;
    cursor: not-allowed;
  }

</style>
