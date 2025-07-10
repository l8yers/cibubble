<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		ArrowDownUp,
		BarChart3,
		Search,
		X,
		Earth,
		Tag,
		User,
		MoreHorizontal,
		Clock
	} from 'lucide-svelte';
	import { user } from '$lib/stores/user.js';

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

	let showSortDropdown = false;
	let showLevelDropdown = false;
	let showCountryDropdown = false;
	let showTagDropdown = false;
	let showMyChannelsDropdown = false;
	let showMoreDropdown = false;

	let sortDropdownRef,
		levelsDropdownRef,
		tagDropdownRef,
		countryDropdownRef,
		myChannelsDropdownRef,
		moreDropdownRef;

	let isTablet = false;
	let isSmallMobile = false;

	function updateSize() {
		isTablet = window.innerWidth < 1200;
		isSmallMobile = window.innerWidth < 650;
	}
	onMount(() => {
		updateSize();
		window.addEventListener('resize', updateSize);
		document.addEventListener('click', handleDocumentClick);
		return () => {
			window.removeEventListener('resize', updateSize);
			document.removeEventListener('click', handleDocumentClick);
		};
	});

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

	// ----- CORE LOGIC -----

	function handleSetSort(val) {
		if (val === 'random') {
			emitChange({
				sortBy: 'random',
				// keep current selectedLevels
				selectedCountry: '',
				selectedTags: [],
				selectedChannel: '',
				searchTerm: ''
			});
		} else {
			emitChange({ sortBy: val });
		}
		showSortDropdown = false;
	}

	function handleToggleLevel(lvl) {
		const next = new Set(selectedLevels);
		if (next.has(lvl)) next.delete(lvl);
		else next.add(lvl);
		emitChange({
			selectedLevels: Array.from(next)
			// don't change sortBy, even if random is active
		});
	}
	function handleToggleAllLevels() {
		if (selectedLevels.length === levels.length) {
			emitChange({
				selectedLevels: []
			});
		} else {
			emitChange({
				selectedLevels: levels.map((l) => l.value)
			});
		}
	}

	function handleSetCountry(c) {
		emitChange({
			selectedCountry: c === selectedCountry ? '' : c,
			sortBy: sortBy === 'random' ? 'new' : sortBy
		});
	}
	function handleToggleTag(tag) {
		const next = new Set(selectedTags);
		if (next.has(tag)) next.delete(tag);
		else next.add(tag);
		emitChange({
			selectedTags: Array.from(next),
			sortBy: sortBy === 'random' ? 'new' : sortBy
		});
	}
	function handleClearTags() {
		emitChange({
			selectedTags: [],
			sortBy: sortBy === 'random' ? 'new' : sortBy
		});
	}
	function handleHideWatched() {
		emitChange({
			hideWatched: !hideWatched,
			sortBy: sortBy === 'random' ? 'new' : sortBy
		});
	}
	function handleSearchInput(val) {
		emitChange({
			searchTerm: val,
			sortBy: sortBy === 'random' ? 'new' : sortBy
		});
	}
	function handleToggleSearch() {
		emitChange({
			searchOpen: !searchOpen,
			searchTerm: searchOpen ? '' : searchTerm,
			sortBy: sortBy === 'random' ? 'new' : sortBy
		});
	}
	function handleSetChannel(channelId) {
		emitChange({
			selectedChannel: channelId,
			sortBy: sortBy === 'random' ? 'new' : sortBy
		});
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

	function handleDocumentClick(event) {
		if (showSortDropdown && sortDropdownRef && !sortDropdownRef.contains(event.target))
			showSortDropdown = false;
		if (showLevelDropdown && levelsDropdownRef && !levelsDropdownRef.contains(event.target))
			showLevelDropdown = false;
		if (!isTablet && !isSmallMobile) {
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
		if (isTablet || isSmallMobile) {
			if (showMoreDropdown && moreDropdownRef && !moreDropdownRef.contains(event.target))
				showMoreDropdown = false;
		}
	}

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
		<!-- Sort Dropdown (always visible) -->
		<div class="dropdown" bind:this={sortDropdownRef}>
			<button
				class="dropdown-btn"
				aria-expanded={showSortDropdown}
				on:click={() => (showSortDropdown = !showSortDropdown)}
				type="button"
			>
				<ArrowDownUp size={20} style="margin-right:7px;vertical-align:-3px;color:#101720;" />
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

		<!-- Levels Dropdown (only show outside small mobile) -->
		{#if !isSmallMobile}
			<div class="dropdown" bind:this={levelsDropdownRef}>
				<button
					class="dropdown-btn"
					aria-expanded={showLevelDropdown}
					on:click={() => (showLevelDropdown = !showLevelDropdown)}
					type="button"
				>
					<BarChart3 size={20} style="margin-right:7px;vertical-align:-3px;color:#101720;" />
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
		{/if}

		<!-- Individual Dropdowns or More Dropdown -->
		{#if !isTablet && !isSmallMobile}
			<div class="dropdown" bind:this={tagDropdownRef}>
				<button
					class="dropdown-btn"
					aria-expanded={showTagDropdown}
					on:click={() => (showTagDropdown = !showTagDropdown)}
					type="button"
				>
					<Tag size={20} style="margin-right:7px;vertical-align:-3px;color:#101720;" />
					Tags
					<svg width="12" height="9" style="margin-left:7px;" fill="none">
						<path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
					</svg>
				</button>
				{#if showTagDropdown}
					<div class="dropdown-content tags-dropdown-content">
						<!-- ... Tags Content ... -->
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
				<button
					class="dropdown-btn"
					aria-expanded={showCountryDropdown}
					on:click={() => (showCountryDropdown = !showCountryDropdown)}
					type="button"
				>
					<Earth size={20} style="margin-right:7px;vertical-align:-3px;color:#101720;" />
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

			<!-- ----------- MY CHANNELS (UPDATED) ----------- -->
			{#if $user}
				<div class="dropdown" bind:this={myChannelsDropdownRef}>
					<button
						class="dropdown-btn"
						aria-expanded={showMyChannelsDropdown}
						on:click={() => (showMyChannelsDropdown = !showMyChannelsDropdown)}
						type="button"
					>
						<User size={20} style="margin-right:7px;vertical-align:-3px;color:#101720;" />
						My Channels
						<svg width="12" height="9" style="margin-left:7px;" fill="none">
							<path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
						</svg>
					</button>
					{#if showMyChannelsDropdown}
						<div class="dropdown-content">
							<!-- WATCH LATER OPTION (always) -->
							<label class="level-checkbox">
								<input
									type="checkbox"
									checked={selectedChannel === '__WATCH_LATER__'}
									on:change={() =>
										emitChange({
											selectedLevels: levels.map((l) => l.value),
											sortBy: 'new',
											selectedCountry: '',
											selectedTags: [],
											hideWatched: false,
											searchTerm: '',
											searchOpen: false,
											selectedChannel: '__WATCH_LATER__'
										})
									}
								/>
								<span style="display:flex;align-items:center;">
									<Clock size={17} style="margin-right:4px;vertical-align:-2px;color:#101720;" />
									Watch Later
								</span>
							</label>
							<hr style="margin:0.5em 0;" />
							<label class="level-checkbox">
								<input
									type="checkbox"
									checked={selectedChannel === '__ALL__'}
									on:change={() =>
										emitChange({
											selectedLevels: levels.map((l) => l.value),
											sortBy: 'new',
											selectedCountry: '',
											selectedTags: [],
											hideWatched: false,
											searchTerm: '',
											searchOpen: false,
											selectedChannel: '__ALL__'
											})
										}
									/>
								<span>All Saved Channels</span>
							</label>
							{#if myChannels && myChannels.length}
								{#each myChannels as ch}
									<label class="level-checkbox">
										<input
											type="checkbox"
											checked={selectedChannel === ch.id}
											on:change={() =>
												emitChange({
													selectedLevels: levels.map((l) => l.value),
													sortBy: 'new',
													selectedCountry: '',
													selectedTags: [],
													hideWatched: false,
													searchTerm: '',
													searchOpen: false,
													selectedChannel: ch.id
												})
											}
										/>
										<span>{ch.name}</span>
									</label>
								{/each}
							{/if}
							<hr style="margin: 0.7em 0;" />
							<a
								href="/mychannels"
								class="edit-my-channels-link"
								style="display: flex; align-items: center; color: #7950f2; font-weight: 700; text-decoration: none; font-size: 1.1em; gap: 0.6em; padding: 0.2em 0.1em;"
							>
								<svg
									width="19"
									height="19"
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
		{:else}
			<!-- More Dropdown: at tablet/small, includes Tags, Country, Channels, and (at mobile) Levels -->
			<div class="dropdown" bind:this={moreDropdownRef}>
				<button
					class="dropdown-btn"
					aria-expanded={showMoreDropdown}
					on:click={() => (showMoreDropdown = !showMoreDropdown)}
					type="button"
				>
					<MoreHorizontal
						size={20}
						style="margin-right:7px;vertical-align:-3px;color:#101720;"
					/>
					More
					<svg width="12" height="9" style="margin-left:7px;" fill="none">
						<path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2" />
					</svg>
				</button>
				{#if showMoreDropdown}
					<div class="dropdown-content" style="min-width:260px;max-width:340px;">
						{#if isSmallMobile}
							<div>
								<div class="dropdown-label" style="font-weight:700; font-size:1.01em;">Levels</div>
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
							<hr style="margin:0.7em 0;" />
						{/if}
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
						<!-- My Channels (always show) -->
						<div>
							<div class="dropdown-label" style="font-weight:700; font-size:1.01em;">
								My Channels
							</div>
							<!-- WATCH LATER OPTION (always) -->
							<label class="level-checkbox">
								<input
									type="checkbox"
									checked={selectedChannel === '__WATCH_LATER__'}
									on:change={() =>
										emitChange({
											selectedLevels: levels.map((l) => l.value),
											sortBy: 'new',
											selectedCountry: '',
											selectedTags: [],
											hideWatched: false,
											searchTerm: '',
											searchOpen: false,
											selectedChannel: '__WATCH_LATER__'
										})
									}
								/>
								<span style="display:flex;align-items:center;">
									<Clock size={17} style="margin-right:4px;vertical-align:-2px;color:#101720;" />
									Watch Later
								</span>
							</label>
							<label class="level-checkbox">
								<input
									type="checkbox"
									checked={selectedChannel === '__ALL__'}
									on:change={() =>
										emitChange({
											selectedLevels: levels.map((l) => l.value),
											sortBy: 'new',
											selectedCountry: '',
											selectedTags: [],
											hideWatched: false,
											searchTerm: '',
											searchOpen: false,
											selectedChannel: '__ALL__'
										})
									}
								/>
								<span>All Saved Channels</span>
							</label>
							{#if myChannels && myChannels.length}
								{#each myChannels as ch}
									<label class="level-checkbox">
										<input
											type="checkbox"
											checked={selectedChannel === ch.id}
											on:change={() =>
												emitChange({
													selectedLevels: levels.map((l) => l.value),
													sortBy: 'new',
													selectedCountry: '',
													selectedTags: [],
													hideWatched: false,
													searchTerm: '',
													searchOpen: false,
													selectedChannel: ch.id
												})
											}
										/>
										<span>{ch.name}</span>
									</label>
								{/each}
							{/if}
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
		{#if $user && !searchOpen}
			<button
				class="dropdown-btn hide-watched-btn"
				type="button"
				aria-pressed={hideWatched}
				on:click={handleHideWatched}
			>
				<span class="switch-slider" aria-hidden="true"></span>
				<span class="switch-label-text">Hide watched</span>
			</button>
		{/if}
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
				title={searchOpen ? 'Close search' : 'Search'}
				on:click={handleToggleSearch}
				aria-label={searchOpen ? 'Close search' : 'Search'}
			>
				{#if searchOpen}
					<X size={22} style="color:#101720;" />
				{:else}
					<Search size={22} style="color:#101720;" />
				{/if}
			</button>
		</div>
	</div>
</div>

<style>
	:root {
		--cibubble-red: #eb1000;
		--cibubble-red-soft: #fceaea;
		--cibubble-accent: #fff6f5;
		--cibubble-dark: #18191a;
		--cibubble-radius: 13px;
	}

	/* --- SORTBAR WRAPPER --- */
	.controls-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		margin: 2em 2em 1em 2em;
		padding: 0.5em 1.2em 0.5em 1.2em;
		background: #fafbfc;
		border-radius: var(--cibubble-radius);
		box-shadow: 0 1.5px 8px #e0e0e040;
		border: 1px solid #e0e3ea;
		position: relative;
	}

	/* --- LEFT BAR: Filter Controls --- */
	.controls-left {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	/* --- RIGHT BAR: Hide Watched + Search --- */
	.controls-right {
		display: flex;
		align-items: center;
		gap: 0.7em;
		margin-left: auto;
	}

	/* --- DROPDOWNS --- */
	.dropdown {
		position: relative;
		min-width: 110px;
	}

	/* --- TOP-LEVEL DROPDOWN BUTTONS --- */
	.dropdown-btn {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.38em 1em;
		border: 1.3px solid #e7e7f6;
		border-radius: var(--cibubble-radius);
		background: #fdfdff;
		font-size: 1.02em;
		font-weight: 700;
		color: #101720;
		cursor: pointer;
		transition:
			border 0.13s,
			background 0.13s,
			color 0.13s;
	}
	/* --- HIGHLIGHT ON HOVER/FOCUS/EXPANDED: ONLY BORDER --- */
	.dropdown-btn[aria-expanded='true'],
	.dropdown-btn:focus,
	.dropdown-btn:hover {
		border: 1.8px solid #b2beb5;
		background: #fdfdff;
		color: #101720;
	}

	.dropdown-content {
		position: absolute;
		top: 115%;
		left: 0;
		z-index: 101;
		min-width: 170px;
		max-width: 320px;
		background: #fff;
		border: 1.4px solid #ececec;
		border-radius: 11px;
		box-shadow: 0 5px 36px #c9d7e155;
		padding: 1em 0.7em 1em 0.7em;
		font-size: 0.98em;
		animation: fadeInSortbar 0.13s;
		overflow-y: auto;
		max-height: 380px;
	}
	@keyframes fadeInSortbar {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* --- CHECKBOXES & LISTS --- */
	.levels-list {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.19em;
		padding: 0.1em 0.05em;
	}
	.level-checkbox {
		display: flex;
		align-items: center;
		gap: 0.45em;
		font-size: 1em;
		padding: 0.05em 0.05em;
		cursor: pointer;
	}
	.level-checkbox input[type='checkbox'] {
		accent-color: var(--cibubble-red);
		width: 1.02em;
		height: 1.02em;
	}

	/* --- RESET BUTTON --- */
	.reset-filters-btn {
		font-weight: 800;
		color: var(--cibubble-red);
		background: none;
		border: none;
		font-size: 1em;
		cursor: pointer;
		letter-spacing: 0.02em;
		padding: 0.35em 0.9em;
		border-radius: 8px;
		margin-left: 0.7em;
		transition:
			text-decoration 0.1s,
			color 0.13s,
			background 0.13s;
	}
	.reset-filters-btn:hover,
	.reset-filters-btn:focus {
		text-decoration: none;
		background: var(--cibubble-red-soft);
	}

	/* --- HIDE WATCHED BUTTON (switch) --- */
	.hide-watched-btn {
		display: flex;
		align-items: center;
		gap: 0.7em;
		border: 1.3px solid #e7e7f6;
		border-radius: var(--cibubble-radius);
		background: #fdfdff;
		padding: 0.4em 1em;
		font-size: 1em;
		font-weight: 700;
		color: #181d27;
		cursor: pointer;
		transition:
			border 0.13s,
			background 0.13s,
			color 0.13s;
	}
	.hide-watched-btn[aria-pressed='true'] {
		background: #fdfdff;
		border: 1.3px solid #e7e7f6;
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
	.hide-watched-btn[aria-pressed='true'] .switch-slider {
		background: var(--cibubble-red);
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
		transition:
			transform 0.13s,
			box-shadow 0.13s;
		box-shadow: 0 1px 2px #0002;
	}
	.hide-watched-btn[aria-pressed='true'] .switch-slider::before {
		transform: translateX(14px);
		box-shadow: 0 1px 4px #eb100033;
	}
	.switch-label-text {
		font-size: 1em;
		font-weight: 700;
		color: inherit;
	}

	/* --- SEARCH --- */
	.search-bar-container {
		display: flex;
		align-items: center;
		position: relative;
		gap: 0.6em;
	}
	.search-input {
		width: 200px;
		max-width: 50vw;
		padding: 0.36em 0.7em;
		font-size: 1em;
		border-radius: 11px;
		border: 1.3px solid #e7e7f6;
		background: #fdfdff;
		color: #232344;
		font-weight: 500;
		margin-right: 0.2em;
		box-shadow: 0 1px 8px #ececec60;
		outline: none;
		transition:
			border 0.13s,
			background 0.13s,
			box-shadow 0.13s;
	}
	.search-input:focus {
		border: 1.3px solid var(--cibubble-red);
		background: #fff6f5;
		box-shadow: 0 2px 14px #fd2b2330;
	}
	.search-toggle {
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		padding: 0.15em;
		border-radius: 50%;
		transition: background 0.13s;
	}
	.search-toggle:hover,
	.search-toggle:focus-visible {
		background: var(--cibubble-red-soft);
	}

	/* --- ACTIVE SORT HIGHLIGHT (DROPDOWN ITEMS, NOT TOP-LEVEL BUTTONS) --- */
	.active-sort-option {
		font-weight: 700;
		color: var(--cibubble-red);
		border-radius: 7px;
	}

	/* --- RESPONSIVE SQUEEZE --- */
	@media (max-width: 900px) {
		.controls-bar {
			gap: 0.6em;
			padding: 0.7em 0.7em;
		}
		.dropdown-btn,
		.hide-watched-btn {
			font-size: 0.96em;
			padding: 0.18em 0.33em;
		}
		.dropdown-content {
			min-width: 98px;
			font-size: 0.97em;
			padding: 0.4em 0.3em 0.4em 0.3em;
		}
		.search-input {
			width: 98px;
			font-size: 0.97em;
		}
	}
	@media (max-width: 650px) {
		.controls-bar {
			gap: 0.25em;
			padding: 0.21em 0.03em;
			margin: 0.3em 0.02em 0.5em 0.02em;
		}
	}
</style>
