<script>
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let videos = [];
  let playlists = [];
  let playlistThumbs = {};
  let playlistLevels = {};
  let channel = null;
  let loading = true;
  let activeTab = 'videos';

  $: id = $page.params.id;

  function difficultyLabel(level) {
    switch (level) {
      case 'superbeginner': return 'Super Beginner';
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      default: return 'Not Yet Rated';
    }
  }
  function difficultyColor(level) {
    switch (level) {
      case 'superbeginner': return '#44c366';
      case 'beginner': return '#2e9be6';
      case 'intermediate': return '#f9c846';
      case 'advanced': return '#e93c2f';
      default: return '#bbb';
    }
  }
  function getBestThumbnail(video) {
    if (video?.thumbnail) return video.thumbnail;
    if (video?.id) return `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
    return '/images/no_thumb_nail.png';
  }

  // Fetch thumbnail and level for each playlist (from its first video)
  async function fetchPlaylistExtras(pls) {
    const thumbs = {};
    const levels = {};
    for (const pl of pls) {
      const { data: vids } = await supabase
        .from('videos')
        .select('id, thumbnail, level')
        .eq('playlist_id', pl.id)
        .order('playlist_position', { ascending: true })
        .limit(1);
      if (vids && vids.length > 0) {
        thumbs[pl.id] = getBestThumbnail(vids[0]);
        levels[pl.id] = vids[0].level;
      } else {
        thumbs[pl.id] = '/images/no_thumb_nail.png';
        levels[pl.id] = 'notyet';
      }
    }
    playlistThumbs = thumbs;
    playlistLevels = levels;
  }

  onMount(async () => {
    loading = true;

    // Get channel info
    const { data: ch } = await supabase.from('channels').select('*').eq('id', id).maybeSingle();
    channel = ch;

    // Get videos for this channel (filter deleted/private) - limit to 30
    const { data: vids } = await supabase
      .from('videos')
      .select('*, playlist:playlist_id(title)')
      .eq('channel_id', id)
      .order('created', { ascending: false })
      .limit(30);
    videos = (vids || []).filter(
      v => v.title !== 'Private video' && v.title !== 'Deleted video' && v.title && v.title !== null
    );

    // Get playlists for this channel
    const { data: pls } = await supabase
      .from('playlists')
      .select('id, title')
      .eq('channel_id', id)
      .order('title', { ascending: true });
    playlists = pls || [];

    // Get thumbs and levels for all playlists (in parallel)
    await fetchPlaylistExtras(playlists);

    loading = false;
  });
</script>

<style>
/* (styles as before, no change needed) */
.page-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 2rem 2vw 2.5rem 2vw;
  font-family: Inter, Arial, sans-serif;
}
.channel-bar {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 2px 8px #f0f0f0;
  font-size: 1.12rem;
  border: 1px solid #efefef;
  border-radius: 7px;
  padding: 0.33em 1.8em 0.33em 1em;
  margin-bottom: 1.8rem;
  gap: 1.2em;
}
.channel-info {
  display: flex;
  align-items: center;
  gap: 1em;
  min-width: 0;
}
.channel-avatar {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 22%;
  background: #f4f4f4;
  border: 1.3px solid #ececec;
}
.channel-bar-details {
  min-width: 0;
}
.channel-bar-name {
  font-size: 1.13rem;
  font-weight: 600;
  color: #191919;
  line-height: 1.13;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.15em;
}
.channel-bar-desc {
  color: #888;
  font-size: 1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  line-height: 1.05;
}
.tabs {
  display: flex;
  align-items: center;
  gap: 0.1em;
  margin-left: 1.2em;
}
.tab-btn {
  font-size: 1.09rem;
  font-weight: 600;
  color: #888;
  background: none;
  border: none;
  border-bottom: 2.5px solid transparent;
  padding: 0.35em 1.15em 0.28em 1.15em;
  margin: 0;
  cursor: pointer;
  transition: color 0.13s, border-bottom 0.13s, background 0.13s;
  border-radius: 0;
}
.tab-btn.active {
  color: #2562e9;
  border-bottom: 2.5px solid #2562e9;
  background: #f7fbff;
}
.tab-btn:focus {
  outline: 2px solid #2562e9;
}
.section-title {
  margin: 2.2em 0 1em 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #222;
  letter-spacing: 0.01em;
}
.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.3rem;
  margin: 2rem 0;
}
.card {
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px #e8e8e8;
  display: flex;
  flex-direction: column;
  border: 1px solid #ededed;
}
.thumb-wrapper {
  position: relative;
}
.thumb {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  background: #eee;
  min-height: 112px;
  display: block;
}
.card-body {
  padding: 1rem 1rem 0.7rem 1rem;
  color: #222;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.card-title-row {
  display: flex;
  align-items: center;
  gap: 0.6em;
  margin-bottom: 0.2em;
}
.card-title {
  font-size: 1.08rem;
  font-weight: 600;
  min-height: 2.2em;
  max-height: 2.3em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
}
.length-inline {
  color: #fff;
  background: #333;
  font-size: 0.87em;
  padding: 0.12em 0.7em;
  border-radius: 9px;
  margin-left: 0.2em;
  font-weight: 500;
  opacity: 0.92;
}
.card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5em;
  margin-top: 0.6em;
  font-size: 1em;
}
.badge {
  display: inline-block;
  font-size: 0.89em;
  font-weight: 600;
  padding: 0.18em 0.7em;
  border-radius: 4px;
  margin-right: 0.5em;
  color: #fff;
  background: #bbb;
  letter-spacing: 0.01em;
  border: 1.5px solid transparent;
  text-shadow: 0 1px 4px #0001;
  white-space: nowrap;
}
.meta-link {
  color: #252525;
  font-size: 0.97em;
  text-decoration: none;
  background: #f6f6f6;
  border-radius: 3px;
  padding: 0.12em 0.55em;
  margin-right: 0.18em;
  font-weight: 500;
  transition: background 0.13s, color 0.13s;
}
.meta-link:hover {
  background: #e4e4e4;
  color: #e93c2f;
}
</style>

<div class="page-container">
  <div class="channel-bar">
    <div class="channel-info">
      <img class="channel-avatar"
        src={channel?.thumbnail || '/images/no_thumb_nail.png'}
        alt="Channel avatar"
        loading="lazy"
        on:error={e => e.target.src = '/images/no_thumb_nail.png'}
      />
      <div class="channel-bar-details">
        <div class="channel-bar-name">{channel?.name || id}</div>
        {#if channel?.description}
          <div class="channel-bar-desc">{channel.description}</div>
        {/if}
      </div>
    </div>
    <div class="tabs">
      <button
        class="tab-btn {activeTab === 'videos' ? 'active' : ''}"
        on:click={() => activeTab = 'videos'}>
        Videos
      </button>
      <button
        class="tab-btn {activeTab === 'playlists' ? 'active' : ''}"
        on:click={() => activeTab = 'playlists'}>
        Playlists
      </button>
    </div>
  </div>

  {#if activeTab === 'videos'}
    <div class="section-title">Videos</div>
    {#if loading}
      <p>Loading…</p>
    {:else if videos.length === 0}
      <p>No videos for this channel.</p>
    {:else}
      <div class="grid">
        {#each videos as video}
          <div class="card">
            <a href={`/video/${video.id}`}>
              <span class="thumb-wrapper">
                <img
                  class="thumb"
                  src={getBestThumbnail(video)}
                  alt={video.title}
                  loading="lazy"
                  on:error={e => e.target.src = '/images/no_thumb_nail.png'}
                />
              </span>
            </a>
            <div class="card-body">
              <div class="card-title-row">
                <span class="card-title">{video.title}</span>
                {#if video.length}
                  <span class="length-inline">{video.length}</span>
                {/if}
              </div>
              <div class="card-meta">
                <span class="badge" style="background:{difficultyColor(video.level)};">
                  {difficultyLabel(video.level)}
                </span>
                {#if video.playlist_id}
                  <a class="meta-link" href={`/playlist/${video.playlist_id}`}>
                    {video.playlist?.title ?? ""}
                  </a>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {:else if activeTab === 'playlists'}
    <div class="section-title">Playlists</div>
    {#if loading}
      <p>Loading…</p>
    {:else if playlists.length === 0}
      <p style="color:#888;">No playlists for this channel.</p>
    {:else}
      <div class="grid">
        {#each playlists as pl}
          <div class="card">
            <a href={`/playlist/${pl.id}`}>
              <span class="thumb-wrapper">
                <img
                  class="thumb"
                  src={playlistThumbs[pl.id] || '/images/no_thumb_nail.png'}
                  alt={pl.title}
                  loading="lazy"
                  on:error={e => e.target.src = '/images/no_thumb_nail.png'}
                />
              </span>
            </a>
            <div class="card-body">
              <div class="card-title-row">
                <span class="card-title">{pl.title}</span>
              </div>
              <div class="card-meta">
                <span class="badge" style="background:{difficultyColor(playlistLevels[pl.id])};">
                  {difficultyLabel(playlistLevels[pl.id])}
                </span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>
