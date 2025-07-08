<script>
  import { supabase } from '$lib/supabaseClient';
  export let channelId;
  export let open = false;
  export let onClose = () => {};

  let playlists = [];
  let loading = false;
  let error = '';
  let updating = {};

  async function fetchPlaylists() {
    if (!channelId) return;
    loading = true;
    error = '';
    try {
      const { data, error: err } = await supabase
        .from('playlists')
        .select('*')
        .eq('channel_id', channelId);
      if (err) throw err;
      playlists = data;
    } catch (err) {
      error = err.message || 'Error loading playlists.';
    } finally {
      loading = false;
    }
  }

  async function setPlaylistLevel(playlistId, level) {
    updating = { ...updating, [playlistId]: true };
    try {
      const { error } = await supabase
        .from('playlists')
        .update({ level })
        .eq('id', playlistId);
      if (error) throw error;
      // Update local state
      playlists = playlists.map(p => p.id === playlistId ? { ...p, level } : p);
    } catch (err) {
      alert("Failed to update playlist level: " + (err.message || err));
    }
    updating = { ...updating, [playlistId]: false };
  }

  $: if (open && channelId) fetchPlaylists();
</script>

{#if open}
  <div class="modal-backdrop" on:click={onClose}></div>
  <div class="modal">
    <button class="close-btn" on:click={onClose}>&times;</button>
    <h3>Playlists for Channel</h3>
    {#if loading}
      <div>Loading playlists...</div>
    {:else if error}
      <div style="color:red">{error}</div>
    {:else if playlists.length === 0}
      <div>No playlists found.</div>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Level</th>
          </tr>
        </thead>
        <tbody>
          {#each playlists as playlist}
            <tr>
              <td>{playlist.name}</td>
              <td>
                <select
                  bind:value={playlist.level}
                  on:change={e => setPlaylistLevel(playlist.id, e.target.value)}
                  disabled={updating[playlist.id]}
                >
                  <option value="">Set Level</option>
                  <option value="easy">Easy</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="notyet">Not Yet Rated</option>
                </select>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed; left: 0; top: 0; width: 100vw; height: 100vh;
    background: #0005; z-index: 9998;
  }
  .modal {
    position: fixed; left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    background: #fff; border-radius: 12px; padding: 2em 2em 1em 2em;
    z-index: 9999; min-width: 350px; box-shadow: 0 12px 50px #0003;
  }
  .close-btn {
    position: absolute; top: 12px; right: 16px;
    background: none; border: none; font-size: 1.5em; cursor: pointer;
    color: #e93c2f;
  }
  table { width: 100%; margin-top: 1em; }
  th, td { padding: 0.6em 0.5em; text-align: left; }
  th { color: #244fa2; background: #f7fafd; }
</style>
