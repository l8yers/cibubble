<script>
  export let onSort = () => {};
  export let onFilter = () => {};
  export let onSearch = () => {};
</script>

<nav class="mobile-menu-bar">
  <button on:click={onSort}>Sort</button>
  <button on:click={onFilter}>Filter</button>
  <button on:click={onSearch}>Search</button>
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
</style>
