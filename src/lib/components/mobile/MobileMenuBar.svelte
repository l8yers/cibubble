<script>
  import { createEventDispatcher } from 'svelte';
  import { ArrowDownUp, ListFilter, Search as SearchIcon, ChevronUp } from 'lucide-svelte';

  export let openSearch = false;
  export let searchValue = '';
  const dispatch = createEventDispatcher();
  let localValue = searchValue;

  $: if (openSearch && localValue !== searchValue) {
    localValue = searchValue;
  }

  function handleInput(e) {
    localValue = e.target.value;
    dispatch('searchInput', localValue);
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') {
      dispatch('submitSearch', localValue);
    }
  }

  function handleSearchClick() {
    dispatch('showSearch');
  }
  function handleCloseSearch() {
    dispatch('closeSearch');
  }
</script>

<nav class="mobile-menu-bar {openSearch ? 'search-open' : ''}">
  {#if !openSearch}
    <button class="menu-btn" title="Sort" on:click={() => dispatch('sort')}>
      <ArrowDownUp size={18} class="menu-icon" />
      <span>Sort</span>
      <ChevronUp size={12} class="chevron" />
    </button>
    <button class="menu-btn" title="Filters" on:click={() => dispatch('filter')}>
      <ListFilter size={18} class="menu-icon" />
      <span>Filters</span>
      <ChevronUp size={12} class="chevron" />
    </button>
    <button class="menu-btn" title="Search" on:click={handleSearchClick}>
      <SearchIcon size={18} class="menu-icon" />
      <span>Search</span>
    </button>
  {:else}
    <div class="search-bar">
      <input
        type="text"
        placeholder="Search videos..."
        bind:value={localValue}
        on:input={handleInput}
        on:keydown={handleKeydown}
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
      />
      <button class="close-btn" on:click={handleCloseSearch} aria-label="Close Search">×</button>
    </div>
  {/if}
</nav>

<style>
  .mobile-menu-bar {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    z-index: 1002;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: stretch;
    background: #fafbff;
    border-top: 1.5px solid #ececec;
    min-height: 43px;
    box-shadow: 0 -2px 12px #ececec70;
    pointer-events: auto;
    padding: 0 0.07em;
    gap: 0.12em;
    transition: top 0.3s, bottom 0.3s;
  }
  .mobile-menu-bar.search-open {
    top: 0;
    bottom: auto;
    border-top: none;
    border-bottom: 1.5px solid #ececec;
    box-shadow: 0 2px 12px #ececec70;
  }
  .menu-btn {
    flex: 1 1 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 0.13em;
    background: none;
    border: none;
    font-size: 0.92em;
    font-weight: 700;
    border-radius: 8px;
    color: #181818;
    padding: 0.32em 0 0.32em 0;
    transition: background 0.13s;
    min-width: 0;
    min-height: 36px;
    line-height: 1.05;
    position: relative;
  }
  .menu-btn:active,
  .menu-btn:focus {
    background: #e9e9ea;
    outline: none;
  }
  .search-bar {
    display: flex;
    flex: 1 1 0;
    align-items: center;
    width: 100vw;
    padding: 0 0.6em;
    gap: 0.3em;
  }
  .search-bar input[type="text"] {
    flex: 1 1 0;
    font-size: 1em;
    padding: 0.47em 0.9em;
    border: 1px solid #ddd;
    border-radius: 8px;
    outline: none;
    background: #fff;
    color: #181818;
  }
  .close-btn {
    font-size: 1.4em;
    color: #888;
    background: none;
    border: none;
    padding: 0 0.13em;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.13s;
    margin-left: 0.24em;
    min-width: 30px;
    min-height: 30px;
    display: flex; align-items: center; justify-content: center;
  }
  .close-btn:hover {
    background: #ececec;
  }

  @media (max-width: 700px) {
    .mobile-menu-bar.search-open {
      position: fixed;
      top: 0;
      bottom: auto;
      width: 100vw;
      z-index: 9999;
      background: #fff;
      border-bottom: 1.5px solid #ececec;
      border-top: none;
      box-shadow: 0 2px 12px #ececec70;
    }
  }
</style>
