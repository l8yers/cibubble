<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';
  import VideoWatchTracker from '$lib/components/VideoWatchTracker.svelte';
  import VideoCard from '$lib/components/VideoCard.svelte';
  import * as utils from '$lib/utils.js';

  let video = null;
  let suggestions = [];
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
    // Fetch 8 suggestions: same channel/level/playlist preferred, else recent
    const { data: suggs } = await supabase
      .from('videos')
      .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
      .neq('id', id)
      .order('created', { ascending: false })
      .limit(8);
    suggestions = suggs ?? [];
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
      <div class="player-suggestions-label">More Videos</div>
      <div class="player-suggestions-grid">
        {#each suggestions as v}
          <VideoCard
            video={v}
            getBestThumbnail={utils.getBestThumbnail}
            difficultyColor={utils.difficultyColor}
            difficultyLabel={utils.difficultyLabel}
            formatLength={utils.formatLength}
            filterByChannel={null}
            filterByPlaylist={null}
          />
        {/each}
      </div>
    </aside>
  </div>
{/if}

<style>
/* Main container grid layout */
.player-container {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2.5rem;
  max-width: 1550px;
  margin: 0 auto;
  padding: 2.5rem 2vw 0 2vw;
  min-height: 100vh;
  background: var(--bg-main, #fff);
}
.player-main-col {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
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
  gap: 1.2rem;
  min-width: 0;
  width: 100%;
}
.player-suggestions-label {
  font-size: 1.10em;
  font-weight: 700;
  color: var(--text-secondary, #666);
  margin-bottom: 6px;
  margin-top: 2px;
  letter-spacing: 0.01em;
}
.player-suggestions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.1rem;
}
@media (max-width: 1200px) {
  .player-container {
    grid-template-columns: 1fr;
    gap: 1.3rem;
    max-width: 99vw;
    padding: 1.3rem 2vw;
  }
  .player-sidebar {
    width: 100%;
  }
  .player-suggestions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.1rem;
  }
}
@media (max-width: 800px) {
  .player-container {
    padding: 1rem 0.3rem;
  }
  .player-suggestions-grid {
    grid-template-columns: 1fr;
    gap: 0.65rem;
  }
}
.player-loading {
  text-align: center;
  margin-top: 3rem;
  color: #aaa;
  font-size: 1.1rem;
}
</style>
