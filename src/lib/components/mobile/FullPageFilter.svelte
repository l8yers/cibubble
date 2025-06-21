<script>
  import { createEventDispatcher } from 'svelte';
  export let open = false;
  export let levels = [];
  export let selectedLevels = [];
  export let tagOptions = [];
  export let selectedTags = [];
  export let countryOptions = [];
  export let selectedCountry = '';
  // More filters soon...

  const dispatch = createEventDispatcher();

  let localLevels = [];
  let localTags = [];
  let localCountry = '';

  $: if (open) {
    localLevels = [...selectedLevels];
    localTags = [...selectedTags];
    localCountry = selectedCountry;
  }

  function toggleLevel(level) {
    if (localLevels.includes(level)) {
      localLevels = localLevels.filter(l => l !== level);
    } else {
      localLevels = [...localLevels, level];
    }
  }
  function toggleTag(tag) {
    if (localTags.includes(tag)) {
      localTags = localTags.filter(t => t !== tag);
    } else {
      localTags = [...localTags, tag];
    }
  }

  function handleApply() {
    dispatch('apply', {
      selectedLevels: localLevels,
      selectedTags: localTags,
      selectedCountry: localCountry,
    });
  }

  function handleClose() {
    dispatch('close');
  }
</script>

{#if open}
  <div class="modal-bg" on:click={handleClose}>
    <div class="filter-modal" on:click|stopPropagation>
      <div class="modal-header">
        <span>Filters</span>
        <button class="close-btn" on:click={handleClose} aria-label="Close">×</button>
      </div>
      <!-- LEVELS FILTER -->
      <div class="filter-group">
        <strong>Levels:</strong>
        <div class="checkbox-list">
          {#each levels as lvl}
            <label>
              <input
                type="checkbox"
                checked={localLevels.includes(lvl.value)}
                on:change={() => toggleLevel(lvl.value)}
              />
              {lvl.label}
            </label>
          {/each}
        </div>
      </div>
      <!-- TAGS FILTER -->
      <div class="filter-group">
        <strong>Tags:</strong>
        <div class="checkbox-list" style="max-height:140px;overflow:auto;">
          {#each tagOptions as tag}
            <label>
              <input
                type="checkbox"
                checked={localTags.includes(tag)}
                on:change={() => toggleTag(tag)}
              />
              {tag}
            </label>
          {/each}
        </div>
      </div>
      <!-- COUNTRY FILTER -->
      <div class="filter-group">
        <strong>Country:</strong>
        <select bind:value={localCountry}>
          <option value="">All</option>
          {#each countryOptions as country}
            <option value={country}>{country}</option>
          {/each}
        </select>
      </div>
      <button class="apply-btn" on:click={handleApply}>Apply Filters</button>
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
  .filter-group {
    margin-bottom: 1.1em;
  }
  .checkbox-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7em 1.2em;
    margin-top: 0.3em;
  }
</style>
