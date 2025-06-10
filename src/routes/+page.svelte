<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  // --- CONFIG ---
  const levels = [
    { value: 'superbeginner', label: 'Super Beginner', color: '#44c366' },
    { value: 'beginner', label: 'Beginner', color: '#2e9be6' },
    { value: 'intermediate', label: 'Intermediate', color: '#f9c846' },
    { value: 'advanced', label: 'Advanced', color: '#e93c2f' }
  ];
  const sortChoices = [
    { value: 'random', label: 'Random' },
    { value: 'easy', label: 'Easy' },
    { value: 'hard', label: 'Hard' },
    { value: 'long', label: 'Long' },
    { value: 'short', label: 'Short' }
  ];

  // --- STATE ---
  let allVideos = [];
  let videos = [];
  let loading = false;
  let errorMsg = '';
  const pageSize = 30;
  let allLoaded = false;
  let selectedLevels = new Set(levels.map(l => l.value));
  let showLevelDropdown = false;
  let showSortDropdown = false;
  let sortBy = 'random';
  let hideWatched = false;
  let watchedIds = new Set();

  // --- UTILS ---
  function difficultyLabel(level) {
    const found = levels.find(l => l.value === level);
    return found ? found.label : 'Not Yet Rated';
  }
  function difficultyColor(level) {
    return levels.find(l => l.value === level)?.color ?? '#bbb';
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
  function levelOrder(level) {
    return ['superbeginner', 'beginner', 'intermediate', 'advanced'].indexOf(level);
  }
  function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // --- FILTER/SORT LOGIC ---
  function filterAndSort(input) {
    let filtered = input.filter(v =>
      v.title !== 'Private video' &&
      v.title !== 'Deleted video' &&
      v.title &&
      v.title !== null &&
      (selectedLevels.has(v.level))
    );
    if (hideWatched) {
      filtered = filtered.filter(v => !watchedIds.has(String(v.id)));
    }
    if (sortBy === 'random') {
      return shuffleArray(filtered);
    } else if (sortBy === 'easy') {
      return filtered.sort((a, b) => levelOrder(a.level) - levelOrder(b.level));
    } else if (sortBy === 'hard') {
      return filtered.sort((a, b) => levelOrder(b.level) - levelOrder(a.level));
    } else if (sortBy === 'long') {
      return filtered.sort((a, b) => (b.length || 0) - (a.length || 0));
    } else if (sortBy === 'short') {
      return filtered.sort((a, b) => (a.length || 0) - (b.length || 0));
    }
    return filtered;
  }

  // --- DATA LOAD ---
  async function loadWatchedIds() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('watch_sessions')
        .select('video_id')
        .eq('user_id', session.user.id);
      watchedIds = new Set((data ?? []).map(x => String(x.video_id)));
    } else {
      watchedIds = new Set();
    }
  }

  async function loadVideos({ reset = false } = {}) {
    if (loading || allLoaded) return;
    loading = true;
    errorMsg = '';
    if (reset) {
      const { data, error } = await supabase
        .from('videos')
        .select('*, playlist:playlist_id(title), channel:channel_id(name)')
        .limit(2000);
      if (error) errorMsg = error.message;
      else if (data && data.length > 0) {
        allVideos = data;
        updateGrid();
      } else {
        videos = [];
        allLoaded = true;
      }
      loading = false;
      return;
    }
    // Lazy load (append next page)
    const alreadyShown = new Set(videos.map(v => v.id));
    const unseen = filterAndSort(allVideos).filter(v => !alreadyShown.has(v.id));
    if (unseen.length === 0) {
      allLoaded = true;
      loading = false;
      return;
    }
    const nextBatch = unseen.slice(0, pageSize);
    videos = [...videos, ...nextBatch];
    if (videos.length >= filterAndSort(allVideos).length) allLoaded = true;
    loading = false;
  }

  function updateGrid() {
    videos = filterAndSort(allVideos).slice(0, pageSize);
    allLoaded = videos.length >= filterAndSort(allVideos).length;
  }

  function handleScroll() {
    if (allLoaded || loading) return;
    const scrollPosition = window.innerHeight + window.scrollY;
    const docHeight = document.body.offsetHeight;
    if (docHeight - scrollPosition < 500) {
      loadVideos();
    }
  }

  // --- CONTROLS HANDLERS ---
  function toggleLevel(level) {
    if (selectedLevels.has(level)) {
      selectedLevels.delete(level);
    } else {
      selectedLevels.add(level);
    }
    updateGrid();
  }
  function allLevelsSelected() {
    return selectedLevels.size === levels.length;
  }
  function toggleAllLevels() {
    if (allLevelsSelected()) {
      selectedLevels = new Set();
    } else {
      selectedLevels = new Set(levels.map(l => l.value));
    }
    updateGrid();
  }
  function handleSortSelect(value) {
    sortBy = value;
    showSortDropdown = false;
    updateGrid();
  }
  function handleLevelDropdownToggle() {
    showLevelDropdown = !showLevelDropdown;
  }
  function handleSortDropdownToggle() {
    showSortDropdown = !showSortDropdown;
  }

  // Dropdown close on outside click
  function handleClickOutside(node, cb) {
    const onClick = e => { if (!node.contains(e.target)) cb(); };
    document.addEventListener('mousedown', onClick);
    return { destroy: () => document.removeEventListener('mousedown', onClick) };
  }

  onMount(async () => {
    await loadWatchedIds();
    await loadVideos({ reset: true });
    updateGrid();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });
