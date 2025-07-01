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
                  <button class="edit-btn" title="Edit" on:click={() => editEntry(entry)}>✏️</button>
                  <button class="delete-btn" title="Delete" on:click={() => deleteEntry(entry)}>🗑️</button>
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
  border-radius: 20px;
  box-shadow: 0 6px 32px #e93c2f33, 0 2px 12px #23232311;
  max-width: 700px;
  width: 98vw;
  padding: 2.1em 2.2em 1.7em 2.2em;
  position: relative;
  margin: 0 auto;
}
@media (max-width: 650px) {
  .manual-list-panel {
    padding: 1.1em 0.4em 1em 0.4em;
    border-radius: 11px;
  }
}

.modal-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.19em;
  font-weight: 800;
  color: #e93c2f;
  margin-bottom: 1.3em;
  letter-spacing: 0.01em;
}
.close-x-btn {
  background: none;
  border: none;
  color: #e93c2f;
  font-size: 1.6em;
  font-weight: 400;
  line-height: 1;
  border-radius: 50%;
  padding: 0.06em 0.45em 0.11em 0.45em;
  cursor: pointer;
  transition: background 0.13s, color 0.13s;
  margin-left: 0.35em;
  margin-top: -0.16em;
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
  font-size: 1.01em;
  background: transparent;
}
.manual-list-table th,
.manual-list-table td {
  border: none;
  padding: 0.58em 0.5em;
  text-align: left;
}
.manual-list-table th {
  color: #cf2f00;
  font-size: 1em;
  font-weight: 800;
  background: #fff5f3;
  border-radius: 8px 8px 0 0;
  letter-spacing: 0.03em;
  border-bottom: 2px solid #ffd6d1;
}
.manual-list-table td {
  color: #181d27;
  background: #fdf9f9;
  border-bottom: 1px solid #f8e2df;
  font-size: 1em;
  font-weight: 500;
  vertical-align: middle;
}
.manual-list-actions {
  text-align: right;
  min-width: 84px;
}
.edit-btn, .delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.21em;
  margin: 0 0.16em;
  opacity: 0.80;
  transition: opacity 0.13s, color 0.11s;
  border-radius: 5px;
}
.edit-btn:hover { opacity: 1; color: #2873d4; background: #f5faff;}
.delete-btn:hover { opacity: 1; color: #e93c2f; background: #fff6f6;}
.manual-list-empty {
  color: #b7b7b7;
  text-align: center;
  padding: 2em 0 1.5em 0;
  font-size: 1.09em;
  font-weight: 600;
}
</style>
