<script>
  export let dailyTotals = [];
  export let manualEntries = [];
  export let formatMinutesOnly = s => `${Math.round(s/60)}m`;
  export let month = (new Date().getMonth() + 1);
  export let year = (new Date().getFullYear());

  // Defensive defaults:
  dailyTotals = dailyTotals || [];
  manualEntries = manualEntries || [];
  formatMinutesOnly = formatMinutesOnly || (s => `${Math.round(s/60)}m`);

  function buildTotalsMap(dailyTotals, manualEntries) {
    const map = {};
    for (const d of dailyTotals) map[d.date] = d.totalSeconds;
    if (manualEntries) for (const m of manualEntries) map[m.date] = m.totalSeconds;
    return map;
  }

  function getDaysInMonth(year, month) {
    const days = [];
    for (let i = 1; i <= new Date(year, month, 0).getDate(); i++) {
      days.push(new Date(year, month - 1, i));
    }
    return days;
  }

  function changeMonth(dir) {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    month = m; year = y;
  }

  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }
  function monthName(m, y) {
    return new Date(y, m - 1).toLocaleString('default', {month:'long', year:'numeric'});
  }

  function getGridData(year, month, totalsByDate) {
    const days = getDaysInMonth(year, month);
    let firstDay = days[0]?.getDay() ?? 1;
    if (firstDay === 0) firstDay = 7;
    const blanks = Array(firstDay - 1).fill(null);
    return blanks.concat(days);
  }
</script>

<div class="cibubble-card calendar-wrap">
  <div class="calendar-header">
    <button on:click={() => changeMonth(-1)} aria-label="Previous Month">&lt;</button>
    <span>{monthName(month, year)}</span>
    <button on:click={() => changeMonth(1)} aria-label="Next Month">&gt;</button>
  </div>
  <div class="calendar-grid">
    <div class="calendar-label">M</div>
    <div class="calendar-label">T</div>
    <div class="calendar-label">W</div>
    <div class="calendar-label">T</div>
    <div class="calendar-label">F</div>
    <div class="calendar-label">S</div>
    <div class="calendar-label">S</div>
    {#each getGridData(year, month, buildTotalsMap(dailyTotals, manualEntries)) as day}
      {#if day}
        {#key formatDate(day)}
          <div
            class="calendar-cell {buildTotalsMap(dailyTotals, manualEntries)[formatDate(day)] ? 'active' : ''}"
            title={buildTotalsMap(dailyTotals, manualEntries)[formatDate(day)] ? formatMinutesOnly(buildTotalsMap(dailyTotals, manualEntries)[formatDate(day)]) : ''}
          >
            <span class="date">{day.getDate()}</span>
            {#if buildTotalsMap(dailyTotals, manualEntries)[formatDate(day)]}
              <span class="mins">{formatMinutesOnly(buildTotalsMap(dailyTotals, manualEntries)[formatDate(day)])}</span>
            {/if}
          </div>
        {/key}
      {:else}
        <div class="calendar-cell empty"></div>
      {/if}
    {/each}
  </div>
</div>

<style>
/* CIBUBBLE dreamy card style */
.cibubble-card {
  background: #fff;
  border-radius: 17px;
  box-shadow: 0 4px 20px #2562e93a, 0 2px 4px #ececec42;
  padding: 2.1em 1.8em 2.2em 1.8em;
  margin: 2em auto;
  max-width: 430px;
  border: 1.3px solid #e3eafc;
  transition: box-shadow 0.18s;
}

.cibubble-card:focus-within,
.cibubble-card:hover {
  box-shadow: 0 8px 30px #2562e955, 0 2px 4px #ececec33;
}

/* Calendar stuff */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.19em;
  font-weight: bold;
  margin-bottom: 1.5em;
  gap: 1.5em;
  letter-spacing: 0.01em;
}
.calendar-header button {
  background: #f5f7fc;
  border: none;
  border-radius: 8px;
  font-size: 1.13em;
  padding: 0.22em 0.8em;
  color: #2562e9;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.14s, color 0.14s;
  outline: none;
  box-shadow: 0 1px 3px #e3eafc44;
}
.calendar-header button:hover,
.calendar-header button:focus { background: #e3eafc; color: #e93c2f; }

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.29em;
  margin-bottom: 0.2em;
}
.calendar-label {
  text-align: center;
  color: #b3bde1;
  font-size: 1em;
  font-weight: 600;
  margin-bottom: 0.18em;
  letter-spacing: 0.04em;
  user-select: none;
}
.calendar-cell {
  background: #f5f7fc;
  border-radius: 8px;
  min-height: 44px;
  text-align: center;
  font-size: 1.07em;
  color: #2562e977;
  position: relative;
  box-shadow: 0 1.5px 3.5px #e3eafc44;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: box-shadow 0.13s, background 0.13s, color 0.15s;
  user-select: none;
}
.calendar-cell.active {
  background: #2562e9;
  color: #fff;
  font-weight: 800;
  box-shadow: 0 3px 11px #2562e94b;
}
.calendar-cell.active .mins {
  color: #fffbe8;
  font-size: 0.96em;
  font-weight: 600;
  margin-top: 0.09em;
  letter-spacing: 0.01em;
}
.calendar-cell.empty {
  background: transparent;
  box-shadow: none;
  pointer-events: none;
}
.date { display: block; font-size: 1.03em; }
.mins { display: block; font-size: 0.84em; margin-top: 0.1em; opacity: 0.88; }

@media (max-width: 600px) {
  .cibubble-card { padding: 1.2em 0.12em 1.4em 0.12em; max-width: 99vw; border-radius: 0; }
  .calendar-grid { gap: 0.11em; }
  .calendar-header { font-size: 1em; margin-bottom: 1em; }
}
</style>
