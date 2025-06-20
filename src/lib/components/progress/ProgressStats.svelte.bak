<script>
  export let watchTime = 0;
  export let todayWatchTime = 0;
  export let streak = 0;
  export let showTotalTooltip = false;
  export let setShowTotalTooltip;
  export let formatWatchTime;
  export let formatFullTime;
  export let formatMinutesOnly;
</script>

<div class="stats-boxes-row">
  <div class="stat-box stat-time">
    <div class="stat-label">Total Watch Time</div>
    <div class="stat-value">
      <span
        class="tooltip-parent"
        on:mouseenter={() => setShowTotalTooltip(true)}
        on:mouseleave={() => setShowTotalTooltip(false)}
        tabindex="0"
        on:focus={() => setShowTotalTooltip(true)}
        on:blur={() => setShowTotalTooltip(false)}
      >
        {formatWatchTime(watchTime)}
        {#if showTotalTooltip}
          <span class="custom-tooltip">{formatFullTime(watchTime)}</span>
        {/if}
      </span>
    </div>
  </div>
  <div class="stat-box stat-today">
    <div class="stat-label">Today's Watch Time</div>
    <div class="stat-value">
      {formatMinutesOnly(todayWatchTime)}
    </div>
  </div>
  <div class="stat-box stat-streak">
    <div class="stat-label">Streak</div>
    <div class="stat-value">
      <span style="font-size:2em;">🔥</span>
      {streak} day{streak === 1 ? '' : 's'}
    </div>
  </div>
</div>

<style>
.stats-boxes-row {
  display: flex;
  gap: 2.1em;
  margin: 2.7em 0 2.7em 0;
  flex-wrap: nowrap;
  align-items: stretch;
  justify-content: center;
}
.stat-box {
  border-radius: 18px;
  padding: 2.1em 2.6em 1.9em 2.6em;
  min-width: 220px;
  min-height: 110px;
  flex: 0 0 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  border: none;
  position: relative;
  background: #f5f5f8;
}
.stat-time {
  background: linear-gradient(120deg, #ffeaea 70%, #fff6f0 100%);
}
.stat-today {
  background: linear-gradient(120deg, #eaffe9 70%, #f5fff5 100%);
}
.stat-streak {
  background: linear-gradient(120deg, #fff6e4 70%, #fef9f1 100%);
}
.stat-label {
  font-size: 1.11em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.13em;
  margin-bottom: 0.8em;
  user-select: none;
  color: #7c7ca4;
}
.stat-time .stat-label { color: #e93c2f; }
.stat-today .stat-label { color: #31b361; }
.stat-streak .stat-label { color: #f4a000; }
.stat-value {
  font-size: 2.3em;
  color: #181d27;
  font-weight: 900;
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 0.18em;
  line-height: 1.15;
  user-select: text;
}
.tooltip-parent {
  position: relative;
  cursor: pointer;
  outline: none;
  transition: box-shadow 0.1s;
}
.tooltip-parent:focus {
  box-shadow: 0 0 0 2px #e93c2f55;
}
.custom-tooltip {
  position: absolute;
  left: 50%;
  bottom: 120%;
  transform: translateX(-50%);
  background: #232323;
  color: #fff;
  font-size: 1.03rem;
  font-weight: 500;
  padding: 0.58em 1.2em;
  border-radius: 12px;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
  opacity: 1;
  animation: fadeIn 0.17s;
}
@media (max-width: 900px) {
  .stats-boxes-row {
    flex-wrap: wrap;
    gap: 1.2em;
  }
  .stat-box {
    min-width: 180px;
    flex: 1 1 210px;
    padding: 1.4em 1.1em 1.2em 1.1em;
  }
}
@media (max-width: 650px) {
  .stats-boxes-row {
    flex-direction: column;
    gap: 1em;
  }
  .stat-box {
    width: 100%;
    min-width: unset;
  }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(8px);}
  to   { opacity: 1; transform: translateX(-50%) translateY(0);}
}
</style>
