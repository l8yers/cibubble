<script>
  import { createEventDispatcher } from 'svelte';
  import { Sparkles, BarChart3, Search as SearchIcon } from 'lucide-svelte';

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

<nav class="mobile-menu-bar">
  {#if !openSearch}
    <button class="menu-btn" title="Sort" on:click={() => dispatch('sort')}>
      <Sparkles size={21} style="margin-right:0.45em;color:#0077ff;" />
      <span>Sort</span>
    </button>
    <button class="menu-btn" title="Filters" on:click={() => dispatch('filter')}>
      <BarChart3 size={21} style="margin-right:0.45em;color:#ee4ea5;" />
      <span>Filters</span>
    </button>
    <button class="menu-btn" title="Search" on:click={handleSearchClick}>
      <SearchIcon size={21} style="margin-right:0.45em;" />
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
    min-height: 50px;
    box-shadow: 0 -2px 12px #ececec70;
    pointer-events: auto;
    padding: 0 0.2em;
    gap: 0.2em;
  }
  .menu-btn {
    flex: 1 1 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 0.2em;
    background: none;
    border: none;
    font-size: 1.05em;
    font-weight: 700;
    border-radius: 10px;
    color: #2451c7;
    padding: 0.45em 0 0.45em 0;
    transition: background 0.13s;
    min-width: 0;
    min-height: 44px;
    line-height: 1.1;
  }
  .menu-btn:active,
  .menu-btn:focus {
    background: #e9f0ff;
    outline: none;
  }
  .menu-btn svg {
    display: inline-block;
    margin-bottom: -2px;
  }
  .menu-btn span {
    font-size: 0.98em;
    letter-spacing: 0.01em;
    margin: 0;
    line-height: 1.1;
    padding-left: 0.02em;
  }
  .search-bar {
    display: flex;
    flex: 1 1 0;
    align-items: center;
    width: 100vw;
    padding: 0 1.1em;
    gap: 0.5em;
  }
  .search-bar input[type="text"] {
    flex: 1 1 0;
    font-size: 1.1em;
    padding: 0.6em 1em;
    border: 1px solid #ddd;
    border-radius: 10px;
    outline: none;
    background: #fff;
  }
  .close-btn {
    font-size: 2em;
    color: #888;
    background: none;
    border: none;
    padding: 0 0.2em;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.13s;
    margin-left: 0.4em;
    min-width: 36px;
    min-height: 36px;
    display: flex; align-items: center; justify-content: center;
  }
  .close-btn:hover {
    background: #f0f0f0;
  }
</style>
