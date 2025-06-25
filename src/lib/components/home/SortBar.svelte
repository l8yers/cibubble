<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { isTablet } from '$lib/stores/screen.js';
	import { ArrowDownUp, BarChart3, Search, Earth, Tag, User, MoreHorizontal } from 'lucide-svelte';

	export let levels = [];
	export let sortChoices = [];
	export let countryOptions = [];
	export let selectedLevels = [];
	export let sortBy = 'new';
	export let selectedCountry = '';
	export let selectedTags = [];
	export let hideWatched = false;
	export let searchTerm = '';
	export let searchOpen = false;
	export let myChannels = [];
	export let selectedChannel = '';

	const dispatch = createEventDispatcher();

	// --- Dropdown state
	let showSortDropdown = false;
	let showLevelDropdown = false;
	let showCountryDropdown = false;
	let showTagDropdown = false;
	let showMyChannelsDropdown = false;
	let showMoreDropdown = false;

	let sortDropdownRef, levelsDropdownRef, tagDropdownRef, countryDropdownRef, myChannelsDropdownRef, moreDropdownRef;

	function emitChange(data = {}) {
		dispatch('change', {
			selectedLevels,
			sortBy,
			selectedCountry,
			selectedTags,
			hideWatched,
			searchTerm,
			searchOpen,
			selectedChannel,
			...data
		});
	}

	function handleToggleLevel(lvl) {
		const next = new Set(selectedLevels);
		if (next.has(lvl)) next.delete(lvl);
		else next.add(lvl);
		emitChange({ selectedLevels: Array.from(next) });
	}
	function handleToggleAllLevels() {
		if (selectedLevels.length === levels.length) emitChange({ selectedLevels: [] });
		else emitChange({ selectedLevels: levels.map((l) => l.value) });
	}
	function handleSetSort(val) {
		emitChange({ sortBy: val });
		showSortDropdown = false;
	}
	function handleSetCountry(c) {
		emitChange({ selectedCountry: c === selectedCountry ? '' : c });
	}
	function handleToggleTag(tag) {
		const next = new Set(selectedTags);
		if (next.has(tag)) next.delete(tag);
		else next.add(tag);
		emitChange({ selectedTags: Array.from(next) });
	}
	function handleClearTags() {
		emitChange({ selectedTags: [] });
	}
	function handleHideWatched() {
		emitChange({ hideWatched: !hideWatched });
	}
	function handleSearchInput(val) {
		emitChange({ searchTerm: val });
	}
	function handleToggleSearch() {
		emitChange({ searchOpen: !searchOpen, searchTerm: searchOpen ? '' : searchTerm });
	}
	function handleSetChannel(channelId) {
		emitChange({ selectedChannel: channelId });
		showMyChannelsDropdown = false;
	}
	function handleResetFilters() {
		emitChange({
			selectedLevels: levels.map((l) => l.value),
			sortBy: 'new',
			selectedCountry: '',
			selectedTags: [],
			hideWatched: false,
			searchTerm: '',
			selectedChannel: ''
		});
	}

	// --- Dropdown close on outside click ---
	function handleDocumentClick(event) {
		if (showSortDropdown && sortDropdownRef && !sortDropdownRef.contains(event.target))
			showSortDropdown = false;
		if (showLevelDropdown && levelsDropdownRef && !levelsDropdownRef.contains(event.target))
			showLevelDropdown = false;
		if (!$isTablet) {
			if (showTagDropdown && tagDropdownRef && !tagDropdownRef.contains(event.target))
				showTagDropdown = false;
			if (showCountryDropdown && countryDropdownRef && !countryDropdownRef.contains(event.target))
				showCountryDropdown = false;
			if (showMyChannelsDropdown && myChannelsDropdownRef && !myChannelsDropdownRef.contains(event.target))
				showMyChannelsDropdown = false;
		}
		if ($isTablet) {
			if (showMoreDropdown && moreDropdownRef && !moreDropdownRef.contains(event.target))
				showMoreDropdown = false;
		}
	}
	onMount(() => {
		document.addEventListener('click', handleDocumentClick);
		return () => document.removeEventListener('click', handleDocumentClick);
	});

	function toTitleCase(str) {
		return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));
	}

	$: filtersChanged =
		sortBy !== 'new' ||
		selectedCountry !== '' ||
		selectedTags.length > 0 ||
		selectedLevels.length !== levels.length ||
		searchTerm !== '' ||
		selectedChannel !== '';

	const topTags = [
		'history', 'for learners', 'personal development', "children's science", 'current events',
		'videogames', 'health', 'news', 'lifestyle', 'random facts'
	];
	const allTags = [
		'ai voice','animated stories','animation','animals','art','argentina','bags','baseball',
		'business','canary islands','challenges',"children's history","children's science","children's stories",
		'colombia','comedy','comedy jokes test rain','cooking','cost of living','country life','creepy','critiques',
		'current events','cuba','culture','debates','dubbed show','education','el salvador','equatorial guinea',
		'facts','fashion','finance','fitness','food reviews','for learners','france','gardening','geography',
		'gravy','guatemala','health','heart','history',"how it's made",'human mind','iceland','interviews',
		'italy','jam','jam toast','journalist',"kid's show",'kids show','kpop','language learning','latin america',
		'law','level','life','life in iceland','life in japan','life in korea','lifestyle','lifestyle in japan',
		'main','manufacturing','mexico','mindfullness','montessori','motivation','music','nasa','nature','news',
		'not native speaker','panama','paraguay','peru','personal development','philosophy','playlists','politics',
		'pop culture','positive affirmations','psychology','pyschology','puerto rico','random facts','re sales',
		'relationships','religion','science','shorts','sobriety','spain','sports','storytelling','street interviews',
		'tarot','tech','test','travel','true crime','uruguay','various','videogames','weather'
	].sort((a, b) => a.localeCompare(b));
