<script>
  // --- Svelte & store core ---
  import { onMount, onDestroy } from 'svelte';
  import { writable, get } from 'svelte/store';
  import { page } from '$app/stores'; // 👈 New!

  // --- App UI Components ---
  import VideoGrid from '$lib/components/home/VideoGrid.svelte';
  import SortBar from '$lib/components/home/SortBar.svelte';
  import FilterChip from '$lib/components/home/FilterChip.svelte';
  import LoadingSpinner from '$lib/components/home/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/home/ErrorMessage.svelte';

  // --- Utility functions ---
  import * as utils from '$lib/utils/utils.js';
  import { filtersToQuery, queryToFilters } from '$lib/utils/filters.js';
  import { updateUrlFromFilters } from '$lib/utils/url.js';

  // --- App-wide filter state ---
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

  // --- App-wide constants ---
  import { LEVELS, VALID_LEVELS, SORT_CHOICES, COUNTRY_OPTIONS, TAG_OPTIONS } from '$lib/constants.js';

  // --- User/account data ---
  import { user } from '$lib/stores/user.js';
  import { userChannels } from '$lib/stores/userChannels.js';
  import { getUserSavedChannels } from '$lib/api/userChannels.js';

  // --- Local state ---
  const PAGE_SIZE = 50;
  const videos = writable([]);
  const loading = writable(false);
  const errorMsg = writable('');
  const hasMore = writable(true);
  const pageNum = writable(1);

  let searchOpen = false;
  let sentinel;
  let observerInstance;

  const levels = LEVELS;
  const validLevels = VALID_LEVELS;
  const sortChoices = SORT_CHOICES;
  let countryOptions = COUNTRY_OPTIONS;
  let tagOptions = TAG_OPTIONS;

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

  async function fetchVideos({ append = false } = {}) {
    loading.set(true);
    errorMsg.set('');

    let channelFilter = get(selectedChannel);
    if (channelFilter === '__ALL__' && get(userChannels).length > 0) {
      channelFilter = get(userChannels).map((ch) => ch.id).join(',');
    } else if (channelFilter === '') {
      channelFilter = '';
    }

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

    const res = await fetch(`/api/videos?${query}`);
    if (!res.ok) {
      const errText = await res.text();
      errorMsg.set('Error loading videos: ' + errText);
      loading.set(false);
      return;
    }
    const { videos: fetched, hasMore: more } = await res.json();

    if (append) {
      videos.update((vs) => [...vs, ...fetched]);
    } else {
      videos.set(fetched);
    }

    if (get(sortBy) === 'random') {
      hasMore.set(true);
    } else {
      hasMore.set(more);
    }
    loading.set(false);
  }

  async function loadMore() {
    if (get(loading)) return;
    if (get(sortBy) !== 'random') {
      pageNum.update((p) => p + 1);
    }
    await fetchVideos({ append: true });
  }

  function resetAndFetch() {
    pageNum.set(1);
    fetchVideos({ append: false });
  }

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
  function filterByPlaylist(playlistId) {
    selectedPlaylist.set(playlistId);
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

  // This block runs on mount (for first page load)
  onMount(() => {
    const filters = queryToFilters($page.url.search);
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

  // --- Reactively reload videos if URL query changes (via SvelteKit SPA navigation) ---
  $: currentQuery = $page.url.search;
  $: if (!firstLoad && currentQuery !== lastQuery) {
    lastQuery = currentQuery;
    const filters = queryToFilters(currentQuery);
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
      query={$page.url.search} 
    />
    {#if $sortBy === 'random'}
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
