<script>
  import { onMount, onDestroy } from 'svelte';
  import VideoGrid from '$lib/components/VideoGrid.svelte';
  import SortBar from '$lib/components/SortBar.svelte';
  import { writable, get } from 'svelte/store';
  import * as utils from '$lib/utils.js';
  import '../app.css';

  import {
    selectedChannel, selectedPlaylist, selectedLevels, sortBy, selectedCountry,
    selectedTags, hideWatched, searchTerm
  } from '$lib/stores/videos.js';

  const PAGE_SIZE = 30;
  const videos = writable([]);
  const loading = writable(false);
  const errorMsg = writable('');
  const hasMore = writable(true);
  const page = writable(1);

  let searchOpen = false;
  let sentinel;
  let observerInstance;

  // ---- Infinite Scroll: Observe the sentinel after each render ----
  function setupObserver() {
    if (observerInstance) {
      observerInstance.disconnect();
      observerInstance = null;
    }
    if (sentinel && get(hasMore) && get(sortBy) !== 'random') {
      observerInstance = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (
              entry.isIntersecting &&
              get(hasMore) &&
              !get(loading) &&
              get(sortBy) !== 'random'
            ) {
              loadMore();
            }
          });
        },
        { root: null, rootMargin: '0px', threshold: 0.1 }
      );
      observerInstance.observe(sentinel);
    }
  }
  $: if (sentinel) setupObserver();
  onDestroy(() => { if (observerInstance) observerInstance.disconnect(); });

  // --- URL <-> Filters helpers ---
  function filtersToQuery({ levels, tags, country, channel, playlist, sort, search }) {
    const params = new URLSearchParams();
    if (levels?.size && levels.size < 3) params.set('level', Array.from(levels).join(','));
    if (tags?.size) params.set('tags', Array.from(tags).join(','));
    if (country) params.set('country', country);
    if (channel) params.set('channel', channel);
    if (playlist) params.set('playlist', playlist);
    if (sort && sort !== 'random') params.set('sort', sort);
    if (search) params.set('search', search);
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

  // --- Main fetch function for all sorts except random ---
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

  // --- Load More Handler (random and non-random) ---
  async function loadMore() {
    if (!get(hasMore) || get(loading)) return;
    // For random: keep incrementing page and appending
    // For others: ditto
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
    resetAndFetch();
  });

  // --- When filters change, update URL and refetch videos ---
  function handleSortBarChange(e) {
    selectedLevels.set(e.detail.selectedLevels);
    sortBy.set(e.detail.sortBy);
    selectedCountry.set(e.detail.selectedCountry);
    selectedTags.set(e.detail.selectedTags);
    searchTerm.set(e.detail.searchTerm);
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
      searchOpen={searchOpen}
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
    <!-- Infinite scroll for all sorts EXCEPT random -->
    {#if $hasMore && $sortBy !== 'random'}
      <div bind:this={sentinel} style="height: 2em;"></div>
    {/if}
    <!-- "Load More" button for random sort only -->
    {#if $hasMore && $sortBy === 'random'}
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
  /* ...other CSS from your app... */
</style>
