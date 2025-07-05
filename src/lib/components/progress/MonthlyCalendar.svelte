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
          {#if buildTotalsMap(dailyTotals, manualEntries)[formatDate(day)]}
            <!-- Red square, white text -->
            <div class="calendar-cell active" title={formatMinutesOnly(buildTotalsMap(dailyTotals, manualEntries)[formatDate(day)])}>
              <span class="date">{day.getDate()}</span>
              <span class="mins">{formatMinutesOnly(buildTotalsMap(dailyTotals, manualEntries)[formatDate(day)])}</span>
            </div>
          {:else}
            <!-- Plain, black text -->
            <div class="calendar-cell">
              <span class="date plain">{day.getDate()}</span>
            </div>
          {/if}
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
  padding: 0.2em 1.4em 1.7em 1em;
  margin: 0.1em 2em 0.1em auto;
  max-width: 455px;
  box-shadow: none;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 1.2em;
  gap: 1.2em;
  letter-spacing: 0.01em;
}

.calendar-header button {
  background: #ffe0dd;
  border: none;
  border-radius: 7px;
  font-size: 1em;
  padding: 0.21em 0.89em;
  color: #EF5552;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.14s, color 0.14s;
  outline: none;
}
.calendar-header button:hover,
.calendar-header button:focus { background: #ffb3ac; color: #e93c2f; }

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.80em;
  margin-bottom: 0.1em;
  padding: 0.2em 0.1em 0.18em 0.1em;
  width: 100%;
}

.calendar-label {
  text-align: center;
  color: #ffb3ac;
  font-size: 0.95em;
  font-weight: 600;
  margin-bottom: 0.09em;
  letter-spacing: 0.04em;
  user-select: none;
}

.calendar-cell {
  background: transparent;
  border-radius: 6px;
  min-height: 52px;
  height: 52px;
  width: 52px;
  text-align: center;
  font-size: 0.99em;
  color: #111;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  user-select: none;
  margin: 0 auto;
  border: none;
  padding: 0.18em 0 0.02em 0;
  transition: background 0.16s, color 0.13s;
}
.calendar-cell.active {
  background: #EF5552;
  color: #fff;
  font-weight: 900;
}
.calendar-cell.active .date,
.calendar-cell.active .mins {
  color: #fff;
}
.calendar-cell .date {
  display: block;
  font-size: 1.07em;
  font-weight: 800;
  line-height: 1.11em;
  letter-spacing: 0.01em;
}
.calendar-cell .date.plain {
  color: #222;
  font-weight: 700;
  opacity: 1;
}
.calendar-cell .mins {
  display: block;
  font-size: 0.60em;
  margin-top: 2px;
  color: #fff;
  font-weight: 500;
  opacity: 0.95;
  line-height: 1.08em;
  letter-spacing: 0.01em;
}
.calendar-cell.empty {
  background: transparent;
  pointer-events: none;
}

/* --- MOBILE: Fill width, smaller text, square cells --- */
@media (max-width: 600px) {
  .cibubble-card.calendar-wrap {
    max-width: 100vw;
    border-radius: 0;
    padding: 0.10em 0 1.1em 0;
    margin: 0;
  }
  .calendar-header {
    font-size: 1em;
    margin-bottom: 0.7em;
  }
  .calendar-grid {
    width: 90vw;
    gap: 0.12em;
    padding: 0.02em;
    grid-template-columns: repeat(7, 1fr);
  }
  .calendar-cell {
    width: 100%;
    aspect-ratio: 1 / 1;
    min-height: unset;
    height: auto;
    font-size: 0.98em;
    border-radius: 6px;
    padding: 0.05em 0 0.01em 0;
    margin: 0;
    box-sizing: border-box;
  }
  .calendar-cell .date {
    font-size: 0.96em;
    font-weight: 700;
  }
  .calendar-cell .mins {
    font-size: 0.60em;
    margin-top: 4px;
    line-height: 1.1em;
  }
}
</style>
