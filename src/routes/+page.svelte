<script>
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import VideoGrid from '$lib/VideoGrid.svelte';
  import SortBar from '$lib/SortBar.svelte';
  import * as utils from '$lib/utils.js';

  // --- DATA STATE ---
  let videos = [];
  let allVideos = [];
  let loading = false;
  let errorMsg = '';
  const pageSize = 30;
  let allLoaded = false;

  // --- SEARCH STATE ---
  let searchTerm = '';
  let searchResults = [];
  let searchPage = 1;
  let searching = false;
  let searchError = '';
  let allSearchLoaded = false;

  // --- FILTER STATE ---
  const levels = [
    { value: 'superbeginner', label: 'Super Beginner' },
    { value: 'beginner', label: 'Beginner' },
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
  let selectedLevels = new Set(levels.map((l) => l.value));
  let sortBy = 'random';
  let showLevelDropdown = false;
  let showSortDropdown = false;
  let hideWatched = false;
  let watchedIds = new Set();

  let searchOpen = false;

  // --- FILTER/SORT LOGIC (for non-search mode) ---
  function levelOrder(level) {
    return ['superbeginner', 'beginner', 'intermediate', 'advanced'].indexOf(level);
  }
  function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function filterAndSort(input) {
    let filtered = input.filter(
      (v) =>
        v.title &&
        v.title !== 'Private video' &&
        v.title !== 'Deleted video' &&
        selectedLevels.has(v.level)
    );
    if (hideWatched) {
      filtered = filtered.filter((v) => !watchedIds.has(String(v.id)));
    }
    if (sortBy === 'random') {
      return shuffleArray(filtered);
    } else if (sortBy === 'easy') {
      return filtered.sort((a, b) => levelOrder(a.level) - levelOrder(b.level));
    } else if (sortBy === 'hard') {
      return filtered.sort((a, b) => levelOrder(b.level) - levelOrder(a.level));
    } else if (sortBy === 'long') {
      return filtered.sort((a, b) => (b.length || 0) - (a.length || 0));
    } else if (sortBy === 'short') {
      return filtered.sort((a, b) => (a.length || 0) - (b.length || 0));
    } else if (sortBy === 'new') {
      return filtered.sort((a, b) => new Date(b.published) - new Date(a.published));
    } else if (sortBy === 'old') {
      return filtered.sort((a, b) => new Date(a.published) - new Date(b.published));
    }
    return filtered;
  }
  function updateGrid() {
    videos = filterAndSort(allVideos).slice(0, pageSize);
    allLoaded = videos.length >= filterAndSort(allVideos).length;
  }

  function toggleLevel(level) {
    if (selectedLevels.has(level)) {
      selectedLevels.delete(level);
    } else {
      selectedLevels.add(level);
    }
    updateGrid();
  }
  function allLevelsSelected() {
    return selectedLevels.size === levels.length;
  }
  function toggleAllLevels() {
    if (allLevelsSelected()) {
      selectedLevels = new Set();
    } else {
      selectedLevels = new Set(levels.map((l) => l.value));
    }
    updateGrid();
  }
  function handleSortSelect(value) {
    sortBy = value;
    showSortDropdown = false;
    updateGrid();
  }
  function handleLevelDropdownToggle() {
    showLevelDropdown = !showLevelDropdown;
  }
  function handleSortDropdownToggle() {
    showSortDropdown = !showSortDropdown;
  }
  function toggleSearch() {
    searchOpen = !searchOpen;
    if (!searchOpen) {
      clearSearch();
    }
  }

  // --- SEARCH HANDLERS ---
  let searchTimeout;
  function handleSearchInput(event) {
    searchTerm = event.target.value;
    clearTimeout(searchTimeout);
    if (searchTerm.trim() === '') {
      clearSearch();
      return;
    }
    searchTimeout = setTimeout(() => runSearch(1, true), 250); // debounce and reset on new search
  }
  async function runSearch(page = 1, reset = false) {
    if (!searchTerm.trim()) return;
    searching = true;
    searchError = '';
    let from = (page - 1) * pageSize;
    let to = from + pageSize - 1;
    // --- FIXED Supabase .or() syntax ---
    const { data, error } = await supabase
      .from('videos')
      .select('*, playlist:playlist_id(title), channel:channel_id(name)')
      .or(
  `title.ilike.%${searchTerm}%,channel_name.ilike.%${searchTerm}%`      )
      .range(from, to);
    if (error) {
      searchError = error.message;
      if (reset) searchResults = [];
    } else {
      if (reset) {
        searchResults = data;
        allSearchLoaded = data.length < pageSize;
        searchPage = 1;
      } else {
        searchResults = [...searchResults, ...data];
        allSearchLoaded = data.length < pageSize;
        searchPage = page;
      }
    }
    searching = false;
  }
  function clearSearch() {
    searchTerm = '';
    searchResults = [];
    searching = false;
    searchError = '';
    allSearchLoaded = false;
    searchPage = 1;
    updateGrid();
  }

  // --- INFINITE SCROLL ---
  function handleScroll(e) {
    const el = e.target.scrollingElement || e.target;
    if (
      searchTerm &&
      !allSearchLoaded &&
      !searching &&
      el.scrollHeight - el.scrollTop - el.clientHeight < 480 // near bottom
    ) {
      runSearch(searchPage + 1, false);
    }
    if (
      !searchTerm &&
      !allLoaded &&
      el.scrollHeight - el.scrollTop - el.clientHeight < 480
    ) {
      // For non-search, load more locally (not from server)
      const nextVideos = filterAndSort(allVideos).slice(0, videos.length + pageSize);
      if (nextVideos.length > videos.length) {
        videos = nextVideos;
        allLoaded = videos.length >= filterAndSort(allVideos).length;
      }
    }
  }

  // --- DATA LOAD (initial) ---
  onMount(async () => {
    loading = true;
    const { data, error } = await supabase
      .from('videos')
      .select('*, playlist:playlist_id(title), channel:channel_id(name)')
      .limit(2000);
    if (error) errorMsg = error.message;
    else if (data && data.length > 0) {
      allVideos = data;
      updateGrid();
    } else {
      videos = [];
      allLoaded = true;
    }
    loading = false;
    window.addEventListener('scroll', handleScroll, { passive: true });
  });
  onDestroy(() => {
    window.removeEventListener('scroll', handleScroll);
  });
</script>

<div class="page-container">
  <SortBar
    {levels}
    {sortChoices}
    {selectedLevels}
    {sortBy}
    {showSortDropdown}
    {showLevelDropdown}
    {toggleLevel}
    {toggleAllLevels}
    {allLevelsSelected}
    {handleSortSelect}
    {handleSortDropdownToggle}
    {handleLevelDropdownToggle}
    {searchOpen}
    {toggleSearch}
    {searchTerm}
    {handleSearchInput}
    {hideWatched}
    {updateGrid}
    clearSearch={clearSearch}
  />

  {#if searchTerm.trim() !== ''}
    {#if searching && searchResults.length === 0}
      <p style="text-align:center;margin:2em 0;font-size:1.2em;">Searching…</p>
    {:else if searchError}
      <div class="error">{searchError}</div>
    {:else if searchResults.length === 0}
      <div style="margin-top:2em;text-align:center;color:#888;font-size:1.1em;">No videos found.</div>
    {:else}
      <VideoGrid
        videos={searchResults}
        getBestThumbnail={utils.getBestThumbnail}
        difficultyColor={utils.difficultyColor}
        difficultyLabel={utils.difficultyLabel}
        formatLength={utils.formatLength}
      />
      {#if !allSearchLoaded}
        <div class="loading-more">Loading more…</div>
      {/if}
    {/if}
  {:else}
    {#if loading}
      <p style="text-align:center;margin:2em 0;font-size:1.2em;">Loading videos…</p>
    {:else if errorMsg}
      <div class="error">{errorMsg}</div>
    {:else if videos.length === 0}
      <div style="margin-top:2em;text-align:center;color:#888;font-size:1.1em;">No videos match your filters.</div>
    {:else}
      <VideoGrid
        {videos}
        getBestThumbnail={utils.getBestThumbnail}
        difficultyColor={utils.difficultyColor}
        difficultyLabel={utils.difficultyLabel}
        formatLength={utils.formatLength}
      />
      {#if !allLoaded}
        <div class="loading-more">Loading more…</div>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .page-container {
    max-width: 1920px;
    margin: 0 auto;
    padding: 2rem 2vw 2.5rem 2vw;
    font-family: Inter, Arial, sans-serif;
  }
  .loading-more {
    text-align: center;
    color: #2e9be6;
    margin: 1.8em 0 2.2em 0;
    font-size: 1.09em;
    font-weight: 600;
    opacity: 0.78;
  }
  .error {
    color: #b12c2c;
    font-weight: 700;
    margin: 2em auto;
    text-align: center;
    background: #ffd3d3;
    padding: 1em 2em;
    border-radius: 11px;
    max-width: 520px;
    font-size: 1.07em;
    border: 1.5px solid #fca5a5;
  }
</style>
