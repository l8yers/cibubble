<script>
  export let open = false;
  export let onApply = () => {};
  export let onClose = () => {};
  
  function applyFilters() {
  dispatch('apply', {
    selectedLevels,
    selectedTags,
    selectedCountry,
    selectedChannel
    // add others as needed!
  });
}

</script>

{#if open}
  <div class="modal-bg" on:click={onClose}>
    <div class="filter-modal" on:click|stopPropagation>
      <div class="modal-header">
        <span>Filters</span>
        <button class="close-btn" on:click={onClose}>×</button>
      </div>
      <div style="padding:1em 0; color:#888;">[Filters UI placeholder]</div>
      <button class="apply-btn" on:click={onApply}>Apply Filters</button>
    </div>
  </div>
{/if}

<style>
  .modal-bg {
    position: fixed; inset: 0;
    background: #222a 0.3;
    z-index: 1000;
    display: flex; align-items: center; justify-content: center;
  }
  .filter-modal {
    background: #fff;
    border-radius: 18px;
    padding: 1.5em 1.3em 1.3em 1.3em;
    max-width: 98vw;
    min-width: 290px;
    box-shadow: 0 2px 20px #aaa5;
  }
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 1.1em; font-weight: 700;
    margin-bottom: 1em;
  }
  .close-btn {
    background: none; border: none; font-size: 1.7em; color: #888;
    cursor: pointer; border-radius: 50%; padding: 0 0.2em;
    transition: background 0.13s;
  }
  .close-btn:hover { background: #eee; }
  .apply-btn {
    margin-top: 1.6em;
    background: #0077ff; color: #fff; font-weight: 700;
    border: none; border-radius: 10px; padding: 0.7em 2em; font-size: 1.1em;
    box-shadow: 0 2px 6px #0077ff33; cursor: pointer;
    transition: background 0.11s;
  }
  .apply-btn:hover { background: #005dc1; }
</style>
