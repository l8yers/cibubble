<script>
  export let dailyTotals = [];
  export let formatMinutesOnly;

  function prettyDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
</script>

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

<style>
.section-title {
  color: #181818;
  font-size: 1.25rem;
  font-weight: bold;
  letter-spacing: 0.3px;
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
