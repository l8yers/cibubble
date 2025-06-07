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
.page-header {
  color: #181818;
  font-size: 2.1rem;
  font-weight: 700;
  margin: 2.1rem 0 0.7rem 0;
  text-align: center;
  letter-spacing: 0.5px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 2.1rem;
  margin: 2.5rem 0 1.5rem 0;
  padding: 0 3vw;
  background: #fff;
}
.card {
  background: #fff;
  border-radius: 13px;
  overflow: hidden;
  box-shadow: 0 2px 10px #e4e4e4;
  border: 1px solid #ececec;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s, transform 0.13s;
}
.card:hover {
  box-shadow: 0 8px 28px #e93c2f11;
  transform: translateY(-3px) scale(1.018);
}
.thumb {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  background: #eee;
}
.card-body {
  padding: 1.1em 1em 0.95em 1em;
  color: #181818;
}
.card-title {
  font-size: 1.09rem;
  margin-bottom: 0.3em;
  font-weight: 600;
  min-height: 2.5em;
  line-height: 1.22;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-channel {
  font-size: 0.97rem;
  color: #666;
  margin-top: 0.3em;
}
@media (max-width: 650px) {
  .grid { grid-template-columns: 1fr; }
  .page-header { font-size: 1.2rem; }
}
</style>

{#if loading}
  <p style="text-align:center; color:#aaa; margin-top:3rem;">Loading videos…</p>
{:else if videos.length === 0}
  <p style="text-align:center; color:#aaa; margin-top:3rem;">No videos yet. Try adding one!</p>
{:else}
  <div class="grid">
    {#each videos as video}
      <a href={`/video/${video.id}`} class="card">
        <img
          class="thumb"
          src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
          alt={video.title}
          on:error="{(e) => e.target.src='https://placehold.co/480x270?text=No+Thumbnail'}"
        />
        <div class="card-body">
          <div class="card-title">{video.title}</div>
          <div class="card-channel">{video.channel_name}</div>
        </div>
      </a>
    {/each}
  </div>
{/if}
