<script>
  import { createEventDispatcher } from 'svelte';
  import { ChevronRight, ChevronLeft, BarChart3, Earth, Tag, Eye, User } from 'lucide-svelte';

  export let open = false;
  export let levels = [];
  export let selectedLevels = [];
  export let tagOptions = [];
  export let selectedTags = [];
  export let countryOptions = [];
  export let selectedCountry = '';
  export let myChannels = [];
  export let selectedChannel = '';
  export let hideWatched = false;

  const dispatch = createEventDispatcher();

  let page = 'main';
  let localLevels = [...selectedLevels];
  let localTags = [...selectedTags];
  let localCountry = selectedCountry;
  let localChannel = selectedChannel || '';
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
            <Earth class="icon"/><span>Country</span> <ChevronRight class="chev"/>
          </li>
          <li on:click={() => page='tags'}>
            <Tag class="icon"/><span>Tags</span> <ChevronRight class="chev"/>
          </li>
          {#if myChannels.length}
          <li on:click={() => page='channels'}>
            <User class="icon"/><span>My Channels</span> <ChevronRight class="chev"/>
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
    background: #161c23cc;
    z-index: 2000;
    display: flex; align-items: flex-end; justify-content: center;
  }
  .filter-modal {
    background: #fff;
    border-radius: 0;
    padding: 0 0 2em 0;
    min-width: 100vw;
    max-width: 100vw;
    box-shadow: 0 -2px 24px #2225;
    animation: slideUp 0.22s cubic-bezier(.16,1,.3,1);
    font-family: inherit;
  }
  @keyframes slideUp { from { transform: translateY(100%);} to { transform: none;} }
  .modal-header {
    display: flex; align-items: center; justify-content: center;
    font-size: 1.05em;
    font-weight: 800;
    background: #f7f8fa;
    border-radius: 0;
    min-height: 48px;
    position: relative;
    margin-bottom: 0.16em;
    letter-spacing: 0.01em;
    color: #181818;
  }
  .modal-header .close-btn {
    position: absolute; right: 1.2em; top: 50%; transform: translateY(-50%);
    font-size: 1.4em;
    background: none; border: none; color: #2e9be6; cursor: pointer;
    border-radius: 0;
  }
  .modal-header .back-btn {
    position: absolute; left: 1.05em; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: #2e9be6; font-size: 1.23em; cursor: pointer;
    padding: 0.14em;
    border-radius: 0;
  }
  .filter-list {
    padding: 0; margin: 0;
    list-style: none;
    background: #fff;
    border-radius: 0;
    font-size: 1em;
    color: #161c23;
    font-weight: 700;
    letter-spacing: 0.01em;
  }
  .filter-list li {
    display: flex; align-items: center; gap: 0.7em;
    border-bottom: 1px solid #f1f1f3;
    padding: 0.88em 1.1em;
    font-size: 1.01em;
    font-weight: 700; color: #181818;
    cursor: pointer;
    background: #fff;
    transition: background 0.13s, color 0.13s;
    line-height: 1.17;
    border-radius: 0;
  }
  .filter-list li:last-child { border-bottom: none; }
  .filter-list li:active,
  .filter-list li:hover { background: #f4f7fa; color: #2e9be6;}
  .filter-list .icon {
    width: 1.2em; height: 1.2em;
    color: #181818;
    margin-right: 0.12em;
    flex-shrink: 0;
  }
  .filter-list .chev {
    margin-left:auto; color: #c4cad6;
    width: 1.1em; height: 1.1em; flex-shrink: 0;
  }
  .toggle-row {
    cursor: default;
    gap: 1em;
    border-bottom: none;
    padding-top: 1em;
    padding-bottom: 1em;
    color: #181818;
    font-weight: 700;
    font-size: 1em;
  }
  .switch {
    position: relative; display: inline-block; width: 34px; height: 19px;
    vertical-align: middle;
  }
  .switch input { opacity: 0; width: 0; height: 0;}
  .slider {
    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
    background: #ccd4e4; border-radius: 11px; transition: .2s;
  }
  .switch input:checked + .slider { background: #2e9be6; }
  .slider:before {
    position: absolute; content: ""; height: 13px; width: 13px; left: 3px; bottom: 3px;
    background: white; border-radius: 50%; transition: .2s;
  }
  .switch input:checked + .slider:before { transform: translateX(13px);}
  .apply-btn {
    display: block; width: calc(100% - 2.4em); margin: 1.1em auto 0 auto;
    background: #2e9be6; color: #fff; font-weight: 800;
    border: none; border-radius: 0; padding: 0.9em 0; font-size: 1.02em;
    box-shadow: 0 2px 14px #2e9be633; cursor: pointer;
    transition: background 0.13s;
    letter-spacing: 0.03em;
    margin-bottom: 0.1em;
  }
  .apply-btn:hover { background: #197bb8; }
  .reset-btn {
    display: block; width: calc(100% - 2.4em); margin: 0.7em auto 0 auto;
    background: #f5f7fa; color: #181818; font-weight: 700;
    border: none; border-radius: 0; padding: 0.86em 0; font-size: 0.98em;
    box-shadow: 0 2px 14px #f7fafc2b; cursor: pointer;
    transition: background 0.13s;
    letter-spacing: 0.02em;
  }
  .reset-btn:hover { background: #e7eaf2; }
  .options-list {
    padding: 1em 1.1em 0.2em 1.1em;
    background: #fff;
    max-height: 60vh;
    overflow-y: auto;
  }
  .checkbox-row {
    display: flex; align-items: center; gap: 0.7em;
    font-size: 1em; margin: 0.5em 0;
    color: #181818;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
</style>
