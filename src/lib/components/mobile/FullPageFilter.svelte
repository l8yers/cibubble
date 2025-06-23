<script>
  import { createEventDispatcher } from 'svelte';
  import { ChevronRight, ChevronLeft, BarChart3, Globe, Tag, Eye } from 'lucide-svelte';

  export let open = false;
  export let levels = [];
  export let selectedLevels = [];
  export let tagOptions = [];
  export let selectedTags = [];
  export let countryOptions = [];
  export let selectedCountry = '';
  export let myChannels = [];
  export let selectedChannel = ''; // '' means none
  export let hideWatched = false;

  const dispatch = createEventDispatcher();

  let page = 'main';
  let localLevels = [...selectedLevels];
  let localTags = [...selectedTags];
  let localCountry = selectedCountry;
  let localChannel = selectedChannel || ''; // nothing selected by default
  let localHideWatched = hideWatched;

  $: if (open) {
    page = 'main';
    localLevels = [...selectedLevels];
    localTags = [...selectedTags];
    localCountry = selectedCountry;
    localChannel = selectedChannel || '';
    localHideWatched = hideWatched;
  }

  function handleApply() {
    dispatch('apply', {
      selectedLevels: localLevels,
      selectedTags: localTags,
      selectedCountry: localCountry,
      selectedChannel: localChannel,
      hideWatched: localHideWatched
    });
  }
  function handleClose() {
    dispatch('close');
  }
  function handleReset() {
    localLevels = ['easy', 'intermediate', 'advanced'];
    localTags = [];
    localCountry = '';
    localChannel = '';
    localHideWatched = false;
    handleApply();
  }
  function toggleLevel(level) {
    if (localLevels.includes(level)) localLevels = localLevels.filter(l => l !== level);
    else localLevels = [...localLevels, level];
  }
  function toggleTag(tag) {
    if (localTags.includes(tag)) localTags = localTags.filter(t => t !== tag);
    else localTags = [...localTags, tag];
  }
  function toggleCountry(country) {
    if (localCountry === country) localCountry = '';
    else localCountry = country;
  }
</script>

