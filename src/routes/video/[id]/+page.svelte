<script>
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user.js';
	import SideBar from '$lib/components/player/SideBar.svelte';
	import PlayerVideoBox from '$lib/components/player/PlayerVideoBox.svelte';
	import PlayerMetaRow from '$lib/components/player/PlayerMetaRow.svelte';
	import ChannelTagsBlock from '$lib/components/player/ChannelTagsBlock.svelte';
	import TagModal from '$lib/components/player/TagModal.svelte';
	import * as utils from '$lib/utils/utils.js';
	import { goto } from '$app/navigation';
	import { autoplay } from '$lib/stores/autoplay.js';

	let video = null;
	let loading = true;
	let suggestions = [];
	let playlistTitle = '';
	let autoplayValue = true;
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
		const { data } = await supabase.rpc('get_popular_tags');
		allTags = (data || []).map((t) => t.tag).filter(Boolean);
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

	const tagColors = [
		'#b5e0fa', '#ffdfab', '#c6f6d5', '#fcbad3', '#ffe066',
		'#b8b5ff', '#ffd6a5', '#f9f871', '#d0f4de', '#b4f8c8'
	];
	const tagTextColors = [
		'#235085', '#965200', '#236048', '#aa234b', '#7c6d10',
		'#413b7b', '#9e5d13', '#868017', '#226352', '#257055'
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

			let chRes = await supabase
				.from('channels')
				.update({ tags: tagsPayload })
				.eq('id', video.channel_id);
			if (chRes.error) throw chRes.error;

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
				<!-- All meta info block handled in PlayerMetaRow -->
				<PlayerMetaRow
					{video}
					{utils}
					user={$user}
					isChannelSaved={isChannelSaved}
					savingChannel={savingChannel}
					saveChannelToMyChannels={saveChannelToMyChannels}
				/>

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
				<div class="mobile-suggestions-block">
					<SideBar {video} />
				</div>
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
	margin-top: 2rem;
	height: 100vh;
	min-height: 100vh;
	overflow: hidden;
	width: 100vw;
}

.player-main-col {
	display: flex;
	flex-direction: column;
	overflow: hidden;
	padding: 0;
}

.player-main-col > :first-child,
.player-main-col video,
.player-main-col iframe,
.PlayerVideoBox {
	margin: 0 !important;
	padding: 0 !important;
	border-radius: 0;
	background: #000;
	box-shadow: none;
	width: 100%;
	max-width: 100%;
	display: block;
}

.player-content,
.player-meta-row,
.mobile-suggestions-block {
	margin-left: 0;
	margin-right: 0;
}

.player-loading {
	text-align: center;
	margin-top: 3rem;
	color: #aaa;
	font-size: 1.1rem;
}

.player-sidebar {
	padding: 0rem 2px 1.3rem 2px;
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
		width: 100vw;
		height: auto;
		min-height: 0;
		margin: 0;
		padding: 0;
	}
	.player-main-col {
		padding: 0;
		margin: 0;
		width: 100vw;
		max-width: 100vw;
	}
	.player-sidebar {
		display: none;
	}
	.player-content,
	.player-meta-row,
	.mobile-suggestions-block {
		margin-left: 0.55rem;
		margin-right: 0.55rem;
	}
	.tag-success {
		font-size: 0.91rem !important;
	}
	.mobile-suggestions-block {
		flex: 1 1 0;
		overflow-y: auto;
		min-height: 0;
		max-height: 100%;
		-webkit-overflow-scrolling: touch;
	}
}

@media (max-width: 800px) {
	html,
	body {
		height: 100vh;
		overflow: hidden;
		position: fixed;
		width: 100vw;
	}
	.player-container {
		height: 100vh;
		min-height: 100vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.player-main-col {
		flex: 1 1 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-height: 0;
	}
}
</style>
