<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';
  import VideoWatchTracker from '$lib/components/VideoWatchTracker.svelte';
  import SideBar from '$lib/components/SideBar.svelte';
  import * as utils from '$lib/utils.js';

  let video = null;
  let loading = true;
  let user = null;

  $: id = $page.params.id;

  onMount(async () => {
    loading = true;
    // Get user
    const { data: sess } = await supabase.auth.getSession();
    user = sess.session?.user ?? null;
    // Fetch main video
    const { data: vid } = await supabase
      .from('videos')
      .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
      .eq('id', id)
      .maybeSingle();
    video = vid;
    loading = false;
  });
</script>

{#if loading}
  <div class="player-loading">Loading…</div>
{:else if !video}
  <div class="player-loading">Video not found.</div>
{:else}
  <div class="player-container">
    <div class="player-main-col">
      <div class="player-video-box">
        <iframe
          id="yt-player"
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${video.id}?enablejsapi=1`}
          title={video.title}
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
        {#if user}
          <VideoWatchTracker videoId={video.id} videoDuration={video.length} userId={user.id} />
        {/if}
      </div>
      <div class="player-title">{video.title}</div>
      <div class="player-meta-row">
        <span
          class="player-diff-badge"
          style="background: {utils.difficultyColor(video.level)};"
        >{utils.difficultyLabel(video.level)}</span>
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
  padding: 0;
  height: 100vh;
  min-height: 100vh;
  background: var(--bg-main, #fff);
  box-sizing: border-box;
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
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 16px #ececec60;
  border: 1.7px solid #ededed;
  overflow: hidden;
  margin-bottom: 0.4rem;
  position: relative;
  flex-shrink: 0;
}

.player-title {
  font-size: 1.38rem;
  font-weight: 800;
  color: var(--text-main, #1a1a1a);
  max-width: 98vw;
  margin-bottom: 0.25rem;
  line-height: 1.21;
  overflow-wrap: anywhere;
}
.player-meta-row {
  display: flex;
  align-items: center;
  gap: 1.0em;
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

.player-sidebar::-webkit-scrollbar {
  width: 10px;
  background: #eee;
  border-radius: 7px;
}
.player-sidebar::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 7px;
}

@media (max-width: 1200px) {
  .player-container {
    max-width: 99vw;
    padding: 0;
    height: 100vh;
  }
  .player-sidebar {
    max-height: 40vh;
    height: 40vh;
    overflow-y: auto;
    margin-top: 2rem;
  }
}
@media (max-width: 800px) {
  .player-container {
    padding: 0;
  }
}
.player-loading {
  text-align: center;
  margin-top: 3rem;
  color: #aaa;
  font-size: 1.1rem;
}
</style>
