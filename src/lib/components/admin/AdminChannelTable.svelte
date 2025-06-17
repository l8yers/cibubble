<script>
  import TagManager from '$lib/components/TagManager.svelte';
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
<table class="admin-table">
  <thead>
    <tr>
      <th>Channel</th>
      <th>Country</th>
      <th>Tags</th>
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
          <select bind:value={chan._country} aria-label="Select country">
            <option value="">No Country</option>
            {#each countryOptions as country}
              <option value={country}>{country}</option>
            {/each}
          </select>
          {#if chan.country !== chan._country}
            <button class="main-btn small" on:click={() => setChannelCountry(chan.id, chan._country)} disabled={settingCountry[chan.id]}>
              {settingCountry[chan.id] ? 'Saving…' : 'Save'}
            </button>
          {/if}
        </td>
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
          <div>
            <TagManager channelId={chan.id} currentTags={chan._tags} onTagChanged={refresh} />
          </div>
        </td>
        <td>
          <select bind:value={chan._newLevel} aria-label="Set channel level">
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
          <button class="main-btn small" on:click={() => setChannelLevel(chan.id, chan._newLevel)} disabled={!chan._newLevel || settingLevel[chan.id]}>
            {settingLevel[chan.id] ? 'Setting…' : 'Set Level'}
          </button>
        </td>
        <td>
          <button class="main-btn light"
            on:click={() => togglePlaylistsFor(chan.id)}
            aria-expanded={showPlaylistsFor === chan.id}
            aria-label={showPlaylistsFor === chan.id ? 'Hide playlists' : 'Show playlists'}>
            {showPlaylistsFor === chan.id ? '▲ Hide Playlists' : '▼ Show Playlists'}
          </button>
        </td>
        <td>
          <button class="danger-btn small" on:click={() => deleteChannel(chan.id)} disabled={!!deleting[chan.id]}>
            {deleting[chan.id] ? 'Deleting…' : 'Delete'}
          </button>
        </td>
      </tr>
      {#if showPlaylistsFor === chan.id}
        <tr class="collapsible-row">
          <td class="playlists-cell" colspan="6">
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
        <td colspan="6" style="text-align:center;color:#999;">No channels found.</td>
      </tr>
    {/if}
  </tbody>
</table>
