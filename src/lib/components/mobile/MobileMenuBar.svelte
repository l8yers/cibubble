<script>
  import { createEventDispatcher } from 'svelte';
  export let openSearch = false;

  const dispatch = createEventDispatcher();
  let searchValue = '';

  function handleSearchClick() {
    dispatch('showSearch');
  }
  function handleCloseSearch() {
    dispatch('closeSearch');
  }
</script>

<nav class="mobile-menu-bar">
  {#if !openSearch}
    <button on:click={() => dispatch('sort')}>Sort</button>
    <button on:click={() => dispatch('filter')}>Filters</button>
    <button on:click={handleSearchClick}>Search</button>
  {:else}
    <div class="search-bar">
      <input
        type="text"
        placeholder="Search videos..."
        bind:value={searchValue}
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
    align-items: center;
    background: #fafbff;
    border-top: 1.5px solid #ececec;
    min-height: 65px;
    box-shadow: 0 -2px 16px #ececec70;
    pointer-events: auto;
  }
  .mobile-menu-bar button {
    flex: 1 1 0;
    background: none;
    border: none;
    font-size: 1.18em;
    font-weight: 700;
    padding: 1em 0;
    border-radius: 10px;
    color: #2451c7;
    transition: background 0.14s;
  }
  .mobile-menu-bar button:active,
  .mobile-menu-bar button:focus {
    background: #e9f0ff;
  }
  .search-bar {
    display: flex;
    flex: 1 1 0;
    align-items: center;
    width: 100vw;
    padding: 0 1.5em;
    gap: 0.5em;
  }
  .search-bar input[type="text"] {
    flex: 1 1 0;
    font-size: 1.13em;
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
  }
  .close-btn:hover {
    background: #f0f0f0;
  }
</style>
