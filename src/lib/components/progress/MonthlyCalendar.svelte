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
  padding: 0.9em 1.6em 1.5em 1.6em;
  margin: 0.15em 1em 0.1em auto;
  max-width: 440px;
  width: 100%;
  box-shadow: none;
  transition: max-width 0.2s;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05em;
  font-weight: 700;
  margin-bottom: 0.95em;
  gap: 1.1em;
  letter-spacing: 0.01em;
}
.calendar-header button {
  background: #ffe0dd;
  border: none;
  border-radius: 7px;
  font-size: 1em;
  padding: 0.22em 1.1em;
  color: #e94b46;
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
  gap: 0.65em;
  margin-bottom: 0.1em;
  padding: 0.18em 0.1em 0.14em 0.1em;
  width: 100%;
}
.calendar-label {
  text-align: center;
  color: #ffb3ac;
  font-size: 0.97em;
  font-weight: 600;
  margin-bottom: 0.09em;
  letter-spacing: 0.04em;
  user-select: none;
}
.calendar-cell {
  background: transparent;
  border-radius: 6px;
  min-height: 44px;
  height: 44px;
  width: 44px;
  text-align: center;
  font-size: 1.07em;
  color: #181818;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  user-select: none;
  margin: 0 auto;
  border: none;
  padding: 0.16em 0 0.03em 0;
  transition: background 0.16s, color 0.13s;
}
.calendar-cell.active {
  background: #ef5552;
  color: #fff;
  font-weight: 700;
}
.calendar-cell.active .date,
.calendar-cell.active .mins {
  color: #fff;
}
.calendar-cell .date {
  display: block;
  font-size: 1em;
  font-weight: 700;
  line-height: 1.09em;
  letter-spacing: 0.01em;
}
.calendar-cell .date.plain {
  color: #222;
  font-weight: 600;
  opacity: 1;
}
.calendar-cell .mins {
  display: block;
  font-size: 0.68em;
  margin-top: 3px;
  color: #fff;
  font-weight: 400;
  opacity: 0.79;
  line-height: 1.08em;
  letter-spacing: 0.01em;
}
.calendar-cell.empty {
  background: transparent;
  pointer-events: none;
}

/* MOBILE: Fill width, override parent's grid */
@media (max-width: 900px) {
  .cibubble-card.calendar-wrap {
    max-width: 100vw !important;
    width: 100vw !important;
    border-radius: 0;
    padding: 0.12em 0.06em 1em 0.06em;
    margin: 0 !important;
    box-shadow: none;
  }
  /* Force the card to fill row (sometimes .progress-row > div has max-width set) */
  .activity-card .cibubble-card.calendar-wrap,
  .calendar-wrap {
    max-width: 100vw !important;
    width: 100vw !important;
  }
  .calendar-header {
    font-size: 1em;
    margin-bottom: 0.5em;
    gap: 0.75em;
  }
  .calendar-grid {
    width: 100%;
    gap: 0.08em;
    padding: 0.03em;
    grid-template-columns: repeat(7, 1fr);
  }
  .calendar-label {
    font-size: 0.91em;
    margin-bottom: 0.01em;
  }
  .calendar-cell {
    width: 100%;
    aspect-ratio: 1 / 1;
    min-height: unset;
    height: auto;
    font-size: 1.1em;
    border-radius: 6px;
    padding: 0.05em 0 0.01em 0;
  }
  .calendar-cell .date {
    font-size: 1em;
  }
  .calendar-cell .mins {
    font-size: 0.81em;
    margin-top: 1px;
  }
}
</style>

