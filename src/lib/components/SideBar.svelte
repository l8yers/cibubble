<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import * as utils from '$lib/utils.js';
  import { ChartNoAxesColumnIncreasing } from 'lucide-svelte';

  function makeChannelUrl(channelId) {
    const params = new URLSearchParams(window.location.search);
    params.set('channel', channelId);
    return `/?${params.toString()}`;
  }

  export let video;

  let suggestions = [];
  let loading = true;
  let autoplay = true;
  let playlistTitle = '';

  function badgeColor(level) {
    switch ((level || '').toLowerCase()) {
      case 'easy': return '#069C56';
      case 'intermediate': return '#FF980E';
      case 'advanced': return '#D3212C';
      default: return '#bbb';
    }
  }

  $: if (video) fetchSuggestions();

  async function fetchSuggestions() {
    loading = true;
    suggestions = [];
    playlistTitle = '';

    if (video.playlist_id) {
      const { data: playlistVids } = await supabase
        .from('videos')
        .select('*, channel:channel_id(name), playlist:playlist_id(title)')
        .eq('playlist_id', video.playlist_id)
        .neq('id', video.id)
        .order('playlist_position', { ascending: true })
        .limit(20);
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
        .limit(20);

      const { data: otherChannels } = await supabase
        .from('videos')
        .select('*, channel:channel_id(name)')
        .neq('channel_id', video.channel_id)
        .limit(40);

      function shuffle(arr) {
        return arr
          .map(v => [Math.random(), v])
          .sort(([a], [b]) => a - b)
          .map(([, v]) => v);
      }
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
      {video.playlist_id
        ? (playlistTitle ? playlistTitle : "More from this playlist")
        : "Suggested Videos"}
    </span>
    <div class="sidebar-toggles">
      <label class="toggle">
        <input type="checkbox" bind:checked={autoplay} />
        <span class="toggle-label">Autoplay</span>
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
        <a class="sidebar-card horizontal-card" href={`/video/${v.id}`} title={v.title}>
          <span class="sidebar-thumb-wrapper">
            <img
              class="sidebar-thumb"
              src={utils.getBestThumbnail(v)}
              alt={v.title}
              loading="lazy"
              on:error={(e) => e.target.src = '/images/no_thumb_nail.png'}
            />
            {#if v.length}
              <span class="length-inline">{utils.formatLength(v.length)}</span>
            {/if}
          </span>
          <div class="sidebar-card-content">
            <div class="sidebar-title-row">
              <span class="sidebar-card-title">{v.title}</span>
            </div>
<div class="sidebar-card-meta">
  {#if v.level}
    <span
      class="ds-difficulty-badge"
      style="background: {badgeColor(v.level)};"
      title={v.level}
    >
      <ChartNoAxesColumnIncreasing size={19} stroke-width="2.2" color="#fff" />
    </span>
  {/if}
  {#if v.channel_id && (v.channel?.name || v.channel_name)}
    <a
      class="meta-link"
      style="color:#2e9be6;cursor:pointer;"
      title={v.channel?.name ?? v.channel_name}
      href={makeChannelUrl(v.channel_id)}
      on:click|stopPropagation
    >
      {(v.channel?.name ?? v.channel_name).length > 14
        ? (v.channel?.name ?? v.channel_name).slice(0, 13) + '…'
        : (v.channel?.name ?? v.channel_name)
      }
    </a>
  {/if}
</div>
          </div>
        </a>
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
  /* Fixed height, or set as needed. Use 100vh for full viewport */
  height: 100vh;
  max-height: 100vh;
  box-sizing: border-box;
  background: #fff; /* optional: helps define the sidebar visually */
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

.sidebar-card-list {
  flex: 1 1 0;
  overflow-y: auto;
  /* This will allow the list to scroll when needed */
  min-height: 0;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.6em;
  margin: 0.1em 0 0 0;
  padding-bottom: 0.5em; /* optional: for visual breathing room at end */
}

.sidebar-card.horizontal-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 12px #e8e8e8;
  border: 1px solid #ededed;
  text-decoration: none;
  min-height: 84px;
  /* Remove vertical padding to close up space */
  padding: 0 0.7em 0 0.12em;
  gap: 1.05em;
  transition: none;
  outline: none;
}
.sidebar-card.horizontal-card:hover,
.sidebar-card.horizontal-card:focus {
  background: #fff;
  box-shadow: 0 2px 12px #e8e8e8;
  transform: none;
}

/* Thumbnail */
.sidebar-thumb-wrapper {
  position: relative;
  width: 45%;
  min-width: 96px;
  max-width: 160px;
  aspect-ratio: 16/9;
  border-radius: 6px;
  overflow: hidden;
  background: #ededed;
  box-shadow: 0 1px 8px #0001;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* No vertical margin/padding */
}
.sidebar-thumb {
  width: 100%;
  height: auto;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 6px;
  display: block;
  background: #ededed;
  min-height: 54px;
  /* No margin/padding */
}
.length-inline {
  position: absolute;
  right: 0.47em;
  bottom: 0.47em;
  color: #fff;
  background: #222c;
  font-size: 0.92em;
  padding: 0.13em 0.58em;
  border-radius: 6px;
  font-weight: 500;
  opacity: 0.96;
  box-shadow: 0 1px 4px #0002;
  z-index: 9;
  pointer-events: none;
  max-width: 88%;
  text-align: right;
  white-space: nowrap;
}
.sidebar-card-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  flex: 1;
  padding: 0 0.15em;
}
.sidebar-title-row {
  display: flex;
  align-items: center;
  gap: 0.4em;
  margin-bottom: 0.09em;
}
.sidebar-card-title {
  font-size: 1em;
  font-weight: 600;
  max-height: 2.2em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
  line-height: 1.16;
  color: #232323;
  transition: none;
}
.sidebar-card-title:hover,
.sidebar-card-title:focus {
  color: #232323;
  background: none;
  text-decoration: none;
  outline: none;
}

.sidebar-card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.37em;
  margin-top: 0.18em;
  font-size: 0.97em;
}

.ds-difficulty-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  box-shadow: 0 1px 3px #0001;
  margin-right: 0.2em;
  border: 2px solid #fff;
  font-size: 1.1em;
  transition: box-shadow 0.15s;
}

.meta-link {
  color: #252525;
  font-size: 0.97em;
  text-decoration: none;
  background: #f6f6f6;
  border-radius: 3px;
  padding: 0.10em 0.48em;
  margin-right: 0.13em;
  font-weight: 500;
  transition: background 0.13s, color 0.13s;
  display: flex;
  align-items: center;
  /* prevent wrap, force single line and ellipsis */
  flex: 1 1 0;
  min-width: 0;
  max-width: 105px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-link:hover {
  background: #e4e4e4;
  color: #e93c2f;
}
@media (max-width: 800px) {
  .sidebar-thumb-wrapper, .sidebar-thumb { width: 35vw; min-width: 50px; max-width: 100px; }
  .sidebar-card-title { font-size: 0.93em; }
}
</style>
