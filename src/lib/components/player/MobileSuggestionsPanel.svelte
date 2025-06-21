<script>
  import { supabase } from '$lib/supabaseClient';
  import * as utils from '$lib/utils/utils.js';
  import { ChartNoAxesColumnIncreasing } from 'lucide-svelte';

  export let video;
  export let open = false;
  export let onClose = () => {};

  let suggestions = [];
  let loading = true;
  let playlistTitle = '';

  function badgeColor(level) {
    switch ((level || '').toLowerCase()) {
      case 'easy': return '#069C56';
      case 'intermediate': return '#FF980E';
      case 'advanced': return '#D3212C';
      default: return '#bbb';
    }
  }

  function makeChannelUrl(channelId) {
    const params = new URLSearchParams(window.location.search);
    params.set('channel', channelId);
    return `/?${params.toString()}`;
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
        .limit(30);
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
    loading = false;
  }
</script>

{#if open}
  <div class="mobile-suggestions-overlay" on:click={onClose}>
    <div class="mobile-suggestions-panel" on:click|stopPropagation>
      <div class="panel-header sticky-header">
        <span>
          {video.playlist_id
            ? (playlistTitle ? `Playlist: ${playlistTitle}` : "Playlist")
            : "More videos like this"}
        </span>
        <button class="close-btn" on:click={onClose} aria-label="Close suggestions">✕</button>
      </div>
      {#if loading}
        <div class="sidebar-loading">Loading…</div>
      {:else if suggestions.length === 0}
        <div class="sidebar-loading">No suggestions found.</div>
      {:else}
        <div class="suggestions-list scroll-list">
          {#each suggestions as v, i (v.id)}
            <a class="suggestion-link" href={`/video/${v.id}`} title={v.title}>
              <div class="suggestion-card horizontal-card">
                <div class="sidebar-thumb-wrapper">
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
                </div>
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
                        <ChartNoAxesColumnIncreasing size={17} stroke-width="2" color="#fff" />
                      </span>
                    {/if}
                    {#if !video.playlist_id && v.channel_id && (v.channel?.name || v.channel_name)}
                      <span
                        class="meta-link"
                        style="color:#2e9be6;cursor:pointer;"
                        title={v.channel?.name ?? v.channel_name}
                        tabindex="0"
                        on:click|stopPropagation={() => window.location = makeChannelUrl(v.channel_id)}
                        on:keydown|stopPropagation={(e) => { if (e.key === "Enter") window.location = makeChannelUrl(v.channel_id); }}
                      >
                        {(v.channel?.name ?? v.channel_name).length > 14
                          ? (v.channel?.name ?? v.channel_name).slice(0, 13) + '…'
                          : (v.channel?.name ?? v.channel_name)
                        }
                      </span>
                    {/if}
                  </div>
                </div>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
@media (max-width: 800px) {
  html, body {
    height: 100%;
    overflow: hidden;
  }
  .mobile-suggestions-overlay {
    position: fixed;
    inset: 0;
    background: transparent;
    z-index: 3000;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    height: 100vh;
    width: 100vw;
    pointer-events: all;
  }
  .mobile-suggestions-panel {
    background: #fff;
    width: 100vw;
    height: calc(100vh - 70vw); /* 56vw is height of 16:9 video. Adjust if your player is different! */
    border-top-left-radius: 18px;
    border-top-right-radius: 18px;
    box-shadow: 0 -6px 22px #0005;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.24s cubic-bezier(.33,.85,.49,1.14);
    max-height: unset;
  }
  @keyframes slideUp {
    from { transform: translateY(100%);}
    to   { transform: translateY(0);}
  }
  .panel-header.sticky-header {
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 2;
    padding: 1.2em 0.8em 0.6em 0.8em;
    font-size: 1.13em;
    font-weight: 700;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ececec;
  }
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5em;
    color: #9696af;
    cursor: pointer;
    margin-left: 1em;
    line-height: 1;
    padding: 0 0.1em;
  }
  .suggestions-list.scroll-list {
    overflow-y: auto;
    flex: 1 1 0;
    padding: 0.6em 0.7em 1.1em 0.7em;
    display: flex;
    flex-direction: column;
    gap: 0.95em;
    min-height: 0;
  }
  .suggestion-link {
    text-decoration: none;
    color: inherit;
    display: block;
    border-radius: 11px;
    transition: background 0.16s;
  }
  .suggestion-link:active {
    background: #f3f4fa;
  }
  .suggestion-card.horizontal-card {
    display: flex;
    flex-direction: row;
    align-items: center;
    background: #fff;
    border-radius: 7px;
    box-shadow: 0 2px 10px #f2f2f2;
    border: 1px solid #ededed;
    min-height: 84px;
    padding: 0 0.7em 0 0.12em;
    gap: 1.05em;
    outline: none;
  }
  .suggestion-card.horizontal-card:hover,
  .suggestion-card.horizontal-card:focus {
    background: #f7f8fa;
    box-shadow: 0 3px 16px #0001;
  }
  .sidebar-thumb-wrapper {
    position: relative;
    width: 34vw;
    min-width: 56px;
    max-width: 102px;
    aspect-ratio: 16/9;
    border-radius: 7px;
    overflow: hidden;
    background: #ededed;
    box-shadow: 0 1px 8px #0001;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .sidebar-thumb {
    width: 100%;
    height: auto;
    aspect-ratio: 16/9;
    object-fit: cover;
    border-radius: 7px;
    display: block;
    background: #ededed;
    min-height: 54px;
  }
  .length-inline {
    position: absolute;
    right: 0.47em;
    bottom: 0.47em;
    color: #fff;
    background: #222c;
    font-size: 0.93em;
    padding: 0.13em 0.58em;
    border-radius: 7px;
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
    gap: 0.36em;
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
    line-clamp: 2;
    flex: 1;
    line-height: 1.16;
    color: #232323;
    transition: none;
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
    width: 22px;
    height: 22px;
    border-radius: 7px;
    box-shadow: 0 1px 3px #0001;
    margin-right: 0.2em;
    border: 2px solid #fff;
    font-size: 1em;
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
    flex: 1 1 0;
    min-width: 0;
    max-width: 90px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }
  .meta-link:hover, .meta-link:focus {
    background: #e4e4e4;
    color: #e93c2f;
    outline: 1.5px solid #e93c2f;
  }
  .sidebar-loading {
    text-align: center;
    padding: 2em 0 1.5em 0;
    font-size: 1.1em;
    color: #b3b3b3;
  }
}
</style>
