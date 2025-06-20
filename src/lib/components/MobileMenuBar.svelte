<script>
  export let onSort = () => {};
  export let onFilter = () => {};
  export let onSearch = () => {};
  let localSearchValue = '';
</script>

<nav class="mobile-menu-bar">
  <button type="button" on:click={onSort}>Sort</button>
  <button type="button" on:click={onFilter}>Filter</button>
  <input
    class="mobile-search-input"
    type="text"
    bind:value={localSearchValue}
    placeholder="Search videos…"
    aria-label="Search videos"
    style="flex:2 1 0; margin: 0 0.7em; padding:0.7em 1em;"
  />
  <button type="button" on:click={() => onSearch(localSearchValue)}>Search</button>
</nav>

<style>
  .mobile-menu-bar {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 0.7em 0.7em;
    background: #fafbff;
    border-top: 1.5px solid #ececec;
    box-shadow: 0 -2px 16px #ececec70;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1002;
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
  .mobile-search-input {
    flex: 2 1 0;
    min-width: 0;
    border: 1px solid #ececec;
    border-radius: 8px;
    font-size: 1.05em;
    padding: 0.7em 1em;
    color: #1d1d1d;
    background: #fff;
    margin: 0 0.5em;
  }
</style>
