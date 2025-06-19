<script>
	import { onDestroy } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user.js';
	import SideBar from '$lib/components/player/SideBar.svelte';
	import PlayerVideoBox from '$lib/components/player/PlayerVideoBox.svelte';
	import AddToMyChannelsButton from '$lib/components/player/AddToMyChannelsButton.svelte';
	import PlayerMetaRow from '$lib/components/player/PlayerMetaRow.svelte';
	import * as utils from '$lib/utils/utils.js';
	import { goto } from '$app/navigation';
	import { autoplay } from '$lib/stores/autoplay.js';

	let video = null;
	let loading = true;
	let suggestions = [];
	let playlistTitle = '';
	let autoplayValue = true;
	const unsubscribe = autoplay.subscribe((val) => (autoplayValue = val));

	let savingChannel = false;
	let isChannelSaved = false;

	// --- Tag Modal State and Logic ---
	let showTagModal = false;
	let newTag = '';
	let tagAdding = false;
	let tagAddError = '';
	let tagSuccess = false;
	let tagSuccessTimeout = null;
	let confirmStep = false;

	// Tag cloud
	let allTags = [];
	let tagCloudLoading = false;

	$: id = $page.params.id;
	$: if (id) initializePlayer();

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
		const { data } = await supabase.from('tags').select('name');
		allTags = (data || [])
			.map((t) => t.name)
			.filter(Boolean)
			.sort((a, b) => a.localeCompare(b));
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

		if ($user && video?.channel_id) {
			checkIfChannelSaved();
		}
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

	// Helper: get tags from channel, normalized
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
</script>

