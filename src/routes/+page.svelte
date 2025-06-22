<script>
	// --- Svelte/SvelteKit core ---
	import { onMount, onDestroy } from 'svelte';
	import { writable, get } from 'svelte/store';
	import { page } from '$app/stores';

	// --- UI Components ---
	import VideoGrid from '$lib/components/home/VideoGrid.svelte';
	import SortBar from '$lib/components/home/SortBar.svelte';
	import FilterChip from '$lib/components/home/FilterChip.svelte';
	import LoadingSpinner from '$lib/components/home/LoadingSpinner.svelte';
	import ErrorMessage from '$lib/components/home/ErrorMessage.svelte';

	// --- Mobile UI ---
	import MobileMenuBar from '$lib/components/mobile/MobileMenuBar.svelte';
	import SortDropdown from '$lib/components/mobile/SortDropdown.svelte';
	import FullPageFilter from '$lib/components/mobile/FullPageFilter.svelte';

	// --- Utility ---
	import * as utils from '$lib/utils/utils.js';
	import { filtersToQuery, applyFiltersFromQueryString } from '$lib/utils/filters.js';
	import { updateUrlFromFilters } from '$lib/utils/url.js';

	// --- State stores ---
	import {
		selectedChannel,
		selectedPlaylist,
		selectedLevels,
		sortBy,
		selectedCountry,
		selectedTags,
		hideWatched,
		watchedIds,
		searchTerm
	} from '$lib/stores/videos.js';
	import {
		LEVELS,
		VALID_LEVELS,
		SORT_CHOICES,
		COUNTRY_OPTIONS,
		TAG_OPTIONS
	} from '$lib/constants.js';
	import { user } from '$lib/stores/user.js';
	import { userChannels } from '$lib/stores/userChannels.js';
	import { getUserSavedChannels } from '$lib/api/userChannels.js';

	// --- Video API ---
	import { fetchVideos as fetchVideosFromAPI } from '$lib/api/videos.js';

	// --- Mobile switching ---
	const isMobile = writable(false);
	let mounted = false;
	let showSortDropdown = false;
	let showFullPageFilter = false;
	let showMobileSearch = false;

	// Responsive watcher
	onMount(() => {
		mounted = true;
		function check() {
			isMobile.set(window.innerWidth <= 700);
		}
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	});

	// --- Local grid state ---
	const PAGE_SIZE = 50;
	const videos = writable([]);
	const loading = writable(false);
	const errorMsg = writable('');
	const hasMore = writable(true);
	const pageNum = writable(1);

	let searchOpen = false;
	let sentinel;
	let observerInstance;

	const levels = LEVELS;
	const validLevels = VALID_LEVELS;
	const sortChoices = SORT_CHOICES;
	let countryOptions = COUNTRY_OPTIONS;
	let tagOptions = TAG_OPTIONS;

	function setupObserver() {
		if (observerInstance) {
			observerInstance.disconnect();
			observerInstance = null;
		}
		if (sentinel && get(hasMore) && get(sortBy) !== 'random') {
			observerInstance = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting && get(hasMore) && !get(loading) && get(sortBy) !== 'random') {
							loadMore();
						}
					});
				},
				{ root: null, rootMargin: '0px', threshold: 0.1 }
			);
			observerInstance.observe(sentinel);
		}
	}
	$: if (sentinel) setupObserver();
	onDestroy(() => {
		if (observerInstance) observerInstance.disconnect();
	});

	// --- fetchVideos, loadMore, resetAndFetch ---
	async function fetchVideos({ append = false } = {}) {
		loading.set(true);
		errorMsg.set('');

		try {
			const { videos: fetched, hasMore: more } = await fetchVideosFromAPI({
				page: get(pageNum),
				pageSize: PAGE_SIZE,
				levels: Array.from(get(selectedLevels)),
				tags: Array.from(get(selectedTags)),
				country: get(selectedCountry),
				channel: get(selectedChannel),
				playlist: get(selectedPlaylist),
				sort: get(sortBy),
				search: get(searchTerm)
			});
			if (append) {
				videos.update((vs) => [...vs, ...fetched]);
			} else {
				videos.set(fetched);
			}
			hasMore.set(get(sortBy) === 'random' ? true : more);
		} catch (err) {
			errorMsg.set(err.message || 'Unknown error loading videos');
		} finally {
			loading.set(false);
		}
	}

	async function loadMore() {
		if (get(loading)) return;
		if (get(sortBy) !== 'random') {
			pageNum.update((p) => p + 1);
		}
		await fetchVideos({ append: true });
	}

	function resetAndFetch() {
		pageNum.set(1);
		fetchVideos({ append: false });
	}

	// --- Desktop SortBar handler ---
	function handleSortBarChange(e) {
		const rawLevels = e.detail.selectedLevels;
		const safeLevels = new Set(Array.from(rawLevels).filter((lvl) => validLevels.has(lvl)));
		selectedLevels.set(safeLevels);
		selectedTags.set(new Set(e.detail.selectedTags));
		sortBy.set(e.detail.sortBy);
		selectedCountry.set(e.detail.selectedCountry);
		hideWatched.set(e.detail.hideWatched);
		searchTerm.set(e.detail.searchTerm);
		searchOpen = e.detail.searchOpen;
		selectedChannel.set(e.detail.selectedChannel ?? '');
		updateUrlFromFilters({
			selectedLevels,
			selectedTags,
			selectedCountry,
			selectedChannel,
			selectedPlaylist,
			sortBy,
			searchTerm,
			get
		});
		resetAndFetch();
	}

	// --- Mobile handlers ---
	function handleMobileSortSelect(val) {
		sortBy.set(val);
		showSortDropdown = false;
		resetAndFetch();
	}
	function handleMobileFilterApply(e) {
		const detail = e.detail || {};
		selectedLevels.set(new Set(detail.selectedLevels));
		selectedTags.set(new Set(detail.selectedTags));
		selectedCountry.set(detail.selectedCountry || '');
		selectedChannel.set(detail.selectedChannel || '');
		hideWatched.set(detail.hideWatched || false);
		showFullPageFilter = false;
		resetAndFetch();
	}
	function handleMobileSearch(e) {
		searchTerm.set(e.target.value);
		resetAndFetch();
	}
	function handleMobileSearchInput(val) {
		searchTerm.set(val);
		// Optionally, auto-fetch on every input, or debounce for prod
		resetAndFetch();
	}
	function handleMobileSearchSubmit(val) {
		searchTerm.set(val);
		resetAndFetch();
		// Optionally, close search on submit (not strictly required)
		// showMobileSearch = false;
	}

	// --- Filter Chips ---
	function filterByChannel(channelId) {
		selectedChannel.set(channelId);
		updateUrlFromFilters({
			selectedLevels,
			selectedTags,
			selectedCountry,
			selectedChannel,
			selectedPlaylist,
			sortBy,
			searchTerm,
			get
		});
		resetAndFetch();
	}
	function clearChannelFilter() {
		selectedChannel.set('');
		updateUrlFromFilters({
			selectedLevels,
			selectedTags,
			selectedCountry,
			selectedChannel,
			selectedPlaylist,
			sortBy,
			searchTerm,
			get
		});
		resetAndFetch();
	}
	function filterByPlaylist(playlistId) {
		selectedPlaylist.set(playlistId);
		updateUrlFromFilters({
			selectedLevels,
			selectedTags,
			selectedCountry,
			selectedChannel,
			selectedPlaylist,
			sortBy,
			searchTerm,
			get
		});
		resetAndFetch();
	}
	function clearPlaylistFilter() {
		selectedPlaylist.set('');
		updateUrlFromFilters({
			selectedLevels,
			selectedTags,
			selectedCountry,
			selectedChannel,
			selectedPlaylist,
			sortBy,
			searchTerm,
			get
		});
		resetAndFetch();
	}

	// --- On mount: apply filters from URL and load initial videos ---
	let firstLoad = true;
	let lastQuery = '';

	onMount(() => {
		applyFiltersFromQueryString($page.url.search);
		resetAndFetch();
		firstLoad = false;
	});

	// --- Reactively reload videos if URL query changes ---
	$: currentQuery = $page.url.search;
	$: if (!firstLoad && currentQuery !== lastQuery) {
		lastQuery = currentQuery;
		applyFiltersFromQueryString(currentQuery);
		resetAndFetch();
	}

	$: filteredVideos = $hideWatched ? $videos.filter((v) => !$watchedIds.has(v.id)) : $videos;

	$: if ($user) {
		getUserSavedChannels($user.id)
			.then((chs) => userChannels.set(chs))
			.catch(() => userChannels.set([]));
	} else {
		userChannels.set([]);
	}
