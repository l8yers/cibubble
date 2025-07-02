<script>
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';
  import { user } from '$lib/stores/user.js';
  import SideBar from '$lib/components/player/SideBar.svelte';
  import PlayerVideoBox from '$lib/components/player/PlayerVideoBox.svelte';
  import PlayerMetaRow from '$lib/components/player/PlayerMetaRow.svelte';
  import * as utils from '$lib/utils/utils.js';
  import { goto } from '$app/navigation';
  import { autoplay } from '$lib/stores/autoplay.js';
  import VideoWatchTracker from '$lib/components/VideoWatchTracker.svelte';
  import { shuffle, parseTags, fetchSuggestions } from '$lib/utils/videoUtils.js';
  import {
    watchLaterIds,
    addToWatchLater,
    loadWatchLaterVideos,
    removeFromWatchLater
  } from '$lib/stores/videos.js';

  let video = null;
  let loading = true;
  let suggestions = [];
  let playlistTitle = '';
  let autoplayValue = true;
  let isMobile = false;

  const unsubscribe = autoplay.subscribe((val) => (autoplayValue = val));
  let savingChannel = false;
  let isChannelSaved = false;

  let savingWatchLater = false;
  let isWatchLater = false;

  $: id = $page.params.id;
  $: if (id) initializePlayer();

  // ---- Watch Later logic ----
  $: $watchLaterIds;
  $: isWatchLater = video ? $watchLaterIds.has(video.id) : false;

  onMount(() => {
    const check = () => (isMobile = window.innerWidth <= 800);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  });

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

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
    suggestions = await fetchSuggestions(video, supabase);
    if ($user && video?.channel_id) checkIfChannelSaved();
    if ($user && video) loadWatchLaterVideos();
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

  async function removeChannelFromMyChannels() {
    if (!$user || !video?.channel_id) return;
    savingChannel = true;
    await supabase
      .from('saved_channels')
      .delete()
      .eq('user_id', $user.id)
      .eq('channel_id', video.channel_id);
    isChannelSaved = false;
    savingChannel = false;
  }

  // ---- Watch Later logic: call from dropdown ----
  async function saveToWatchLater() {
    if (!$user || !video?.id || isWatchLater || savingWatchLater) return;
    savingWatchLater = true;
    await addToWatchLater(video.id);
    savingWatchLater = false;
  }

  async function handleRemoveFromWatchLater() {
    if (!$user || !video?.id || !isWatchLater || savingWatchLater) return;
    savingWatchLater = true;
    await removeFromWatchLater(video.id);
    savingWatchLater = false;
  }

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
			<PlayerVideoBox {video} user={$user} {suggestions} {autoplayValue} {handlePlayNextVideo} />

			<div class="player-content">
<PlayerMetaRow
  {video}
  {utils}
  user={$user}
  isChannelSaved={isChannelSaved}
  savingChannel={savingChannel}
  saveChannelToMyChannels={saveChannelToMyChannels}
  removeChannelFromMyChannels={removeChannelFromMyChannels}
  isWatchLater={isWatchLater}
  savingWatchLater={savingWatchLater}
  saveToWatchLater={saveToWatchLater}
  removeFromWatchLater={handleRemoveFromWatchLater}
/>

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
	.mobile-suggestions-block {
		flex: 1 1 0;
		overflow-y: auto;
		min-height: 0;
		max-height: 100%;
		-webkit-overflow-scrolling: touch;
		margin-top: 1.25em;
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
