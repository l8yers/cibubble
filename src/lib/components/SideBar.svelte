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
          <a class="sidebar-card" href={`/video/${v.id}`} title={v.title}>
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
            <div class="card-content">
              <div class="sidebar-title-row">
                <span class="sidebar-card-title">{v.title}</span>
              </div>
              <div class="sidebar-card-meta">
                <span class="badge" style="background:{utils.difficultyColor(v.level)};">
                  {utils.difficultyLabel(v.level)}
                </span>
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
  font-size: 1.08em;
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
  gap: 1em;
  margin: 0.2em 0 0 0;
}

.sidebar-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px #e8e8e8;
  border: 1px solid #ededed;
  transition: background 0.13s, box-shadow 0.10s, transform 0.09s;
  text-decoration: none;
  min-height: 110px;
  padding: 0.18em 1em 0.18em 0.2em;
  gap: 1.1em;
  outline: none;
}

.sidebar-card:hover,
.sidebar-card:focus {
  background: #f7f5fa;
  box-shadow: 0 3px 16px #e93c2f11;
  transform: translateY(-1px) scale(1.013);
}

.thumb-wrapper {
  position: relative;
  width: 148px;
  min-width: 148px;
  max-width: 148px;
  aspect-ratio: 16/9;
  border-radius: 7px;
  overflow: hidden;
  background: #ededed;
  box-shadow: 0 1px 8px #0001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 7px;
  display: block;
  background: #ededed;
  min-height: 84px;
}

.length-inline {
  position: absolute;
  right: 0.55em;
  bottom: 0.55em;
  color: #fff;
  background: #222c;
  font-size: 0.97em;
  padding: 0.14em 0.66em;
  border-radius: 6px;
  font-weight: 500;
  opacity: 0.96;
  box-shadow: 0 1px 4px #0002;
  z-index: 9;
  pointer-events: none;
  max-width: 85%;
  text-align: right;
  white-space: nowrap;
}

.card-content {
  padding: 0.1em 0 0 0;
  color: #222;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.sidebar-title-row {
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-bottom: 0.13em;
}
.sidebar-card-title {
  font-size: 1.05rem;
  font-weight: 600;
  max-height: 2.5em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
  line-height: 1.2;
}
.sidebar-card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5em;
  margin-top: 0.36em;
  font-size: 1em;
}
.badge {
  display: inline-block;
  font-size: 0.89em;
  font-weight: 600;
  padding: 0.17em 0.7em;
  border-radius: 4px;
  color: #fff;
  background: #bbb;
  letter-spacing: 0.01em;
  border: 1.5px solid transparent;
  text-shadow: 0 1px 4px #0001;
  white-space: nowrap;
}
.sidebar-loading {
  color: #aaa;
  text-align: center;
  margin: 1.1em 0;
  font-size: 1em;
}

/* Responsive: smaller thumbs/cards for narrow sidebars */
@media (max-width: 800px) {
  .thumb-wrapper, .thumb { width: 95px; min-width: 95px; min-height: 56px;}
  .sidebar-card { min-height: 56px; }
  .sidebar-card-title { font-size: 0.97em; }
}
</style>