</script>

<div class="page-container">
	<!-- Desktop bar -->
	{#if mounted && !$isMobile}
		<div class="sortbar-container">
			<SortBar
				{levels}
				{sortChoices}
				{countryOptions}
				{tagOptions}
				selectedLevels={Array.from($selectedLevels)}
				sortBy={$sortBy}
				selectedCountry={$selectedCountry}
				selectedTags={Array.from($selectedTags)}
				hideWatched={$hideWatched}
				searchTerm={$searchTerm}
				{searchOpen}
				myChannels={$userChannels}
				selectedChannel={$selectedChannel}
				on:change={handleSortBarChange}
			/>
		</div>
	{/if}

	<!-- Shared grid container for chips & grid -->
	<div class="content-container">
		{#if ($selectedChannel && $selectedChannel !== '__ALL__') || $selectedPlaylist}
			<div class="chips-row">
				{#if $selectedChannel && $selectedChannel !== '__ALL__'}
					<FilterChip
						type="info"
						label="Filtered by channel"
						value={$videos.length > 0
							? ($videos[0].channel?.name ?? $videos[0].channel_name ?? $selectedChannel)
							: $selectedChannel}
						onClear={clearChannelFilter}
						clearClass="clear-btn--blue"
					/>
				{/if}
				{#if $selectedPlaylist}
					<FilterChip
						type="warning"
						label="Filtered by playlist"
						value={$videos.length > 0
							? ($videos[0].playlist?.title ?? $selectedPlaylist)
							: $selectedPlaylist}
						onClear={clearPlaylistFilter}
						clearClass="clear-btn--purple"
					/>
				{/if}
			</div>
		{/if}

		{#if $videos.length > 0}
			<VideoGrid
				videos={filteredVideos}
				getBestThumbnail={utils.getBestThumbnail}
				difficultyColor={utils.difficultyColor}
				difficultyLabel={utils.difficultyLabel}
				formatLength={utils.formatLength}
				{filterByChannel}
				{filterByPlaylist}
				query={$page.url.search}
			/>
			{#if $sortBy === 'random'}
				<button
					class="load-more-btn"
					on:click={loadMore}
					disabled={$loading}
					style="margin: 2em auto; display: block;"
				>
					{#if $loading}Loading...{/if}
					{#if !$loading}Load More{/if}
				</button>
			{:else if $hasMore}
				<div bind:this={sentinel} style="height: 2em;"></div>
			{/if}
		{/if}
	</div>

	<!-- Centered loading/error/no-results messages -->
	<div class="center-content">
		{#if $loading && $videos.length === 0}
			<LoadingSpinner />
		{:else if $errorMsg}
			<ErrorMessage message={$errorMsg} />
		{:else if !$loading && $videos.length === 0}
			<div class="loading-more text-muted">No videos match your filters.</div>
		{/if}
	</div>
	<!-- Mobile menu and modals -->
	{#if mounted && $isMobile}
		<MobileMenuBar
			openSearch={showMobileSearch}
			searchValue={$searchTerm}
			on:showSearch={() => (showMobileSearch = true)}
			on:closeSearch={() => (showMobileSearch = false)}
			on:searchInput={(e) => handleMobileSearchInput(e.detail)}
			on:submitSearch={(e) => handleMobileSearchSubmit(e.detail)}
			on:sort={() => (showSortDropdown = true)}
			on:filter={() => (showFullPageFilter = true)}
		/>
		<SortDropdown
			open={showSortDropdown}
			{sortChoices}
			selectedSort={$sortBy}
			onSelect={handleMobileSortSelect}
			onClose={() => (showSortDropdown = false)}
		/>
		<FullPageFilter
			open={showFullPageFilter}
			{levels}
			selectedLevels={Array.from($selectedLevels)}
			{countryOptions}
			selectedCountry={$selectedCountry}
			{tagOptions}
			selectedTags={Array.from($selectedTags)}
			myChannels={$userChannels}
			selectedChannel={$selectedChannel}
			on:apply={handleMobileFilterApply}
			on:close={() => (showFullPageFilter = false)}
		/>
	{/if}
</div>

<style>
	.page-container {
		width: 100%;
	}
	.sortbar-container {
		margin-bottom: 0.5em;
	}
	.content-container {
		max-width: 1700px;
		margin: 0 auto;
	}
	.chips-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.7em;
		margin: 0 0 1em 0;
		justify-content: flex-start;
		padding-left: 2rem;
		padding-right: 2rem;
	}
	@media (max-width: 1200px) {
		.content-container {
			max-width: 1100px;
		}
		.chips-row {
			padding-left: 2rem;
			padding-right: 2rem;
		}
	}
	@media (max-width: 900px) {
		.content-container {
			max-width: 700px;
		}
		.chips-row {
			padding-left: 2rem;
			padding-right: 2rem;
		}
	}
	@media (max-width: 600px) {
		.content-container {
			max-width: 420px;
		}
		.chips-row {
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}
	.center-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin: 1em 0 2em 0;
		width: 100%;
		text-align: center;
		min-height: 48px;
	}
	.center-content > * {
		margin-bottom: 0.75em;
	}
	.loading-more {
		font-size: 1.15em;
		color: #555;
		margin: 2em 0 0 0;
		text-align: center;
	}
	.text-muted {
		color: #888;
	}
	.load-more-btn {
		padding: 0.9em 2.4em;
		font-size: 1.17em;
		background: #fafbff;
		border: 1.6px solid #d6d6ee;
		border-radius: 13px;
		box-shadow: 0 2px 12px #ececec80;
		font-weight: 700;
		cursor: pointer;
		margin: 2em auto 0 auto;
		transition: background 0.15s;
		display: block;
	}
	.load-more-btn:disabled {
		opacity: 0.66;
		cursor: not-allowed;
	}
</style>
