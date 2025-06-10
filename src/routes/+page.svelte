<script>
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import VideoGrid from '$lib/VideoGrid.svelte';
  import SortBar from '$lib/SortBar.svelte';
  import * as utils from '$lib/utils.js';

  // --- DATA STATE ---
  let allVideos = [];
  let filteredVideos = [];
  let videos = [];
  let loading = false;
  let loadingMore = false;
  let errorMsg = '';
  const pageSize = 30;
  let page = 1;
  let allLoaded = false;

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
  let searchTerm = '';

  // --- FILTER/SORT LOGIC ---
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
    // SEARCH FILTER
    if (searchTerm && searchTerm.trim() !== '') {
      const s = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (v) =>
          (v.title && v.title.toLowerCase().includes(s)) ||
          (v.channel?.name && v.channel.name.toLowerCase().includes(s)) ||
          (v.channel_name && v.channel_name.toLowerCase().includes(s))
      );
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
    filteredVideos = filterAndSort(allVideos);
    page = 1;
    videos = filteredVideos.slice(0, pageSize);
    allLoaded = videos.length >= filteredVideos.length;
  }

  async function loadMoreVideos() {
    if (loadingMore || allLoaded) return;
    loadingMore = true;
    page += 1;
    const nextVideos = filteredVideos.slice(0, page * pageSize);
    videos = nextVideos;
    allLoaded = videos.length >= filteredVideos.length;
    loadingMore = false;
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
      searchTerm = '';
      updateGrid();
    }
  }
  function handleSearchInput(event) {
    searchTerm = event.target.value;
    updateGrid();
  }

  // --- DATA LOAD ---
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
  });

  // --- INFINITE SCROLL LOGIC ---
  let sentinel;
  let observer;
  function setupObserver() {
    if (observer) observer.disconnect();
    if (!sentinel) return;
    observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && !allLoaded && !loadingMore) {
          await loadMoreVideos();
        }
      },
      { root: null, rootMargin: '120px', threshold: 0.1 }
    );
    observer.observe(sentinel);
  }

  $: {
    if (sentinel && !allLoaded) setupObserver();
  }

  onDestroy(() => {
    if (observer) observer.disconnect();
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
  />

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
    {#if !allLoaded && videos.length > 0}
      <div bind:this={sentinel} style="height:36px;"></div>
    {/if}
    {#if loadingMore}
      <div style="text-align:center;margin:1.5em 0;font-size:1.1em;">Loading more…</div>
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
.error {
  color: #c44;
  text-align: center;
  margin: 2em 0;
}
</style>
