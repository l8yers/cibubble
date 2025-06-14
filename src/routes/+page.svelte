<script>
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import VideoGrid from '$lib/components/VideoGrid.svelte';
  import SortBar from '$lib/components/SortBar.svelte';
  import * as utils from '$lib/utils.js';
  import '../app.css';


  // import { getTagsForChannel } from '$lib/api/tags.js'; // <-- comment this out for now

async function getTagsForChannel(channelId) {
  const { data, error } = await supabase
    .from('channel_tags')
    .select('tag:tag_id(id,name)')
    .eq('channel_id', channelId);
  if (error) return [];
  return (data || []).map(row => row.tag);
}

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

  import { writable, get } from 'svelte/store';

  const PAGE_SIZE = 30;
  const videos = writable([]);
  const loading = writable(false);
  const errorMsg = writable('');
  const hasMore = writable(true);
  const pageNum = writable(1);

  let searchOpen = false;
  let sentinel;
  let observerInstance;

  const levels = [
    { value: 'easy', label: 'Easy' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];
  const validLevels = new Set(levels.map((l) => l.value));
  const sortChoices = [
    { value: 'random', label: 'Random' },
    { value: 'short', label: 'Short' },
    { value: 'long', label: 'Long' },
    { value: 'new', label: 'New' },
    { value: 'old', label: 'Old' }
  ];
  let countryOptions = [
    'Spain','Mexico','Argentina','Colombia','Chile','Various','Peru','Guatemala','Uruguay',
    'Dominican Republic','Venezuela','Costa Rica','Cuba','Ecuador','Paraguay','Panama',
    'Canary Islands','Italy','Puerto Rico','Equatorial Guinea','DUBS','Not Native Speaker',
    'AI Voice','Latin America'
  ].sort();
  let tagOptions = [
    'For Learners','Kids Show','Dubbed Show','Videogames','News','History','Science','Travel',
    'Lifestyle','Personal Development','Cooking','Music','Comedy','Native Show','Education',
    'Sports','Current Events'
  ].sort();

  // Infinite Scroll
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

  // URL <-> Filters
  function filtersToQuery({ levels, tags, country, channel, playlist, sort, search }) {
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

  // Main fetch function
  async function fetchVideos({ append = false } = {}) {
    loading.set(true);
    errorMsg.set('');
    const query = new URLSearchParams({
      page: get(pageNum),
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
      videos.update((vs) => [...vs, ...fetched]);
    } else {
      videos.set(fetched);
    }
    hasMore.set(more);
    loading.set(false);
  }

  async function loadMore() {
    if (!get(hasMore) || get(loading)) return;
    pageNum.update((p) => p + 1);
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

    updateUrlFromFilters();
    resetAndFetch();
  }
  function filterByChannel(channelId) {
    selectedChannel.set(channelId);
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

  let firstLoad = true;
  let lastQuery = '';

  // First load: set filters from URL and fetch
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
    sortBy.set(filters.sort || 'random');
    searchTerm.set(filters.search || '');

    resetAndFetch();
    firstLoad = false;
  });

  // SPA: Listen for URL query changes after first load
  $: if (!firstLoad && $page.url.search !== lastQuery) {
    lastQuery = $page.url.search;
    const filters = queryToFilters($page.url.search);
    const safeLevels = new Set(Array.from(filters.levels).filter((lvl) => validLevels.has(lvl)));
    selectedLevels.set(
      safeLevels.size ? safeLevels : new Set(['easy', 'intermediate', 'advanced'])
    );
    selectedTags.set(filters.tags.size ? filters.tags : new Set());
    selectedCountry.set(filters.country || '');
    selectedChannel.set(filters.channel || '');
    selectedPlaylist.set(filters.playlist || '');
    sortBy.set(filters.sort || 'random');
    searchTerm.set(filters.search || '');

    resetAndFetch();
  }

  // Hide watched filtering (main new bit)
  $: filteredVideos = $hideWatched
    ? $videos.filter(v => !$watchedIds.has(v.id))
    : $videos;
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
      on:change={handleSortBarChange}
    />
  </div>

  {#if $selectedChannel}
    <div class="chip-info">
      <span>
        <b>Filtered by channel:</b>
        {#if $videos.length > 0}
          {$videos[0].channel?.name ?? $videos[0].channel_name ?? $selectedChannel}
        {:else}
          {$selectedChannel}
        {/if}
      </span>
      <button on:click={clearChannelFilter} class="clear-btn clear-btn--blue">✕ Clear</button>
    </div>
  {/if}
  {#if $selectedPlaylist}
    <div class="chip-warning">
      <span>
        <b>Filtered by playlist:</b>
        {#if $videos.length > 0}
          {$videos[0].playlist?.title ?? $selectedPlaylist}
        {:else}
          {$selectedPlaylist}
        {/if}
      </span>
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
      videos={filteredVideos}
      getBestThumbnail={utils.getBestThumbnail}
      difficultyColor={utils.difficultyColor}
      difficultyLabel={utils.difficultyLabel}
      formatLength={utils.formatLength}
      {filterByChannel}
      {filterByPlaylist}
    />
    {#if $hasMore && $sortBy !== 'random'}
      <div bind:this={sentinel} style="height: 2em;"></div>
    {/if}
    {#if $hasMore && $sortBy === 'random'}
      <button
        class="load-more-btn"
        on:click={loadMore}
        disabled={$loading}
        style="margin: 2em auto; display: block;"
      >
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
  display: block;
}
.load-more-btn:disabled {
  opacity: 0.66;
  cursor: not-allowed;
}
</style>