<script>
  import { createEventDispatcher } from 'svelte';
  export let manualEntries = [];
  export let formatMinutesOnly;
  export let SENTINEL_DATE = '1975-01-01';

  const dispatch = createEventDispatcher();

  $: sorted = manualEntries.slice().sort((a, b) => b.date.localeCompare(a.date));

  function editEntry(entry) {
    dispatch('edit', entry);
  }
  function deleteEntry(entry) {
    if (window.confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
      dispatch('delete', entry);
    }
  }
</script>

<div class="manual-list-modal">
  <div class="manual-list-panel">
    <div class="modal-title-row">
      <span>Time Added Outside the Platform</span>
      <button
        class="close-x-btn"
        aria-label="Close"
        on:click={() => dispatch('cancel')}
      >×</button>
    </div>
    {#if sorted.length === 0}
      <div class="manual-list-empty">No manual time entries found.</div>
    {:else}
      <div class="manual-list-table-wrapper">
        <table class="manual-list-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Source / Comment</th>
              <th>Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each sorted as entry}
              <tr>
                <td>{entry.date === SENTINEL_DATE ? "No date" : entry.date}</td>
                <td>{entry.source || "-"}</td>
                <td>{formatMinutesOnly(entry.totalSeconds)}</td>
                <td class="manual-list-actions">
                  <button class="edit-btn" title="Edit" on:click={() => editEntry(entry)}>
                    <svg width="18" height="18" fill="none" stroke="#2873d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                  </button>
                  <button class="delete-btn" title="Delete" on:click={() => deleteEntry(entry)}>
                    <svg width="18" height="18" fill="none" stroke="#e93c2f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<style>
.manual-list-modal {
  position: fixed;
  z-index: 1100;
  left: 0; top: 0; width: 100vw; height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(24,29,39, 0.38);
}
.manual-list-panel {
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 3px 22px 0 #e9eaee18, 0 8px 32px #e93c2f14;
  max-width: 700px;
  width: 97vw;
  padding: 2em 2em 1.4em 2em;
  position: relative;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}
@media (max-width: 650px) {
  .manual-list-panel {
    padding: 1.1em 0.4em 1em 0.4em;
    border-radius: 13px;
  }
}
.modal-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.12em;
  font-weight: 700;
  color: #101720;
  margin-bottom: 1.0em;
  letter-spacing: 0.01em;
  padding-bottom: 0.1em;
  border-bottom: 1.5px solid #f0f2f7;
}
.close-x-btn {
  background: none;
  border: none;
  color: #e93c2f;
  font-size: 1.65em;
  font-weight: 400;
  line-height: 1;
  border-radius: 50%;
  padding: 0.06em 0.45em 0.11em 0.45em;
  cursor: pointer;
  transition: background 0.13s, color 0.13s;
  margin-left: 0.35em;
  margin-top: -0.12em;
}
.close-x-btn:hover, .close-x-btn:focus {
  background: #fff6f6;
  color: #b8271b;
  outline: none;
}
/* Table Styles */
.manual-list-table-wrapper {
  overflow-x: auto;
}
.manual-list-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 1.03em;
  background: transparent;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 8px #e9eaee11;
}
.manual-list-table th,
.manual-list-table td {
  border: none;
  padding: 0.55em 0.5em;
  text-align: left;
}
.manual-list-table th {
  color: #212229;
  font-size: 1em;
  font-weight: 700;
  background: #f5f6fa;
  border-bottom: 2px solid #e3e4e8;
  letter-spacing: 0.03em;
}
.manual-list-table td {
  color: #181d27;
  background: #fff;
  border-bottom: 1px solid #f0f1f4;
  font-size: 1em;
  font-weight: 500;
  vertical-align: middle;
}
.manual-list-table tr:last-child td {
  border-bottom: none;
}
.manual-list-actions {
  text-align: right;
  min-width: 78px;
}
.edit-btn, .delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  margin: 0 0.08em;
  border-radius: 6px;
  padding: 0.18em 0.32em;
  transition: background 0.12s, opacity 0.13s, color 0.11s;
  vertical-align: middle;
}
.edit-btn:hover { background: #f5f6fa; }
.delete-btn:hover { background: #fff6f6; }
.edit-btn svg, .delete-btn svg { display: inline; vertical-align: middle;}
.manual-list-empty {
  color: #b7b7b7;
  text-align: center;
  padding: 2em 0 1.5em 0;
  font-size: 1.09em;
  font-weight: 600;
}
</style>
