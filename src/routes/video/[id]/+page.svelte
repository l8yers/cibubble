<script>
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user.js';
	import SideBar from '$lib/components/player/SideBar.svelte';
	import PlayerVideoBox from '$lib/components/player/PlayerVideoBox.svelte';
	import AddToMyChannelsButton from '$lib/components/player/AddToMyChannelsButton.svelte';
	import PlayerMetaRow from '$lib/components/player/PlayerMetaRow.svelte';
	import ChannelTagsBlock from '$lib/components/player/ChannelTagsBlock.svelte';
	import TagModal from '$lib/components/player/TagModal.svelte';
	import MobileSuggestionsPanel from '$lib/components/player/MobileSuggestionsPanel.svelte';
	import * as utils from '$lib/utils/utils.js';
	import { goto } from '$app/navigation';
	import { autoplay } from '$lib/stores/autoplay.js';

	let video = null;
	let loading = true;
	let suggestions = [];
	let playlistTitle = '';
	let autoplayValue = true;
	let showSuggestionsPanel = false;
	let isMobile = false;

	const unsubscribe = autoplay.subscribe((val) => (autoplayValue = val));
	let savingChannel = false;
	let isChannelSaved = false;

	// Tag modal state/logic
	let showTagModal = false;
	let newTag = '';
	let tagAdding = false;
	let tagAddError = '';
	let tagSuccess = false;
	let tagSuccessTimeout = null;
	let confirmStep = false;
	let allTags = [];
	let tagCloudLoading = false;

	$: id = $page.params.id;
	$: if (id) initializePlayer();

	onMount(() => {
		const check = () => (isMobile = window.innerWidth <= 800);
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
		if (tagSuccessTimeout) clearTimeout(tagSuccessTimeout);
	});

	function closeTagModal() {
		showTagModal = false;
		confirmStep = false;
		newTag = '';
		tagAddError = '';
		tagAdding = false;
	}

async function loadTagCloud() {
  tagCloudLoading = true;
  const { data, error } = await supabase.rpc('get_popular_tags');
  allTags = (data || []).map(t => t.tag).filter(Boolean);
  tagCloudLoading = false;
}

	function openTagModal() {
		showTagModal = true;
		tagAddError = '';
		newTag = '';
		confirmStep = false;
		loadTagCloud();
	}

	async function initializePlayer() {
		loading = true;
		video = null;
		suggestions = [];
		playlistTitle = '';
		isChannelSaved = false;

		const { data: vid } = await supabase
			.from('videos')
			.select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
			.eq('id', id)
			.maybeSingle();
		video = vid;
		loading = false;
		if (!video) return;
		await fetchSuggestions();
		if ($user && video?.channel_id) checkIfChannelSaved();
	}

	async function fetchSuggestions() {
		if (!video) return;
		if (video.playlist_id) {
			const { data: playlistVids } = await supabase
				.from('videos')
				.select('*, channel:channel_id(name), playlist:playlist_id(title)')
				.eq('playlist_id', video.playlist_id)
				.order('playlist_position', { ascending: true })
				.limit(50);
			suggestions = playlistVids || [];
			if (playlistVids && playlistVids[0]?.playlist?.title) {
				playlistTitle = playlistVids[0].playlist.title;
			}
		} else {
			const { data: sameChannel } = await supabase
				.from('videos')
				.select('*, channel:channel_id(name)')
				.eq('channel_id', video.channel_id)
				.neq('id', video.id)
				.limit(30);
			const { data: otherChannelsRaw } = await supabase
				.from('videos')
				.select('*, channel:channel_id(name)')
				.neq('channel_id', video.channel_id)
				.neq('id', video.id)
				.limit(400);

			function shuffle(arr) {
				return (arr || [])
					.map((v) => [Math.random(), v])
					.sort(([a], [b]) => a - b)
					.map(([, v]) => v);
			}
			const channelMap = {};
			for (const v of shuffle(otherChannelsRaw || [])) {
				if (!channelMap[v.channel_id]) channelMap[v.channel_id] = v;
			}
			const otherVids = Object.values(channelMap).slice(0, 23);
			let channelVids = shuffle(sameChannel || []).slice(0, 7);
			let suggestionsMixed = otherVids.slice();
			let insertIndexes = shuffle([...Array(Math.min(15, suggestionsMixed.length)).keys()]).slice(
				0,
				channelVids.length
			);
			insertIndexes.forEach((idx, i) => {
				let pos = Math.min(idx, suggestionsMixed.length);
				suggestionsMixed.splice(pos, 0, channelVids[i]);
			});
			suggestions = suggestionsMixed.slice(0, 30);
		}
	}

	async function checkIfChannelSaved() {
		if (!$user || !video?.channel_id) return;
		const { data } = await supabase
			.from('saved_channels')
			.select('channel_id')
			.eq('user_id', $user.id)
			.eq('channel_id', video.channel_id)
			.maybeSingle();
		isChannelSaved = !!data;
	}

	async function saveChannelToMyChannels() {
		if (!$user || !video?.channel_id) return;
		savingChannel = true;
		await supabase.from('saved_channels').upsert(
			{
				user_id: $user.id,
				channel_id: video.channel_id
			},
			{ onConflict: ['user_id', 'channel_id'] }
		);
		isChannelSaved = true;
		savingChannel = false;
	}

	function handlePlayNextVideo(event) {
		const nextId = event.detail;
		if (nextId) {
			goto(`/video/${nextId}`);
		}
	}

	// Colorful tag palette!
	const tagColors = [
		'#b5e0fa',
		'#ffdfab',
		'#c6f6d5',
		'#fcbad3',
		'#ffe066',
		'#b8b5ff',
		'#ffd6a5',
		'#f9f871',
		'#d0f4de',
		'#b4f8c8'
	];
	const tagTextColors = [
		'#235085',
		'#965200',
		'#236048',
		'#aa234b',
		'#7c6d10',
		'#413b7b',
		'#9e5d13',
		'#868017',
		'#226352',
		'#257055'
	];

	$: tagArray = Array.isArray(video?.channel?.tags)
		? video.channel.tags.map((t) => t.toLowerCase())
		: video?.channel?.tags
			? video.channel.tags
					.split(',')
					.map((t) => t.trim().toLowerCase())
					.filter(Boolean)
			: [];

	function tryAddTag() {
		tagAddError = '';
		let tag = newTag.trim().toLowerCase();
		if (!tag || tag.length < 2 || tag.length > 32) {
			tagAddError = 'Tags must be 2–32 characters.';
			return;
		}
		if (tagArray.some((t) => t === tag)) {
			tagAddError = 'That tag already exists.';
			return;
		}
		confirmStep = true;
	}

	async function handleAddTag() {
		tagAddError = '';
		tagAdding = true;
		try {
			let tag = newTag.trim().toLowerCase();
			let updatedTags = [...tagArray, tag];
			let tagsPayload = Array.isArray(video.channel.tags) ? updatedTags : updatedTags.join(',');

			// 1. Channel update only!
			let chRes = await supabase
				.from('channels')
				.update({ tags: tagsPayload })
				.eq('id', video.channel_id);
			if (chRes.error) throw chRes.error;

			// 2. Upsert for global tags table (optional, for tag cloud/autocomplete)
			let tRes = await supabase.from('tags').upsert([{ name: tag }], { onConflict: ['name'] });
			if (tRes.error) throw tRes.error;

			tagAdding = false;
			tagSuccess = true;
			closeTagModal();
			if (tagSuccessTimeout) clearTimeout(tagSuccessTimeout);
			tagSuccessTimeout = setTimeout(() => (tagSuccess = false), 1600);
			initializePlayer();
		} catch (err) {
			tagAddError = (err?.message || err) + ' (see console)';
			tagAdding = false;
			console.error('[DEBUG] Error in handleAddTag', err);
		}
	}

	function selectCloudTag(tag) {
		newTag = tag;
		tagAddError = '';
	}
	function setNewTagValue(val) {
		newTag = val;
		tagAddError = '';
	}
