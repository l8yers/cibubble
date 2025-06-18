<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { Sparkles, BarChart3, Search, Globe, Tag, User } from 'lucide-svelte';

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

	// Level filter
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

	// Sort dropdown
	function handleSetSort(val) {
		emitChange({ sortBy: val });
		showSortDropdown = false;
	}

	// Country filter
	function handleSetCountry(c) {
		emitChange({ selectedCountry: c === selectedCountry ? '' : c });
	}

	// TAGS FILTER (Top + All tags, no search)
	function handleToggleTag(tag) {
		const next = new Set(selectedTags);
		if (next.has(tag)) next.delete(tag);
		else next.add(tag);
		emitChange({ selectedTags: Array.from(next) });
	}
	function handleClearTags() {
		emitChange({ selectedTags: [] });
	}

	// Misc
	function handleHideWatched() {
		emitChange({ hideWatched: !hideWatched });
	}
	function handleSearchInput(val) {
		emitChange({ searchTerm: val });
	}
	function handleToggleSearch() {
		emitChange({ searchOpen: !searchOpen, searchTerm: searchOpen ? '' : searchTerm });
	}

	// Dropdown state (UI only)
	let showSortDropdown = false;
	let showLevelDropdown = false;
	let showCountryDropdown = false;
	let showTagDropdown = false;
	let showMyChannelsDropdown = false;
	let sortDropdownRef, levelsDropdownRef, tagDropdownRef, countryDropdownRef, myChannelsDropdownRef;

	function handleSetChannel(channelId) {
		emitChange({ selectedChannel: channelId });
		showMyChannelsDropdown = false;
	}

	function handleDocumentClick(event) {
		if (showSortDropdown && sortDropdownRef && !sortDropdownRef.contains(event.target))
			showSortDropdown = false;
		if (showLevelDropdown && levelsDropdownRef && !levelsDropdownRef.contains(event.target))
			showLevelDropdown = false;
		if (showTagDropdown && tagDropdownRef && !tagDropdownRef.contains(event.target))
			showTagDropdown = false;
		if (showCountryDropdown && countryDropdownRef && !countryDropdownRef.contains(event.target))
			showCountryDropdown = false;
		if (
			showMyChannelsDropdown &&
			myChannelsDropdownRef &&
			!myChannelsDropdownRef.contains(event.target)
		)
			showMyChannelsDropdown = false;
	}
	onMount(() => {
		document.addEventListener('click', handleDocumentClick);
		return () => document.removeEventListener('click', handleDocumentClick);
	});

	// Title case util for friendly tag display
	function toTitleCase(str) {
		return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));
	}

	// Helper to check if filters are not default
	$: filtersChanged =
		sortBy !== 'new' ||
		selectedCountry !== '' ||
		selectedTags.length > 0 ||
		selectedLevels.length !== levels.length ||
		hideWatched !== false ||
		searchTerm !== '' ||
		selectedChannel !== '';

	// --- Top Tags (hardcoded from your latest top 10) ---
	const topTags = [
		'history',
		'for learners',
		'personal development',
		"children's science",
		'current events',
		'videogames',
		'health',
		'news',
		'lifestyle',
		'random facts'
	];

	// --- All Tags: deduped, sorted, lowercased, split on / and trimmed (from your CSV) ---
	const allTags = [
		'ai voice',
		'animated stories',
		'animation',
		'animals',
		'art',
		'argentina',
		'bags',
		'baseball',
		'business',
		'canary islands',
		'challenges',
		"children's history",
		"children's science",
		"children's stories",
		'colombia',
		'comedy',
		'comedy jokes test rain',
		'cooking',
		'cost of living',
		'country life',
		'creepy',
		'critiques',
		'current events',
		'cuba',
		'culture',
		'debates',
		'dubbed show',
		'education',
		'el salvador',
		'equatorial guinea',
		'facts',
		'fashion',
		'finance',
		'fitness',
		'food reviews',
		'for learners',
		'france',
		'gardening',
		'geography',
		'gravy',
		'guatemala',
		'health',
		'heart',
		'history',
		"how it's made",
		'human mind',
		'iceland',
		'interviews',
		'italy',
		'jam',
		'jam toast',
		'journalist',
		"kid's show",
		'kids show',
		'kpop',
		'language learning',
		'latin america',
		'law',
		'level',
		'life',
		'life in iceland',
		'life in japan',
		'life in korea',
		'lifestyle',
		'lifestyle in japan',
		'main',
		'manufacturing',
		'mexico',
		'mindfullness',
		'montessori',
		'motivation',
		'music',
		'nasa',
		'nature',
		'news',
		'not native speaker',
		'panama',
		'paraguay',
		'peru',
		'personal development',
		'philosophy',
		'playlists',
		'politics',
		'pop culture',
		'positive affirmations',
		'psychology',
		'pyschology',
		'puerto rico',
		'random facts',
		're sales',
		'relationships',
		'religion',
		'science',
		'shorts',
		'sobriety',
		'spain',
		'sports',
		'storytelling',
		'street interviews',
		'tarot',
		'tech',
		'test',
		'travel',
		'true crime',
		'uruguay',
		'various',
		'videogames',
		'weather'
	].sort((a, b) => a.localeCompare(b));
