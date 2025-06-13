<script>
  import { onMount } from 'svelte';
  import VideoGrid from '$lib/components/VideoGrid.svelte';
  import SortBar from '$lib/components/SortBar.svelte';
  import * as utils from '$lib/utils.js';


  // Import stores
  import {
    filteredVideos, loading, errorMsg, loadVideos,
    selectedChannel, selectedPlaylist, selectedLevels, sortBy, selectedCountry,
    selectedTags, hideWatched, watchedIds, searchTerm
  } from '$lib/stores/videos.js';

  // Set up on mount
  onMount(() => {
    loadVideos();
    // TODO: fetch watchedIds for the current user and set watchedIds store here
  });

  // Example: pass event from SortBar to update filter stores
  function handleSortBarChange(e) {
    selectedLevels.set(e.detail.selectedLevels);
    sortBy.set(e.detail.sortBy);
    selectedCountry.set(e.detail.selectedCountry);
    selectedTags.set(e.detail.selectedTags);
    hideWatched.set(e.detail.hideWatched);
    searchTerm.set(e.detail.searchTerm);
  }

  // Filtering by channel/playlist via VideoCard grid:
  function filterByChannel(channelName) { selectedChannel.set(channelName); }
  function clearChannelFilter() { selectedChannel.set(""); }
  function filterByPlaylist(playlistTitle) { selectedPlaylist.set(playlistTitle); }
  function clearPlaylistFilter() { selectedPlaylist.set(""); }

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
    "Spain", "Mexico", "Argentina", "Colombia", "Chile", "Various", "Peru",
    "Guatemala", "Uruguay", "Dominican Republic", "Venezuela", "Costa Rica", "Cuba", "Ecuador", "Paraguay", "Panama", "Canary Islands", "Italy", "Puerto Rico", "Equatorial Guinea", "DUBS", "Not Native Speaker", "AI Voice", "Latin America"
  ].sort();
  let tagOptions = [
    "For Learners", "Kids Show", "Dubbed Show", "Videogames", "News", "History", "Science", "Travel", "Lifestyle", "Personal Development", "Cooking", "Music", "Comedy", "Native Show", "Education", "Sports", "Current Events"
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
      filterByChannel={filterByChannel}
      filterByPlaylist={filterByPlaylist}
    />
  {/if}
</div>
