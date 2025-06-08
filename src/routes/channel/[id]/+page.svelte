<script>
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let videos = [];
  let channel = null;
  let loading = true;

  $: id = $page.params.id;

  onMount(async () => {
    // Get channel info
    const { data: ch } = await supabase.from('channels').select('*').eq('id', id).maybeSingle();
    channel = ch;
    // Get videos for this channel
    const { data } = await supabase
      .from('videos')
      .select('*, playlist:playlist_id(title)')
      .eq('channel_id', id)
      .order('created', { ascending: false });
    videos = data || [];
    loading = false;
  });
</script>

<h2 style="margin:2.2em 0 1em 0;">Channel: {channel?.name || id}</h2>
{#if loading}
  <p>Loading…</p>
{:else if videos.length === 0}
  <p>No videos for this channel.</p>
{:else}
  <ul>
    {#each videos as v}
      <li>
        <a href={`/video/${v.id}`}>{v.title}</a>
        {#if v.playlist?.title} — <span style="color:#888;">{v.playlist.title}</span>{/if}
      </li>
    {/each}
  </ul>
{/if}