</script>

<style>
.page-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 2rem 2vw 2.5rem 2vw;
  font-family: Inter, Arial, sans-serif;
}
.controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.2em;
  max-width: 1380px;
  margin: 0 0 1.5em 0;
  margin-left: auto;
  margin-right: auto;
  background: #f7f7fb;
  padding: 0.7em 1.5em 0.7em 1.2em;
  border-radius: 18px;
  border: 1.7px solid #ececec;
  box-shadow: 0 2px 16px #ececec60;
}
.controls-left {
  display: flex;
  align-items: center;
  gap: 1.2em;
}
.controls-right {
  margin-left: auto;
  display: flex;
  align-items: center;
}
@media (max-width: 900px) {
  .controls-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 0.7em 0.8em;
  }
  .controls-left,
  .controls-right {
    margin-left: 0;
    justify-content: flex-start;
  }
  .controls-right {
    justify-content: flex-end;
    margin-top: 0.7em;
  }
}
.dropdown {
  position: relative;
  min-width: 120px;
}
.dropdown-btn {
  padding: 0.42em 1.1em;
  font-size: 1.05em;
  border-radius: 12px;
  border: 1.2px solid #ececec;
  background: #f9f9f9;
  color: #1d1d1d;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5em;
  min-width: 110px;
  transition: border 0.11s, background 0.11s;
}
.dropdown-btn[aria-expanded="true"] {
  background: #f1f5fb;
  border: 1.2px solid #bbb;
}
.dropdown-content {
  position: absolute;
  z-index: 10;
  background: #fff;
  border: 1.3px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 2px 18px #eee;
  min-width: 180px;
  padding: 0.8em 0.6em;
  top: 110%;
  left: 0;
  font-size: 1em;
}
.levels-list {
  display: flex;
  flex-direction: column;
  gap: 0.6em;
  margin: 0.3em 0 0.4em 0;
}
.level-checkbox {
  display: flex;
  align-items: center;
  gap: 0.6em;
  font-size: 1.03em;
}
.switch-bar {
  display: flex;
  align-items: center;
}
.switch-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  color: #1d1d1d;
  gap: 0.4em;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 0.33em 0.7em 0.33em 0.33em;
  border: 1px solid #ececec;
  user-select: none;
}
.switch-label input {
  display: none;
}
.switch-slider {
  width: 34px;
  height: 20px;
  background: #e8e8e8;
  border-radius: 12px;
  position: relative;
  transition: background 0.13s;
  margin-right: 0.35em;
}
.switch-label input:checked + .switch-slider {
  background: #26890d;
}
.switch-slider::before {
  content: '';
  position: absolute;
  width: 15px;
  height: 15px;
  left: 2.2px;
  top: 2.2px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.13s;
}
.switch-label input:checked + .switch-slider::before {
  transform: translateX(14px);
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
@media (max-width: 1200px) {
  .grid { grid-template-columns: repeat(3, 1fr);}
}
@media (max-width: 900px) {
  .controls-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 0.7em 0.8em;
  }
  .controls-left,
  .controls-right {
    margin-left: 0;
    justify-content: flex-start;
  }
  .controls-right {
    justify-content: flex-end;
    margin-top: 0.7em;
  }
}
@media (max-width: 800px) {
  .grid { grid-template-columns: repeat(1, 1fr);}
}
</style>

