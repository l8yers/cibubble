<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  let videos = [];
  let loading = true;

  onMount(async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created', { ascending: false })
      .limit(100);

    console.log('Supabase data:', data);
    console.log('Supabase error:', error);

    if (error) {
      videos = [];
      alert('Error fetching videos: ' + error.message);
    } else if (data) {
      videos = data;
    }
    loading = false;
  });
</script>

<style>
body {
  background: #141414;
}
.page-header {
  color: #eee;
  font-size: 2rem;
  font-weight: 700;
  margin-top: 2rem;
  text-align: center;
  letter-spacing: 1px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
  padding: 0 2vw;
}
.card {
  background: #18181b;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px #0003;
  display: flex;
  flex-direction: column;
  transition: transform 0.1s;
  border: 1px solid #222;
}
.card:hover { transform: translateY(-4px) scale(1.03);}
.thumb {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  background: #222;
}
.card-body {
  padding: 1rem;
  color: #eee;
}
.card-title {
  font-size: 1.05rem;
  margin-bottom: 0.3em;
  font-weight: bold;
  min-height: 2.5em;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-channel {
  font-size: 0.92rem;
  color: #b3b3b3;
  margin-top: 0.3em;
}
@media (max-width: 600px) {
  .grid { grid-template-columns: 1fr; }
  .page-header { font-size: 1.2rem; }
}
</style>

<div class="page-header">CIBUBBLE – Comprehensible Input Video Library</div>

{#if loading}
  <p style="text-align:center; color:#aaa; margin-top:3rem;">Loading videos…</p>
{:else if videos.length === 0}
  <p style="text-align:center; color:#aaa; margin-top:3rem;">No videos yet. Try adding one!</p>
{:else}
  <div class="grid">
    {#each videos as video}
      <div class="card">
        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener">
          <img
            class="thumb"
            src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
            alt={video.title}
            on:error="{(e) => e.target.src='https://placehold.co/480x270?text=No+Thumbnail'}"
          />
        </a>
        <div class="card-body">
          <div class="card-title">{video.title}</div>
          <div class="card-channel">{video.channel_name}</div>
        </div>
      </div>
    {/each}
  </div>
{/if}
