<script>
  import { onMount, onDestroy } from 'svelte';
  import { writable, get } from 'svelte/store';
  import { page } from '$app/stores';

  import VideoGrid from '$lib/components/home/VideoGrid.svelte';
  import SortBar from '$lib/components/home/SortBar.svelte';
  import FilterChip from '$lib/components/home/FilterChip.svelte';
  import FilterChipsRow from '$lib/components/home/FilterChipsRow.svelte';
  import BubbleSpinner from '$lib/components/ui/BubbleSpinner.svelte';
  import ErrorMessage from '$lib/components/home/ErrorMessage.svelte';

  import MobileMenuBar from '$lib/components/mobile/MobileMenuBar.svelte';
  import SortDropdown from '$lib/components/mobile/SortDropdown.svelte';
  import FullPageFilter from '$lib/components/mobile/FullPageFilter.svelte';

  import * as utils from '$lib/utils/utils.js';
  import { filtersToQuery, queryToFilters } from '$lib/utils/filters.js';
  import { updateUrlFromFilters } from '$lib/utils/url.js';
  import {
    watchLaterIds,
    addToWatchLater,
    removeFromWatchLater,
    watchLaterLoading
  } from '$lib/stores/videos.js';

  import {
    selectedChannel,
    selectedLevels,
    sortBy,
    selectedCountry,
    selectedTags,
    hideWatched,
    watchedIds,
    searchTerm,
    loadWatchLaterVideos
  } from '$lib/stores/videos.js';

  import {
    LEVELS,
    VALID_LEVELS,
    SORT_CHOICES,
    COUNTRY_OPTIONS,
    TAG_OPTIONS
  } from '$lib/constants.js';

  import { user } from '$lib/stores/user.js';
  import { userChannels } from '$lib/stores/userChannels.js';
  import { getUserSavedChannels } from '$lib/api/userChannels.js';

  import { isMobile } from '$lib/stores/screen.js';

  import { supabase } from '$lib/supabaseClient';

  import { handleClearChip, handleResetFilters } from '$lib/utils/filterHandlers.js';

  // Loading state
  const loadedOnce = writable(false);
  const loading = writable(false);
  const isLoadingMore = writable(false);

  let mounted = false;
  let showSortDropdown = false;
  let showFullPageFilter = false;
  let showMobileSearch = false;

  onMount(() => {
    mounted = true;
    let filters;
    let initialSearch = '';
    try {
      initialSearch = get(page).url.search;
    } catch (err) {}
    if (initialSearch && initialSearch.length > 1) {
      filters = queryToFilters(initialSearch);
      saveFiltersToStorage(filters);
    } else {
      filters = loadFiltersFromStorage() || {};
    }

    const safeLevels = new Set(
      Array.from(filters.levels || []).filter((lvl) => validLevels.has(lvl))
    );
    selectedLevels.set(
      safeLevels.size ? safeLevels : new Set(['easy', 'intermediate', 'advanced'])
    );
    selectedTags.set(filters.tags && filters.tags.length ? new Set(filters.tags) : new Set());
    selectedCountry.set(filters.country || '');
    selectedChannel.set(filters.channel || '');
    sortBy.set(filters.sort || 'new');
    searchTerm.set(filters.search || '');

    resetAndFetch();
    firstLoad = false;
  });

  $: if ($user) {
    loadWatchLaterVideos();
  }

  const PAGE_SIZE = 36;
  const videos = writable([]);
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

  function saveFiltersToStorage(filters) {
    try {
      localStorage.setItem('cibubble-filters', JSON.stringify(filters));
    } catch (_) {}
  }

  function loadFiltersFromStorage() {
    try {
      const data = localStorage.getItem('cibubble-filters');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

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
    isLoadingMore.set(append);
    errorMsg.set('');
    loadedOnce.set(false);

    let channelFilter = get(selectedChannel);
    if (channelFilter === '__ALL__' && get(userChannels).length > 0) {
      channelFilter = get(userChannels)
        .map((ch) => ch.id)
        .join(',');
    } else if (channelFilter === '' || channelFilter === '__WATCH_LATER__') {
      channelFilter = '';
    }

    const query = new URLSearchParams({
      page: get(sortBy) === 'random' ? 1 : get(pageNum),
      pageSize: PAGE_SIZE,
      levels: Array.from(get(selectedLevels)).join(','),
      tags: Array.from(get(selectedTags)).join(','),
      country: get(selectedCountry),
      channel: channelFilter,
      sort: get(sortBy),
      search: get(searchTerm)
    });

    let res;
    try {
      res = await fetch(`/api/videos?${query}`);
    } catch (err) {
      errorMsg.set('Error loading videos: Network error');
      loading.set(false);
      isLoadingMore.set(false);
      loadedOnce.set(true);
      return;
    }
    if (!res.ok) {
      const errText = await res.text();
      errorMsg.set('Error loading videos: ' + errText);
      loading.set(false);
      isLoadingMore.set(false);
      loadedOnce.set(true);
      return;
    }
    let resultJson;
    try {
      resultJson = await res.json();
    } catch (err) {
      errorMsg.set('Error loading videos: Bad JSON');
      loading.set(false);
      isLoadingMore.set(false);
      loadedOnce.set(true);
      return;
    }

    const { videos: fetched, hasMore: more } = resultJson;

    if (fetched && fetched.length > 0) {
      console.log('Fetched video sample:', fetched[0]);
    }

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
    isLoadingMore.set(false);
    loadedOnce.set(true);
  }

  async function loadMore() {
    if (get(loading)) {
      return;
    }
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
      sortBy,
      searchTerm,
      get
    });
    resetAndFetch();
  }

  // Mobile handlers
  function handleMobileSortSelect(val) {
    sortBy.set(val);
    showSortDropdown = false;
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

  function handleMobileFilterApply(e) {
    const detail = e.detail || {};
    selectedLevels.set(new Set(detail.selectedLevels || []));
    selectedTags.set(new Set(detail.selectedTags || []));
    selectedCountry.set(detail.selectedCountry || '');
    selectedChannel.set(detail.selectedChannel || '');
    hideWatched.set(detail.hideWatched || false);
    if (detail.sortBy) sortBy.set(detail.sortBy);
    updateUrlFromFilters({
      selectedLevels,
      selectedTags,
      selectedCountry,
      selectedChannel,
      sortBy,
      searchTerm,
      get
    });
    showFullPageFilter = false;
    resetAndFetch();
  }

  function handleMobileSearchInput(val) {
    searchTerm.set(val);
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
  function handleMobileSearchSubmit(val) {
    searchTerm.set(val);
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

  function filterByChannel(channelId) {
    selectedChannel.set(channelId);
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
  function clearChannelFilter() {
    selectedChannel.set('');
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

  let firstLoad = true;
  let lastQuery = '';
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
    sortBy.set(filters.sort || 'new');
    searchTerm.set(filters.search || '');

    resetAndFetch();
  }

  // ---- FILTERED VIDEOS LOGIC ----
  $: filteredVideos =
    $sortBy === 'random'
      ? $videos
      : ($selectedChannel === '__WATCH_LATER__'
          ? $videos.filter((v) => $watchLaterIds.has(v.id))
          : $selectedChannel === '__ALL__'
            ? $videos
            : $hideWatched
              ? $videos.filter((v) => !$watchedIds.has(v.id))
              : $videos
        )
        .filter(v => {
          // Hide videos with private/deleted/unavailable titles
          if (!v.title || typeof v.title !== 'string') return false;
          const t = v.title.trim().toLowerCase();
          if (
            t === '' ||
            t === 'deleted video' ||
            t === 'private video' ||
            t.startsWith('[deleted') ||
            t.includes('video unavailable')
          ) return false;
          return true;
        });

  // ==== DEBUG LOG: See what a video looks like after filtering ====
  $: if (filteredVideos && filteredVideos.length > 0) {
    console.log('Filtered video sample:', filteredVideos[0]);
  }

  // Saved channels handling
  $: if ($user) {
    getUserSavedChannels($user.id)
      .then((chs) => {
        userChannels.set(chs);
      })
      .catch((err) => {
        userChannels.set([]);
      });
  } else {
    userChannels.set([]);
  }

  $: saveFiltersToStorage({
    levels: Array.from($selectedLevels),
    tags: Array.from($selectedTags),
    country: $selectedCountry,
    channel: $selectedChannel,
    sort: $sortBy,
    search: $searchTerm
  });

  function isChannelSaved(video) {
    return $user && video.channel_id && $userChannels.some((ch) => ch.id === video.channel_id);
  }
  function isWatchLater(video) {
    return $user && $watchLaterIds.has(video.id);
  }
  async function handleAddToChannels(video) {
    if (!$user || !video?.channel_id) return;
    await supabase
      .from('saved_channels')
      .upsert(
        { user_id: $user.id, channel_id: video.channel_id },
        { onConflict: ['user_id', 'channel_id'] }
      );
    // Force refresh:
    getUserSavedChannels($user.id).then(userChannels.set);
  }

  async function handleRemoveFromChannels(video) {
    if (!$user || !video?.channel_id) return;
    await supabase
      .from('saved_channels')
      .delete()
      .eq('user_id', $user.id)
      .eq('channel_id', video.channel_id);
    // Force refresh:
    getUserSavedChannels($user.id).then(userChannels.set);
  }
  async function handleAddToWatchLater(video) {
    if (!$user || !video?.id) return;
    if (!$watchLaterIds.has(video.id)) {
      await addToWatchLater(video.id);
    }
  }
  async function handleRemoveFromWatchLater(video) {
    if (!$user || !video?.id) return;
    if ($watchLaterIds.has(video.id)) {
      await removeFromWatchLater(video.id);
    }
  }

  // --- FILTER CHIP LOGIC ---
  $: filterChips = [
    ...(
      $selectedLevels.size && $selectedLevels.size < levels.length
        ? Array.from($selectedLevels).map(lvl => ({
            type: 'level',
            label: utils.difficultyLabel ? utils.difficultyLabel(lvl) : lvl,
            value: '',
            clearClass: 'clear-btn--green'
          }))
        : []
    ),
    ...(
      $selectedTags.size
        ? Array.from($selectedTags).map(tag => ({
            type: 'tag',
            label: tag,
            value: '',
            clearClass: 'clear-btn--red'
          }))
        : []
    ),
    ...(
      $selectedCountry
        ? [{
            type: 'country',
            label: countryOptions.find(c => c.value === $selectedCountry)?.label ?? $selectedCountry,
            value: '',
            clearClass: 'clear-btn--blue'
          }]
        : []
    ),
    ...(
      $sortBy && $sortBy !== 'new'
        ? [{
            type: 'sort',
            label: sortChoices.find(sc => sc.value === $sortBy)?.label ?? $sortBy,
            value: '',
            clearClass: 'clear-btn--purple'
          }]
        : []
    ),
    ...(
      $searchTerm && $searchTerm.trim().length
        ? [{
            type: 'search',
            label: `Search: "${$searchTerm}"`,
            value: '',
            clearClass: 'clear-btn--gray'
          }]
        : []
    ),
    ...(
      $selectedChannel === '__WATCH_LATER__'
        ? [{
            type: 'watchlater',
            label: 'Watch Later',
            value: '',
            clearClass: 'clear-btn--blue'
          }]
        : $selectedChannel === '__ALL__'
          ? [{
              type: 'channel',
              label: 'All Saved Channels',
              value: '',
              clearClass: 'clear-btn--blue'
            }]
          : $selectedChannel && $selectedChannel !== ''
            ? [{
                type: 'channel',
                label:
                  $videos.length > 0
                    ? ($videos[0].channel?.name ?? $videos[0].channel_name ?? $selectedChannel)
                    : $selectedChannel,
                value: '',
                clearClass: 'clear-btn--blue'
              }]
            : []
    ),
  ];

  // Pass in closures so you can use Svelte's get() and current page-scoped fns
  function clearChipHandler(chip) {
    handleClearChip({
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
    });
  }
  function resetFiltersHandler() {
    handleResetFilters({
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
    });
  }
</script>

<div class="page-container">
  {#if mounted && !$isMobile}
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
  {/if}

  {#if filterChips.length > 0}
    <div class="chips-container">
      <FilterChipsRow
        {filterChips}
        showReset={true}
        onClearChip={clearChipHandler}
        onReset={resetFiltersHandler}
      />
    </div>
  {/if}

  <div class="content-container">
    {#if $videos.length > 0}
      <VideoGrid
        videos={filteredVideos}
        getBestThumbnail={utils.getBestThumbnail}
        difficultyColor={utils.difficultyColor}
        difficultyLabel={utils.difficultyLabel}
        formatLength={utils.formatLength}
        {filterByChannel}
        query={$page.url.search}
        {isChannelSaved}
        {isWatchLater}
        onAddToChannels={handleAddToChannels}
        onRemoveFromChannels={handleRemoveFromChannels}
        onAddToWatchLater={handleAddToWatchLater}
        onRemoveFromWatchLater={handleRemoveFromWatchLater}
      />
      {#if $sortBy === 'random'}
        <button
          class="load-more-btn"
          on:click={loadMore}
          disabled={$loading}
          style="margin: 2em auto; display: block; position: relative;"
        >
          {#if $isLoadingMore && $loading}
            <div class="bubble-spinner-bottom">
              <BubbleSpinner />
            </div>
            <span style="opacity:0.3;pointer-events:none;">Load More</span>
          {:else}
            Load More
          {/if}
        </button>
      {:else if $hasMore}
        <div bind:this={sentinel} style="height: 2em;"></div>
      {/if}
    {/if}
  </div>

  <div class="center-content">
    {#if $loading && !$isLoadingMore}
      <div class="bubble-spinner-overlay" style="top: 90px !important;">
        <BubbleSpinner />
      </div>
    {:else if $errorMsg}
      <ErrorMessage message={$errorMsg} />
    {:else if $loadedOnce && filteredVideos.length === 0}
      <div class="loading-more text-muted">No videos match your filters.</div>
    {/if}
  </div>

  {#if $isLoadingMore && $loading && $hasMore && $sortBy !== 'random'}
    <div class="bubble-spinner-bottom">
      <BubbleSpinner />
    </div>
  {/if}

  {#if mounted && $isMobile}
    <MobileMenuBar
      openSearch={showMobileSearch}
      searchValue={$searchTerm}
      on:showSearch={() => (showMobileSearch = true)}
      on:closeSearch={() => (showMobileSearch = false)}
      on:searchInput={(e) => handleMobileSearchInput(e.detail)}
      on:submitSearch={(e) => handleMobileSearchSubmit(e.detail)}
      on:sort={() => (showSortDropdown = true)}
      on:filter={() => (showFullPageFilter = true)}
    />
    <SortDropdown
      open={showSortDropdown}
      {sortChoices}
      selectedSort={$sortBy}
      onSelect={handleMobileSortSelect}
      onClose={() => (showSortDropdown = false)}
    />
    <FullPageFilter
      open={showFullPageFilter}
      {levels}
      selectedLevels={Array.from($selectedLevels)}
      {countryOptions}
      selectedCountry={$selectedCountry}
      {tagOptions}
      selectedTags={Array.from($selectedTags)}
      myChannels={$userChannels}
      selectedChannel={$selectedChannel}
      hideWatched={$hideWatched}
      currentSort={$sortBy}
      on:apply={handleMobileFilterApply}
      on:close={() => (showFullPageFilter = false)}
    />
  {/if}
</div>

<style>
  .chips-container {
    max-width: 1640px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  .sortbar-container,
  .content-container {
    max-width: 1700px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  .reset-filters-link {
    color: #d3212c;
    font-weight: 600;
    background: none;
    border: none;
    font-size: 1em;
    cursor: pointer;
    margin-left: 1.2em;
    padding: 0;
    box-shadow: none;
    border-radius: 0;
    letter-spacing: 0.02em;
    transition: color 0.14s;
  }
  .reset-filters-link:hover,
  .reset-filters-link:focus {
    color: #a11a22;
  }

  .center-content {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 180px;
    width: 100%;
  }
  .loading-more {
    font-size: 1.15em;
    color: #555;
    margin: 2em 0 0 0;
    text-align: center;
  }
  .text-muted {
    color: #888;
  }
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
    position: relative;
  }
  .load-more-btn:disabled {
    opacity: 0.66;
    cursor: not-allowed;
  }

  @media (max-width: 1200px) {
    .chips-container,
    .sortbar-container,
    .content-container {
      max-width: 1100px;
    }
  }
  @media (max-width: 900px) {
    .chips-container,
    .sortbar-container,
    .content-container {
      max-width: 700px;
    }
  }
  @media (max-width: 700px) {
    .chips-container,
    .sortbar-container,
    .content-container {
      max-width: 100vw;
      padding-left: 0.15em;
      padding-right: 0.15em;
    }
    .reset-filters-link {
      font-size: 0.92em;
      margin-left: 0.44em;
      font-weight: 500;
    }
  }
</style>