<div class="page-container">
  <!-- Selection Controls Bar -->
  <div class="controls-bar">
    <div class="controls-left">
      <!-- Sort By Dropdown -->
      <div class="dropdown" use:handleClickOutside={() => showSortDropdown = false}>
        <button
          class="dropdown-btn"
          aria-expanded={showSortDropdown}
          on:click={handleSortDropdownToggle}
          type="button"
        >
          Sort by
          <svg width="12" height="9" style="margin-left:7px;" fill="none">
            <path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2"/>
          </svg>
        </button>
        {#if showSortDropdown}
          <div class="dropdown-content">
            {#each sortChoices as opt}
              <div style="padding:0.32em 0.2em;cursor:pointer;" on:click={() => handleSortSelect(opt.value)}>
                {opt.label}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Levels Dropdown -->
      <div class="dropdown" use:handleClickOutside={() => showLevelDropdown = false}>
        <button
          class="dropdown-btn"
          aria-expanded={showLevelDropdown}
          on:click={handleLevelDropdownToggle}
          type="button"
        >
          Levels
          <svg width="12" height="9" style="margin-left:7px;" fill="none">
            <path d="M1 1l5 6 5-6" stroke="#888" stroke-width="2"/>
          </svg>
        </button>
        {#if showLevelDropdown}
          <div class="dropdown-content">
            <div style="margin-bottom:0.5em;font-size:1em;font-weight:600;">Include</div>
            <div class="levels-list">
              {#each levels as lvl}
                <label class="level-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedLevels.has(lvl.value)}
                    on:change={() => toggleLevel(lvl.value)}
                  />
                  <span>{lvl.label}</span>
                </label>
              {/each}
            </div>
            <div style="margin-top:0.4em;">
              <button style="font-size:0.97em;color:#176cda;background:none;border:none;cursor:pointer;" on:click={toggleAllLevels}>
                {allLevelsSelected() ? "Clear all" : "Select all"}
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Hide Watched Switch (right side) -->
    <div class="controls-right">
      <div class="switch-bar">
        <label class="switch-label">
          <input type="checkbox" bind:checked={hideWatched} on:change={updateGrid} />
          <span class="switch-slider"></span>
          Hide watched
        </label>
      </div>
    </div>
  </div>

  <!-- Grid -->
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
            <a class="meta-link" href={`/channel/${video.channel_id}`}>
              {video.channel?.name ?? video.channel_name ?? "Unknown Channel"}
            </a>
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

  {#if loading}
    <p style="text-align:center;margin:2em 0;">Loading…</p>
  {:else if allLoaded && videos.length > 0}
    <p style="text-align:center;color:#888;">No more videos to load.</p>
  {:else if videos.length === 0}
    <p style="text-align:center;margin:2em 0;">No videos found.</p>
  {/if}
</div>
