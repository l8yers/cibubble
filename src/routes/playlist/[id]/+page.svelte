
<script>
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let videos = [];
  let playlist = null;
  let loading = true;

  $: id = $page.params.id;

  onMount(async () => {
    // Get playlist info
    const { data: pl } = await supabase.from('playlists').select('*').eq('id', id).maybeSingle();
    playlist = pl;
    // Get videos for this playlist
    const { data } = await supabase
      .from('videos')
      .select('*, channel:channel_id(name)')
      .eq('playlist_id', id)
      .order('created', { ascending: false });
    videos = data || [];
    loading = false;
  });
</script>

<h2 style="margin:2.2em 0 1em 0;">Playlist: {playlist?.title || id}</h2>
{#if loading}
  <p>Loading…</p>
{:else if videos.length === 0}
  <p>No videos for this playlist.</p>
{:else}
  <ul>
    {#each videos as v}
      <li>
        <a href={`/video/${v.id}`}>{v.title}</a>
        {#if v.channel?.name} — <span style="color:#888;">{v.channel.name}</span>{/if}
      </li>
    {/each}
  </ul>
{/if}
