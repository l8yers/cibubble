<script>
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let videos = [];
  let playlists = [];
  let channel = null;
  let loading = true;

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
  function formatLength(sec) {
    if (!sec || isNaN(sec)) return '';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`;
  }
  function getBestThumbnail(video) {
    if (video.thumbnail) return video.thumbnail;
    if (video.id) return `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
    return '/images/no_thumb_nail.png';
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

    loading = false;
  });
</script>

<style>
.page-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 2rem 2vw 2.5rem 2vw;
  font-family: Inter, Arial, sans-serif;
}
.channel-bar {
  width: inherit;
  padding: 0.33em 1.5em 0.33em 1em;
  display: flex;
  align-items: center;
  gap: 1.1em;
  border-radius: 7px;
  background: #fff;
  box-shadow: 0 2px 8px #f0f0f0;
  font-size: 1.12rem;
  border: 1px solid #efefef;
  margin-bottom: 1.6rem;
}

.channel-avatar {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 22%;
  background: #f4f4f4;
  border: 1.3px solid #ececec;
  margin-right: 0.5em;
}
.channel-bar-name {
  font-size: 1.18rem;
  font-weight: 600;
  color: #191919;
  margin-right: 1.2em;
  line-height: 1.12;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.channel-bar-desc {
  color: #888;
  font-size: 1em;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.section-title {
  margin: 2.2em 0 1em 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #222;
  letter-spacing: 0.01em;
  max-width: 1360px;
  margin-left: auto;
  margin-right: auto;
}
.page-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 2rem 2vw 2.5rem 2vw;
  font-family: Inter, Arial, sans-serif;
}
.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.3rem;
  margin: 2rem 0;
  /* REMOVE: max-width: 1360px; */
  /* REMOVE: margin-left/right: auto; */
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
.playlists-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7em 1.2em;
  margin: 2.5em auto 0.6em auto;
  max-width: 1360px;
  padding-left: 0.2em;
  padding-right: 0.2em;
  align-items: center;
}
.playlist-link {
  display: inline-block;
  font-size: 1.05rem;
  font-weight: 600;
  color: #2562e9;
  background: #f2f7ff;
  border-radius: 5px;
  padding: 0.15em 0.8em;
  text-decoration: none;
  border: 1.1px solid #dde6fb;
  transition: background 0.13s, color 0.13s;
}
.playlist-link:hover {
  background: #d5e7ff;
  color: #e93c2f;
}
</style>

<div class="page-container">
  <div class="channel-bar">
    <img class="channel-avatar"
      src={channel?.thumbnail || '/images/no_thumb_nail.png'}
      alt="Channel avatar"
      loading="lazy"
      on:error={e => e.target.src = '/images/no_thumb_nail.png'}
    />
    <div class="channel-bar-name">{channel?.name || id}</div>
    {#if channel?.description}
      <div class="channel-bar-desc">{channel.description}</div>
    {/if}
  </div>

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
                <span class="length-inline">{formatLength(video.length)}</span>
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

  <div class="section-title" style="margin-top:3.5rem;">Playlists</div>
  {#if playlists.length === 0}
    <p style="color:#888;">No playlists for this channel.</p>
  {:else}
    <div class="playlists-bar">
      {#each playlists as pl}
        <a href={`/playlist/${pl.id}`} class="playlist-link">{pl.title}</a>
      {/each}
    </div>
  {/if}
</div>
