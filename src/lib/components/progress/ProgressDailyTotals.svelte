<script>
  export let dailyTotals = [];
  export let formatMinutesOnly;
  export let open = false;
  export let onToggle = () => {};

  function prettyDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
</script>

<div class="daily-totals-section">
  <button class="toggle-btn subtle" on:click={onToggle} aria-expanded={open}>
    <span class="toggle-icon">{open ? '➖' : '➕'}</span>
    <span class="toggle-label">{open ? 'Hide Daily Breakdown' : 'Show Daily Breakdown'}</span>
  </button>
  <div class="dropdown-content" aria-hidden={!open} style="max-height: {open ? '1000px' : '0'};">
    {#if open}
      <div class="section-title" style="margin-bottom:0.8em;">Daily Totals</div>
      {#if dailyTotals.length === 0}
        <div class="empty-row">No activity yet.</div>
      {:else}
        <div class="table-card">
          <table class="daily-totals-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Watch Time</th>
              </tr>
            </thead>
            <tbody>
              {#each dailyTotals as { date, totalSeconds }}
                <tr>
                  <td>{prettyDate(date)}</td>
                  <td>{formatMinutesOnly(totalSeconds)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
.daily-totals-section {
  margin: 2.7em 0 1.2em 0;
  width: 100%;
  max-width: 100%;
}

.toggle-btn.subtle {
  display: flex;
  align-items: center;
  gap: 0.5em;
  background: none;
  border: none;
  font-size: 1.08em;
  font-weight: 600;
  color: #4b5771;
  padding: 0.2em 0.4em;
  margin-bottom: 0.2em;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.13s, color 0.13s;
  outline: none;
}
.toggle-btn.subtle:focus,
.toggle-btn.subtle:hover {
  background: #f5f5f8;
  color: #e93c2f;
}
.toggle-icon {
  font-size: 1.24em;
  line-height: 1;
  color: #a3a3b2;
  transition: color 0.14s;
}
.toggle-btn.subtle:hover .toggle-icon {
  color: #e93c2f;
}
.toggle-label {
  font-weight: 500;
  font-size: 1em;
  letter-spacing: 0.01em;
}

.dropdown-content {
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(.86,0,.07,1);
}
.table-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 8px #e5e5f322;
  padding: 1.4em 2.3em 1.7em 2.3em;
  margin-top: 0.6em;
  margin-bottom: 1.2em;
  max-width: 820px;
  width: 100%;
}
.daily-totals-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  font-size: 1.09em;
}
.daily-totals-table th,
.daily-totals-table td {
  padding: 0.8em 1.1em;
  text-align: left;
}
.daily-totals-table th {
  background: #f2f5f7;
  color: #47476b;
  font-weight: bold;
  border-bottom: 1px solid #e7e7ed;
}
.daily-totals-table tr:nth-child(even) td {
  background: #f9f9fd;
}
.daily-totals-table tr:hover td {
  background: #f5f6fb;
}
.empty-row {
  color: #888;
  margin: 1em 0 1.3em 0;
}
@media (max-width: 900px) {
  .table-card {
    padding: 1.1em 0.7em;
    max-width: 98vw;
  }
}
</style>