</script>

<div class="controls-bar">
	<div class="controls-left">
		<!-- Sort Dropdown -->
		<div class="dropdown" bind:this={sortDropdownRef}>
			<button class="dropdown-btn" aria-expanded={showSortDropdown} on:click={() => (showSortDropdown = !showSortDropdown)} type="button">
				<ArrowDownUp size={18} style="margin-right:7px;vertical-align:-3px;color:#2e9be6;" />
				Sort by
				<svg width="12" height="9" style="margin-left:7px;" fill="none">
					<path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
				</svg>
			</button>
			{#if showSortDropdown}
				<div class="dropdown-content">
					{#each sortChoices as opt}
						<div class:active-sort-option={opt.value === sortBy}
							style="padding:0.32em 0.2em;cursor:pointer;display:flex;align-items:center;"
							on:click={() => handleSetSort(opt.value)}>
							<span>{opt.label}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Levels Dropdown -->
		<div class="dropdown" bind:this={levelsDropdownRef}>
			<button class="dropdown-btn" aria-expanded={showLevelDropdown} on:click={() => (showLevelDropdown = !showLevelDropdown)} type="button">
				<BarChart3 size={18} style="margin-right:7px;vertical-align:-3px;color:#f365a0;" />
				Levels
				<svg width="12" height="9" style="margin-left:7px;" fill="none">
					<path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
				</svg>
			</button>
			{#if showLevelDropdown}
				<div class="dropdown-content">
					<div class="levels-list">
						{#each levels as lvl}
							<label class="level-checkbox">
								<input
									type="checkbox"
									checked={selectedLevels.includes(lvl.value)}
									on:change={() => handleToggleLevel(lvl.value)}
								/>
								<span>{lvl.label}</span>
							</label>
						{/each}
					</div>
					<button
						style="margin-top:0.5em;font-size:0.96em;color:#d54b18;background:none;border:none;cursor:pointer;"
						on:click={handleToggleAllLevels}
					>
						Toggle all
					</button>
				</div>
			{/if}
		</div>

		{#if !$isTablet}
			<!-- Individual Dropdowns on Desktop -->
			<div class="dropdown" bind:this={tagDropdownRef}>
				<button class="dropdown-btn" aria-expanded={showTagDropdown} on:click={() => (showTagDropdown = !showTagDropdown)} type="button">
					<Tag size={18} style="margin-right:7px;vertical-align:-3px;color:#f2a02b;" />
					Tags
					<svg width="12" height="9" style="margin-left:7px;" fill="none">
						<path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
					</svg>
				</button>
				{#if showTagDropdown}
					<div class="dropdown-content tags-dropdown-content">
						<!-- TOP TAGS -->
						<div style="margin-bottom:0.7em;">
							<div class="dropdown-label" style="font-weight:700; font-size:1.01em;">Top Tags</div>
							{#each topTags as tag}
								<label class="level-checkbox">
									<input
										type="checkbox"
										checked={selectedTags.includes(tag)}
										on:change={() => handleToggleTag(tag)}
									/>
									<span>{toTitleCase(tag)}</span>
								</label>
							{/each}
						</div>
						<hr style="margin:0.5em 0 0.5em 0;" />
						<!-- ALL OTHER TAGS -->
						<div>
							<div class="dropdown-label" style="font-weight:700; font-size:1.01em;">All Tags</div>
							{#each allTags as tag}
								{#if !topTags.includes(tag)}
									<label class="level-checkbox">
										<input
											type="checkbox"
											checked={selectedTags.includes(tag)}
											on:change={() => handleToggleTag(tag)}
										/>
										<span>{toTitleCase(tag)}</span>
									</label>
								{/if}
							{/each}
						</div>
						<button
							style="margin-top:0.7em;font-size:0.96em;color:#d54b18;background:none;border:none;cursor:pointer;"
							on:click={handleClearTags}
						>
							Clear all
						</button>
					</div>
				{/if}
			</div>
			<div class="dropdown" bind:this={countryDropdownRef}>
				<button class="dropdown-btn" aria-expanded={showCountryDropdown} on:click={() => (showCountryDropdown = !showCountryDropdown)} type="button">
					<Earth size={18} style="margin-right:7px;vertical-align:-3px;color:#c367f2;" />
					Country
					<svg width="12" height="9" style="margin-left:7px;" fill="none">
						<path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
					</svg>
				</button>
				{#if showCountryDropdown}
					<div class="dropdown-content">
						<label class="level-checkbox">
							<input
								type="checkbox"
								checked={selectedCountry === ''}
								on:change={() => handleSetCountry('')}
							/>
							<span>All Countries</span>
						</label>
						{#each countryOptions as country}
							<label class="level-checkbox">
								<input
									type="checkbox"
									checked={selectedCountry === country}
									on:change={() => handleSetCountry(country)}
								/>
								<span>{country}</span>
							</label>
						{/each}
					</div>
				{/if}
			</div>
			{#if myChannels && myChannels.length}
				<div class="dropdown" bind:this={myChannelsDropdownRef}>
					<button class="dropdown-btn" aria-expanded={showMyChannelsDropdown} on:click={() => (showMyChannelsDropdown = !showMyChannelsDropdown)} type="button">
						<User size={18} style="margin-right:7px;vertical-align:-3px;color:#7950f2;" />
						My Channels
						<svg width="12" height="9" style="margin-left:7px;" fill="none">
							<path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
						</svg>
					</button>
					{#if showMyChannelsDropdown}
						<div class="dropdown-content">
							<!-- All My Channels option -->
							<label class="level-checkbox">
								<input
									type="checkbox"
									checked={selectedChannel === '__ALL__'}
									on:change={() => emitChange({ selectedChannel: '__ALL__' })}
								/>
								<span>All Saved Channels</span>
							</label>
							{#each myChannels as ch}
								<label class="level-checkbox">
									<input
										type="checkbox"
										checked={selectedChannel === ch.id}
										on:change={() => emitChange({ selectedChannel: ch.id })}
									/>
									<span>{ch.name}</span>
								</label>
							{/each}
							<hr style="margin: 0.7em 0;" />
							<a
								href="/mychannels"
								class="edit-my-channels-link"
								style="display: flex; align-items: center; color: #7950f2; font-weight: 700; text-decoration: none; font-size: 1em; gap: 0.6em; padding: 0.2em 0.1em;"
							>
								<svg width="18" height="18" fill="none" stroke="#7950f2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="9" cy="9" r="7.5" />
									<path d="M12.5 7.5l-5 5" />
									<path d="M7.5 7.5l5 5" />
								</svg>
								Edit My Channels
							</a>
						</div>
					{/if}
				</div>
			{/if}
		{:else}
			<!-- TABLET: More Dropdown for Tags, Country, Channels -->
			<div class="dropdown" bind:this={moreDropdownRef}>
				<button class="dropdown-btn" aria-expanded={showMoreDropdown} on:click={() => (showMoreDropdown = !showMoreDropdown)} type="button">
					<MoreHorizontal size={18} style="margin-right:7px;vertical-align:-3px;color:#888;" />
					More
					<svg width="12" height="9" style="margin-left:7px;" fill="none">
						<path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
					</svg>
				</button>
				{#if showMoreDropdown}
					<div class="dropdown-content" style="min-width:260px;max-width:340px;">
						<!-- Tags -->
						<div>
							<div class="dropdown-label" style="font-weight:700; font-size:1.01em;">Tags</div>
							<div class="levels-list">
								{#each topTags as tag}
									<label class="level-checkbox">
										<input
											type="checkbox"
											checked={selectedTags.includes(tag)}
											on:change={() => handleToggleTag(tag)}
										/>
										<span>{toTitleCase(tag)}</span>
									</label>
								{/each}
								<hr style="margin:0.5em 0 0.5em 0;" />
								{#each allTags as tag}
									{#if !topTags.includes(tag)}
										<label class="level-checkbox">
											<input
												type="checkbox"
												checked={selectedTags.includes(tag)}
												on:change={() => handleToggleTag(tag)}
											/>
											<span>{toTitleCase(tag)}</span>
										</label>
									{/if}
								{/each}
							</div>
							<button
								style="margin-top:0.7em;font-size:0.96em;color:#d54b18;background:none;border:none;cursor:pointer;"
								on:click={handleClearTags}
							>
								Clear all
							</button>
						</div>
						<hr style="margin:1em 0 1em 0;" />
						<!-- Country -->
						<div>
							<div class="dropdown-label" style="font-weight:700; font-size:1.01em;">Country</div>
							<label class="level-checkbox">
								<input
									type="checkbox"
									checked={selectedCountry === ''}
									on:change={() => handleSetCountry('')}
								/>
								<span>All Countries</span>
							</label>
							{#each countryOptions as country}
								<label class="level-checkbox">
									<input
										type="checkbox"
										checked={selectedCountry === country}
										on:change={() => handleSetCountry(country)}
									/>
									<span>{country}</span>
								</label>
							{/each}
						</div>
						<hr style="margin:1em 0 1em 0;" />
						<!-- My Channels -->
						{#if myChannels && myChannels.length}
						<div>
							<div class="dropdown-label" style="font-weight:700; font-size:1.01em;">My Channels</div>
							<label class="level-checkbox">
								<input
									type="checkbox"
									checked={selectedChannel === '__ALL__'}
									on:change={() => emitChange({ selectedChannel: '__ALL__' })}
								/>
								<span>All Saved Channels</span>
							</label>
							{#each myChannels as ch}
								<label class="level-checkbox">
									<input
										type="checkbox"
										checked={selectedChannel === ch.id}
										on:change={() => emitChange({ selectedChannel: ch.id })}
									/>
									<span>{ch.name}</span>
								</label>
							{/each}
							<a
								href="/mychannels"
								class="edit-my-channels-link"
								style="display: flex; align-items: center; color: #7950f2; font-weight: 700; text-decoration: none; font-size: 1em; gap: 0.6em; padding: 0.2em 0.1em;"
							>
								<svg width="18" height="18" fill="none" stroke="#7950f2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="9" cy="9" r="7.5" />
									<path d="M12.5 7.5l-5 5" />
									<path d="M7.5 7.5l5 5" />
								</svg>
								Edit My Channels
							</a>
						</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		{#if filtersChanged}
			<button class="reset-filters-btn" type="button" on:click={handleResetFilters}>
				reset filters
			</button>
		{/if}
	</div>
	<div class="controls-right">
		<button class="dropdown-btn hide-watched-btn" type="button" aria-pressed={hideWatched} on:click={handleHideWatched}>
			<span class="switch-slider" aria-hidden="true"></span>
			<span class="switch-label-text">Hide watched</span>
		</button>
		<div class="search-bar-container">
			{#if searchOpen}
				<input
					type="text"
					class="search-input"
					placeholder="Search videos…"
					value={searchTerm}
					on:input={(e) => handleSearchInput(e.target.value)}
					autofocus
				/>
			{/if}
			<button class="search-toggle" title="Search" on:click={handleToggleSearch} aria-label="Search">
				<Search size={22} style="color:#2e9be6;" />
			</button>
		</div>
	</div>
</div>


<style>
/* --- SORTBAR WRAPPER --- */
.controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2em;
  margin: 2em 9em 2em 9em;
  padding: 1.1em 2.2em 1.1em 2.2em;
  background: #f7f8fc;
  border-radius: 20px;
  box-shadow: 0 3px 18px #ececec66;
  border: 1.5px solid #ededfa;
  position: relative;
  flex-wrap: wrap;
}

/* --- LEFT BAR: Filter Controls --- */
.controls-left {
  display: flex;
  align-items: center;
  gap: 1.3em;
  flex-wrap: wrap;
}

/* --- RIGHT BAR: Hide Watched + Search --- */
.controls-right {
  display: flex;
  align-items: center;
  gap: 1.1em;
  margin-left: auto;
}

/* --- DROPDOWNS --- */
.dropdown {
  position: relative;
  min-width: 130px;
}
.dropdown-btn {
  display: flex;
  align-items: center;
  gap: 0.7em;
  padding: 0.47em 1.3em;
  border: 1.3px solid #e7e7f6;
  border-radius: 13px;
  background: #fdfdff;
  font-size: 1.04em;
  font-weight: 700;
  color: #232344;
  cursor: pointer;
  transition: border 0.13s, background 0.13s, color 0.13s;
}
.dropdown-btn[aria-expanded='true'] {
  border: 1.3px solid #bbb;
  background: #f1f5fb;
  color: #e93c2f;
}
.dropdown-content {
  position: absolute;
  top: 115%;
  left: 0;
  z-index: 101;
  min-width: 195px;
  max-width: 320px;
  background: #fff;
  border: 1.4px solid #ececec;
  border-radius: 11px;
  box-shadow: 0 5px 36px #c9d7e155;
  padding: 1em 0.7em 1.2em 0.7em;
  font-size: 1em;
  animation: fadeInSortbar 0.13s;
  overflow-y: auto;
  max-height: 380px;
}
@keyframes fadeInSortbar {
  from { opacity: 0; transform: translateY(10px);}
  to   { opacity: 1; transform: translateY(0);}
}

/* --- CHECKBOXES & LISTS --- */
.levels-list, .dropdown-content .tags-dropdown-content {
  display: flex;
  flex-direction: column;
  gap: 0.6em;
}
.level-checkbox {
  display: flex;
  align-items: center;
  gap: 0.55em;
  font-size: 1.01em;
  padding: 0.1em 0.1em;
  cursor: pointer;
}
.level-checkbox input[type="checkbox"] {
  accent-color: #2e9be6;
  width: 1.04em; height: 1.04em;
}

/* --- TAG DROPDOWN EXTRAS --- */
.tags-dropdown-content {
  max-height: 320px;
  overflow-y: auto;
  padding-bottom: 0.8em;
}
.dropdown-label {
  font-size: 1em;
  font-weight: 700;
  margin-bottom: 0.3em;
  color: #2e9be6;
}

/* --- RESET BUTTON --- */
.reset-filters-btn {
  font-weight: 800;
  color: #e93c2f;
  background: none;
  border: none;
  font-size: 1.03em;
  cursor: pointer;
  letter-spacing: 0.03em;
  padding: 0.48em 1.1em;
  border-radius: 8px;
  margin-left: 0.8em;
  transition: text-decoration 0.1s, color 0.13s, background 0.13s;
}
.reset-filters-btn:hover, .reset-filters-btn:focus {
  text-decoration: underline;
  background: #fceaea;
}

/* --- HIDE WATCHED BUTTON (switch) --- */
.hide-watched-btn {
  display: flex;
  align-items: center;
  gap: 0.7em;
  border: 1.3px solid #e7e7f6;
  border-radius: 13px;
  background: #fdfdff;
  padding: 0.4em 1.2em;
  font-size: 1.04em;
  font-weight: 700;
  color: #181d27;
  cursor: pointer;
  transition: border 0.13s, background 0.13s, color 0.13s;
}
.hide-watched-btn[aria-pressed="true"] {
  background: #fd2b2330;
  color: #e93c2f;
  border: 1.3px solid #fd2b23;
}
.switch-slider {
  width: 36px;
  height: 20px;
  background: #e8e8e8;
  border-radius: 8px;
  position: relative;
  display: inline-block;
  transition: background 0.13s;
  margin-right: 0.5em;
  vertical-align: middle;
}
.hide-watched-btn[aria-pressed="true"] .switch-slider {
  background: #fd2b23;
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
  transition: transform 0.13s, box-shadow 0.13s;
  box-shadow: 0 1px 2px #0002;
}
.hide-watched-btn[aria-pressed="true"] .switch-slider::before {
  transform: translateX(14px);
  box-shadow: 0 1px 4px #fd2b2333;
}
.switch-label-text {
  font-size: 1.04em;
  font-weight: 700;
  color: inherit;
}

/* --- SEARCH --- */
.search-bar-container {
  display: flex;
  align-items: center;
  position: relative;
  gap: 0.7em;
}
.search-input {
  width: 180px;
  max-width: 50vw;
  padding: 0.45em 1em;
  font-size: 1.04em;
  border-radius: 11px;
  border: 1.3px solid #e7e7f6;
  background: #fdfdff;
  color: #232344;
  font-weight: 500;
  margin-right: 0.3em;
  box-shadow: 0 1px 8px #ececec60;
  outline: none;
  transition: border 0.13s, background 0.13s, box-shadow 0.13s;
}
.search-input:focus {
  border: 1.3px solid #2e9be6;
  background: #f7faff;
  box-shadow: 0 2px 14px #cbeafe44;
}
.search-toggle {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.3em;
  border-radius: 50%;
  transition: background 0.13s;
}
.search-toggle:hover, .search-toggle:focus-visible {
  background: #e5f2fd;
}

/* --- ACTIVE SORT HIGHLIGHT --- */
.active-sort-option {
  background: #e5f2fd;
  font-weight: 700;
  color: #2e9be6;
  border-radius: 7px;
}

/* --- RESPONSIVE --- */
@media (max-width: 1200px) {
  .controls-bar {
    flex-direction: column;
    gap: 1.2em;
    padding: 1em 1.2em;
  }
  .controls-left, .controls-right {
    flex-wrap: wrap;
    margin-left: 0;
    gap: 1em;
  }
  .controls-right {
    justify-content: flex-end;
    margin-top: 0.7em;
  }
}

@media (max-width: 900px) {
  .controls-bar {
    gap: 1em;
  }
}


@media (max-width: 700px) {
  .controls-bar {
    gap: 0.6em;
    padding: 0.8em 0.4em;
    border-radius: 10px;
  }
  .dropdown-btn, .hide-watched-btn {
    font-size: 0.99em;
    padding: 0.34em 0.7em;
  }
  .dropdown-content {
    min-width: 135px;
    font-size: 0.99em;
    padding: 0.5em 0.5em 0.7em 0.5em;
  }
  .search-input {
    width: 98px;
    font-size: 0.99em;
  }
}
</style>
