<script>
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { ArrowDownUp, ListFilter, Search as SearchIcon, ChevronUp } from 'lucide-svelte';

  export let openSearch = false;
  export let searchValue = '';
  const dispatch = createEventDispatcher();
  let localValue = searchValue;
  let searchInputRef;

  $: if (openSearch && localValue !== searchValue) {
    localValue = searchValue;
  }

  $: if (openSearch) {
    tick().then(() => {
      if (searchInputRef) searchInputRef.focus();
    });
  }

  function handleInput(e) {
    localValue = e.target.value;
    dispatch('searchInput', localValue);
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') {
      dispatch('submitSearch', localValue);
      handleCloseSearch();
    }
  }

  function handleSearchClick() {
    dispatch('showSearch');
  }
  function handleCloseSearch() {
    dispatch('closeSearch');
  }
  function handleSubmit(e) {
    e.preventDefault();
    dispatch('submitSearch', localValue);
    handleCloseSearch();
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
    <div class="cibubble-search-overlay"></div>
    <form
      class="cibubble-search-bar-mobile"
      on:submit={handleSubmit}
      autocomplete="off"
    >
      <input
        type="text"
        placeholder="Search videos..."
        bind:this={searchInputRef}
        bind:value={localValue}
        on:input={handleInput}
        on:keydown={handleKeydown}
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
        aria-label="Search videos"
      />
      <button
        class="cibubble-search-submit"
        type="submit"
        title="Search"
        aria-label="Execute Search"
      >
        <SearchIcon size={22} />
      </button>
      <button class="close-btn" on:click={handleCloseSearch} aria-label="Close Search" type="button">×</button>
    </form>
  {/if}
</nav>

<style>
:root {
  --cibubble-red: #eb1000;
  --cibubble-red-soft: #fceaea;
  --cibubble-accent: #fff6f5;
  --cibubble-dark: #18191a;
  --cibubble-radius: 13px;
}

.cibubble-search-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 3000;
  background: rgba(40, 40, 50, 0.32);
  backdrop-filter: blur(4px) brightness(0.96);
  pointer-events: auto;
  transition: all 0.13s;
}

/* --- Main bar at bottom by default --- */
.mobile-menu-bar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 2000;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: stretch;
  background: #fafbfc;
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
  background: transparent;
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

/* --- Mobile search bar sheet --- */
.cibubble-search-bar-mobile {
  position: fixed;
  top: 48px; /* Change to your navbar's height if needed! */
  left: 0;
  width: 100vw;
  z-index: 4000;
  margin: 0;
  border-radius: 0 0 var(--cibubble-radius) var(--cibubble-radius);
  padding: 0.25em 0.7em;
  min-height: 54px;
  box-shadow: 0 6px 22px #00000014;
  background: #fafbfc;
  border: 1px solid #e0e3ea;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.45em;
  pointer-events: auto;
}

.cibubble-search-bar-mobile input[type="text"] {
  flex: 1 1 0;
  font-size: 1.15em;
  padding: 0.58em 1.1em;
  border: 1.3px solid #e0e3ea;
  border-radius: 9px;
  outline: none;
  background: #fafbfc;
  color: #232344;
  font-weight: 500;
  margin-right: 0.2em;
  box-shadow: none;
  height: 2.7em; /* taller */
  transition: border 0.13s, background 0.13s;
}
.cibubble-search-bar-mobile input[type="text"]:focus {
  background: #f5f5f5;
  border: 1.3px solid #b2beb5;
}

.cibubble-search-submit {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0.22em 0.5em;
  border-radius: 8px;
  font-size: 1.2em;
  color: #888;
  transition: background 0.13s;
}
.cibubble-search-submit:hover,
.cibubble-search-submit:focus {
  background: #ececec;
}

.close-btn {
  font-size: 1.5em;
  color: #888;
  background: none;
  border: none;
  padding: 0 0.13em;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.13s;
  margin-left: 0.13em;
  min-width: 32px;
  min-height: 32px;
  display: flex; align-items: center; justify-content: center;
}
.close-btn:hover, .close-btn:focus {
  background: #ececec;
}

@media (max-width: 700px) {
  .mobile-menu-bar,
  .mobile-menu-bar.search-open {
    min-height: 43px;
    padding: 0 0.07em;
    width: 100vw;
    font-size: 1em;
    z-index: 2000;
  }
}
</style>
