<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let videos = [];
  let loading = false;
  let errorMsg = '';
  let offset = 0;
  const pageSize = 30;
  let allLoaded = false;

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

  async function loadVideos({ reset = false } = {}) {
    if (loading || allLoaded) return;
    loading = true;
    errorMsg = '';

    if (reset) {
      const { data, error } = await supabase
        .from('videos')
        .select('*, playlist:playlist_id(title), channel:channel_id(name)')
        .limit(500);
      if (error) errorMsg = error.message;
      else if (data && data.length > 0) {
        let filtered = data.filter(v => v.thumbnail && v.title !== 'Private video');
        let shuffled = filtered.sort(() => Math.random() - 0.5);
        videos = shuffled.slice(0, pageSize);
        offset = pageSize;
        allLoaded = false;
      } else {
        videos = [];
        allLoaded = true;
      }
      loading = false;
      return;
    }

    const { data, error } = await supabase
      .from('videos')
      .select('*, playlist:playlist_id(title), channel:channel_id(name)')
      .limit(500);
    if (error) errorMsg = error.message;
    else if (data && data.length > 0) {
      let filtered = data.filter(v => v.thumbnail && v.title !== 'Private video');
      let shuffled = filtered.sort(() => Math.random() - 0.5);
      let next = shuffled.slice(offset, offset + pageSize);
      if (next.length) {
        videos = [...videos, ...next];
        offset += next.length;
        if (next.length < pageSize) allLoaded = true;
      } else {
        allLoaded = true;
      }
    } else {
      allLoaded = true;
    }
    loading = false;
  }

  function handleScroll() {
    if (allLoaded || loading) return;
    const scrollPosition = window.innerHeight + window.scrollY;
    const docHeight = document.body.offsetHeight;
    if (docHeight - scrollPosition < 500) {
      loadVideos();
    }
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
  font-size: 0.97em;
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
  {#if errorMsg}
    <div class="error-msg">{errorMsg}</div>
  {/if}

  <div class="grid">
    {#each videos as video}
      <div class="card">
        <a href={`/video/${video.id}`}>
          <span class="thumb-wrapper">
            <img
              class="thumb"
              src={`https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`}
              alt={video.title}
              on:error={(e) => { e.target.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`; }}
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
    <p style="text-align:center;margin:2em 0;">No videos yet.</p>
  {/if}
</div>
