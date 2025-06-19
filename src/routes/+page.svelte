<script>
  // --- Svelte & store core ---
  import { onMount, onDestroy } from 'svelte';
  import { writable, get } from 'svelte/store';

  // --- App UI Components ---
  import VideoGrid from '$lib/components/home/VideoGrid.svelte';
  import SortBar from '$lib/components/home/SortBar.svelte';
  import FilterChip from '$lib/components/home/FilterChip.svelte';
  import LoadingSpinner from '$lib/components/home/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/home/ErrorMessage.svelte';

  // --- Utility functions (formatting, filter/query helpers) ---
  import * as utils from '$lib/utils/utils.js';
  import { filtersToQuery, queryToFilters } from '$lib/utils/filters.js';
  import { updateUrlFromFilters } from '$lib/utils/url.js';

  // --- App-wide filter state (from Svelte stores) ---
  import {
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

  // --- App-wide constants (keep all options/choices here) ---
  import { LEVELS, VALID_LEVELS, SORT_CHOICES, COUNTRY_OPTIONS, TAG_OPTIONS } from '$lib/constants.js';

  // --- User/account data ---
  import { user } from '$lib/stores/user.js';
  import { userChannels } from '$lib/stores/userChannels.js';
  import { getUserSavedChannels } from '$lib/api/userChannels.js';

  // --- Local state: videos, loading, errors, pagination ---
  const PAGE_SIZE = 50; // Number of videos to load per batch
  const videos = writable([]);         // List of currently loaded videos
  const loading = writable(false);     // Is a fetch in progress?
  const errorMsg = writable('');       // Any error message to show
  const hasMore = writable(true);      // For infinite scroll or Load More
  const pageNum = writable(1);         // Pagination for non-random sorts

  // --- Local UI state ---
  let searchOpen = false;              // Controls the search bar visibility
  let sentinel;                        // For intersection observer (infinite scroll)
  let observerInstance;                // Reference to the observer

  // --- Options for filter UI ---
  const levels = LEVELS;
  const validLevels = VALID_LEVELS;
  const sortChoices = SORT_CHOICES;
  let countryOptions = COUNTRY_OPTIONS;
  let tagOptions = TAG_OPTIONS;

  // --- Set up (and tear down) infinite scroll observer for non-random sorts ---
  function setupObserver() {
    if (observerInstance) {
      observerInstance.disconnect();
      observerInstance = null;
    }
    if (sentinel && get(hasMore) && get(sortBy) !== 'random') {
      observerInstance = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && get(hasMore) && !get(loading) && get(sortBy) !== 'random') {
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
  onDestroy(() => {
    if (observerInstance) observerInstance.disconnect();
  });

  // --- Fetch videos from the server, based on current filters/state ---
  async function fetchVideos({ append = false } = {}) {
    loading.set(true);
    errorMsg.set('');

    // Compose channel filter: handle "all my channels" (special case)
    let channelFilter = get(selectedChannel);
    if (channelFilter === '__ALL__' && get(userChannels).length > 0) {
      channelFilter = get(userChannels).map((ch) => ch.id).join(',');
    } else if (channelFilter === '') {
      channelFilter = '';
    }

    // Build URL for the fetch call based on all current filters
    const query = new URLSearchParams({
      page: get(sortBy) === 'random' ? 1 : get(pageNum),
      pageSize: PAGE_SIZE,
      levels: Array.from(get(selectedLevels)).join(','),
      tags: Array.from(get(selectedTags)).join(','),
      country: get(selectedCountry),
      channel: channelFilter,
      playlist: get(selectedPlaylist),
      sort: get(sortBy),
      search: get(searchTerm)
    });

    // Fetch videos from backend API
    const res = await fetch(`/api/videos?${query}`);
    if (!res.ok) {
      const errText = await res.text();
      errorMsg.set('Error loading videos: ' + errText);
      loading.set(false);
      return;
    }
    const { videos: fetched, hasMore: more } = await res.json();

    // If appending (infinite scroll/Load More), add to end; otherwise, replace
    if (append) {
      videos.update((vs) => [...vs, ...fetched]);
    } else {
      videos.set(fetched);
    }

    // For random sorts, always allow Load More button to show (hasMore true)
    if (get(sortBy) === 'random') {
      hasMore.set(true);
    } else {
      hasMore.set(more);
    }
    loading.set(false);
  }

  // --- Loads more videos (for infinite scroll or Load More button) ---
  async function loadMore() {
    if (get(loading)) return;
    // For random sorts, pageNum is ignored (always new batch)
    if (get(sortBy) !== 'random') {
      pageNum.update((p) => p + 1);
    }
    await fetchVideos({ append: true });
  }

  // --- Resets to page 1 and fetches videos (after changing filters) ---
  function resetAndFetch() {
    pageNum.set(1);
    fetchVideos({ append: false });
  }

  // --- Handler for all filter/sort/search changes from SortBar ---
  function handleSortBarChange(e) {
    const rawLevels = e.detail.selectedLevels;
    const safeLevels = new Set(Array.from(rawLevels).filter((lvl) => validLevels.has(lvl)));
    selectedLevels.set(safeLevels);
    selectedTags.set(new Set(e.detail.selectedTags));
    sortBy.set(e.detail.sortBy);
    selectedCountry.set(e.detail.selectedCountry);
    hideWatched.set(e.detail.hideWatched);
    searchTerm.set(e.detail.searchTerm);
    searchOpen = e.detail.searchOpen;
    selectedChannel.set(e.detail.selectedChannel ?? '');
    // Push updated filters to URL, then fetch
    updateUrlFromFilters({
      selectedLevels,
      selectedTags,
      selectedCountry,
      selectedChannel,
      selectedPlaylist,
      sortBy,
      searchTerm,
      get
    });
    resetAndFetch();
  }

  // --- Helper functions for clicking channel/playlist chips ---
  function filterByChannel(channelId) {
    selectedChannel.set(channelId);
    updateUrlFromFilters({
      selectedLevels,
      selectedTags,
      selectedCountry,
      selectedChannel,
      selectedPlaylist,
      sortBy,
      searchTerm,
      get
    });
    resetAndFetch();
  }
  function clearChannelFilter() {
    selectedChannel.set('');
    updateUrlFromFilters({
      selectedLevels,
      selectedTags,
      selectedCountry,
      selectedChannel,
      selectedPlaylist,
      sortBy,
      searchTerm,
      get
    });
    resetAndFetch();
  }
  function filterByPlaylist(playlistTitle) {
    selectedPlaylist.set(playlistTitle);
    updateUrlFromFilters({
      selectedLevels,
      selectedTags,
      selectedCountry,
      selectedChannel,
      selectedPlaylist,
      sortBy,
      searchTerm,
      get
    });
    resetAndFetch();
  }
  function clearPlaylistFilter() {
    selectedPlaylist.set('');
    updateUrlFromFilters({
      selectedLevels,
      selectedTags,
      selectedCountry,
      selectedChannel,
      selectedPlaylist,
      sortBy,
      searchTerm,
      get
    });
    resetAndFetch();
  }

  // --- On mount: parse filters from URL and load initial videos ---
  let firstLoad = true;
  let lastQuery = '';

  onMount(() => {
    const filters = queryToFilters(window.location.search);
    const safeLevels = new Set(Array.from(filters.levels).filter((lvl) => validLevels.has(lvl)));
    selectedLevels.set(
      safeLevels.size ? safeLevels : new Set(['easy', 'intermediate', 'advanced'])
    );
    selectedTags.set(filters.tags.size ? filters.tags : new Set());
    selectedCountry.set(filters.country || '');
    selectedChannel.set(filters.channel || '');
    selectedPlaylist.set(filters.playlist || '');
    sortBy.set(filters.sort || 'new');
    searchTerm.set(filters.search || '');

    resetAndFetch();
    firstLoad = false;
  });

  // --- Reactively reload videos if URL query changes (manual back/forward, etc) ---
  $: if (!firstLoad && window.location.search !== lastQuery) {
    lastQuery = window.location.search;
    const filters = queryToFilters(window.location.search);
    const safeLevels = new Set(Array.from(filters.levels).filter((lvl) => validLevels.has(lvl)));
    selectedLevels.set(
      safeLevels.size ? safeLevels : new Set(['easy', 'intermediate', 'advanced'])
    );
    selectedTags.set(filters.tags.size ? filters.tags : new Set());
    selectedCountry.set(filters.country || '');
    selectedChannel.set(filters.channel || '');
    selectedPlaylist.set(filters.playlist || '');
    sortBy.set(filters.sort || 'new');
    searchTerm.set(filters.search || '');

    resetAndFetch();
  }

  // --- Hide watched videos if toggle is on ---
  $: filteredVideos = $hideWatched ? $videos.filter((v) => !$watchedIds.has(v.id)) : $videos;

  // --- Get user's saved channels if logged in (for "My Channels" filter) ---
  $: if ($user) {
    getUserSavedChannels($user.id)
      .then((chs) => userChannels.set(chs))
      .catch(() => userChannels.set([]));
  } else {
    userChannels.set([]);
  }
</script>

<!-- --- Main page layout --- -->
<div class="page-container">
  <div class="sortbar-container">
    <SortBar
      {levels}
      {sortChoices}
      {countryOptions}
      {tagOptions}
      selectedLevels={Array.from($selectedLevels)}
      sortBy={$sortBy}
      selectedCountry={$selectedCountry}
      selectedTags={Array.from($selectedTags)}
      hideWatched={$hideWatched}
      searchTerm={$searchTerm}
      {searchOpen}
      myChannels={$userChannels}
      selectedChannel={$selectedChannel}
      on:change={handleSortBarChange}
    />
  </div>

  {#if $selectedChannel && $selectedChannel !== '__ALL__'}
    <FilterChip
      type="info"
      label="Filtered by channel"
      value={$videos.length > 0
        ? ($videos[0].channel?.name ?? $videos[0].channel_name ?? $selectedChannel)
        : $selectedChannel}
      onClear={clearChannelFilter}
      clearClass="clear-btn--blue"
    />
  {/if}

  {#if $selectedPlaylist}
    <FilterChip
      type="warning"
      label="Filtered by playlist"
      value={$videos.length > 0
        ? ($videos[0].playlist?.title ?? $selectedPlaylist)
        : $selectedPlaylist}
      onClear={clearPlaylistFilter}
      clearClass="clear-btn--purple"
    />
  {/if}

  {#if $loading && $videos.length === 0}
    <LoadingSpinner />
  {:else if $errorMsg}
    <ErrorMessage message={$errorMsg} />
  {:else if !$loading && $videos.length === 0}
    <div class="loading-more text-muted">No videos match your filters.</div>
  {:else}
    <VideoGrid
      videos={filteredVideos}
      getBestThumbnail={utils.getBestThumbnail}
      difficultyColor={utils.difficultyColor}
      difficultyLabel={utils.difficultyLabel}
      formatLength={utils.formatLength}
      {filterByChannel}
      {filterByPlaylist}
    />
    {#if $sortBy === 'random'}
      <!-- For random, always show Load More button -->
      <button
        class="load-more-btn"
        on:click={loadMore}
        disabled={$loading}
        style="margin: 2em auto; display: block;"
      >
        {#if $loading}Loading...{/if}
        {#if !$loading}Load More{/if}
      </button>
    {:else if $hasMore}
      <!-- For paged results, sentinel for infinite scroll -->
      <div bind:this={sentinel} style="height: 2em;"></div>
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
    display: block;
  }
  .load-more-btn:disabled {
    opacity: 0.66;
    cursor: not-allowed;
  }
</style>
