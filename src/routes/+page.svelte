<script>
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import VideoGrid from '$lib/components/VideoGrid.svelte';
	import SortBar from '$lib/components/SortBar.svelte';
	import * as utils from '$lib/utils.js';
	import '../app.css';

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

	import { writable, get } from 'svelte/store';
	import { filtersToQuery, queryToFilters } from '$lib/utils/filters.js';
	import { updateUrlFromFilters } from '$lib/utils/url.js';

	// --- NEW: Saved Channels imports ---
	import { user } from '$lib/stores/user.js';
	import { userChannels } from '$lib/stores/userChannels.js';
	import { getUserSavedChannels } from '$lib/api/userChannels.js';

	const PAGE_SIZE = 50;
	const videos = writable([]);
	const loading = writable(false);
	const errorMsg = writable('');
	const hasMore = writable(true);
	const pageNum = writable(1);

	let searchOpen = false;
	let sentinel;
	let observerInstance;

	const levels = [
		{ value: 'easy', label: 'Easy' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' }
	];
	const validLevels = new Set(levels.map((l) => l.value));
	const sortChoices = [
		{ value: 'random', label: 'Random' },
		{ value: 'short', label: 'Short' },
		{ value: 'long', label: 'Long' },
		{ value: 'new', label: 'New' },
		{ value: 'old', label: 'Old' }
	];
	let countryOptions = [
		'Spain', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Various', 'Peru', 'Guatemala',
		'Uruguay', 'Dominican Republic', 'Venezuela', 'Costa Rica', 'Cuba', 'Ecuador',
		'Paraguay', 'Panama', 'Canary Islands', 'Puerto Rico', 'Equatorial Guinea',
		'Latin America'
	].sort();
	let tagOptions = [
	  '80s',
	  'acting',
	  'animal',
	  'animated stories',
	  'anthropology',
	  'ants',
	  'archeology',
	  'architecture',
	  'art',
	  'art history',
	  'astronomy',
	  'av',
	  'baseball',
	  'basketball',
	  'boardgames',
	  'books',
	  'books, myths, legends',
	  'boxing',
	  'boxing history',
	  'business',
	  'business scandals',
	  'calligraphy',
	  'caravan',
	  'challenge',
	  'challenges',
	  'chat',
	  'chess',
	  "children's history",
	  "children's science",
	  "children's stories",
	  'chinese grammar',
	  'climbing',
	  'coffee',
	  'comedy',
	  'cooking',
	  'crafts',
	  'creepy',
	  'creepy facts',
	  'critiques',
	  'crochet',
	  'culture',
	  'current events',
	  'dallas cowboys',
	  'debates',
	  'design',
	  'dramatized stories',
	  'drawing',
	  'dubbed show',
	  'dubbing industry',
	  'economy',
	  'education',
	  'facts',
	  'film',
	  'finance',
	  'fitness',
	  'food',
	  'food reviews',
	  'for learners',
	  'futbol',
	  'futbol discussion',
	  'games',
	  'gameshow',
	  'gaming',
	  'gardening',
	  'geography',
	  'geoguesser',
	  'graphic design',
	  'greek myths',
	  'guitars',
	  'harry potter disc',
	  'health',
	  'hip hop',
	  'history',
	  'hobby',
	  'home design',
	  "how it's made",
	  'human mind',
	  'humanities',
	  'interviews',
	  'journaling',
	  'journalist',
	  "kid's show",
	  'kids',
	  'kpop',
	  'language learning',
	  'law',
	  'life',
	  'life in canada',
	  'life in china',
	  'life in colombia',
	  'life in cuba',
	  'life in guatemala',
	  'life in iceland',
	  'life in japan',
	  'life in korea',
	  'life in mexico',
	  'life in spain',
	  'life in uruguay',
	  'lifestyle',
	  'lifestyle in australia',
	  'lifestyle in germany',
	  'lifestyle in japan',
	  'lifestyle in mexico city',
	  'literature',
	  'makeup',
	  'manufacturing',
	  'martial arts',
	  'math',
	  'meditation',
	  'mental health',
	  'mindfullness',
	  'minecraft',
	  'minimalism',
	  'montessori',
	  'movie',
	  'movie discussion',
	  'movie reviews',
	  'music',
	  'music theory',
	  'mystery',
	  'mythology',
	  'nasa',
	  'native movie',
	  'native show',
	  'native story podcast',
	  'nature',
	  'nba history',
	  'news',
	  'organizing',
	  'paranormal',
	  'personal developement',
	  'personal development',
	  'philosophy',
	  'photography',
	  'physics',
	  'politics',
	  'pop culture',
	  'positive affirmations',
	  'product testing',
	  'psychology',
	  'psycology',
	  'pyschology',
	  'random',
	  'random facts',
	  're sales',
	  'reality competition',
	  'reality show',
	  'relationships',
	  'religion',
	  'scary stories',
	  'science',
	  'skiing',
	  'sobriety',
	  'social experiment',
	  'sports',
	  'stories',
	  'storytelling',
	  'street interviews',
	  'survival',
	  'tarot',
	  'taylor swift breakdown',
	  'tech',
	  'travel',
	  'true crime',
	  'tv ads',
	  'video essays',
	  'video game reviews',
	  'videogame discussion',
	  'videogames',
	  'weather',
	  'writing tips',
	  'yoga'
	].sort();

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

	async function fetchVideos({ append = false } = {}) {
		loading.set(true);
		errorMsg.set('');
		const query = new URLSearchParams({
			page: get(pageNum),
			pageSize: PAGE_SIZE,
			levels: Array.from(get(selectedLevels)).join(','),
			tags: Array.from(get(selectedTags)).join(','),
			country: get(selectedCountry),
			channel: get(selectedChannel),
			playlist: get(selectedPlaylist),
			sort: get(sortBy),
			search: get(searchTerm)
		});
		const res = await fetch(`/api/videos?${query}`);
		if (!res.ok) {
			const errText = await res.text();
			errorMsg.set('Error loading videos: ' + errText);
			loading.set(false);
			return;
		}
		const { videos: fetched, hasMore: more } = await res.json();
		if (append) {
			videos.update((vs) => [...vs, ...fetched]);
		} else {
			videos.set(fetched);
		}
		hasMore.set(more);
		loading.set(false);
	}

	async function loadMore() {
		if (!get(hasMore) || get(loading)) return;
		pageNum.update((p) => p + 1);
		await fetchVideos({ append: true });
	}

	function resetAndFetch() {
		pageNum.set(1);
		fetchVideos({ append: false });
	}

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
	function filterByChannel(channelId) {
		selectedChannel.set(channelId);
		updateUrlFromFilters({ selectedLevels, selectedTags, selectedCountry, selectedChannel, selectedPlaylist, sortBy, searchTerm, get });
		resetAndFetch();
	}
	function clearChannelFilter() {
		selectedChannel.set('');
		updateUrlFromFilters({ selectedLevels, selectedTags, selectedCountry, selectedChannel, selectedPlaylist, sortBy, searchTerm, get });
		resetAndFetch();
	}
	function filterByPlaylist(playlistTitle) {
		selectedPlaylist.set(playlistTitle);
		updateUrlFromFilters({ selectedLevels, selectedTags, selectedCountry, selectedChannel, selectedPlaylist, sortBy, searchTerm, get });
		resetAndFetch();
	}
	function clearPlaylistFilter() {
		selectedPlaylist.set('');
		updateUrlFromFilters({ selectedLevels, selectedTags, selectedCountry, selectedChannel, selectedPlaylist, sortBy, searchTerm, get });
		resetAndFetch();
	}

	let firstLoad = true;
	let lastQuery = '';

	onMount(() => {
		const filters = queryToFilters(window.location.search);
		const safeLevels = new Set(Array.from(filters.levels).filter((lvl) => validLevels.has(lvl)));
		selectedLevels.set(
			safeLevels.size ? safeLevels : new Set(['easy', 'intermediate', 'advanced'])
		);
		selectedTags.set(filters.tags.size ? filters.tags : new Set());
		selectedCountry.set(filters.country || '');
		selectedChannel.set(filters.channel || '');
		selectedPlaylist.set(filters.playlist || '');
		sortBy.set(filters.sort || 'new');
		searchTerm.set(filters.search || '');

		resetAndFetch();
		firstLoad = false;
	});

	$: if (!firstLoad && $page.url.search !== lastQuery) {
		lastQuery = $page.url.search;
		const filters = queryToFilters($page.url.search);
		const safeLevels = new Set(Array.from(filters.levels).filter((lvl) => validLevels.has(lvl)));
		selectedLevels.set(
			safeLevels.size ? safeLevels : new Set(['easy', 'intermediate', 'advanced'])
		);
		selectedTags.set(filters.tags.size ? filters.tags : new Set());
		selectedCountry.set(filters.country || '');
		selectedChannel.set(filters.channel || '');
		selectedPlaylist.set(filters.playlist || '');
		sortBy.set(filters.sort || 'new');
		searchTerm.set(filters.search || '');

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
  </div> <!-- <-- close sortbar-container here! -->

  {#if $selectedChannel}
    <div class="chip-info">
      <span>
        <b>Filtered by channel:</b>
        {#if $videos.length > 0}
          {$videos[0].channel?.name ?? $videos[0].channel_name ?? $selectedChannel}
        {:else}
          {$selectedChannel}
        {/if}
      </span>
      <button on:click={clearChannelFilter} class="clear-btn clear-btn--blue">✕ Clear</button>
    </div>
  {/if}
  {#if $selectedPlaylist}
    <div class="chip-warning">
      <span>
        <b>Filtered by playlist:</b>
        {#if $videos.length > 0}
          {$videos[0].playlist?.title ?? $selectedPlaylist}
        {:else}
          {$selectedPlaylist}
        {/if}
      </span>
      <button on:click={clearPlaylistFilter} class="clear-btn clear-btn--purple">✕ Clear</button>
    </div>
  {/if}
  {#if $loading && $videos.length === 0}
    <p class="loading-more">Loading videos…</p>
  {:else if $errorMsg}
    <div class="error">{$errorMsg}</div>
  {:else if !$loading && $videos.length === 0}
    <div class="loading-more text-muted">No videos match your filters.</div>
  {:else}
    <VideoGrid
      videos={filteredVideos}
      getBestThumbnail={utils.getBestThumbnail}
      difficultyColor={utils.difficultyColor}
      difficultyLabel={utils.difficultyLabel}
      formatLength={utils.formatLength}
      {filterByChannel}
      {filterByPlaylist}
    />
    {#if $hasMore && $sortBy !== 'random'}
      <div bind:this={sentinel} style="height: 2em;"></div>
    {/if}
    {#if $hasMore && $sortBy === 'random'}
      <button
        class="load-more-btn"
        on:click={loadMore}
        disabled={$loading}
        style="margin: 2em auto; display: block;"
      >
        {#if $loading}Loading...{/if}
        {#if !$loading}Load More{/if}
      </button>
    {/if}
  {/if}
</div>

<style>
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