</script>

{#if loading}
	<div class="player-loading">Loading…</div>
{:else if !video}
	<div class="player-loading">Video not found.</div>
{:else}
	<div class="player-container">
		<div class="player-main-col">
			<PlayerVideoBox {video} user={$user} {suggestions} {autoplayValue} {handlePlayNextVideo} />
			  <div class="player-content">
			<div class="player-title-row">
				<div class="player-title">{video.title}</div>
{#if $user && video?.channel_id}
  <div class="add-to-channels-wrapper">
    <AddToMyChannelsButton
      {isChannelSaved}
      {savingChannel}
      {saveChannelToMyChannels}
    />
  </div>
{/if}
			</div>
			<PlayerMetaRow {video} {utils} />

			<ChannelTagsBlock
				{tagArray}
				{tagColors}
				{tagTextColors}
				user={$user}
				onAddClick={openTagModal}
			/>

			<TagModal
				show={showTagModal}
				{confirmStep}
				{newTag}
				{tagAdding}
				{tagAddError}
				{allTags}
				{tagColors}
				{tagTextColors}
				{tagCloudLoading}
				onClose={closeTagModal}
				onTryAdd={tryAddTag}
				onHandleAdd={handleAddTag}
				onEdit={() => (confirmStep = false)}
				onSelectCloudTag={selectCloudTag}
				setNewTag={setNewTagValue}
			/>

			{#if tagSuccess}
				<div class="tag-success">Tag added!</div>
			{/if}
			</div>

{#if isMobile}
  <button class="show-suggestions-btn" on:click={() => (showSuggestionsPanel = true)}>
    More videos like this
  </button>
  <MobileSuggestionsPanel
    open={showSuggestionsPanel}
    {video}
    onClose={() => (showSuggestionsPanel = false)}
  />
{/if}
		</div>
		<aside class="player-sidebar" style:display={isMobile ? 'none' : undefined}>
			<SideBar {video} />
		</aside>
	</div>
{/if}

<style>
	.player-container {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 2.5rem;
		max-width: 1550px;
		margin: 0 auto;
		height: 100vh;
		min-height: 100vh;
	}
	.player-main-col {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding: 2.3rem 0 1.2rem 0;
	}
	.player-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.2em;
		margin-bottom: 0.5em;
	}
	.player-title {
		font-size: 1.38rem;
		font-weight: 800;
		color: #1a1a1a;
		line-height: 1.21;
		overflow-wrap: anywhere;
		flex: 1 1 auto;
		min-width: 0;
		margin-bottom: 0.7em;
		margin-top: 0.5em;
	}
	.player-loading {
		text-align: center;
		margin-top: 3rem;
		color: #aaa;
		font-size: 1.1rem;
	}
	.player-sidebar {
		padding: 1.7rem 2px 1.3rem 2px;
	}
	.tag-success {
		color: #17b052;
		margin-top: 0.3em;
		font-weight: 600;
		font-size: 1.03em;
		letter-spacing: 0.02em;
	}

	/* ---- MOBILE STYLE ---- */
	@media (max-width: 800px) {
		.player-container {
			display: flex;
			flex-direction: column;
			gap: 0;
			max-width: 100vw;
			height: auto;
			min-height: 0;
			margin: 0;
			padding: 0;
		}
		.player-main-col {
			padding: 0.5rem 0.5rem 0 0.5rem;
			flex-direction: column;
			width: 100vw;
			max-width: 100vw;
		}
		.player-sidebar {
			display: none;
		}
		.player-title-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.2em;
			margin-bottom: 0.5em;
			width: 100%;
		}
		.player-title {
			font-size: 1.25rem;
			text-align: left;
			font-weight: 800;
			color: #181820;
			margin-bottom: 0.4em;
			margin-top: 0.4em;
			width: 100%;
		}
		/* Video box should be full width */
		.player-main-col > :first-child,
		.player-main-col video,
		.player-main-col iframe,
		.PlayerVideoBox {
			width: 100vw !important;
			max-width: 100vw !important;
			margin-left: -0.5rem;
			margin-right: -0.5rem;
			border-radius: 0;
			background: #000;
			box-shadow: none;
			min-height: 205px;
			aspect-ratio: 16/9;
		}
		/* Make action buttons and meta rows touch-friendly */
		.player-title-row button,
		.player-main-col .AddToMyChannelsButton,
		.player-main-col .PlayerMetaRow,
		.player-main-col .ChannelTagsBlock {
			width: 100%;
			min-height: 46px;
			font-size: 1.03rem;
			margin-bottom: 0.1rem;
			margin-top: 0;
		}
		.player-main-col .ChannelTagsBlock {
			flex-wrap: wrap;
			justify-content: flex-start;
			margin-bottom: 0.5rem;
			gap: 0.35rem;
		}
		/* Description block */
		.player-main-col .player-desc {
			font-size: 1.03rem;
			color: #23233b;
			padding: 0.6em 0 0.9em 0;
			margin: 0 0 0.7em 0;
			line-height: 1.5;
			text-align: left;
			background: none;
			border: none;
		}
		/* Comments, next video, etc */
		.player-main-col .view-comments,
		.player-main-col .suggested-videos-block {
			width: 100vw;
			margin-left: -0.5rem;
			margin-right: -0.5rem;
			border-radius: 0;
			font-size: 1.09rem;
		}
		/* Suggestions button for mobile */
		.show-suggestions-btn {
			width: 100%;
			padding: 1.1em 0;
			background: #fff;
			border: none;
			border-top: 1px solid #e5e5e9;
			font-size: 1.11em;
			font-weight: 700;
			color: #1a1a2f;
			box-shadow: 0 0.5px 7px #0002;
			cursor: pointer;
			position: sticky;
			bottom: 0;
			z-index: 1001;
		}
	}
	@media (max-width: 800px) {
  .player-container {
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100vw !important;
    width: 100vw !important;
  }
  .player-main-col {
    padding: 0 !important;
    margin: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
  }
  body, html {
    margin: 0 !important;
    padding: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
    background: #000 !important; /* optional, helps see the player edge */
  }
    .player-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #23243a;      /* dark, but soft—not full black */
    letter-spacing: 0.01em;
    line-height: 1.2;
    margin-top: 0.25em;
    margin-bottom: 0.5em;
    text-align: left;
    text-shadow: 0 1px 0 #fff1, 0 0.5px 0 #fff1; /* subtle softening, optional */
    /* Remove if you don't like text-shadow look */
  }
    .player-content {
    padding: 0.8rem 1.1rem 0.5rem 1.1rem;
    /* or adjust as you like, e.g. margin if you prefer */
  }
  .show-suggestions-btn {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 56px;
    background: #fff;
    border: none;
    font-size: 1.1em;
    font-weight: 700;
    color: #232349;
    box-shadow: 0 -2px 16px #0002;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid #e5e5ef;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: background 0.13s;
  }
  .show-suggestions-btn:active {
    background: #f7f8fa;
  }
}
@media (max-width: 800px) {
  .add-to-channels-wrapper {
    display: none !important;
  }
}




</style>
