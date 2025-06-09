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
    { value: 'hard', label: 'Hard → Easy' },
    { value: 'easy', label: 'Easy → Hard' },
    { value: 'long', label: 'Longest' },
    { value: 'short', label: 'Shortest' }
  ];

  // --- STATE ---
  let allVideos = [];
  let videos = [];
  let loading = false;
  let errorMsg = '';
  const pageSize = 30;
  let allLoaded = false;
  let selectedLevels = new Set();
  let sortBy = 'random';

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

  // --- SHUFFLE ---
  function channelRoundRobinShuffle(inputVideos, size) {
    const byChannel = {};
    inputVideos.forEach(v => {
      if (!byChannel[v.channel_id]) byChannel[v.channel_id] = [];
      byChannel[v.channel_id].push(v);
    });
    // Shuffle within channels
    for (const arr of Object.values(byChannel)) {
      arr.sort(() => Math.random() - 0.5);
    }
    // Take from each channel, round robin, until filled
    const shuffled = [];
    let keepGoing = true;
    while (keepGoing && shuffled.length < size) {
      keepGoing = false;
      for (const arr of Object.values(byChannel)) {
        if (arr.length) {
          shuffled.push(arr.shift());
          keepGoing = true;
          if (shuffled.length === size) break;
        }
      }
    }
    return shuffled;
  }

  // --- FILTER/SORT LOGIC ---
  function filterAndSort(input) {
    let filtered = input.filter(v =>
      v.title !== 'Private video' &&
      v.title !== 'Deleted video' &&
      v.title &&
      v.title !== null &&
      (selectedLevels.size === 0 || selectedLevels.has(v.level))
    );
    if (sortBy === 'random') {
      // Use round robin shuffle for channel fairness
      return channelRoundRobinShuffle(filtered, filtered.length);
    } else if (sortBy === 'hard') {
      return filtered.sort((a, b) => levelOrder(b.level) - levelOrder(a.level));
    } else if (sortBy === 'easy') {
      return filtered.sort((a, b) => levelOrder(a.level) - levelOrder(b.level));
    } else if (sortBy === 'long') {
      return filtered.sort((a, b) => (b.length || 0) - (a.length || 0));
    } else if (sortBy === 'short') {
      return filtered.sort((a, b) => (a.length || 0) - (b.length || 0));
    }
    return filtered;
  }

  function levelOrder(level) {
    return ['superbeginner', 'beginner', 'intermediate', 'advanced'].indexOf(level);
  }

  // --- DATA LOAD ---
  async function loadVideos({ reset = false } = {}) {
    if (loading || allLoaded) return;
    loading = true;
    errorMsg = '';
    if (reset) {
      const { data, error } = await supabase
        .from('videos')
        .select('*, playlist:playlist_id(title), channel:channel_id(name)')
        .limit(2000); // Load big batch for client-side
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
    // Reset & reload with new filters/sort
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
  function clearLevels() {
    selectedLevels = new Set();
    updateGrid();
  }
  function handleSortChange(ev) {
    sortBy = ev.target.value;
    updateGrid();
  }

  onMount(() => {
    loadVideos({ reset: true });
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
  flex-wrap: wrap;
  align-items: center;
  gap: 1.2em;
  margin: 0 0 1.5em 0;
  max-width: 1380px;
  margin-left: auto;
  margin-right: auto;
}
.select-sort {
  padding: 0.42em 1.1em;
  font-size: 1.05em;
  border-radius: 6px;
  border: 1.2px solid #ececec;
  background: #f9f9f9;
  color: #1d1d1d;
  font-weight: 600;
}
.level-badges {
  display: flex;
  gap: 0.6em;
  align-items: center;
}
.level-btn {
  display: flex;
  align-items: center;
  gap: 0.42em;
  padding: 0.13em 1.1em;
  font-size: 1em;
  border-radius: 18px;
  border: 1.3px solid #ededed;
  background: #fafafa;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  outline: none;
  transition: background 0.13s, color 0.13s;
}
.level-btn.selected {
  background: #f3faff;
  border: 1.3px solid #bbb;
  color: #222;
}
.level-dot {
  width: 18px;
  height: 18px;
  border-radius: 9px;
  margin-right: 0.4em;
  display: inline-block;
}
.level-label {
  white-space: nowrap;
}
.clear-levels {
  margin-left: 0.6em;
  font-size: 0.98em;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
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
@media (max-width: 800px) {
  .grid { grid-template-columns: repeat(1, 1fr);}
  .controls-bar { flex-direction: column; align-items: stretch;}
}
</style>

<div class="page-container">
  <!-- Controls Bar -->
  <div class="controls-bar">
    <!-- Sort By -->
    <label for="sortby" style="font-weight:600;">Sort by:</label>
    <select class="select-sort" id="sortby" bind:value={sortBy} on:change={handleSortChange}>
      {#each sortChoices as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>

    <!-- Level/Difficulty Filter -->
    <div class="level-badges">
      <span style="font-weight:600;">Levels:</span>
      {#each levels as lvl}
        <button
          class="level-btn {selectedLevels.has(lvl.value) ? 'selected' : ''}"
          on:click={() => toggleLevel(lvl.value)}
          type="button"
        >
          <span class="level-dot" style="background:{lvl.color}"></span>
          <span class="level-label">{lvl.label}</span>
        </button>
      {/each}
      <button class="clear-levels" on:click={clearLevels}>Clear</button>
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
