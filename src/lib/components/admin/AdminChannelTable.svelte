<script>
  import AdminTagManager from '$lib/components/admin/AdminTagManager.svelte';

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
  <div class="pagination">
    <button on:click={() => goToPage(1)} disabled={currentPage===1}>&laquo; First</button>
    <button on:click={() => goToPage(currentPage-1)} disabled={currentPage===1}>&lsaquo; Prev</button>
    {#each Array(totalPages) as _, i (i)}
      {#if Math.abs(currentPage - (i + 1)) <= 2 || i === 0 || i === totalPages - 1}
        {#if currentPage === i + 1}
          <span class="current">{i + 1}</span>
        {:else}
          <button on:click={() => goToPage(i + 1)}>{i + 1}</button>
        {/if}
      {:else if Math.abs(currentPage - (i + 1)) === 3}
        <span>…</span>
      {/if}
    {/each}
    <button on:click={() => goToPage(currentPage+1)} disabled={currentPage===totalPages}>Next &rsaquo;</button>
    <button on:click={() => goToPage(totalPages)} disabled={currentPage===totalPages}>Last &raquo;</button>
    {#if refreshing}
      <span style="margin-left:1em;">Refreshing…</span>
    {/if}
  </div>
</div>

<style>
.admin-section {
  width: 100%;
}
.admin-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.2em;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 3px 16px 0 #0002;
}
.admin-table th, .admin-table td {
  padding: 0.45em 0.9em;
  text-align: left;
  border-bottom: 1px solid #f0f2fa;
}
.admin-table th {
  background: #f7fafd;
  font-weight: 600;
}
.admin-table-compact th, .admin-table-compact td {
  font-size: 1.08em;
}
.pagination {
  display: flex;
  gap: 0.15em;
  align-items: center;
  justify-content: center;
  margin: 1.1em 0 0.8em 0;
}
.pagination button {
  background: #eee;
  border: none;
  border-radius: 7px;
  padding: 0.22em 0.8em;
  cursor: pointer;
  font-size: 1.05em;
  min-width: 2.2em;
  transition: background 0.14s;
}
.pagination button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.pagination .current {
  font-weight: bold;
  background: #e93c2f;
  color: #fff;
  border-radius: 8px;
  padding: 0.23em 0.9em;
}
</style>
