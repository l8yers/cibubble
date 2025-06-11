<script>
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import VideoGrid from '$lib/components/VideoGrid.svelte';
  import SortBar from '$lib/components/SortBar.svelte';
  import * as utils from '$lib/utils.js';
  import '../app.css';

  let videos = [];
  let allVideos = [];
  let loading = false;
  let errorMsg = '';
  const pageSize = 30;
  let allLoaded = false;

  let searchTerm = '';
  let searchResults = [];
  let searchPage = 1;
  let searching = false;
  let searchError = '';
  let allSearchLoaded = false;

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

  let countryOptions = [
    "Spain", "Mexico", "Argentina", "Colombia", "Chile", "Various", "Peru",
    "Guatemala", "Uruguay", "Dominican Republic", "Venezuela", "Costa Rica", "Cuba", "Ecuador", "Paraguay", "Panama", "Canary Islands", "Italy", "Puerto Rico", "Equatorial Guinea", "DUBS", "Not Native Speaker", "AI Voice", "Latin America"
  ].sort();

  let tagOptions = [
    "For Learners", "Kids Show", "Dubbed Show", "Videogames", "News", "History", "Science", "Travel", "Lifestyle", "Personal Development", "Cooking", "Music", "Comedy", "Native Show", "Education", "Sports", "Current Events"
  ].sort();

  let selectedCountry = "";
  let selectedTags = new Set();

  let showCountryDropdown = false;
  let showTagDropdown = false;

  function setSelectedCountry(c) {
    selectedCountry = (c === selectedCountry) ? "" : c;
    showCountryDropdown = false;
    updateGrid();
  }

  function toggleTag(tag) {
    if (selectedTags.has(tag)) selectedTags.delete(tag);
    else selectedTags.add(tag);
    updateGrid();
  }
  function clearTags() {
    selectedTags = new Set();
    updateGrid();
  }
  function toggleCountryDropdown() {
    showCountryDropdown = !showCountryDropdown;
  }
  function toggleTagDropdown() {
    showTagDropdown = !showTagDropdown;
  }

  let selectedLevels = new Set(levels.map((l) => l.value));
  let sortBy = 'random';
  let showLevelDropdown = false;
  let showSortDropdown = false;
  let hideWatched = false;
  let watchedIds = new Set();
  let searchOpen = false;

  // Channel filter logic
  let selectedChannel = "";
  function filterByChannel(channelName) {
    selectedChannel = channelName;
    updateGrid();
  }
  function clearChannelFilter() {
    selectedChannel = "";
    updateGrid();
  }

  // Playlist filter logic
  let selectedPlaylist = "";
  function filterByPlaylist(playlistTitle) {
    selectedPlaylist = playlistTitle;
    updateGrid();
  }
  function clearPlaylistFilter() {
    selectedPlaylist = "";
    updateGrid();
  }

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
    let filtered = input;
    if (selectedChannel) {
      filtered = filtered.filter(v => v.channel_name === selectedChannel);
    }
    if (selectedPlaylist) {
      filtered = filtered.filter(v => v.playlist?.title === selectedPlaylist);
    }
    filtered = filtered.filter(
      (v) =>
        v.title &&
        v.title !== 'Private video' &&
        v.title !== 'Deleted video' &&
        selectedLevels.has(v.level)
    );
    if (hideWatched) {
      filtered = filtered.filter((v) => !watchedIds.has(String(v.id)));
    }
    if (selectedCountry) {
      filtered = filtered.filter((v) =>
        (v.channel?.country || "").trim().toLowerCase() === selectedCountry.trim().toLowerCase()
      );
    }
    if (selectedTags.size > 0) {
      filtered = filtered.filter((v) => {
        const tags = (v.channel?.tags || "")
          .split(",")
          .map(t => t.trim().toLowerCase())
          .filter(Boolean);
        for (let tag of selectedTags) {
          if (tags.includes(tag.toLowerCase())) return true;
        }
        return false;
      });
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

  let searchTimeout;
  function handleSearchInput(event) {
    searchTerm = event.target.value;
    clearTimeout(searchTimeout);
    if (searchTerm.trim() === '') {
      clearSearch();
      return;
    }
    searchTimeout = setTimeout(() => runSearch(1, true), 250);
  }
  async function runSearch(page = 1, reset = false) {
    if (!searchTerm.trim()) return;
    searching = true;
    searchError = '';
    let from = (page - 1) * pageSize;
    let to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('videos')
      .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
      .or(
        `title.ilike.%${searchTerm}%,channel_name.ilike.%${searchTerm}%`
      )
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

  function handleScroll(e) {
    const el = e.target.scrollingElement || e.target;
    if (
      searchTerm &&
      !allSearchLoaded &&
      !searching &&
      el.scrollHeight - el.scrollTop - el.clientHeight < 480
    ) {
      runSearch(searchPage + 1, false);
    }
    if (
      !searchTerm &&
      !allLoaded &&
      el.scrollHeight - el.scrollTop - el.clientHeight < 480
    ) {
      const nextVideos = filterAndSort(allVideos).slice(0, videos.length + pageSize);
      if (nextVideos.length > videos.length) {
        videos = nextVideos;
        allLoaded = videos.length >= filterAndSort(allVideos).length;
      }
    }
  }

  onMount(async () => {
    loading = true;
    const { data, error } = await supabase
      .from('videos')
      .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
      .limit(2000);

    if (error) {
      errorMsg = error.message;
    } else if (data && data.length > 0) {
      allVideos = data;
      updateGrid();
    } else {
      videos = [];
      allLoaded = true;
    }
    loading = false;
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', handleScroll);
    }
  });
</script>

<div class="page-container">
    <div class="sortbar-container">
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
    {countryOptions}
    {selectedCountry}
    {setSelectedCountry}
    {showCountryDropdown}
    {toggleCountryDropdown}
    {tagOptions}
    {selectedTags}
    {toggleTag}
    {clearTags}
    {showTagDropdown}
    {toggleTagDropdown}
  />
    </div>


  {#if selectedChannel}
    <div class="chip-info ">
      <span><b>Filtered by channel:</b> {selectedChannel}</span>
      <button on:click={clearChannelFilter} class="clear-btn clear-btn--blue">✕ Clear</button>
    </div>
  {/if}
  {#if selectedPlaylist}
    <div class="chip-warning">
      <span><b>Filtered by playlist:</b> {selectedPlaylist}</span>
      <button on:click={clearPlaylistFilter} class="clear-btn clear-btn--purple">✕ Clear</button>
    </div>
  {/if}

  {#if searchTerm.trim() !== ''}
    {#if searching && searchResults.length === 0}
      <p class="loading-more">Searching…</p>
    {:else if searchError}
      <div class="error">{searchError}</div>
    {:else if searchResults.length === 0}
      <div class="loading-more text-muted">No videos found.</div>
    {:else}
      <VideoGrid
        videos={searchResults}
        getBestThumbnail={utils.getBestThumbnail}
        difficultyColor={utils.difficultyColor}
        difficultyLabel={utils.difficultyLabel}
        formatLength={utils.formatLength}
        filterByChannel={filterByChannel}
        filterByPlaylist={filterByPlaylist}
      />
      {#if !allSearchLoaded}
        <div class="loading-more">Loading more…</div>
      {/if}
    {/if}
  {:else}
    {#if loading}
      <p class="loading-more">Loading videos…</p>
    {:else if errorMsg}
      <div class="error">{errorMsg}</div>
    {:else if videos.length === 0}
      <div class="loading-more text-muted">No videos match your filters.</div>
    {:else}
      <VideoGrid
        {videos}
        getBestThumbnail={utils.getBestThumbnail}
        difficultyColor={utils.difficultyColor}
        difficultyLabel={utils.difficultyLabel}
        formatLength={utils.formatLength}
        filterByChannel={filterByChannel}
        filterByPlaylist={filterByPlaylist}
      />
      {#if !allLoaded}
        <div class="loading-more">Loading more…</div>
      {/if}
    {/if}
  {/if}
</div>
