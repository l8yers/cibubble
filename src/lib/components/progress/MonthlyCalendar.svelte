<script>
  export let dailyTotals = []; // [{ date: 'YYYY-MM-DD', totalSeconds }]
  export let manualEntries = []; // optional, can be []
  export let formatMinutesOnly = s => `${Math.round(s/60)}m`;
  export let month = (new Date().getMonth() + 1);
  export let year = (new Date().getFullYear());

  // Build map for fast lookup
  let totalsByDate = {};
  for (const d of dailyTotals) totalsByDate[d.date] = d.totalSeconds;
  for (const m of manualEntries) totalsByDate[m.date] = m.totalSeconds;

  function getDaysInMonth(month, year) {
    let days = [];
    let date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }

  function changeMonth(dir) {
    let m = month + dir, y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    month = m; year = y;
  }

  function formatDate(d) { return d.toISOString().split("T")[0]; }
  function monthName(m, y) { return new Date(y, m - 1).toLocaleString('default', {month:'long', year:'numeric'}); }

  // Calendar grid: align to Mon-Sun (Monday start)
  $: days = getDaysInMonth(month, year);
  $: firstDayOfWeek = (days[0]?.getDay() || 7) - 1; // 0=Mon, 6=Sun
  $: gridDays = Array(firstDayOfWeek).fill(null).concat(days);

</script>

<div class="calendar-wrap">
  <div class="calendar-header">
    <button on:click={() => changeMonth(-1)}>&lt;</button>
    <span>{monthName(month, year)}</span>
    <button on:click={() => changeMonth(1)}>&gt;</button>
  </div>
  <div class="calendar-grid">
    <div class="calendar-label">M</div>
    <div class="calendar-label">T</div>
    <div class="calendar-label">W</div>
    <div class="calendar-label">T</div>
    <div class="calendar-label">F</div>
    <div class="calendar-label">S</div>
    <div class="calendar-label">S</div>
    {#each gridDays as day, i}
      {#if day}
        <div class="calendar-cell {totalsByDate[formatDate(day)] ? 'active' : ''}"
             title={totalsByDate[formatDate(day)] ? formatMinutesOnly(totalsByDate[formatDate(day)]) : ''}
        >
          <span class="date">{day.getDate()}</span>
          {#if totalsByDate[formatDate(day)]}
            <span class="mins">{formatMinutesOnly(totalsByDate[formatDate(day)])}</span>
          {/if}
        </div>
      {:else}
        <div class="calendar-cell empty"></div>
      {/if}
    {/each}
  </div>
</div>

<style>
.calendar-wrap {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 8px #ececec55;
  padding: 1.6em 1.2em 2em 1.2em;
  max-width: 410px;
  margin: 2em auto;
  border: 1px solid #ececec;
}
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.18em;
  font-weight: bold;
  margin-bottom: 1.3em;
  gap: 1.2em;
}
.calendar-header button {
  background: #f7f3ee;
  border: none;
  border-radius: 7px;
  font-size: 1.15em;
  padding: 0.14em 0.7em;
  color: #6f5b3e;
  cursor: pointer;
  transition: background 0.14s;
}
.calendar-header button:hover { background: #f3e7cc; }
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.29em;
}
.calendar-label {
  text-align: center;
  color: #bcb6ad;
  font-size: 1em;
  font-weight: 600;
  margin-bottom: 0.18em;
}
.calendar-cell {
  background: #f6f4ef;
  border-radius: 7px;
  min-height: 42px;
  text-align: center;
  font-size: 1.05em;
  color: #aaa;
  position: relative;
  box-shadow: 0 1px 2px #eee6cc88;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: box-shadow 0.13s, background 0.13s;
}
.calendar-cell.active {
  background: #FF9100;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px #ff910055;
}
.calendar-cell.active .mins {
  font-size: 0.93em;
  display: block;
  color: #fff8;
  margin-top: 0.04em;
}
.calendar-cell.empty {
  background: transparent;
  box-shadow: none;
  pointer-events: none;
}
.date { display: block; }
.mins { display: block; font-size: 0.82em; margin-top: 0.1em; }

@media (max-width: 600px) {
  .calendar-wrap { padding: 0.8em 0.2em 1em 0.2em; max-width: 99vw; border-radius: 0; }
  .calendar-grid { gap: 0.11em; }
  .calendar-header { font-size: 0.98em; margin-bottom: 0.8em; }
}
</style>
