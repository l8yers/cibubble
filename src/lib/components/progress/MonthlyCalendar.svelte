<script>
  export let dailyTotals = []; // [{ date: 'YYYY-MM-DD', totalSeconds }]
  export let month = (new Date().getMonth() + 1); // 1-12 (default: current month)
  export let year = (new Date().getFullYear());
  export let formatMinutesOnly = secs => `${Math.round(secs/60)} min`;

  // Utility: get all days in a month
  function getDaysInMonth(month, year) {
    let days = [];
    let date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }

  // Map dates for quick lookup
  let totalsByDate = {};
  for (const d of dailyTotals) {
    totalsByDate[d.date] = d.totalSeconds;
  }

  // Helper: format as YYYY-MM-DD
  function formatDate(d) {
    return d.toISOString().split('T')[0];
  }

  // Weekday headers
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Previous/Next month nav (simple, optional)
  function changeMonth(offset) {
    let newMonth = month + offset;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    month = newMonth;
    year = newYear;
  }
</script>

<div class="calendar-card">
  <div class="calendar-header">
    <button class="month-nav" on:click={() => changeMonth(-1)}>&lt;</button>
    <span>{new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
    <button class="month-nav" on:click={() => changeMonth(1)}>&gt;</button>
  </div>
  <div class="calendar-grid">
    {#each weekdays as day}
      <div class="calendar-weekday">{day}</div>
    {/each}
    {#each Array(new Date(year, month - 1, 1).getDay() || 7 - 1) as _, i}
      <!-- Padding for first day (Monday start) -->
      <div class="calendar-day empty"></div>
    {/each}
{#each getDaysInMonth(month, year) as day}
  <div class="calendar-day {totalsByDate[formatDate(day)] ? 'active' : ''}"
       title={totalsByDate[formatDate(day)] ? `${formatMinutesOnly(totalsByDate[formatDate(day)])}` : 'No activity'}>
    <span class="day-number">{day.getDate()}</span>
    {#if totalsByDate[formatDate(day)]}
      <span class="minutes">{Math.round(totalsByDate[formatDate(day)] / 60)}m</span>
    {/if}
  </div>
{/each}

  </div>
</div>

<style>
.calendar-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 10px #ececec44;
  padding: 2em 2.4em 2.2em 2.4em;
  margin: 2em auto;
  max-width: 550px;
  width: 100%;
  border: 1px solid #ececec;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3em;
  font-weight: 700;
  margin-bottom: 1.5em;
  gap: 1.2em;
}

.month-nav {
  background: #f6f7fb;
  border: none;
  border-radius: 8px;
  font-size: 1.15em;
  padding: 0.23em 0.7em;
  color: #45457a;
  cursor: pointer;
  transition: background 0.14s;
}
.month-nav:hover {
  background: #e3e3f1;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5em;
}

.calendar-weekday {
  color: #8b8bb8;
  font-size: 1em;
  text-align: center;
  font-weight: 600;
  margin-bottom: 0.2em;
}

.calendar-day {
  background: #f9fafd;
  border-radius: 9px;
  min-height: 44px;
  padding: 0.3em 0 0.18em 0;
  text-align: center;
  font-size: 1.13em;
  color: #aaa;
  position: relative;
  cursor: default;
  box-shadow: 0 1px 3px #f6f6f8a8;
  transition: box-shadow 0.13s, background 0.13s;
  user-select: none;
}
.calendar-day.active {
  background: #ff5454;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px #ff54545c;
  cursor: pointer;
}
.calendar-day.active .minutes {
  font-size: 0.82em;
  display: block;
  margin-top: 0.1em;
  color: #fff7;
}
.calendar-day.empty {
  background: transparent;
  box-shadow: none;
  pointer-events: none;
}

.day-number {
  display: block;
}

@media (max-width: 700px) {
  .calendar-card {
    padding: 0.9em 0.2em 1em 0.2em;
    max-width: 99vw;
    border-radius: 0;
  }
  .calendar-grid {
    gap: 0.17em;
  }
  .calendar-header {
    font-size: 1em;
    margin-bottom: 1em;
  }
}
</style>