{#if open}
  <div class="modal-bg" on:click={handleClose}>
    <div class="filter-modal" on:click|stopPropagation>
      {#if page === 'main'}
        <div class="modal-header">
          <span>Filter</span>
          <button class="close-btn" on:click={handleClose} aria-label="Close">×</button>
        </div>
        <ul class="filter-list">
          <li on:click={() => page='levels'}>
            <BarChart3 class="icon"/><span>Levels</span> <ChevronRight class="chev"/>
          </li>
          <li on:click={() => page='country'}>
            <Globe class="icon"/><span>Country</span> <ChevronRight class="chev"/>
          </li>
          <li on:click={() => page='tags'}>
            <Tag class="icon"/><span>Tags</span> <ChevronRight class="chev"/>
          </li>
          {#if myChannels.length}
          <li on:click={() => page='channels'}>
            <svg class="icon" width="19" height="19"><circle cx="9" cy="9" r="8" fill="#0077ff"/><text x="9" y="13" text-anchor="middle" font-size="12" fill="#fff">C</text></svg>
            <span>My Channels</span>
            <ChevronRight class="chev"/>
          </li>
          {/if}
          <li class="toggle-row">
            <Eye class="icon"/><span>Hide watched</span>
            <label class="switch">
              <input type="checkbox" bind:checked={localHideWatched}>
              <span class="slider"></span>
            </label>
          </li>
        </ul>
        <button class="apply-btn" on:click={handleApply}>View videos</button>
        <button class="reset-btn" on:click={handleReset}>Reset filters</button>
      {:else if page === 'levels'}
        <div class="modal-header">
          <button class="back-btn" on:click={() => page='main'}><ChevronLeft /></button>
          <span>Levels</span>
        </div>
        <div class="options-list">
          {#each levels as lvl}
            <label class="checkbox-row">
              <input type="checkbox" checked={localLevels.includes(lvl.value)} on:change={() => toggleLevel(lvl.value)} />
              <span>{lvl.label}</span>
            </label>
          {/each}
        </div>
        <button class="apply-btn" on:click={handleApply}>View videos</button>
        <button class="reset-btn" on:click={handleReset}>Reset filters</button>
      {:else if page === 'country'}
        <div class="modal-header">
          <button class="back-btn" on:click={() => page='main'}><ChevronLeft /></button>
          <span>Country</span>
        </div>
        <div class="options-list">
          <label class="checkbox-row">
            <input
              type="checkbox"
              checked={localCountry === ''}
              on:change={() => localCountry = ''}
            />
            <span>All</span>
          </label>
          {#each countryOptions as country}
            <label class="checkbox-row">
              <input
                type="checkbox"
                checked={localCountry === country}
                on:change={() => localCountry = country}
              />
              <span>{country}</span>
            </label>
          {/each}
        </div>
        <button class="apply-btn" on:click={handleApply}>View videos</button>
        <button class="reset-btn" on:click={handleReset}>Reset filters</button>
      {:else if page === 'tags'}
        <div class="modal-header">
          <button class="back-btn" on:click={() => page='main'}><ChevronLeft /></button>
          <span>Tags</span>
        </div>
        <div class="options-list">
          {#each tagOptions as tag}
            <label class="checkbox-row">
              <input type="checkbox" checked={localTags.includes(tag)} on:change={() => toggleTag(tag)} />
              <span>{tag}</span>
            </label>
          {/each}
        </div>
        <button class="apply-btn" on:click={handleApply}>View videos</button>
        <button class="reset-btn" on:click={handleReset}>Reset filters</button>
      {:else if page === 'channels'}
        <div class="modal-header">
          <button class="back-btn" on:click={() => page='main'}><ChevronLeft /></button>
          <span>My Channels</span>
        </div>
        <div class="options-list">
          <label class="checkbox-row">
            <input
              type="radio"
              name="mychannels"
              value="__ALL__"
              checked={localChannel === '__ALL__'}
              on:change={() => localChannel = '__ALL__'}
            />
            <span>All My Channels</span>
          </label>
          {#each myChannels as ch}
            <label class="checkbox-row">
              <input
                type="radio"
                name="mychannels"
                value={ch.id}
                checked={localChannel === ch.id}
                on:change={() => localChannel = ch.id}
              />
              <span>{ch.name}</span>
            </label>
          {/each}
        </div>
        <button class="apply-btn" on:click={handleApply}>View videos</button>
        <button class="reset-btn" on:click={handleReset}>Reset filters</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-bg {
    position: fixed; inset: 0;
    background: #222a 0.32;
    z-index: 2000;
    display: flex; align-items: flex-end; justify-content: center;
  }
  .filter-modal {
    background: #fff;
    border-radius: 24px 24px 0 0;
    padding: 0 0 2em 0;
    min-width: 100vw;
    max-width: 100vw;
    box-shadow: 0 -2px 24px #2222;
    animation: slideUp 0.24s cubic-bezier(.16,1,.3,1);
  }
  @keyframes slideUp { from { transform: translateY(100%);} to { transform: none;} }
  .modal-header {
    display: flex; align-items: center; justify-content: center;
    font-size: 1.25em; font-weight: 700;
    background: #f6f7fa;
    border-radius: 24px 24px 0 0;
    min-height: 56px;
    position: relative;
    margin-bottom: 0.2em;
  }
  .modal-header .close-btn {
    position: absolute; right: 1.4em; top: 50%; transform: translateY(-50%);
    font-size: 2em;
    background: none; border: none; color: #888; cursor: pointer;
  }
  .modal-header .back-btn {
    position: absolute; left: 1.3em; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: #0077ff; font-size: 1.7em; cursor: pointer;
    padding: 0.2em;
  }
  .filter-list {
    padding: 0; margin: 0;
    list-style: none;
    background: #fff;
    border-radius: 24px 24px 0 0;
    font-size: 1.13em;
  }
  .filter-list li {
    display: flex; align-items: center; gap: 1em;
    border-bottom: 1px solid #f1f1f1;
    padding: 1.05em 1.5em;
    font-weight: 500; color: #1d293a;
    cursor: pointer;
    background: #fff;
    transition: background 0.13s;
  }
  .filter-list li:last-child { border-bottom: none; }
  .filter-list li:active,
  .filter-list li:hover { background: #f7f9fc; }
  .filter-list .icon { width: 1.4em; height: 1.4em; color: #8395b2;}
  .filter-list .chev { margin-left:auto; color: #ccd6e3; }
  .toggle-row {
    cursor: default;
    gap: 1em;
    border-bottom: none;
    padding-top: 1.2em;
    padding-bottom: 1.2em;
    color: #27364b;
  }
  .switch {
    position: relative; display: inline-block; width: 38px; height: 22px;
  }
  .switch input { opacity: 0; width: 0; height: 0;}
  .slider {
    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
    background: #cfd7e6; border-radius: 11px; transition: .2s;
  }
  .switch input:checked + .slider { background: #0077ff; }
  .slider:before {
    position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px;
    background: white; border-radius: 50%; transition: .2s;
  }
  .switch input:checked + .slider:before { transform: translateX(16px);}
  .apply-btn {
    display: block; width: calc(100% - 2.4em); margin: 1.1em auto 0 auto;
    background: #0077ff; color: #fff; font-weight: 700;
    border: none; border-radius: 12px; padding: 1.05em 0; font-size: 1.13em;
    box-shadow: 0 2px 14px #0077ff33; cursor: pointer;
    transition: background 0.13s;
    letter-spacing: 0.04em;
  }
  .apply-btn:hover { background: #005dc1; }
  .reset-btn {
    display: block; width: calc(100% - 2.4em); margin: 0.7em auto 0 auto;
    background: #f2f2f4; color: #27364b; font-weight: 700;
    border: none; border-radius: 12px; padding: 1.05em 0; font-size: 1.05em;
    box-shadow: 0 2px 14px #fafafc33; cursor: pointer;
    transition: background 0.13s;
    letter-spacing: 0.04em;
  }
  .reset-btn:hover { background: #e5e6ee; }
  .options-list {
    padding: 1em 1.5em 0.2em 1.5em;
    background: #fff;
    max-height: 60vh;
    overflow-y: auto;
  }
  .checkbox-row {
    display: flex; align-items: center; gap: 0.95em;
    font-size: 1.13em; margin: 0.7em 0;
  }
</style>
