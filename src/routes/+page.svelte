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
        .limit(100);
      if (error) errorMsg = error.message;
      else if (data && data.length > 0) {
        videos = data.slice(0, pageSize);
        offset = pageSize;
        allLoaded = false;
      } else {
        videos = [];
        allLoaded = true;
      }
      loading = false;
      return;
    }
    const from = offset;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('videos')
      .select('*, playlist:playlist_id(title), channel:channel_id(name)')
      .order('created', { ascending: false })
      .range(from, to);
    if (error) errorMsg = error.message;
    else if (data && data.length > 0) {
      videos = [...videos, ...data];
      offset += data.length;
      if (data.length < pageSize) allLoaded = true;
    } else {
      allLoaded = true;
    }
    loading = false;
  }
  function handleScroll() {
    if (allLoaded || loading) return;
    const scrollPosition = window.innerHeight + window.scrollY;
    const docHeight = document.body.offsetHeight;
    if (docHeight - scrollPosition < 400) {
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
  gap: 1.25rem;
  margin: 2rem 0;
}
.card {
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px #e8e8e8;
  display: flex;
  flex-direction: column;
  transition: transform 0.13s, box-shadow 0.13s;
  border: 1px solid #ededed;
}
.card:hover {
  transform: translateY(-2px) scale(1.025);
  box-shadow: 0 6px 24px #e4e4e4;
}
.thumb-wrapper {
  position: relative;
  background: #e5e5e5;
}
.thumb {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  background: #eee;
  min-height: 112px;
  display: block;
}
.length-badge {
  position: absolute;
  bottom: 10px;
  right: 12px;
  background: #fff;
  color: #222;
  font-weight: 600;
  font-size: 1em;
  border-radius: 9px 0 0 9px;
  padding: 3px 13px 3px 10px;
  box-shadow: 0 2px 6px #0001, 0 1px 3px #0001;
  letter-spacing: 0.03em;
  opacity: 0.97;
  border: 1.5px solid #e3e3e3;
  pointer-events: none;
  user-select: none;
  z-index: 2;
}
.card-body {
  padding: 1rem 1rem 0.7rem 1rem;
  color: #222;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.card-title {
  font-size: 1.08rem;
  margin-bottom: 0.25em;
  font-weight: 600;
  min-height: 2.2em;
  max-height: 2.3em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.48em;
  margin-top: 0.74em;
  font-size: 0.96em;
}
.badge {
  display: inline-block;
  font-size: 0.89em;
  font-weight: 600;
  padding: 0.23em 0.8em;
  border-radius: 5px;
  margin-right: 0.5em;
  margin-bottom: 0.1em;
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
  border-radius: 4px;
  padding: 0.11em 0.6em;
  margin-right: 0.2em;
  font-weight: 500;
  transition: background 0.13s, color 0.13s;
}
.meta-link:hover {
  background: #e4e4e4;
  color: #e93c2f;
}
.error-msg {
  color: #c00;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 7px;
  padding: 1em;
  margin: 2em auto;
  max-width: 460px;
  text-align: center;
}
@media (max-width: 1450px) {
  .grid { grid-template-columns: repeat(4, 1fr);}
}
@media (max-width: 1150px) {
  .grid { grid-template-columns: repeat(3, 1fr);}
}
@media (max-width: 800px) {
  .grid { grid-template-columns: repeat(2, 1fr);}
}
@media (max-width: 500px) {
  .grid { grid-template-columns: 1fr;}
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
            {#if video.length}
              <span class="length-badge">{formatLength(video.length)}</span>
            {/if}
          </span>
        </a>
        <div class="card-body">
          <div class="card-title">{video.title}</div>
          <div class="card-meta">
            <span
              class="badge"
              style="background:{difficultyColor(video.level)};">
              {difficultyLabel(video.level)}
            </span>
            <a class="meta-link" href={`/channel/${video.channel_id}`}>{video.channel?.name ?? video.channel_name ?? "Unknown Channel"}</a>
            <a class="meta-link" href={`/playlist/${video.playlist_id}`}>{video.playlist?.title ?? "Unknown Playlist"}</a>
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
