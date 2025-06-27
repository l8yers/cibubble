<script>
  export let dailyTotals = [];
  export let manualEntries = [];
  export let formatMinutesOnly = s => `${Math.round(s/60)}m`;
  export let month = (new Date().getMonth() + 1);
  export let year = (new Date().getFullYear());

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
  padding: 1.5em 0.8em 1.6em 0.8em;
  margin: 1.5em auto 2em auto;
  max-width: 395px;
  border: 1.2px solid #ffe0dd;
  box-shadow: none;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.07em;
  font-weight: bold;
  margin-bottom: 1em;
  gap: 1.1em;
  letter-spacing: 0.01em;
}
.calendar-header button {
  background: #ffe0dd;
  border: none;
  border-radius: 7px;
  font-size: 1em;
  padding: 0.17em 0.75em;
  color: #ff6456;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.14s, color 0.14s;
  outline: none;
}
.calendar-header button:hover,
.calendar-header button:focus { background: #ffb3ac; color: #e93c2f; }

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.45em;
  margin-bottom: 0.1em;
  padding: 0.18em 0.1em 0.12em 0.1em;
}
.calendar-label {
  text-align: center;
  color: #ffb3ac;
  font-size: 0.93em;
  font-weight: 600;
  margin-bottom: 0.09em;
  letter-spacing: 0.04em;
  user-select: none;
}
.calendar-cell {
  background: #ffe0dd;  /* Softest light red */
  border-radius: 7px;
  min-height: 36px;
  height: 36px;
  width: 36px;
  text-align: center;
  font-size: 1em;
  color: #222;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: background 0.13s, color 0.14s;
  user-select: none;
  margin: 0 auto;
  border: none;
  padding: 0.5em 0 0.12em 0;
}
.calendar-cell.active {
  background: #ffb3ac;
  color: #000;
  font-weight: 800;
}
.calendar-cell.active .mins {
  color: #7d292a;
  font-size: 0.56em;
  font-weight: 500;
  margin-top: 0.05em;
  letter-spacing: 0.01em;
  line-height: 1.02em;
}
.calendar-cell.empty {
  background: transparent;
  pointer-events: none;
}
.date { 
  display: block;
  font-size: 1.03em;
  color: #111;
  font-weight: 700;
  line-height: 1.13em;
}
.mins { 
  display: block;
  font-size: 0.56em;
  margin-top: -1.5px;
  color: #7d292a;
  font-weight: 500;
  opacity: 0.69;
  line-height: 1.09em;
}

@media (max-width: 500px) {
  .cibubble-card.calendar-wrap { max-width: 99vw; border-radius: 0; }
  .calendar-header { font-size: 0.97em; margin-bottom: 0.6em; }
  .calendar-grid { gap: 0.17em; }
  .calendar-cell { min-height: 26px; height: 26px; width: 26px; font-size: 0.96em; }
}
</style>
