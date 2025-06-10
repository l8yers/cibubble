<script>
  import { Sparkles, BarChart3, Search } from 'lucide-svelte';

  export let levels = [];
  export let sortChoices = [];
  export let selectedLevels;
  export let sortBy;
  export let showSortDropdown;
  export let showLevelDropdown;
  export let toggleLevel;
  export let toggleAllLevels;
  export let allLevelsSelected;
  export let handleSortSelect;
  export let handleSortDropdownToggle;
  export let handleLevelDropdownToggle;
  export let searchOpen;
  export let toggleSearch;
  export let searchTerm;
  export let handleSearchInput;
  export let hideWatched;
  export let updateGrid;
</script>

<div class="controls-bar">
  <div class="controls-left">
    <!-- Sort Dropdown -->
    <div class="dropdown">
      <button class="dropdown-btn" aria-expanded={showSortDropdown} on:click={handleSortDropdownToggle} type="button">
        <Sparkles size={18} style="margin-right:7px; vertical-align:-3px; color:#2e9be6;" />
        Sort by
        <svg width="12" height="9" style="margin-left:7px;" fill="none">
          <path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
        </svg>
      </button>
      {#if showSortDropdown}
        <div class="dropdown-content">
          {#each sortChoices as opt}
            <div style="padding:0.32em 0.2em;cursor:pointer;" on:click={() => handleSortSelect(opt.value)}>
              {opt.label}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Levels Dropdown -->
    <div class="dropdown">
      <button class="dropdown-btn" aria-expanded={showLevelDropdown} on:click={handleLevelDropdownToggle} type="button">
        <BarChart3 size={18} style="margin-right:7px; vertical-align:-3px; color:#44c366;" />
        Levels
        <svg width="12" height="9" style="margin-left:7px;" fill="none">
          <path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
        </svg>
      </button>
      {#if showLevelDropdown}
        <div class="dropdown-content">
          <div style="margin-bottom:0.5em;font-size:1em;font-weight:600;">Include</div>
          <div class="levels-list">
            {#each levels as lvl}
              <label class="level-checkbox">
                <input type="checkbox" checked={selectedLevels.has(lvl.value)} on:change={() => toggleLevel(lvl.value)} />
                <span>{lvl.label}</span>
              </label>
            {/each}
          </div>
          <div style="margin-top:0.4em;">
            <button style="font-size:0.97em;color:#176cda;background:none;border:none;cursor:pointer;" on:click={toggleAllLevels}>
              {allLevelsSelected() ? 'Clear all' : 'Select all'}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
  <div class="controls-right">
    <div class="switch-bar">
      <label class="switch-label">
        <input type="checkbox" bind:checked={hideWatched} on:change={updateGrid} />
        <span class="switch-slider"></span>
        Hide watched
      </label>
    </div>
    <div class="search-bar-container">
      {#if searchOpen}
        <input
          type="text"
          class="search-input"
          placeholder="Search videos…"
          bind:value={searchTerm}
          on:input={handleSearchInput}
          autofocus
        />
      {/if}
      <button
        class="search-toggle"
        title="Search"
        on:click={toggleSearch}
        aria-label="Search"
      >
        <Search size={22} />
      </button>
    </div>
  </div>
</div>

<style>
.controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.2em;
  max-width: 1380px;
  margin: 0.5em auto 2em auto;
  background: #f7f7fb;
  padding: 0.7em 1.5em 0.7em 1.2em;
  border-radius: 18px;
  border: 1.7px solid #ececec;
  box-shadow: 0 2px 16px #ececec60;
  overflow-x: visible;
    position: relative;
}
.controls-left {
  display: flex;
  align-items: center;
  gap: 1.2em;
}
.controls-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1.1em;
}
.dropdown {
  position: relative;
  min-width: 120px;
}
.dropdown-btn {
  padding: 0.42em 1.1em;
  font-size: 1.05em;
  border-radius: 12px;
  border: 1.2px solid #ececec;
  background: #f9f9f9;
  color: #1d1d1d;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5em;
  min-width: 110px;
  transition: border 0.11s, background 0.11s;
}
.dropdown-btn[aria-expanded='true'] {
  background: #f1f5fb;
  border: 1.2px solid #bbb;
}
.dropdown-content {
  position: absolute;
  z-index: 10;
  background: #fff;
  border: 1.3px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 2px 18px #eee;
  min-width: 180px;
  padding: 0.8em 0.6em;
  top: 110%;
  left: 0;
  font-size: 1em;
}
.levels-list {
  display: flex;
  flex-direction: column;
  gap: 0.6em;
  margin: 0.3em 0 0.4em 0;
}
.level-checkbox {
  display: flex;
  align-items: center;
  gap: 0.6em;
  font-size: 1.03em;
}
.switch-bar {
  display: flex;
  align-items: center;
}
.switch-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  color: #1d1d1d;
  gap: 0.4em;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 0.33em 0.7em 0.33em 0.33em;
  border: 1px solid #ececec;
  user-select: none;
}
.switch-label input {
  display: none;
}
.switch-slider {
  width: 34px;
  height: 20px;
  background: #e8e8e8;
  border-radius: 12px;
  position: relative;
  transition: background 0.13s;
  margin-right: 0.35em;
}
.switch-label input:checked + .switch-slider {
  background: #26890d;
}
.switch-slider::before {
  content: '';
  position: absolute;
  width: 15px;
  height: 15px;
  left: 2.2px;
  top: 2.2px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.13s;
}
.switch-label input:checked + .switch-slider::before {
  transform: translateX(14px);
}
/* --- Search Bar --- */
.search-bar-container {
  display: flex;
  align-items: center;
  position: relative;
  gap: 0.7em;
}
.search-input {
  transition: width 0.2s, opacity 0.2s;
  width: 180px;
  max-width: 50vw;
  order: -1; /* This keeps the input to the *left* of the button */
  margin-right: 0.3em;
  opacity: 1;
}
.search-toggle {
  z-index: 2;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.3em;
  margin-left: 0;
}
.search-toggle svg {
  transition: stroke 0.15s;
}
.search-toggle:hover svg {
  stroke: #2e9be6;
}
@media (max-width: 900px) {
  .controls-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 0.7em 0.8em;
  }
  .controls-left,
  .controls-right {
    margin-left: 0;
    justify-content: flex-start;
  }
  .controls-right {
    justify-content: flex-end;
    margin-top: 0.7em;
  }
}
@media (max-width: 600px) {
  .search-input {
    width: 110px;
    font-size: 0.96em;
  }
}
</style>
