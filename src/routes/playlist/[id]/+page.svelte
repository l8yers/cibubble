<script>
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let videos = [];
  let playlist = null;
  let loading = true;
  let currentIndex = 0;

  $: id = $page.params.id;
  $: currentVideo = videos[currentIndex];

  function getBestThumbnail(video) {
    if (video?.thumbnail) return video.thumbnail;
    if (video?.id) return `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
    return '/images/no_thumb_nail.png';
  }

  onMount(async () => {
    loading = true;
    // Get playlist info
    const { data: pl } = await supabase.from('playlists').select('*').eq('id', id).maybeSingle();
    playlist = pl;
    // Get videos for this playlist, order by playlist_position ASC (not by created!)
    const { data } = await supabase
      .from('videos')
      .select('*, channel:channel_id(name)')
      .eq('playlist_id', id)
      .order('playlist_position', { ascending: true });
    videos = (data || []).filter(v => v.title !== 'Private video' && v.title !== 'Deleted video' && v.title);
    loading = false;
  });

  // Handler for clicking on a sidebar video
  function playVideo(idx) {
    currentIndex = idx;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<style>
.page-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 2rem 2vw 2.5rem 2vw;
  font-family: Inter, Arial, sans-serif;
}
.player-layout {
  display: flex;
  gap: 2.2rem;
  align-items: flex-start;
  margin-top: 1.5em;
}
.player-main {
  flex: 4;
  min-width: 0;
}
.player-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.45em;
}
.player-yt {
  width: 100%;
  aspect-ratio: 16/9;
  background: #eee;
  border-radius: 10px;
  border: 1.5px solid #eee;
  margin-bottom: 0.7em;
}
.player-meta {
  margin: 0.8em 0 0.3em 0;
  color: #777;
  font-size: 1.03em;
  display: flex;
  gap: 1.1em;
  align-items: center;
}
.sidebar {
  flex: 1.6;
  min-width: 280px;
  max-width: 350px;
  background: #fafafd;
  border-radius: 9px;
  border: 1.2px solid #f0f0f0;
  padding: 0.8em 0.7em 0.8em 0.7em;
  box-shadow: 0 2px 14px #f1f1f1;
  overflow-y: auto;
  max-height: 72vh;
}
.sidebar-title {
  font-weight: 600;
  font-size: 1.09em;
  color: #355;
  margin-bottom: 0.6em;
  margin-left: 0.18em;
}
.sidebar-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.7em;
  padding: 0.38em 0.15em;
  border-radius: 7px;
  margin-bottom: 0.12em;
  cursor: pointer;
  transition: background 0.15s;
}
.sidebar-item.active,
.sidebar-item:hover {
  background: #e8f0ff;
}
.sidebar-thumb {
  width: 54px;
  height: 32px;
  object-fit: cover;
  border-radius: 6px;
  background: #eee;
  border: 1px solid #eaeaea;
  flex-shrink: 0;
}
.sidebar-title-txt {
  font-size: 1.01em;
  color: #222;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
@media (max-width: 1024px) {
  .player-layout { flex-direction: column; gap: 1.5rem; }
  .sidebar { max-width: 100%; width: 100%; min-width: 0; }
}
</style>

<div class="page-container">
  <h2 style="margin:2.2em 0 1em 0;">Playlist: {playlist?.title || id}</h2>

  {#if loading}
    <p>Loading…</p>
  {:else if videos.length === 0}
    <p>No videos for this playlist.</p>
  {:else}
    <div class="player-layout">
      <div class="player-main">
        <div class="player-title">{currentVideo?.title}</div>
        <iframe
          class="player-yt"
          src={"https://www.youtube.com/embed/" + currentVideo?.id + "?autoplay=1"}
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
        ></iframe>
        <div class="player-meta">
          <span>{currentVideo?.channel?.name || "Unknown Channel"}</span>
          {#if currentVideo?.playlist_position !== null}
            <span>#{currentVideo.playlist_position + 1} in playlist</span>
          {/if}
        </div>
      </div>
      <aside class="sidebar">
        <div class="sidebar-title">Playlist videos</div>
        <ul class="sidebar-list">
          {#each videos as v, idx}
            <li
              class="sidebar-item {currentIndex === idx ? 'active' : ''}"
              on:click={() => playVideo(idx)}
            >
              <img class="sidebar-thumb" src={getBestThumbnail(v)} alt={v.title} loading="lazy" />
              <span class="sidebar-title-txt">{v.title}</span>
            </li>
          {/each}
        </ul>
      </aside>
    </div>
  {/if}
</div>
