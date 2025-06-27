<script>
  export let dailyTotals = [];
  export let manualEntries = [];
  export let formatMinutesOnly = s => `${Math.round(s/60)}m`;
  export let month = (new Date().getMonth() + 1);
  export let year = (new Date().getFullYear());

  // Defensive defaults
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
.cibubble-card.calendar-wrap {
  background: #fff;
  border-radius: 13px;
  box-shadow: 0 3px 14px #2562e922, 0 1px 2px #ececec42;
  padding: 1.2em 0.5em 1.2em 0.5em;
  margin: 1.2em auto 1.7em auto;
  max-width: 325px;
  border: 1.2px solid #e3eafc;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1em;
  font-weight: bold;
  margin-bottom: 0.8em;
  gap: 1em;
  letter-spacing: 0.01em;
}
.calendar-header button {
  background: #f5f7fc;
  border: none;
  border-radius: 7px;
  font-size: 1em;
  padding: 0.14em 0.65em;
  color: #5a7ec7;
  font-weight: 600;
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
  gap: 0.13em;
  margin-bottom: 0.1em;
}
.calendar-label {
  text-align: center;
  color: #b3bde1;
  font-size: 0.89em;
  font-weight: 600;
  margin-bottom: 0.05em;
  letter-spacing: 0.04em;
  user-select: none;
}
.calendar-cell {
  background: #b7cffc;  /* Super light blue */
  border-radius: 7px;
  min-height: 29px;
  height: 29px;
  width: 29px;
  text-align: center;
  font-size: 1em;
  color: #222;
  position: relative;
  box-shadow: 0 0.5px 2px #b7cffc33;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: box-shadow 0.13s, background 0.13s, color 0.14s;
  user-select: none;
  margin: 0 auto;
}
.calendar-cell.active {
  background: #97b8f7;
  color: #000;
  font-weight: 800;
  box-shadow: 0 2px 7px #b7cffc77;
}
.calendar-cell.active .mins {
  color: #333c;
  font-size: 0.65em;
  font-weight: 500;
  margin-top: 0.03em;
  letter-spacing: 0.01em;
}
.calendar-cell.empty {
  background: transparent;
  box-shadow: none;
  pointer-events: none;
}
.date { 
  display: block;
  font-size: 0.98em;
  color: #111;
  font-weight: 700;
  line-height: 1.13em;
}
.mins { 
  display: block;
  font-size: 0.66em;
  margin-top: -2px;
  color: #3a3a3a99;
  font-weight: 500;
  opacity: 0.82;
  line-height: 1.03em;
}

@media (max-width: 500px) {
  .cibubble-card.calendar-wrap { max-width: 99vw; border-radius: 0; }
  .calendar-header { font-size: 0.97em; margin-bottom: 0.6em; }
  .calendar-grid { gap: 0.09em; }
  .calendar-cell { min-height: 23px; height: 23px; width: 23px; font-size: 0.95em; }
}
</style>
