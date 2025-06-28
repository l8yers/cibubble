<script>
  import AdminTagManager from '$lib/components/admin/AdminTagManager.svelte'; // stub if needed

  export let filteredChannels = [];
  export let currentPage = 1;
  export let totalPages = 1;
  export let refreshing = false;
  export let countryOptions = [];
  export let levels = [];
  export let settingCountry = {};
  export let settingLevel = {};
  export let deleting = {};

  export let setChannelCountry;
  export let setChannelLevel;
  export let deleteChannel;
  export let goToPage;
</script>

<div class="admin-section">
  <table class="admin-table admin-table-compact">
    <thead>
      <tr>
        <th>Name</th>
        <th>Country</th>
        <th>Tags</th>
        <th>Level</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each filteredChannels as chan}
        <tr>
          <td>{chan.name}</td>
          <td>
            <select bind:value={chan._country}>
              <option value="">No Country</option>
              {#each countryOptions as country}
                <option value={country}>{country}</option>
              {/each}
            </select>
            {#if chan.country !== chan._country}
              <button on:click={() => setChannelCountry(chan.id, chan._country)} disabled={settingCountry[chan.id]}>
                {settingCountry[chan.id] ? 'Saving…' : 'Save'}
              </button>
            {/if}
          </td>
          <td>
            <AdminTagManager channelId={chan.id} currentTags={chan._tags} />
          </td>
          <td>
            <select bind:value={chan._newLevel}>
              <option value="">
                {levels.find(l => l.value === chan.level)?.label || '-- Not Set --'}
              </option>
              {#each levels as l}
                <option value={l.value}>{l.label}</option>
              {/each}
            </select>
            <button
              on:click={() => setChannelLevel(chan.id, chan._newLevel)}
              disabled={!chan._newLevel || settingLevel[chan.id]}>
              {settingLevel[chan.id] ? 'Saving…' : 'Set'}
            </button>
          </td>
          <td>
            <button style="color:#c11;" on:click={() => deleteChannel(chan.id)} disabled={!!deleting[chan.id]}>
              {deleting[chan.id] ? '…' : 'Delete'}
            </button>
          </td>
        </tr>
      {/each}
      {#if !filteredChannels.length}
        <tr>
          <td colspan="5" style="color:#aaa;">No channels found.</td>
        </tr>
      {/if}
    </tbody>
  </table>

  <!-- PAGINATION -->
  <div style="margin:1em 0;text-align:center;">
    {#if totalPages > 1}
      {#each Array(totalPages) as _, i}
        <button on:click={() => goToPage(i+1)} disabled={currentPage === i+1}>
          {i+1}
        </button>
      {/each}
    {/if}
    {#if refreshing}
      <span style="margin-left:1em;">Refreshing…</span>
    {/if}
  </div>
</div>
