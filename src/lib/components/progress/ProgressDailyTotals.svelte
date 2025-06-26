<script>
  export let dailyTotals = [];
  export let manualEntries = [];
  export let formatMinutesOnly;

  function prettyDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
</script>

<div class="section-title" style="margin-bottom:0.8em;">Daily Totals</div>
{#if dailyTotals.length === 0 && manualEntries.length === 0}
  <div class="empty-row">No activity yet.</div>
{:else}
  <div class="table-card">
    <table class="daily-totals-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Watched Time</th>
          <th>Added Time</th>
        </tr>
      </thead>
      <tbody>
        {#each dailyTotals as { date, totalSeconds }}
          <tr>
            <td>{prettyDate(date)}</td>
            <td>{formatMinutesOnly(totalSeconds)}</td>
            <td>
              {#if manualEntries.find(e => e.date === date)}
                {formatMinutesOnly(manualEntries.find(e => e.date === date).totalSeconds)}
                {#if manualEntries.find(e => e.date === date).source}
                  <div class="manual-source-note">
                    {manualEntries.find(e => e.date === date).source}
                  </div>
                {/if}
              {:else}
                -
              {/if}
            </td>
          </tr>
        {/each}

        {#if manualEntries.length > 0}
          {#each manualEntries.filter(e => !dailyTotals.find(d => d.date === e.date)) as manualOnly}
            <tr>
              <td>{prettyDate(manualOnly.date)}</td>
              <td>-</td>
              <td>
                {formatMinutesOnly(manualOnly.totalSeconds)}
                {#if manualOnly.source}
                  <div class="manual-source-note">
                    {manualOnly.source}
                  </div>
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .table-card {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 2px 8px #ececec55;
    padding: 2.2em 2.6em 2.2em 2.6em;
    margin: 2em auto 2em auto;
    max-width: 1700px;
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #ececec;
  }

  @media (max-width: 1200px) {
    .table-card {
      max-width: 1100px;
      padding: 1.5em 1.2em 1.7em 1.2em;
    }
  }
  @media (max-width: 900px) {
    .table-card {
      max-width: 700px;
      padding: 1.1em 0.7em 1.1em 0.7em;
    }
  }
  @media (max-width: 600px) {
    .table-card {
      max-width: 100vw;
      border-radius: 0;
      margin: 0;
      padding: 0.9em 0.3em 1em 0.3em;
    }
  }

  /* ----- Daily Totals Table ----- */
  .daily-totals-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 1.09em;
    background: transparent;
  }

  .daily-totals-table th,
  .daily-totals-table td {
    padding: 0.85em 1.2em;
    text-align: left;
    vertical-align: middle;
  }

  .daily-totals-table th {
    background: #f6f7fb;
    color: #45457a;
    font-weight: bold;
    border-bottom: 1.5px solid #e3e3f1;
    font-size: 1.02em;
  }

  .daily-totals-table tr:nth-child(even) td {
    background: #f9fafd;
  }
  .daily-totals-table tr:hover td {
    background: #f5f6fa;
  }

  .empty-row {
    color: #b5b5c7;
    margin: 1em 0 1.3em 0;
    text-align: center;
    font-style: italic;
  }

  .manual-source-note {
    margin-top: 0.3em;
    font-size: 0.9em;
    color: #555;
    white-space: normal;
    user-select: text;
  }
</style>
