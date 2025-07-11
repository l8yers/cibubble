<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import * as utils from '$lib/utils/utils.js';
  import { ChartNoAxesColumnIncreasing, ChevronUp, ChevronDown } from 'lucide-svelte';
  import { autoplay } from '$lib/stores/autoplay.js';
  import { user } from '$lib/stores/user.js';
  import { hideWatchedSidebar } from '$lib/stores/hideWatchedSidebar.js';

  export let video;
  export let sortBarIsVisibleMobile = false;

  let isMobile = false;
  let showMobileBar = true;
  let suggestions = [];
  let loading = true;
  let playlistTitle = '';

  let watchedIds = new Set();

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

  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth <= 800;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

  // SUGGESTIONS + WATCHED LOGIC

  $: fetchSidebarSuggestions();

  async function fetchSidebarSuggestions() {
    if (!video) {
      suggestions = [];
      playlistTitle = '';
      return;
    }
    loading = true;
    suggestions = [];
    playlistTitle = '';
    watchedIds = new Set();

    // Find playlist for current video
    const { data: playlists } = await supabase
      .from('playlists')
      .select('id, title, videos')
      .contains('videos', [video.id])
      .limit(1);

    let vidsToShow = [];

    if (playlists && playlists.length > 0) {
      // Playlist case
      const playlist = playlists[0];
      playlistTitle = playlist.title;
      const playlistIds = playlist.videos.filter(id => id !== video.id);

      if (playlistIds.length > 0) {
        // Fetch those videos in order
        const { data: vids } = await supabase
          .from('videos')
          .select('*, channel:channel_id(name)')
          .in('id', playlistIds);

        vidsToShow = playlistIds.map(id => vids.find(v => v.id === id)).filter(Boolean);

        // Fetch watched IDs for this user *in this playlist*
        if ($user) {
          const { data: watched } = await supabase
            .from('watched_sessions')
            .select('video_id')
            .eq('user_id', $user.id)
            .in('video_id', playlistIds);

          watchedIds = new Set((watched || []).map(row => row.video_id));
        }
      }
    } else {
      // Not in a playlist: fetch videos from this channel (not current video)
      const { data: vids } = await supabase
        .from('videos')
        .select('*, channel:channel_id(name)')
        .eq('channel_id', video.channel_id)
        .neq('id', video.id)
        .limit(30);

      vidsToShow = (vids || []).sort(() => Math.random() - 0.5);
      playlistTitle = '';

      // Fetch watched IDs for this user *in this channel*
      if ($user && vidsToShow.length > 0) {
        const candidateIds = vidsToShow.map(v => v.id);
        const { data: watched } = await supabase
          .from('watched_sessions')
          .select('video_id')
          .eq('user_id', $user.id)
          .in('video_id', candidateIds);

        watchedIds = new Set((watched || []).map(row => row.video_id));
      }
    }

    // --- Hide watched videos if toggle is ON (use the store value) ---
    if ($hideWatchedSidebar && watchedIds.size) {
      vidsToShow = vidsToShow.filter(v => !watchedIds.has(v.id));
    }

    suggestions = vidsToShow;
    loading = false;
  }
</script>