{#if loading}
	<div class="player-loading">Loading…</div>
{:else if !video}
	<div class="player-loading">Video not found.</div>
{:else}
	<div class="player-container">
		<div class="player-main-col">
			<PlayerVideoBox {video} user={$user} {suggestions} {autoplayValue} {handlePlayNextVideo} />
			<div class="player-title-row">
				<div class="player-title">{video.title}</div>
				{#if $user && video?.channel_id}
					<AddToMyChannelsButton {isChannelSaved} {savingChannel} {saveChannelToMyChannels} />
				{/if}
			</div>
			<PlayerMetaRow {video} {utils} />

			<!-- CHANNEL TAGS: COLOURFUL OUTPUT -->
			<div class="channel-tags-block">
				<div class="tags-row">
					<strong>Channel Tags:</strong>
					{#if tagArray.length}
						{#each tagArray as tag, i (tag)}
							<a
								class="tag-chip"
								href={`/?tags=${encodeURIComponent(tag)}`}
								style="background:{tagColors[i % tagColors.length]};color:{tagTextColors[
									i % tagTextColors.length
								]};">{tag}</a
							>
						{/each}
					{:else}
						<span class="no-tags">No tags yet.</span>
					{/if}
					<!-- Add tag button (plus sign) -->
					{#if $user}
						<button class="add-tag-btn" on:click={openTagModal} title="Add tag">+</button>
					{/if}
				</div>
			</div>
			<!-- END TAGS OUTPUT -->

			<!-- Tag Add Modal -->
			{#if showTagModal}
				<div class="modal-bg" on:click={closeTagModal}></div>
				<div class="modal-content" on:click|stopPropagation>
					<div class="modal-title">
						{!confirmStep ? 'Add or Select a Tag' : 'Confirm Tag Addition'}
					</div>
					{#if !confirmStep}
						<input
							class="tag-input"
							type="text"
							placeholder="Enter or select a tag…"
							bind:value={newTag}
							maxlength="32"
							autofocus
							on:keydown={(e) => e.key === 'Enter' && tryAddTag()}
							disabled={tagAdding}
						/>
						<button class="save-btn" on:click={tryAddTag} disabled={tagAdding}>Add</button>
						<button class="cancel-btn" on:click={closeTagModal} disabled={tagAdding}>Cancel</button>
						{#if tagAddError}
							<div class="tag-error">{tagAddError}</div>
						{/if}
						<div class="tag-cloud-label">Popular Tags:</div>
						<div class="tag-cloud">
							{#if tagCloudLoading}
								<span class="cloud-loading">Loading…</span>
							{:else if allTags.length}
								{#each allTags as tag, i}
									<span
										class="cloud-chip"
										style="background:{tagColors[i % tagColors.length]};color:{tagTextColors[
											i % tagTextColors.length
										]};"
										on:click={() => selectCloudTag(tag)}>{tag}</span
									>
								{/each}
							{:else}
								<span class="cloud-empty">No tags yet.</span>
							{/if}
						</div>
					{:else}
						<div class="confirm-text">
							Are you sure you want to add the tag: <span class="confirm-tag"
								>{newTag.trim().toLowerCase()}</span
							>?
						</div>
						<button class="save-btn" on:click={handleAddTag} disabled={tagAdding}>Confirm</button>
						<button
							class="cancel-btn"
							on:click={() => {
								confirmStep = false;
							}}
							disabled={tagAdding}>Edit</button
						>
					{/if}
				</div>
			{/if}
			<!-- END Modal -->
			{#if tagSuccess}
				<div class="tag-success">Tag added!</div>
			{/if}
		</div>
		<aside class="player-sidebar">
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

	/* TAGS styling */
	.channel-tags-block {
		margin: 1.1em 0 0.8em 0;
	}
	.tags-row {
		display: flex;
		align-items: center;
		gap: 0.6em;
		flex-wrap: wrap;
		font-size: 1.05rem;
	}
	.tag-chip {
		display: inline-block;
		border-radius: 1.2em;
		padding: 0.19em 1em 0.19em 1em;
		font-size: 1em;
		font-weight: 600;
		margin-right: 0.19em;
		margin-bottom: 0.13em;
		transition:
			box-shadow 0.15s,
			background 0.12s;
		box-shadow: 0 1px 6px #0002;
		letter-spacing: 0.01em;
		text-decoration: none;
	}
	.tag-chip:hover {
		filter: brightness(1.1);
		box-shadow: 0 2px 12px #bebebe30;
		background: #f2f9ff;
	}
	.add-tag-btn {
		background: #20b288;
		color: #fff;
		border: none;
		border-radius: 50%;
		width: 1.8em;
		height: 1.8em;
		font-size: 1.19em;
		font-weight: bold;
		margin-left: 0.4em;
		cursor: pointer;
		transition:
			background 0.13s,
			box-shadow 0.13s;
		vertical-align: middle;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 1px 4px #0002;
	}
	.add-tag-btn:hover,
	.add-tag-btn:focus {
		background: #1e8b6b;
	}

	.no-tags {
		color: #aab1be;
		font-style: italic;
		margin-right: 0.6em;
	}
	.tag-success {
		color: #17b052;
		margin-top: 0.3em;
		font-weight: 600;
		font-size: 1.03em;
		letter-spacing: 0.02em;
	}

	/* Modal Styles */
	.modal-bg {
		position: fixed;
		z-index: 1001;
		left: 0;
		top: 0;
		width: 100vw;
		height: 100vh;
		background: #2d304a80;
	}
	.modal-content {
		position: fixed;
		z-index: 1002;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		min-width: 340px;
		max-width: 98vw;
		background: #fcfcfd;
		border-radius: 13px;
		box-shadow: 0 4px 50px #2c326a40;
		padding: 2.1em 2em 1.2em 2em;
		display: flex;
		flex-direction: column;
		align-items: center;
		border: 2px solid #dbeaff;
	}
	.modal-title {
		font-size: 1.16em;
		font-weight: 700;
		margin-bottom: 1.3em;
		color: #334;
		letter-spacing: 0.03em;
	}
	.tag-input {
		width: 98%;
		font-size: 1em;
		padding: 0.45em 0.9em;
		border-radius: 8px;
		border: 1.5px solid #d3e0ef;
		background: #f7fafd;
		margin-bottom: 0.5em;
		margin-top: 0.1em;
		transition: border 0.15s;
	}
	.tag-input:focus {
		border-color: #7ebeff;
		outline: none;
	}
	.save-btn,
	.cancel-btn {
		margin-top: 0.9em;
		margin-right: 0.6em;
		font-size: 1em;
		border-radius: 7px;
		background: #f5f8fc;
		border: 1.3px solid #e3e7ef;
		cursor: pointer;
		padding: 0.37em 1.25em;
		transition:
			background 0.14s,
			border 0.14s;
	}
	.save-btn:disabled,
	.cancel-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.save-btn:hover {
		background: #e8f2ff;
		border-color: #aad4ff;
	}
	.cancel-btn:hover {
		background: #ffe3e3;
		border-color: #ffcccc;
	}
	.tag-error {
		color: #c42525;
		margin-top: 0.5em;
		font-size: 0.97em;
	}
	.tag-cloud-label {
		margin-top: 0.7em;
		color: #888;
		font-size: 1em;
		font-weight: 500;
		margin-bottom: 0.2em;
	}
	.tag-cloud {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45em;
		margin-top: 0.15em;
		margin-bottom: 0.2em;
		min-height: 2.1em;
	}
	.cloud-chip {
		display: inline-block;
		padding: 0.19em 1em;
		border-radius: 1.2em;
		font-size: 1em;
		font-weight: 500;
		box-shadow: 0 1px 5px #ebebeb60;
		cursor: pointer;
		margin-bottom: 0.15em;
		border: 1px solid #f0f0f0;
		transition:
			box-shadow 0.13s,
			background 0.14s;
	}
	.cloud-chip:hover {
		filter: brightness(1.17);
		box-shadow: 0 2px 10px #b5e0fa60;
		background: #f2f9ff;
		border-color: #aac6ff;
	}
	.cloud-loading,
	.cloud-empty {
		font-size: 0.99em;
		color: #a3a6af;
	}
	.confirm-text {
		font-size: 1.1em;
		margin-bottom: 1.3em;
		color: #333;
	}
	.confirm-tag {
		color: #3074b5;
		font-weight: 600;
		letter-spacing: 0.03em;
		font-size: 1.1em;
	}
</style>
