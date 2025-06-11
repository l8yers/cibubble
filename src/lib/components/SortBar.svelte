<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { Sparkles, BarChart3, Search, Globe, Tag } from 'lucide-svelte';

  // --- Props from parent ---
  export let levels = [];
  export let sortChoices = [];
  export let countryOptions = [];
  export let tagOptions = [];
  export let selectedLevels;
  export let sortBy;
  export let selectedCountry;
  export let selectedTags;
  export let hideWatched;
  export let searchTerm;
  export let searchOpen = false;

  const dispatch = createEventDispatcher();

  // --- Local state mirrors props ---
  let _selectedLevels = new Set(selectedLevels);
  let _sortBy = sortBy;
  let _selectedCountry = selectedCountry;
  let _selectedTags = new Set(selectedTags);
  let _hideWatched = hideWatched;
  let _searchTerm = searchTerm;
  let _searchOpen = searchOpen;

  // Dropdown UI state
  let showSortDropdown = false;
  let showLevelDropdown = false;
  let showCountryDropdown = false;
  let showTagDropdown = false;

  let sortDropdownRef, levelsDropdownRef, tagDropdownRef, countryDropdownRef;

  function emitChange() {
    dispatch('change', {
      selectedLevels: new Set(_selectedLevels),
      sortBy: _sortBy,
      selectedCountry: _selectedCountry,
      selectedTags: new Set(_selectedTags),
      hideWatched: _hideWatched,
      searchTerm: _searchTerm,
      searchOpen: _searchOpen
    });
  }

  // Handlers
  function handleToggleLevel(lvl) {
    if (_selectedLevels.has(lvl)) _selectedLevels.delete(lvl);
    else _selectedLevels.add(lvl);
    emitChange();
  }
  function handleToggleAllLevels() {
    if (_selectedLevels.size === levels.length) _selectedLevels = new Set();
    else _selectedLevels = new Set(levels.map(l => l.value));
    emitChange();
  }
  function handleSetSort(val) {
    _sortBy = val;
    emitChange();
    showSortDropdown = false;
  }
  function handleSetCountry(c) {
    _selectedCountry = c === _selectedCountry ? "" : c;
    emitChange();
  }
  function handleToggleTag(tag) {
    if (_selectedTags.has(tag)) _selectedTags.delete(tag);
    else _selectedTags.add(tag);
    emitChange();
  }
  function handleClearTags() {
    _selectedTags = new Set();
    emitChange();
  }
  function handleHideWatched() {
    _hideWatched = !_hideWatched;
    emitChange();
  }
  function handleSearchInput(val) {
    _searchTerm = val;
    emitChange();
  }
  function handleToggleSearch() {
    _searchOpen = !_searchOpen;
    // If closing search, reset value
    if (!_searchOpen) {
      _searchTerm = '';
    }
    emitChange();
  }

  function handleDocumentClick(event) {
    if (showSortDropdown && sortDropdownRef && !sortDropdownRef.contains(event.target)) {
      showSortDropdown = false;
    }
    if (showLevelDropdown && levelsDropdownRef && !levelsDropdownRef.contains(event.target)) {
      showLevelDropdown = false;
    }
    if (showTagDropdown && tagDropdownRef && !tagDropdownRef.contains(event.target)) {
      showTagDropdown = false;
    }
    if (showCountryDropdown && countryDropdownRef && !countryDropdownRef.contains(event.target)) {
      showCountryDropdown = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleDocumentClick);
  });
  onDestroy(() => {
    document.removeEventListener('click', handleDocumentClick);
  });

  // Keep local state in sync with props
  $: if (selectedLevels && !equalSets(selectedLevels, _selectedLevels)) _selectedLevels = new Set(selectedLevels);
  $: if (selectedTags && !equalSets(selectedTags, _selectedTags)) _selectedTags = new Set(selectedTags);
  $: if (sortBy !== _sortBy) _sortBy = sortBy;
  $: if (selectedCountry !== _selectedCountry) _selectedCountry = selectedCountry;
  $: if (hideWatched !== _hideWatched) _hideWatched = hideWatched;
  $: if (searchTerm !== _searchTerm) _searchTerm = searchTerm;
  $: if (searchOpen !== _searchOpen) _searchOpen = searchOpen;

  function equalSets(a, b) {
    if (a.size !== b.size) return false;
    for (let v of a) if (!b.has(v)) return false;
    return true;
  }
</script>

