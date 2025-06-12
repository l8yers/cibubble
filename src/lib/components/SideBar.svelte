<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import * as utils from '$lib/utils.js';

  export let video;

  let suggestions = [];
  let loading = true;
  let autoplay = true;
  let skipWatched = false;

  function shuffle(arr) {
    return arr
      .map(v => [Math.random(), v])
      .sort(([a], [b]) => a - b)
      .map(([, v]) => v);
  }
  function isWatched(v) {
    return v.is_watched || false;
  }

  $: if (video) fetchSuggestions();

  async function fetchSuggestions() {
    loading = true;
    suggestions = [];

    if (video.playlist_id) {
      const { data: playlistVids } = await supabase
        .from('videos')
        .select('*, playlist:playlist_id(title)')
        .eq('playlist_id', video.playlist_id)
        .neq('id', video.id)
        .order('playlist_position', { ascending: true })
        .limit(20);
      suggestions = playlistVids || [];
    } else {
      const { data: sameChannel } = await supabase
        .from('videos')
        .select('*')
        .eq('channel_id', video.channel_id)
        .neq('id', video.id)
        .limit(20);

      const { data: otherChannels } = await supabase
        .from('videos')
        .select('*')
        .neq('channel_id', video.channel_id)
        .limit(40);

      let channelVids = shuffle(sameChannel || []).slice(0, 4);
      let otherVids = shuffle(otherChannels || []).slice(0, 4);
      suggestions = [...channelVids, ...otherVids];
    }
    loading = false;
  }
</script>

<div class="sidebar-root">
  <div class="sidebar-header">
    <span class="sidebar-title">
      {video.playlist_id ? "More from this playlist" : "More videos like this"}
    </span>
    <div class="sidebar-toggles">
      <label class="toggle">
        <input type="checkbox" bind:checked={autoplay} />
        <span class="toggle-label">Autoplay</span>
      </label>
      <label class="toggle">
        <input type="checkbox" bind:checked={skipWatched} />
        <span class="toggle-label">Skip watched</span>
      </label>
    </div>
  </div>
  {#if loading}
    <div class="sidebar-loading">Loading…</div>
  {:else if suggestions.length === 0}
    <div class="sidebar-loading">No suggestions found.</div>
  {:else}
    <div class="sidebar-card-list">
      {#each suggestions as v, i (v.id)}
        {#if !skipWatched || !isWatched(v)}
          <a class="card sidebar-card" href={`/video/${v.id}`} title={v.title}>
            <span class="thumb-wrapper">
              <img
                class="thumb"
                src={utils.getBestThumbnail(v)}
                alt={v.title}
                loading="lazy"
                on:error={(e) => e.target.src = '/images/no_thumb_nail.png'}
              />
              {#if v.length}
                <span class="length-inline">{utils.formatLength(v.length)}</span>
              {/if}
            </span>
            <div class="card-body">
              <div class="card-title-row">
                <span class="card-title">{v.title}</span>
              </div>
              <div class="card-meta">
                <span class="badge" style="background:{utils.difficultyColor(v.level)};">
                  {utils.difficultyLabel(v.level)}
                </span>
                {#if v.channel_name}
                  <span class="meta-link">{v.channel_name}</span>
                {/if}
                {#if v.playlist_id && v.playlist?.title}
                  <span class="meta-link" style="color:#9326e9;">{v.playlist.title}</span>
                {/if}
              </div>
            </div>
          </a>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
.sidebar-root {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.1em;
}
.sidebar-header {
  font-size: 1.1em;
  font-weight: 700;
  color: var(--text-secondary, #666);
  margin-bottom: 0.2em;
  display: flex;
  flex-direction: column;
  gap: 0.4em;
}
.sidebar-title {
  font-weight: 800;
  font-size: 1.1em;
  color: var(--text-main, #232323);
}
.sidebar-toggles {
  display: flex;
  flex-direction: row;
  gap: 1em;
  margin-top: 0.1em;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 0.28em;
  font-size: 0.97em;
  border-radius: 13px;
  background: #f8f8f8;
  padding: 0.15em 0.5em 0.15em 0.3em;
  box-shadow: 0 0.5px 2px #eee;
  user-select: none;
}
.toggle input[type="checkbox"] {
  accent-color: #e93c2f;
  width: 1.08em;
  height: 1.08em;
}
.toggle-label {
  color: #444;
  font-size: 0.98em;
}

/* List styling for sidebar cards */
.sidebar-card-list {
  display: flex;
  flex-direction: column;
  gap: 0.85em;
  margin: 0.2em 0 0 0;
}

.sidebar-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  background: #fff;
  border-radius: 9px;
  box-shadow: 0 1.5px 8px #e0e0e0;
  border: 1px solid #ececec;
  transition: background 0.14s, box-shadow 0.11s, transform 0.09s;
  text-decoration: none;
  min-height: 56px;
  padding: 0.23em 0.6em 0.23em 0.22em;
  outline: none;
  gap: 0.7em;
}
.sidebar-card:hover, .sidebar-card:focus {
  background: #f7f5fa;
  box-shadow: 0 3px 16px #e93c2f11;
  transform: translateY(-1px) scale(1.011);
}
.thumb-wrapper {
  position: relative;
  width: 95px;
  min-width: 95px;
  aspect-ratio: 16/9;
  border-radius: 6px;
  overflow: hidden;
  background: #ededed;
  box-shadow: 0 0.8px 5px #0001;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
  display: block;
  background: #ededed;
  min-height: 48px;
}
.length-inline {
  position: absolute;
  right: 0.45em;
  bottom: 0.45em;
  color: #fff;
  background: #222c;
  font-size: 0.92em;
  padding: 0.12em 0.57em;
  border-radius: 6px;
  font-weight: 500;
  opacity: 0.96;
  box-shadow: 0 1px 4px #0002;
  z-index: 9;
  pointer-events: none;
  max-width: 80%;
  text-align: right;
  white-space: nowrap;
}
.card-body {
  padding: 0.21em 0 0 0;
  color: #222;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.card-title-row {
  display: flex;
  align-items: center;
  gap: 0.4em;
  margin-bottom: 0.1em;
}
.card-title {
  font-size: 1.02rem;
  font-weight: 600;
  max-height: 2.5em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
}
.card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.42em;
  margin-top: 0.31em;
  font-size: 0.99em;
}
.badge {
  display: inline-block;
  font-size: 0.84em;
  font-weight: 600;
  padding: 0.13em 0.57em;
  border-radius: 4px;
  margin-right: 0.2em;
  color: #fff;
  background: #bbb;
  letter-spacing: 0.01em;
  border: 1.2px solid transparent;
  text-shadow: 0 1px 4px #0001;
  white-space: nowrap;
}
.meta-link {
  color: #2e9be6;
  font-size: 0.97em;
  text-decoration: none;
  background: #f6f6f6;
  border-radius: 3px;
  padding: 0.11em 0.36em;
  margin-right: 0.12em;
  font-weight: 500;
  transition: background 0.13s, color 0.13s;
  white-space: nowrap;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta-link[style*="color:#9326e9;"] {
  background: #f6e9ff;
}
.sidebar-loading {
  color: #aaa;
  text-align: center;
  margin: 1.1em 0;
  font-size: 1em;
}

/* Responsive: smaller thumbs/cards for narrow sidebars */
@media (max-width: 600px) {
  .thumb-wrapper, .thumb { width: 58px; min-width: 58px; min-height: 32px;}
  .sidebar-card { min-height: 32px; }
  .card-title { font-size: 0.97em; }
}
</style>
