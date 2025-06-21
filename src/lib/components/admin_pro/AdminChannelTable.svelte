<script>
  import AdminTagManager from '$lib/components/admin/AdminTagManager.svelte';
  import AdminPlaylistsTable from './AdminPlaylistsTable.svelte';

  export let filteredChannels = [];
  export let countryOptions = [];
  export let levels = [];
  export let showPlaylistsFor;
  export let playlists;
  export let playlistsLoading;
  export let message;
  export let settingCountry;
  export let settingLevel;
  export let settingPlaylistLevel;
  export let deleting;

  export let setChannelCountry;
  export let setChannelLevel;
  export let togglePlaylistsFor;
  export let setPlaylistLevel;
  export let deleteChannel;
  export let refresh;
</script>

{#if message}
  <div class="admin-message" style="margin:1em 0 1.2em 0;">{message}</div>
{/if}

<div class="admin-section">
  <table class="admin-table admin-table-compact">
    <thead>
      <tr>
        <th>Channel</th>
        <th>Country</th>
        <th>Current Tags</th>
        <th>Add Tags</th>
        <th>Level</th>
        <th>Playlists</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each filteredChannels as chan}
        <tr>
          <td><span style="font-weight:600;">{chan.name}</span></td>
          <td>
            <select bind:value={chan._country} aria-label="Select country" class="admin-select admin-select-compact">
              <option value="">No Country</option>
              {#each countryOptions as country}
                <option value={country}>{country}</option>
              {/each}
            </select>
            {#if chan.country !== chan._country}
              <button class="main-btn small inline" on:click={() => setChannelCountry(chan.id, chan._country)} disabled={settingCountry[chan.id]}>
                {settingCountry[chan.id] ? 'Saving…' : 'Save'}
              </button>
            {/if}
          </td>
          <!-- Current Tags Column -->
          <td>
            {#if chan._tags && chan._tags.length > 0}
              <div class="channel-tags-list">
                {#each chan._tags as tag}
                  <span class="tag-pill">{tag.name}</span>
                {/each}
              </div>
            {:else}
              <span style="color:#aaa;">No tags</span>
            {/if}
          </td>
          <!-- Add Tags Column (compact and inline) -->
          <td>
            <div class="add-tags-inline">
              <AdminTagManager channelId={chan.id} currentTags={chan._tags} onTagAdded={refresh} />
            </div>
          </td>
          <!-- Level Column (dropdown + button inline and compact) -->
          <td>
            <div class="level-inline">
              <select bind:value={chan._newLevel} aria-label="Set channel level" class="admin-select admin-select-compact">
                <option value="">
                  {chan._mainLevel === 'mixed'
                    ? '-- Mixed --'
                    : levels.find((lvl) => lvl.value === chan._mainLevel)?.label
                      ? '-- ' + levels.find((lvl) => lvl.value === chan._mainLevel)?.label + ' --'
                      : '-- Not Set --'}
                </option>
                {#each levels as lvl}
                  <option value={lvl.value}>{lvl.label}</option>
                {/each}
              </select>
              <button class="main-btn small inline" on:click={() => setChannelLevel(chan.id, chan._newLevel)} disabled={!chan._newLevel || settingLevel[chan.id]}>
                {settingLevel[chan.id] ? '…' : 'Set'}
              </button>
            </div>
          </td>
          <td>
            <button class="main-btn light small inline"
              on:click={() => togglePlaylistsFor(chan.id)}
              aria-expanded={showPlaylistsFor === chan.id}
              aria-label={showPlaylistsFor === chan.id ? 'Hide playlists' : 'Show playlists'}>
              Playlists
            </button>
          </td>
          <td>
            <button class="danger-btn small inline" on:click={() => deleteChannel(chan.id)} disabled={!!deleting[chan.id]}>
              {deleting[chan.id] ? '…' : 'Delete'}
            </button>
          </td>
        </tr>
        {#if showPlaylistsFor === chan.id}
          <tr class="collapsible-row">
            <td class="playlists-cell" colspan="7">
              <AdminPlaylistsTable
                {playlists}
                {playlistsLoading}
                {levels}
                {settingPlaylistLevel}
                {setPlaylistLevel}
              />
            </td>
          </tr>
        {/if}
      {/each}
      {#if filteredChannels.length === 0}
        <tr>
          <td colspan="7" style="text-align:center;color:#999;">No channels found.</td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>

<style>
  .admin-table-compact th, .admin-table-compact td {
    padding: 0.11em 1.38em;  /* moderate vertical, wide horizontal */
    font-size: 1.01em;       /* up from 0.96em, not as much as before */
    border-bottom: 1px solid #f2f2f2;
    text-align: left;
    vertical-align: middle;
    min-width: 73px;
    max-width: 440px;
    line-height: 1.09;
  }
  .admin-table-compact th {
    background: #f2f8ff;
    color: #e93c2f;
    font-weight: 800;
    font-size: 1.04em;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    padding-top: 0.14em;
    padding-bottom: 0.14em;
  }
  .admin-table-compact tbody tr:nth-child(odd) { background: #f7fafd; }
  .admin-table-compact tbody tr:nth-child(even) { background: #fff; }
  .admin-table-compact tbody tr:hover { background: #eaf4ff !important; }

  .channel-tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.10em;
    margin-bottom: 1px;
  }
  .tag-pill {
    background: #e9f6ff;
    color: #2562e9;
    padding: 0.06em 0.43em;
    border-radius: 7px;
    font-size: 0.95em;
    margin-bottom: 1px;
    display: inline-flex;
    align-items: center;
    transition: background 0.12s, color 0.12s;
  }
  .tag-pill:hover {
    background: #cbe8ff;
    color: #214d77;
  }
  .admin-select {
    border: 1px solid #e3e8ee;
    border-radius: 5px;
    background: #f7fafd;
    color: #1c2541;
    font-size: 0.97em;
    padding: 0.10em 0.33em;
    margin-right: 0.13em;
    outline: none;
    min-width: 66px;
    max-width: 116px;
    height: 1.57em;
    transition: border 0.13s;
    display: inline-block;
    vertical-align: middle;
  }
  .admin-select:focus {
    border-color: #2562e9;
    background: #e9f6ff;
  }
  .admin-select-compact {
    font-size: 0.93em;
    min-width: 63px;
    max-width: 115px;
    height: 1.41em;
    padding: 0.05em 0.21em;
  }
  .main-btn, .danger-btn {
    font-size: 0.95em;
    font-weight: 600;
    padding: 0.05em 0.44em;
    border-radius: 7px;
    border: none;
    margin-left: 0.09em;
    cursor: pointer;
    transition: background 0.13s, color 0.13s, box-shadow 0.14s;
    box-shadow: 0 1px 2px #e3e8ee09;
    vertical-align: middle;
    height: 1.43em;
    line-height: 1.1;
    display: inline-block;
  }
  .main-btn.small,
  .danger-btn.small,
  .main-btn.inline,
  .danger-btn.inline {
    font-size: 0.92em;
    padding: 0.02em 0.34em;
    margin-left: 0.08em;
    border-radius: 6px;
    height: 1.28em;
  }
  .main-btn.light { background: #f7f7fa; color: #262626; font-weight: 500; }
  .main-btn.light:hover { background: #edeffd; }
  .main-btn { background: #f1f6fb; color: #244fa2; }
  .main-btn:hover, .main-btn:focus { background: #dbeafe; color: #152449; }
  .danger-btn { background: #fbeaea; color: #be2231; }
  .danger-btn:hover { background: #f9d7da; color: #b12c2c; }
  .add-tags-inline {
    display: flex;
    align-items: center;
    gap: 0.11em;
    min-width: 95px;
  }
  .level-inline {
    display: flex;
    align-items: center;
    gap: 0.09em;
    min-width: 88px;
  }
  .main-btn.inline, .danger-btn.inline {
    margin-left: 0.08em;
    height: 1.28em;
    padding-top: 0;
    padding-bottom: 0;
  }
  .collapsible-row .playlists-cell {
    padding: 0.10em 0.59em !important;
    background: #f8fafd;
    font-size: 0.97em;
    border-radius: 7px;
  }

  @media (max-width: 900px) {
    .admin-table-compact th, .admin-table-compact td {
      padding: 0.07em 0.18em;
      font-size: 0.97em;
    }
    .channel-tags-list {
      gap: 0.04em;
    }
    .collapsible-cell, .playlists-cell {
      padding: 0.09em 0.13em !important;
    }
  }
  @media (max-width: 600px) {
    .admin-table-compact th, .admin-table-compact td {
      padding: 0.04em 0.03em;
      font-size: 0.92em;
    }
    .add-tags-inline, .level-inline { min-width: unset; }
    .admin-select, .admin-select-compact { min-width: unset; }
  }
</style>