{#if !isMobile || (isMobile && sortBarIsVisibleMobile)}
  <div class="sidebar-root">
    <div class="sidebar-header">
      <span class="sidebar-title">
        {playlistTitle
          ? `Playlist: ${playlistTitle}`
          : "More from this channel"}
      </span>
      {#if isMobile}
        <button
          class="sidebar-hide-btn"
          type="button"
          on:click={() => { sortBarIsVisibleMobile = false; showMobileBar = true; }}
          on:keydown={(e) => { if (e.key === "Enter" || e.key === " ") { sortBarIsVisibleMobile = false; showMobileBar = true; } }}
          aria-label="Hide suggestions"
          tabindex="0"
        >
          <ChevronDown size={22} />
        </button>
      {/if}
      <div class="sidebar-toggles">
        <label class="toggle">
          <input type="checkbox" bind:checked={$autoplay} />
          <span class="toggle-label">Autoplay</span>
        </label>
        <label class="toggle">
          <input
            type="checkbox"
            checked={$hideWatchedSidebar}
            on:change={e => hideWatchedSidebar.set(e.target.checked)}
          />
          <span class="toggle-label">Hide Watched</span>
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
          <div class="sidebar-card horizontal-card">
            <a class="sidebar-thumb-wrapper" href={`/video/${v.id}`} title={v.title}>
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
            </a>
            <div class="sidebar-card-content">
              <div class="sidebar-title-row">
                <a class="sidebar-card-title" href={`/video/${v.id}`}>{v.title}</a>
              </div>
              <div class="sidebar-card-meta">
                {#if v.level}
                  <span
                    class="ds-difficulty-badge"
                    style="background: {badgeColor(v.level)};"
                    title={v.level}
                  >
                    <ChartNoAxesColumnIncreasing size={17} stroke-width="2.1" color="#fff" />
                  </span>
                {/if}
                {#if !playlistTitle && v.channel_id && (v.channel?.name || v.channel_name)}
                  <span
                    class="meta-link"
                    style="color:#2e9be6;cursor:pointer;"
                    title={v.channel?.name ?? v.channel_name}
                    tabindex="0"
                    on:click={() => window.location = makeChannelUrl(v.channel_id)}
                    on:keydown={(e) => { if (e.key === "Enter") window.location = makeChannelUrl(v.channel_id); }}
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
        {/each}
      </div>
    {/if}
  </div>
{/if}

{#if isMobile && showMobileBar && !sortBarIsVisibleMobile}
  <div
    class="mobile-more-bar"
    role="button"
    tabindex="0"
    on:click={() => { showMobileBar = false; sortBarIsVisibleMobile = true; }}
    on:keydown={(e) => { if (e.key === "Enter" || e.key === " ") { showMobileBar = false; sortBarIsVisibleMobile = true; } }}
  >
    <span class="mobile-more-bar-label">More videos like this</span>
    <span class="mobile-more-bar-chevron"><ChevronUp size={22} /></span>
  </div>
{/if}



<style>
.sidebar-root {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.1em;
  height: 100vh;
  max-height: 100vh;
  box-sizing: border-box;
  background: #fff;
  padding: 1.1rem 0 1.1rem 0;
    flex: 1 1 0;
  min-height: 0;

  padding-bottom: calc(1.1rem + env(safe-area-inset-bottom, 0));
}

.sidebar-header {
  font-size: 1.02em;
  font-weight: 600;
  color: #101720;
  margin-bottom: 0.2em;
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  position: relative;
}
.sidebar-title {
  font-weight: 600;
  font-size: 1.1em;
  color: #101720;
  display: inline-block;
}
.sidebar-hide-btn {
  background: none;
  border: none;
  margin-left: 0.55em;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  color: #222;
  transition: background 0.11s;
  position: absolute;
  right: 0.2em;
  top: 0;
}
.sidebar-hide-btn:focus {
  outline: 2px solid #e93c2f;
  outline-offset: 2px;
}
@media (min-width: 801px) {
  .sidebar-hide-btn {
    display: none;
  }
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
  min-height: 0;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.6em;
  margin: 0.1em 0 0 0;
  padding-bottom: 0.5em;
}

/* NEW: Perfectly aligned, larger thumbnail */
.sidebar-card.horizontal-card {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px #e4e4e466;
  border: 1px solid #ececec;
  min-height: 98px;
  height: 98px;
  padding: 0;
  gap: 1.03em;
  transition: box-shadow 0.15s, border 0.15s;
  outline: none;
  overflow: hidden;
}

.sidebar-thumb-wrapper {
  position: relative;
  min-width: 174px;
  max-width: 174px;
  height: 98px;
  aspect-ratio: 16/9;
  border-radius: 6px 0 0 6px;
  overflow: hidden;
  background: #f0f0f0;
  box-shadow: none;
  display: flex;
  align-items: stretch;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 0;
  background: #ededed;
  min-width: 0;
  min-height: 0;
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
  flex: 1 1 0;
  padding: 0.36em 0.2em 0.36em 0.15em;
  height: 100%;
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
  line-clamp: 2;
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
  flex: 1 1 0;
  min-width: 0;
  max-width: 105px;
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
.mobile-more-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;
  background: #fff;
  color: #111;
  font-weight: bold;
  font-size: 1rem;
  text-align: left;
  padding: 0.75em 1em 0.75em 1em;
  border-top: 1px solid #eee;
  z-index: 9999;
  letter-spacing: 0.01em;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  box-shadow: 0 -1px 8px 0 rgba(0,0,0,0.01);
}
.mobile-more-bar-label {
  font-size: 1rem;
}
.mobile-more-bar-chevron {
  display: flex;
  align-items: center;
  margin-left: 1em;
}
@media (min-width: 801px) {
  .mobile-more-bar {
    display: none;
  }
  .sidebar-hide-btn {
    display: none;
  }
}

@media (max-width: 800px) {
  .sidebar-root {
    font-size: 0.92rem;
    padding-top: 0.3rem;
    padding-bottom: 0.4rem;
  }
  .sidebar-header {
    font-size: 0.93em;
    margin-bottom: 0.09em;
    gap: 0.12em;
    flex-direction: row;
    align-items: center;
  }
  .sidebar-title {
    font-size: 0.98em;
    margin-bottom: 0.14em;
  }
  .sidebar-toggles,
  .toggle,
  .toggle-label {
    font-size: 0.91em !important;
    margin-top: 0.04em !important;
    margin-bottom: 0.04em !important;
    padding-top: 0;
    padding-bottom: 0;
  }
  .sidebar-card-list {
    margin-top: 0.23em;
    gap: 0.36em;
    padding-bottom: 0.2em;
  }
  .sidebar-card.horizontal-card {
    min-height: 100px;
    height: 100px;
    padding: 0;
    gap: 0;
    align-items: stretch;
  }
  .sidebar-thumb-wrapper,
  .sidebar-thumb {
    width: 48vw;
    min-width: 110px;
    max-width: 170px;
    height: 100px;
    min-height: 100px;
    max-height: 100px;
    border-radius: 7px 0 0 7px;
    margin-right: 0.07em;
  }
  .sidebar-card-content {
    padding: 0 0.17em;
  }
  .sidebar-title-row {
    gap: 0.18em;
    margin-bottom: 0.03em;
  }
  .sidebar-card-title {
    font-size: 0.96em;
    line-height: 1.19;
    -webkit-line-clamp: 2;
    max-height: 2.3em;
  }
  .sidebar-card-meta {
    font-size: 0.89em;
    margin-top: 0.06em;
    gap: 0.14em;
  }
  .ds-difficulty-badge {
    width: 20px;
    height: 20px;
    font-size: 0.97em;
  }
  .meta-link {
    font-size: 0.91em;
    padding: 0.08em 0.21em;
    max-width: 95px;
  }
}
</style>
