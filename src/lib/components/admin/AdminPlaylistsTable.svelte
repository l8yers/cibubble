<script>
  export let playlists = [];
  export let playlistsLoading;
  export let levels = [];
  export let settingPlaylistLevel = {};
  export let setPlaylistLevel;
</script>

{#if playlistsLoading}
  <div>Loading playlists…</div>
{:else if playlists.length === 0}
  <div>No playlists found for this channel.</div>
{:else}
  <table class="playlist-table">
    <thead>
      <tr>
        <th>Playlist</th>
        <th>Videos</th>
        <th>Set Level</th>
      </tr>
    </thead>
    <tbody>
      {#each playlists as pl}
        <tr>
          <td>{pl.title}</td>
          <td>{pl.videos_count}</td>
          <td>
            <select bind:value={pl._newLevel} aria-label="Set playlist level">
              <option value="">
                --
                {pl.currentLevel === ''
                  ? 'Not Set'
                  : pl.currentLevel === 'mixed'
                    ? 'Mixed'
                    : levels.find((lvl) => lvl.value === pl.currentLevel)?.label || pl.currentLevel}
                --
              </option>
              {#each levels as lvl}
                <option value={lvl.value}>{lvl.label}</option>
              {/each}
            </select>
            <button class="main-btn small"
              style="margin-left:0.6em"
              on:click={() => setPlaylistLevel(pl.id, pl._newLevel)}
              disabled={!pl._newLevel || settingPlaylistLevel[pl.id]}
              aria-label="Set playlist level"
            >{settingPlaylistLevel[pl.id] ? 'Setting…' : 'Set'}</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