<div class="controls-bar">
  <div class="controls-left">
    <!-- Sort Dropdown -->
    <div class="dropdown" bind:this={sortDropdownRef}>
      <button class="dropdown-btn" aria-expanded={showSortDropdown} on:click={() => showSortDropdown = !showSortDropdown} type="button">
        <Sparkles size={18} style="margin-right:7px;vertical-align:-3px;color:#2e9be6;" />
        Sort by
        <svg width="12" height="9" style="margin-left:7px;" fill="none">
          <path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
        </svg>
      </button>
      {#if showSortDropdown}
        <div class="dropdown-content">
          {#each sortChoices as opt}
            <div style="padding:0.32em 0.2em;cursor:pointer;" on:click={() => handleSetSort(opt.value)}>
              {opt.label}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Levels Dropdown -->
    <div class="dropdown" bind:this={levelsDropdownRef}>
      <button class="dropdown-btn" aria-expanded={showLevelDropdown} on:click={() => showLevelDropdown = !showLevelDropdown} type="button">
        <BarChart3 size={18} style="margin-right:7px;vertical-align:-3px;color:#44c366;" />
        Levels
        <svg width="12" height="9" style="margin-left:7px;" fill="none">
          <path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
        </svg>
      </button>
      {#if showLevelDropdown}
        <div class="dropdown-content">
          <div style="margin-bottom:0.5em;font-size:1em;font-weight:600;">Include</div>
          <div class="levels-list">
            {#each levels as lvl}
              <label class="level-checkbox">
                <input type="checkbox" checked={_selectedLevels.has(lvl.value)} on:change={() => handleToggleLevel(lvl.value)} />
                <span>{lvl.label}</span>
              </label>
            {/each}
          </div>
          <div style="margin-top:0.4em;">
            <button style="font-size:0.97em;color:#176cda;background:none;border:none;cursor:pointer;" on:click={handleToggleAllLevels}>
              {_selectedLevels.size === levels.length ? 'Clear all' : 'Select all'}
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Tags Dropdown -->
    <div class="dropdown" bind:this={tagDropdownRef}>
      <button class="dropdown-btn" aria-expanded={showTagDropdown} on:click={() => showTagDropdown = !showTagDropdown} type="button">
        <Tag size={18} style="margin-right:7px;vertical-align:-3px;color:#f2a02b;" />
        Tags
        <svg width="12" height="9" style="margin-left:7px;" fill="none">
          <path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
        </svg>
      </button>
      {#if showTagDropdown}
        <div class="dropdown-content">
          {#each tagOptions as tag}
            <label class="level-checkbox">
              <input
                type="checkbox"
                checked={_selectedTags.has(tag)}
                on:change={() => handleToggleTag(tag)}
              />
              <span>{tag}</span>
            </label>
          {/each}
          <button style="margin-top:0.5em;font-size:0.96em;color:#d54b18;background:none;border:none;cursor:pointer;" on:click={handleClearTags}>
            Clear all
          </button>
        </div>
      {/if}
    </div>

    <!-- Countries Dropdown -->
    <div class="dropdown" bind:this={countryDropdownRef}>
      <button class="dropdown-btn" aria-expanded={showCountryDropdown} on:click={() => showCountryDropdown = !showCountryDropdown} type="button">
        <Globe size={18} style="margin-right:7px;vertical-align:-3px;color:#c367f2;" />
        Countries
        <svg width="12" height="9" style="margin-left:7px;" fill="none">
          <path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
        </svg>
      </button>
      {#if showCountryDropdown}
        <div class="dropdown-content">
          <label class="level-checkbox">
            <input
              type="checkbox"
              checked={_selectedCountry === ""}
              on:change={() => handleSetCountry("")}
            />
            <span>All Countries</span>
          </label>
          {#each countryOptions as country}
            <label class="level-checkbox">
              <input
                type="checkbox"
                checked={_selectedCountry === country}
                on:change={() => handleSetCountry(country)}
              />
              <span>{country}</span>
            </label>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  <div class="controls-right">
    <button
      class="dropdown-btn hide-watched-btn"
      type="button"
      aria-pressed={_hideWatched}
      on:click={handleHideWatched}
    >
      <span class="switch-slider" aria-hidden="true"></span>
      <span class="switch-label-text">Hide watched</span>
    </button>
    <div class="search-bar-container">
      {#if _searchOpen}
        <input
          type="text"
          class="search-input"
          placeholder="Search videos…"
          value={_searchTerm}
          on:input={e => handleSearchInput(e.target.value)}
          autofocus
        />
      {/if}
      <button
        class="search-toggle"
        title="Search"
        on:click={handleToggleSearch}
        aria-label="Search"
      >
        <Search size={22} style="color:#2e9be6;" />
      </button>
    </div>
  </div>
</div>

<style>
  .controls-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.2em;
    max-width: 1380px;
    margin: 2em auto 2em auto;
    background: #f7f7fb;
    padding: 0.7em 1.2em 0.7em 1.2em;
    border-radius: 18px;
    border: 1.7px solid #ececec;
    box-shadow: 0 2px 16px #ececec60;
    position: relative;
    overflow-x: visible;
  }
  .controls-left {
    display: flex;
    align-items: center;
    gap: 1.2em;
  }
  .controls-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 1.1em;
  }
  .dropdown {
    position: relative;
    min-width: 120px;
  }
  .dropdown-btn {
    padding: 0.42em 1.1em;
    font-size: 1.05em;
    border-radius: 12px;
    border: 1.2px solid #ececec;
    background: #f9f9f9;
    color: #1d1d1d;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.65em;
    min-width: 110px;
    transition:
      border 0.11s,
      background 0.11s;
  }
  .dropdown-btn[aria-expanded='true'],
  .dropdown-btn[aria-pressed='true'] {
    background: #f1f5fb;
    border: 1.2px solid #bbb;
    color: #1d1d1d;
  }
  .hide-watched-btn {
    /* Neutral; red only for switch below */
  }
  .hide-watched-btn .switch-slider {
    width: 36px;
    height: 20px;
    background: #e8e8e8;
    border-radius: 8px;
    position: relative;
    display: inline-block;
    transition: background 0.13s;
    margin-right: 0.65em;
    vertical-align: middle;
  }
  .hide-watched-btn[aria-pressed="true"] .switch-slider {
    background: #fd2b23;
  }
  .hide-watched-btn .switch-slider::before {
    content: '';
    position: absolute;
    width: 15px;
    height: 15px;
    left: 2.2px;
    top: 2.2px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.13s, box-shadow 0.13s;
    box-shadow: 0 1px 2px #0002;
  }
  .hide-watched-btn[aria-pressed="true"] .switch-slider::before {
    transform: translateX(14px);
    box-shadow: 0 1px 4px #fd2b2333;
  }
  .switch-label-text {
    font-size: 1.05em;
    font-weight: 600;
    letter-spacing: 0.03em;
    font-family: inherit;
    color: inherit;
  }
  .dropdown-content {
    position: absolute;
    z-index: 1000;
    background: #fff;
    border: 1.3px solid #e8e8e8;
    border-radius: 8px;
    box-shadow: 0 2px 18px #eee;
    min-width: 180px;
    padding: 0.8em 0.6em;
    top: 110%;
    left: 0;
    font-size: 1em;
  }
  .levels-list {
    display: flex;
    flex-direction: column;
    gap: 0.6em;
    margin: 0.3em 0 0.4em 0;
  }
  .level-checkbox {
    display: flex;
    align-items: center;
    gap: 0.6em;
    font-size: 1.03em;
  }
  /* --- Search Bar --- */
  .search-bar-container {
    display: flex;
    align-items: center;
    position: relative;
    gap: 0.7em;
  }
  .search-input {
    transition:
      width 0.2s,
      opacity 0.2s,
      box-shadow 0.13s,
      border 0.13s;
    width: 180px;
    max-width: 50vw;
    order: -1;
    margin-right: 0.3em;
    opacity: 1;
    font-size: 1.05em;
    border-radius: 12px;
    border: 1.2px solid #ececec;
    background: #f9f9f9;
    color: #1d1d1d;
    font-weight: 500;
    padding: 0.42em 1.1em;
    box-shadow: 0 2px 8px #ececec60;
    outline: none;
  }
  .search-input:focus {
    border: 1.2px solid #bbb;
    background: #f1f5fb;
    box-shadow: 0 2px 16px #bbb2;
  }
  .search-toggle {
    z-index: 2;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0.3em;
    margin-left: 0;
    border-radius: 50%;
    transition: background 0.18s;
  }
  .search-toggle:hover,
  .search-toggle:focus-visible {
    background: #e5f2fd;
  }
  .search-toggle svg {
    transition: stroke 0.15s;
  }
  .search-toggle:hover svg {
    stroke: #2e9be6;
  }

  @media (max-width: 900px) {
    .controls-bar {
      flex-direction: column;
      align-items: stretch;
      padding: 0.7em 0.8em;
    }
    .controls-left,
    .controls-right {
      margin-left: 0;
      justify-content: flex-start;
    }
    .controls-right {
      justify-content: flex-end;
      margin-top: 0.7em;
    }
  }
  @media (max-width: 600px) {
    .search-input {
      width: 110px;
      font-size: 0.96em;
    }
  }
</style>
