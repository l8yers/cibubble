<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';

  let video = null;
  let suggestions = [];
  let loading = true;

  // Get ID from route params
  $: id = $page.params.id;

  onMount(async () => {
    loading = true;

    // Fetch this video
    const { data: vid, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    video = vid;

    // Fetch suggested videos (latest 12, excluding current)
    const { data: suggs } = await supabase
      .from('videos')
      .select('*')
      .order('created', { ascending: false })
      .neq('id', id)
      .limit(12);

    suggestions = suggs || [];
    loading = false;
  });
</script>

<style>
.player-page {
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 2rem auto;
  color: #eee;
}
.player-main {
  flex: 1 1 66%;
  min-width: 0;
}
.player-embed {
  width: 100%;
  aspect-ratio: 16/9;
  background: #111;
  border-radius: 12px;
  margin-bottom: 1.3rem;
  border: 1px solid #222;
}
.player-title {
  font-size: 1.35rem;
  font-weight: bold;
  margin-bottom: 0.35em;
}
.player-channel {
  font-size: 1rem;
  color: #b3b3b3;
  margin-bottom: 1.1em;
}
.suggestions {
  flex: 0 0 340px;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.suggest-card {
  display: flex;
  gap: 0.8em;
  background: #19191e;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #232323;
  transition: background 0.2s;
  cursor: pointer;
}
.suggest-card:hover { background: #23232b; }
.suggest-thumb {
  width: 120px;
  aspect-ratio: 16/9;
  object-fit: cover;
  background: #181818;
}
.suggest-body {
  flex: 1;
  padding: 0.4em 0.6em 0.2em 0.3em;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.suggest-title {
  font-size: 1.02rem;
  font-weight: 600;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 0.19em;
  max-height: 2.2em;
  overflow: hidden;
  text-overflow: ellipsis;
}
.suggest-channel {
  color: #b3b3b3;
  font-size: 0.93rem;
}
@media (max-width: 900px) {
  .player-page { flex-direction: column; }
  .suggestions { flex-direction: row; max-width: unset; gap: 0.8em; margin-top: 1.5rem;}
  .suggest-card { flex-direction: column; width: 150px; min-width: 120px;}
  .suggest-thumb { width: 100%; }
}
</style>

{#if loading}
  <p style="text-align:center; margin-top:3rem;">Loading…</p>
{:else if !video}
  <p style="text-align:center; margin-top:3rem;">Video not found.</p>
{:else}
  <div class="player-page">
    <div class="player-main">
      <div class="player-embed">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${video.id}`}
          title={video.title}
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
      <div class="player-title">{video.title}</div>
      <div class="player-channel">{video.channel_name}</div>
    </div>
    <aside class="suggestions">
      {#each suggestions as v}
        <a class="suggest-card" href={`/video/${v.id}`}>
          <img
            class="suggest-thumb"
            src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
            alt={v.title}
            on:error="{(e) => e.target.src='https://placehold.co/120x67?text=No+Thumb'}"
          />
          <div class="suggest-body">
            <div class="suggest-title">{v.title}</div>
            <div class="suggest-channel">{v.channel_name}</div>
          </div>
        </a>
      {/each}
    </aside>
  </div>
{/if}
