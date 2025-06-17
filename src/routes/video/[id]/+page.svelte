<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user.js';
	import SideBar from '$lib/components/SideBar.svelte';
	import VideoWatchTracker from '$lib/components/VideoWatchTracker.svelte';
	import * as utils from '$lib/utils.js';
	import { goto } from '$app/navigation';
	import { autoplay } from '$lib/stores/autoplay.js';

	let video = null;
	let loading = true;
	let suggestions = [];
	let playlistTitle = '';
	let autoplayValue = true;
	const unsubscribe = autoplay.subscribe((val) => (autoplayValue = val));

	$: id = $page.params.id;
	$: if (id) initializePlayer();

	// SSR-safe: don't reference window/document or YT here

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	async function initializePlayer() {
		loading = true;
		video = null;
		suggestions = [];
		playlistTitle = '';

		const { data: vid } = await supabase
			.from('videos')
			.select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
			.eq('id', id)
			.maybeSingle();
		video = vid;
		loading = false;
		if (!video) return;

		await fetchSuggestions();
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

	// Handler: autoplay event from child tracker
	function handlePlayNextVideo(event) {
		const nextId = event.detail;
		if (nextId) {
			goto(`/video/${nextId}`);
		}
	}
</script>

{#if loading}
	<div class="player-loading">Loading…</div>
{:else if !video}
	<div class="player-loading">Video not found.</div>
{:else}
	<div class="player-container">
		<div class="player-main-col">
			<div class="player-video-box">
				<!-- Plain iframe, tracker will manage YT.Player internally -->
				<iframe
					id="yt-player"
					width="100%"
					height="100%"
					src={`https://www.youtube.com/embed/${video.id}?enablejsapi=1&autoplay=1`}
					title={video.title}
					frameborder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
				></iframe>
				{#if $user}
					{#key video.id}
						<VideoWatchTracker
							videoId={video.id}
							videoDuration={video.length}
							userId={$user.id}
							{suggestions}
							autoplay={autoplayValue}
							on:playNextVideo={handlePlayNextVideo}
						/>
					{/key}
				{/if}
			</div>
			<div class="player-title">{video.title}</div>
			<div class="player-meta-row">
				<span class="player-diff-badge" style="background: {utils.difficultyColor(video.level)};"
					>{utils.difficultyLabel(video.level)}</span
				>
				<span class="player-channel">{video.channel?.name ?? video.channel_name}</span>
				{#if video.length}
					<span class="player-duration">{utils.formatLength(video.length)}</span>
				{/if}
			</div>
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
	.player-video-box {
		width: 100%;
		aspect-ratio: 16/9;
		border-radius: 6px;
		background: #fff;
		box-shadow: 0 2px 16px #ececec60;
		border: 1.7px solid #ededed;
		overflow: hidden;
		margin-bottom: 0.4rem;
		position: relative;
	}
	.player-title {
		font-size: 1.38rem;
		font-weight: 800;
		color: #1a1a1a;
		max-width: 98vw;
		margin-bottom: 0.25rem;
		line-height: 1.21;
		overflow-wrap: anywhere;
	}
	.player-meta-row {
		display: flex;
		align-items: center;
		gap: 1em;
		font-size: 1.04em;
		color: #888;
	}
	.player-diff-badge {
		font-size: 1em;
		font-weight: 700;
		padding: 0.19em 1em;
		border-radius: 13px;
		color: #fff;
		display: inline-block;
		border: none;
		white-space: nowrap;
		box-shadow: 0 1px 4px #e0e0e0;
	}
	.player-channel {
		font-size: 1.01em;
		color: #3c68ad;
		font-weight: 500;
		max-width: 160px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.player-duration {
		font-size: 0.99em;
		color: #adadad;
		margin-left: auto;
	}
	.player-sidebar {
		display: flex;
		flex-direction: column;
		overflow-x: visible;
		box-sizing: border-box;
		padding: 1.7rem 2px 1.3rem 2px;
	}
	.player-loading {
		text-align: center;
		margin-top: 3rem;
		color: #aaa;
		font-size: 1.1rem;
	}
</style>
