<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let videos = [];
  let loading = false;
  let errorMsg = '';
  let offset = 0;
  const pageSize = 30;
  let allLoaded = false;

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

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
        videos = shuffle(data).slice(0, pageSize);
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
}
.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
  margin: 2rem 0;
}
.card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px #eee;
  display: flex;
  flex-direction: column;
  transition: transform 0.1s;
}
.card:hover { transform: translateY(-4px) scale(1.03);}
.thumb {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  background: #eee;
}
.card-body {
  padding: 1rem;
  color: #222;
}
.card-title {
  font-size: 1.08rem;
  margin-bottom: 0.3em;
  font-weight: bold;
  min-height: 2.2em;
  max-height: 2.3em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.card-meta {
  font-size: 0.92rem;
  color: #888;
  display: flex;
  align-items: center;
  gap: 0.5em;
  flex-wrap: wrap;
  margin-top: 0.4em;
}
.badge {
  display: inline-block;
  font-size: 0.85em;
  font-weight: 600;
  padding: 0.24em 0.85em;
  border-radius: 100px;
  margin-right: 0.5em;
  margin-bottom: 0.1em;
  color: #fff;
  background: #bbb;
  letter-spacing: 0.01em;
  border: 1.5px solid transparent;
  text-shadow: 0 1px 4px #0001;
  white-space: nowrap;
}
a {
  color: #e93c2f;
  text-decoration: none;
  margin-right: 0.7em;
}
a:hover {
  text-decoration: underline;
}
.error-msg {
  color: #c00;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
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
          <img class="thumb" src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt={video.title} />
        </a>
        <div class="card-body">
          <div class="card-title">{video.title}</div>
          <div class="card-meta">
            <span
              class="badge"
              style="background:{difficultyColor(video.level)};">
              {difficultyLabel(video.level)}
            </span>
            <a href={`/channel/${video.channel_id}`}>{video.channel?.name ?? video.channel_name ?? "Unknown Channel"}</a>
            &middot;
            <a href={`/playlist/${video.playlist_id}`}>{video.playlist?.title ?? "Unknown Playlist"}</a>
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
