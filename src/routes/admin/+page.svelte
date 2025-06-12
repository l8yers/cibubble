<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  let users = [];
  let videos = [];
  let playlists = [];
  let channels = [];
  let loading = true;
  let error = '';
  let stats = null;

  // New playlist-level settings
  let editingPlaylist = null;
  let newLevel = '';

  async function fetchAll() {
    loading = true;
    error = '';
    try {
      // Grab stats
      const { data: statsData } = await supabase.rpc('get_video_stats'); // assuming you have a stats function
      stats = statsData;

      // Users
      const { data: usersData } = await supabase.from('profiles').select('*');
      users = usersData || [];

      // Videos
      const { data: videosData } = await supabase.from('videos').select('*');
      videos = videosData || [];

      // Playlists
      const { data: playlistsData } = await supabase.from('playlists').select('*');
      playlists = playlistsData || [];

      // Channels
      const { data: channelsData } = await supabase.from('channels').select('*');
      channels = channelsData || [];

    } catch (e) {
      error = e.message || 'Unknown error';
    }
    loading = false;
  }

  onMount(fetchAll);

  async function setPlaylistLevel(playlistId, level) {
    await supabase.from('playlists').update({ level }).eq('id', playlistId);
    fetchAll();
  }
  function startEditPlaylist(pl) {
    editingPlaylist = pl.id;
    newLevel = pl.level || '';
  }
  function cancelEditPlaylist() {
    editingPlaylist = null;
    newLevel = '';
  }
  async function savePlaylistLevel(pl) {
    await setPlaylistLevel(pl.id, newLevel);
    editingPlaylist = null;
    newLevel = '';
  }
</script>

{#if loading}
  <div class="admin-panel">
    <h2>ADMIN2 (No protection, for debug)</h2>
    <p>Loading…</p>
  </div>
{:else}
  <div class="admin-panel">
    <h2>ADMIN2 (No protection, for debug)</h2>
    {#if error}
      <div class="error">{error}</div>
    {/if}
    <section>
      <h3>Stats</h3>
      {#if stats}
        <pre>{JSON.stringify(stats, null, 2)}</pre>
      {:else}
        <span>No stats function found or not set up.</span>
      {/if}
    </section>
    <section>
      <h3>Users ({users.length})</h3>
      <ul>
        {#each users as user}
          <li>{user.email} — {user.id}</li>
        {/each}
      </ul>
    </section>
    <section>
      <h3>Videos ({videos.length})</h3>
      <ul>
        {#each videos.slice(0, 10) as video} <!-- Only show first 10 for brevity -->
          <li>{video.title} — {video.id} — Level: {video.level}</li>
        {/each}
        {#if videos.length > 10}
          <li>…and {videos.length - 10} more</li>
        {/if}
      </ul>
    </section>
    <section>
      <h3>Playlists ({playlists.length})</h3>
      <ul>
        {#each playlists as pl}
          <li>
            <strong>{pl.title}</strong> — Level: 
            {#if editingPlaylist === pl.id}
              <input bind:value={newLevel} placeholder="Set level"/>
              <button on:click={() => savePlaylistLevel(pl)}>Save</button>
              <button on:click={cancelEditPlaylist}>Cancel</button>
            {:else}
              {pl.level || 'Unset'} 
              <button on:click={() => startEditPlaylist(pl)}>Edit</button>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
    <section>
      <h3>Channels ({channels.length})</h3>
      <ul>
        {#each channels.slice(0, 10) as ch}
          <li>{ch.name} — {ch.id}</li>
        {/each}
        {#if channels.length > 10}
          <li>…and {channels.length - 10} more</li>
        {/if}
      </ul>
    </section>
    <button on:click={fetchAll}>Reload</button>
  </div>
{/if}

<style>
  .admin-panel {
    max-width: 900px;
    margin: 2em auto;
    background: var(--bg-light, #f7f7f7);
    border-radius: 18px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    padding: 2em 2em 2em 2em;
    font-size: 1.1em;
  }
  h2, h3 { margin-top: 0; }
  .error { color: #b12c2c; background: #ffd3d3; padding: 0.5em; border-radius: 9px; }
  ul { padding-left: 1.1em; }
  li { margin-bottom: 0.5em; }
  button { margin-left: 0.5em; }
  input { font-size: 1em; padding: 0.2em; border-radius: 6px; border: 1px solid #ddd; }
</style>
