<script>
  import { onDestroy } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';
  import { user } from '$lib/stores/user.js';
  import SideBar from '$lib/components/player/SideBar.svelte';
  import PlayerVideoBox from '$lib/components/player/PlayerVideoBox.svelte';
  import AddToMyChannelsButton from '$lib/components/player/AddToMyChannelsButton.svelte';
  import PlayerMetaRow from '$lib/components/player/PlayerMetaRow.svelte';
  import * as utils from '$lib/utils.js';
  import { goto } from '$app/navigation';
  import { autoplay } from '$lib/stores/autoplay.js';

  let video = null;
  let loading = true;
  let suggestions = [];
  let playlistTitle = '';
  let autoplayValue = true;
  const unsubscribe = autoplay.subscribe(val => autoplayValue = val);

  let savingChannel = false;
  let isChannelSaved = false;

  $: id = $page.params.id;
  $: if (id) initializePlayer();

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
        return (arr || []).map(v => [Math.random(), v]).sort(([a], [b]) => a - b).map(([, v]) => v);
      }
      const channelMap = {};
      for (const v of shuffle(otherChannelsRaw || [])) {
        if (!channelMap[v.channel_id]) channelMap[v.channel_id] = v;
      }
      const otherVids = Object.values(channelMap).slice(0, 23);
      let channelVids = shuffle(sameChannel || []).slice(0, 7);
      let suggestionsMixed = otherVids.slice();
      let insertIndexes = shuffle([...Array(Math.min(15, suggestionsMixed.length)).keys()]).slice(0, channelVids.length);
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
    await supabase.from('saved_channels').upsert({
      user_id: $user.id,
      channel_id: video.channel_id
    }, { onConflict: ['user_id', 'channel_id'] });
    isChannelSaved = true;
    savingChannel = false;
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
      <PlayerVideoBox
        {video}
        user={$user}
        {suggestions}
        {autoplayValue}
        {handlePlayNextVideo}
      />
      <div class="player-title-row">
        <div class="player-title">{video.title}</div>
        {#if $user && video?.channel_id}
          <AddToMyChannelsButton
            {isChannelSaved}
            {savingChannel}
            saveChannelToMyChannels={saveChannelToMyChannels}
          />
        {/if}
      </div>
      <PlayerMetaRow {video} {utils} />
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
</style>
