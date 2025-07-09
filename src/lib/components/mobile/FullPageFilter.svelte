<script>
  import { createEventDispatcher } from 'svelte';
  import { ChevronRight, ChevronLeft, BarChart3, Earth, Tag, Eye, User, Clock } from 'lucide-svelte';

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
  export let currentSort = 'new'; // Pass in $sortBy from parent!

  const dispatch = createEventDispatcher();

  let page = 'main';
  let localLevels = [];
  let localTags = [];
  let localCountry = '';
  let localChannel = '';
  let localHideWatched = false;

  $: if (open) {
    page = 'main';
    localLevels = [...selectedLevels];
    localTags = [...selectedTags];
    localCountry = selectedCountry;
    localChannel = selectedChannel || '';
    localHideWatched = hideWatched;
  }

  function emitApply(partial = {}) {
    // Core logic: if random is active and *any* filter except levels is changed, reset to 'new'
    let nextSort = currentSort;
    if (
      currentSort === 'random' &&
      (
        partial.selectedCountry !== undefined ||
        partial.selectedTags !== undefined ||
        partial.selectedChannel !== undefined ||
        partial.hideWatched !== undefined
      )
    ) {
      nextSort = 'new';
    }
    dispatch('apply', {
      selectedLevels: partial.selectedLevels ?? localLevels,
      selectedTags: partial.selectedTags ?? localTags,
      selectedCountry: partial.selectedCountry ?? localCountry,
      selectedChannel: partial.selectedChannel ?? localChannel,
      hideWatched: partial.hideWatched ?? localHideWatched,
      sortBy: nextSort
    });
  }

  function handleApply() {
    emitApply();
  }
  function handleClose() {
    dispatch('close');
  }
  function handleReset() {
    localLevels = levels.map(l => l.value);
    localTags = [];
    localCountry = '';
    localChannel = '';
    localHideWatched = false;
    emitApply({
      selectedLevels: localLevels,
      selectedTags: [],
      selectedCountry: '',
      selectedChannel: '',
      hideWatched: false
    });
  }
  function toggleLevel(level) {
    if (localLevels.includes(level)) localLevels = localLevels.filter(l => l !== level);
    else localLevels = [...localLevels, level];
    emitApply({ selectedLevels: localLevels }); // Only levels, so keep random if random
  }
  function toggleTag(tag) {
    if (localTags.includes(tag)) localTags = localTags.filter(t => t !== tag);
    else localTags = [...localTags, tag];
    emitApply({ selectedTags: localTags });
  }
  function toggleCountry(country) {
    if (localCountry === country) {
      localCountry = '';
    } else {
      localCountry = country;
    }
    emitApply({ selectedCountry: localCountry });
  }
  function toggleHideWatched() {
    localHideWatched = !localHideWatched;
    emitApply({ hideWatched: localHideWatched });
  }
  // ---------------- PATCHED FUNCTION ----------------
  function selectChannel(channel) {
    // When selecting a channel, reset all filters and set the channel (just like SortBar does)
    localLevels = levels.map(l => l.value);
    localTags = [];
    localCountry = '';
    localHideWatched = false;
    localChannel = channel;
    emitApply({
      selectedLevels: localLevels,
      selectedTags: [],
      selectedCountry: '',
      selectedChannel: channel,
      hideWatched: false
    });
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
          <li on:click={() => page='channels'}>
            <User class="icon"/><span>My Channels</span> <ChevronRight class="chev"/>
          </li>
          <li class="toggle-row">
            <Eye class="icon"/><span>Hide watched</span>
            <label class="switch">
              <input type="checkbox" bind:checked={localHideWatched} on:change={toggleHideWatched}>
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
              on:change={() => toggleCountry('')}
            />
            <span>All</span>
          </label>
          {#each countryOptions as country}
            <label class="checkbox-row">
              <input
                type="checkbox"
                checked={localCountry === country}
                on:change={() => toggleCountry(country)}
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
              value="__WATCH_LATER__"
              checked={localChannel === '__WATCH_LATER__'}
              on:change={() => selectChannel('__WATCH_LATER__')}
            />
            <span style="display:flex;align-items:center;">
              <Clock size={17} style="margin-right:4px;vertical-align:-2px;" />
              Watch Later
            </span>
          </label>
          <label class="checkbox-row">
            <input
              type="radio"
              name="mychannels"
              value="__ALL__"
              checked={localChannel === '__ALL__'}
              on:change={() => selectChannel('__ALL__')}
            />
            <span>All Saved Channels</span>
          </label>
          {#if myChannels && myChannels.length}
            {#each myChannels as ch}
              <label class="checkbox-row">
                <input
                  type="radio"
                  name="mychannels"
                  value={ch.id}
                  checked={localChannel === ch.id}
                  on:change={() => selectChannel(ch.id)}
                />
                <span>{ch.name}</span>
              </label>
            {/each}
          {/if}
          <a
            href="/mychannels"
            class="edit-my-channels-link"
            style="display: flex; align-items: center; color: #e65c4f; font-weight: 700; text-decoration: none; font-size: 1em; gap: 0.6em; padding: 0.2em 0.1em; margin-top: 0.8em;"
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="#e65c4f"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="9" cy="9" r="7.5" />
              <path d="M12.5 7.5l-5 5" />
              <path d="M7.5 7.5l5 5" />
            </svg>
            Edit My Channels
          </a>
        </div>
        <button class="apply-btn" on:click={handleApply}>View videos</button>
        <button class="reset-btn" on:click={handleReset}>Reset filters</button>
      {/if}
    </div>
  </div>
{/if}


<style>
:root {
  --cibubble-red: #e65c4f;    /* Muted/soft CIBUBBLE red */
  --cibubble-red-soft: #fbecea;
  --cibubble-accent: #fff6f5;
  --cibubble-dark: #18191a;
  --cibubble-radius: 13px;
}

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
  background: none; border: none; color: var(--cibubble-red); cursor: pointer;
  border-radius: 0;
}
.modal-header .back-btn {
  position: absolute; left: 1.05em; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: var(--cibubble-red); font-size: 1.23em; cursor: pointer;
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
  transition: none;
  line-height: 1.17;
  border-radius: 0;
  border: none;
}
.filter-list li:last-child { border-bottom: none; }
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
  background: #fbecea; /* faded red for off state */
  border-radius: 11px; transition: .2s;
}
.switch input:checked + .slider { background: var(--cibubble-red); }
.slider:before {
  position: absolute; content: ""; height: 13px; width: 13px; left: 3px; bottom: 3px;
  background: white; border-radius: 50%; transition: .2s;
}
.switch input:checked + .slider:before { transform: translateX(13px);}
.apply-btn {
  display: block; width: calc(100% - 2.4em); margin: 1.1em auto 0 auto;
  background: #101720; color: #fff; font-weight: 800;
  border: none; border-radius: 0; padding: 0.9em 0; font-size: 1.02em;
  box-shadow: 0 2px 14px #e65c4f44; cursor: pointer;
  transition: none;
  letter-spacing: 0.03em;
  margin-bottom: 0.1em;
}
.apply-btn:hover { background: #b83d2f; }
.reset-btn {
  display: block; width: calc(100% - 2.4em); margin: 0.7em auto 0 auto;
  background: #f5f7fa; color: var(--cibubble-red); font-weight: 700;
  border: none; border-radius: 0; padding: 0.86em 0; font-size: 0.98em;
  box-shadow: 0 2px 14px #f7fafc2b; cursor: pointer;
  transition: none;
  letter-spacing: 0.02em;
}
.reset-btn:hover { background: #ffe7e2; }
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
  padding: 0.3em 0.5em 0.3em 0.1em;
  border-radius: 7px;
  border: none;
  transition: none;
  cursor: pointer;
}
.checkbox-row input[type='checkbox'],
.checkbox-row input[type='radio'] {
  accent-color: var(--cibubble-red);
  width: 1.1em; height: 1.1em;
}
.edit-my-channels-link {
  display: flex; align-items: center; color: var(--cibubble-red); font-weight: 700; text-decoration: none; font-size: 1em; gap: 0.6em; padding: 0.2em 0.1em; margin-top: 0.8em;
}
</style>
