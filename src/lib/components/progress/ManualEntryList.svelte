<script>
  import { createEventDispatcher } from 'svelte';
  export let manualEntries = [];
  export let formatMinutesOnly;
  export let SENTINEL_DATE = '1975-01-01';

  const dispatch = createEventDispatcher();

  $: sorted = manualEntries.slice().sort((a, b) => b.date.localeCompare(a.date));

  function editEntry(entry) {
    dispatch('edit', { entry });
  }
  function deleteEntry(entry) {
    if (window.confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
      dispatch('delete', { entry });
    }
  }
</script>

<div class="manual-list-panel">
  <div class="manual-list-header">
    <span>Time Added Outside the Platform</span>
    <button class="manual-list-back" on:click={() => dispatch('back')}>Back to Progress</button>
  </div>
  {#if sorted.length === 0}
    <div class="manual-list-empty">No manual time entries found.</div>
  {:else}
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
            <td>
              <button class="edit-btn" title="Edit" on:click={() => editEntry(entry)}>✏️</button>
              <button class="delete-btn" title="Delete" on:click={() => deleteEntry(entry)}>🗑️</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
.manual-list-panel {
  background: #fff;
  border-radius: 14px;
  padding: 1.8em 2em 2em 2em;
  margin: 0.7em 0 1.4em 0;
  box-shadow: 0 1px 4px #e2e2e733;
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
}
.manual-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.1em;
  margin-bottom: 1.3em;
}
.manual-list-back {
  background: #f6f6f6;
  color: #7a7a7a;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1em;
  padding: 0.4em 1.2em;
  cursor: pointer;
  transition: background 0.15s, color 0.14s;
}
.manual-list-back:hover {
  background: #eaeaea;
  color: #e93c2f;
}
.manual-list-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1em;
}
.manual-list-table th,
.manual-list-table td {
  border: none;
  padding: 0.58em 0.5em;
  text-align: left;
}
.manual-list-table th {
  color: #a15a00;
  font-size: 0.99em;
  font-weight: 700;
  background: #fff5e6;
  border-radius: 8px 8px 0 0;
}
.manual-list-table td {
  color: #272727;
  background: #fffcf7;
  border-bottom: 1px solid #f1e1c0;
}
.manual-list-empty {
  color: #b7b7b7;
  text-align: center;
  padding: 2em 0 1.5em 0;
  font-size: 1.09em;
}
.edit-btn, .delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  margin-right: 0.2em;
  margin-left: 0.2em;
  opacity: 0.82;
  transition: opacity 0.13s;
}
.edit-btn:hover { opacity: 1; color: #2873d4;}
.delete-btn:hover { opacity: 1; color: #e93c2f;}
</style>