</script>

<div class="controls-bar">
	<div class="controls-left">
		<!-- Sort Dropdown -->
		<div class="dropdown" bind:this={sortDropdownRef}>
			<button
				class="dropdown-btn"
				aria-expanded={showSortDropdown}
				on:click={() => (showSortDropdown = !showSortDropdown)}
				type="button"
			>
				<Sparkles size={18} style="margin-right:7px;vertical-align:-3px;color:#2e9be6;" />
				Sort by
				<svg width="12" height="9" style="margin-left:7px;" fill="none">
					<path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
				</svg>
			</button>
			{#if showSortDropdown}
				<div class="dropdown-content">
					{#each sortChoices as opt}
						<div
							class:active-sort-option={opt.value === sortBy}
							style="padding:0.32em 0.2em;cursor:pointer;display:flex;align-items:center;"
							on:click={() => handleSetSort(opt.value)}
						>
							<span>{opt.label}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Levels Dropdown -->
		<div class="dropdown" bind:this={levelsDropdownRef}>
			<button
				class="dropdown-btn"
				aria-expanded={showLevelDropdown}
				on:click={() => (showLevelDropdown = !showLevelDropdown)}
				type="button"
			>
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

		<!-- TAGS FILTER Dropdown (Top + All, no search) -->
		<div class="dropdown" bind:this={tagDropdownRef}>
			<button
				class="dropdown-btn"
				aria-expanded={showTagDropdown}
				on:click={() => (showTagDropdown = !showTagDropdown)}
				type="button"
			>
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

		<!-- Countries Dropdown -->
		<div class="dropdown" bind:this={countryDropdownRef}>
			<button
				class="dropdown-btn"
				aria-expanded={showCountryDropdown}
				on:click={() => (showCountryDropdown = !showCountryDropdown)}
				type="button"
			>
				<Globe size={18} style="margin-right:7px;vertical-align:-3px;color:#c367f2;" />
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

		<!-- My Channels Dropdown -->
		{#if myChannels && myChannels.length}
			<div class="dropdown" bind:this={myChannelsDropdownRef}>
				<button
					class="dropdown-btn"
					aria-expanded={showMyChannelsDropdown}
					on:click={() => (showMyChannelsDropdown = !showMyChannelsDropdown)}
					type="button"
				>
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
							<span>All My Channels</span>
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
							<svg
								width="18"
								height="18"
								fill="none"
								stroke="#7950f2"
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
				{/if}
			</div>
		{/if}

		<!-- RESET FILTERS BUTTON (only visible if not defaults) -->
		{#if filtersChanged}
			<button
				class="reset-filters-btn"
				type="button"
				on:click={() =>
					emitChange({
						selectedLevels: levels.map((l) => l.value),
						sortBy: 'new',
						selectedCountry: '',
						selectedTags: [],
						hideWatched: false,
						searchTerm: '',
						selectedChannel: ''
					})}
			>
				reset filters
			</button>
		{/if}
	</div>
	<div class="controls-right">
		<button
			class="dropdown-btn hide-watched-btn"
			type="button"
			aria-pressed={hideWatched}
			on:click={handleHideWatched}
		>
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
			<button
				class="search-toggle"
				title="Search"
				on:click={handleToggleSearch}
				aria-label="Search"
			>
				<Search size={22} style="color:#2e9be6;" />
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
		max-width: 1700px;
		margin: 2em auto 2em auto;
		background: #f7f7fb;
		padding: 0.7em 1.2em 0.7em 1.2em;
		border-radius: 18px;
		border: 1.7px solid #ececec;
		box-shadow: 0 2px 16px #ececec60;
		position: relative;
		overflow-x: visible;
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
		gap: 0.65em;
		min-width: 110px;
		transition:
			border 0.11s,
			background 0.11s;
	}
	.dropdown-btn[aria-expanded='true'],
	.dropdown-btn[aria-pressed='true'] {
		background: #f1f5fb;
		border: 1.2px solid #bbb;
		color: #1d1d1d;
	}
	.hide-watched-btn .switch-slider {
		width: 36px;
		height: 20px;
		background: #e8e8e8;
		border-radius: 8px;
		position: relative;
		display: inline-block;
		transition: background 0.13s;
		margin-right: 0.65em;
		vertical-align: middle;
	}
	.hide-watched-btn[aria-pressed='true'] .switch-slider {
		background: #fd2b23;
	}
	.hide-watched-btn .switch-slider::before {
		content: '';
		position: absolute;
		width: 15px;
		height: 15px;
		left: 2.2px;
		top: 2.2px;
		background: #fff;
		border-radius: 50%;
		transition:
			transform 0.13s,
			box-shadow 0.13s;
		box-shadow: 0 1px 2px #0002;
	}
	.hide-watched-btn[aria-pressed='true'] .switch-slider::before {
		transform: translateX(14px);
		box-shadow: 0 1px 4px #fd2b2333;
	}
	.switch-label-text {
		font-size: 1.05em;
		font-weight: 600;
		letter-spacing: 0.03em;
		font-family: inherit;
		color: inherit;
	}
	.dropdown-content {
		position: absolute;
		z-index: 1000;
		background: #fff;
		border: 1.3px solid #e8e8e8;
		border-radius: 8px;
		box-shadow: 0 2px 18px #eee;
		min-width: 180px;
		padding: 0.8em 0.6em;
		top: 110%;
		left: 0;
		font-size: 1em;
		max-height: 350px;
		overflow-y: auto;
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
	.search-bar-container {
		display: flex;
		align-items: center;
		position: relative;
		gap: 0.7em;
	}
	.search-input {
		transition:
			width 0.2s,
			opacity 0.2s,
			box-shadow 0.13s,
			border 0.13s;
		width: 180px;
		max-width: 50vw;
		order: -1;
		margin-right: 0.3em;
		opacity: 1;
		font-size: 1.05em;
		border-radius: 12px;
		border: 1.2px solid #ececec;
		background: #f9f9f9;
		color: #1d1d1d;
		font-weight: 500;
		padding: 0.42em 1.1em;
		box-shadow: 0 2px 8px #ececec60;
		outline: none;
	}
	.search-input:focus {
		border: 1.2px solid #bbb;
		background: #f1f5fb;
		box-shadow: 0 2px 16px #bbb2;
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
		border-radius: 50%;
		transition: background 0.18s;
	}
	.search-toggle:hover,
	.search-toggle:focus-visible {
		background: #e5f2fd;
	}
	.search-toggle svg {
		transition: stroke 0.15s;
	}
	.search-toggle:hover svg {
		stroke: #2e9be6;
	}

	.reset-filters-btn {
		margin-left: 0.6em;
		font-weight: 800;
		color: #e93c2f !important;
		background: none;
		border: none;
		font-size: 1em;
		cursor: pointer;
		letter-spacing: 0.03em;
		padding: 0.45em 0.7em;
		border-radius: 8px;
		transition: text-decoration 0.11s;
		text-transform: none;
	}
	.reset-filters-btn:hover,
	.reset-filters-btn:focus-visible {
		text-decoration: underline;
		background: none;
		outline: none;
	}

	/* ACTIVE SORT HIGHLIGHT */
	.active-sort-option {
		background: #e5f2fd;
		font-weight: 700;
		color: #2e9be6;
		border-radius: 6px;
	}
	.active-sort-option:hover {
		background: #cbe5fb;
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
		.controls-bar {
			max-width: 99vw;
		}
		.search-input {
			width: 110px;
			font-size: 0.96em;
		}
	}
</style>
