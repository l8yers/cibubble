<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let videos = [];
  let loading = true;
  let errorMsg = '';

  onMount(async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*, playlist:playlist_id(title), channel:channel_id(name)')
      .order('created', { ascending: false })
      .limit(50);

    if (error) {
      errorMsg = error.message;
      videos = [];
    } else if (data) {
      videos = data;
    }
    loading = false;
  });
</script>

<style>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 1.4rem;
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
}
.card-meta a {
  color: #e93c2f;
  text-decoration: none;
  margin-right: 0.7em;
}
.card-meta a:hover {
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
</style>

{#if loading}
  <p>Loading videos…</p>
{:else if errorMsg}
  <div class="error-msg">{errorMsg}</div>
{:else if videos.length === 0}
  <p>No videos yet.</p>
{:else}
  <div class="grid">
    {#each videos as video}
      <div class="card">
        <a href={`/video/${video.id}`}>
          <img class="thumb" src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt={video.title} />
        </a>
        <div class="card-body">
          <div class="card-title">{video.title}</div>
          <div class="card-meta">
            <a href={`/channel/${video.channel_id}`}>{video.channel?.name ?? video.channel_name ?? "Unknown Channel"}</a>
            &middot;
            <a href={`/playlist/${video.playlist_id}`}>{video.playlist?.title ?? "Unknown Playlist"}</a>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}
