<script>
  export let search;
  export let onSearchInput;
  export let totalPages;
  export let currentPage;
  export let goToPage;
</script>

<div class="import-bar" style="margin-top:1.2em; justify-content: space-between;">
  <div style="display:flex; align-items:center; gap:1.2em;">
    <span class="import-videos-title" style="color:#2562e9;">SEARCH CHANNELS</span>
    <input type="text" class="import-input" placeholder="Type to search by name, country or tag…" value={search}
      on:input={onSearchInput} style="max-width:330px;" aria-label="Search Channels" autocomplete="off" />
  </div>
  {#if totalPages > 1}
    <div style="display:flex; align-items:center; gap:0.5em;">
      <button class="main-btn small" on:click={() => goToPage(currentPage-1)} disabled={currentPage === 1}>&lt; Prev</button>
      <span style="font-weight:600;">Page {currentPage} / {totalPages}</span>
      <button class="main-btn small" on:click={() => goToPage(currentPage+1)} disabled={currentPage === totalPages}>Next &gt;</button>
    </div>
  {/if}
</div>
