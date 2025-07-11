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
	import { TOP_TAGS, ALL_TAGS } from '$lib/constants/tags.js';

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
	let searchInputRef;

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

	function handleSetSort(val) {
		if (val === 'random') {
			emitChange({
				sortBy: 'random',
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
	function handleSearchSubmit(e) {
		e.preventDefault();
		if (searchTerm?.trim()) {
			emitChange({ searchTerm, searchOpen: false });
		}
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
</script>

<div class="cibubble-bar-container">
	{#if searchOpen}
		<div class="cibubble-search-overlay"></div>
		<form class="cibubble-bar cibubble-search-bar" on:submit|preventDefault={handleSearchSubmit}>
			<input
				class="search-full-input"
				bind:this={searchInputRef}
				type="text"
				placeholder="Search"
				autocomplete="off"
				value={searchTerm}
				on:input={(e) => handleSearchInput(e.target.value)}
				autofocus
				aria-label="Search videos"
			/>
			<button
				class="cibubble-search-x"
				type="button"
				title="Close search"
				on:click={handleToggleSearch}
				tabindex="0"
			>
				<X size={24} style="color:#18191a;" />
			</button>
			<button
				class="cibubble-search-submit"
				type="submit"
				title="Search"
				tabindex="0"
			>
				<Search size={23} style="color:#18191a;" />
			</button>
		</form>
	{:else}
		<div class="cibubble-bar controls-bar">
			<div class="controls-left">
				<!-- Sort Dropdown -->
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
				{#if !isTablet && !isSmallMobile}
					<!-- Tags Dropdown -->
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
								<div style="margin-bottom:0.7em;">
									<div class="dropdown-label" style="font-weight:700; font-size:1.01em;">Top Tags</div>
									{#each TOP_TAGS as tag}
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
									{#each ALL_TAGS as tag}
										{#if !TOP_TAGS.includes(tag)}
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
					<!-- Country Dropdown -->
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
					<!-- My Channels Dropdown (user only) -->
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
										{#each TOP_TAGS as tag}
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
										{#each ALL_TAGS as tag}
											{#if !TOP_TAGS.includes(tag)}
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
			</div>
			<div class="controls-right">
				{#if $user}
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
					<button
						class="search-toggle"
						title="Search"
						on:click={handleToggleSearch}
						aria-label="Search"
					>
						<Search size={22} style="color:#101720;" />
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
:root {
	--cibubble-red: #eb1000;
	--cibubble-red-soft: #fceaea;
	--cibubble-accent: #fff6f5;
	--cibubble-dark: #18191a;
	--cibubble-radius: 13px;
}

.cibubble-bar-container {
	width: 100%;
	max-width: 1920px;
	margin: 0 auto;
}

.cibubble-bar,
.controls-bar,
.cibubble-search-bar {
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
	min-height: 66px;
}

.cibubble-search-bar {
	background: #fafbfc !important;
	border: 1px solid #e0e3ea;
	z-index: 1003;
}

.search-full-input {
	flex: 1;
	font-size: 1.2em;
	padding: 0.38em 0.7em;
	border-radius: 9px;
	border: 1.3px solid #e0e3ea;
	background: #fafbfc;
	color: #232344;
	font-weight: 500;
	box-shadow: none;
	outline: none;
	transition:
		border 0.13s,
		background 0.13s;
	margin-right: 0.5em;
	height: 2.4em;
}

.search-full-input:focus {
	background: #f5f5f5;
	border: 1.3px solid #b2beb5;
}

.cibubble-search-x,
.cibubble-search-submit {
	background: none;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	padding: 0.22em 0.5em;
	border-radius: 8px;
	font-size: 1.1em;
	transition: background 0.13s;
}
.cibubble-search-x:hover,
.cibubble-search-submit:hover,
.cibubble-search-x:focus,
.cibubble-search-submit:focus {
	background: #f5f5f5;
}

.cibubble-search-overlay {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	width: 100vw;
	height: 100vh;
	z-index: 1001;
	background: rgba(40, 40, 50, 0.32);
	backdrop-filter: blur(4px) brightness(0.96);
	pointer-events: auto;
	transition: all 0.13s;
}

.controls-left {
	display: flex;
	align-items: center;
	gap: 1em;
}
.controls-right {
	display: flex;
	align-items: center;
	gap: 0.7em;
	margin-left: auto;
}
.dropdown { position: relative; min-width: 110px; }
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

.search-bar-container {
	display: flex;
	align-items: center;
	position: relative;
	gap: 0.6em;
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

.active-sort-option {
	font-weight: 700;
	color: var(--cibubble-red);
	border-radius: 7px;
}

@media (max-width: 900px) {
	.cibubble-bar,
	.controls-bar {
		gap: 0.6em;
		padding: 0.7em 0.7em;
		min-height: 56px;
	}
	.cibubble-search-bar {
		padding: 0.7em 0.7em;
		margin: 1.2em 0.7em 1em 0.7em;
		min-height: 56px;
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
	.search-full-input {
		font-size: 1em;
		padding: 0.18em 0.4em;
		height: 2em;
	}
}
@media (max-width: 650px) {
	.cibubble-bar,
	.controls-bar,
	.cibubble-search-bar {
		gap: 0.25em;
		padding: 0.21em 0.03em;
		margin: 0.3em 0.02em 0.5em 0.02em;
		min-height: 44px;
	}
	.search-full-input {
		font-size: 0.96em;
		padding: 0.12em 0.2em;
		height: 1.7em;
	}
}

</style>