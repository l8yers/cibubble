<script>
  import { Timer, CalendarCheck, Award } from 'lucide-svelte';

  export let watchTime = 0;
  export let todayWatchTime = 0;
  export let daysPracticed = 0;
  export let showTotalTooltip = false;
  export let showTodayTooltip = false;
  export let setShowTotalTooltip;
  export let setShowTodayTooltip;
  export let formatWatchTime;
  export let formatFullTime;
  export let formatMinutesOnly;
</script>

<div class="stats-boxes-row">
  <div class="stat-box stat-time">
    <Timer
      size={48}
      class="stat-icon time-icon"
      style="stroke: var(--icon-color); fill: none; margin-bottom: 0.8em;"
    />
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
    <CalendarCheck
      size={48}
      class="stat-icon today-icon"
      style="stroke: var(--icon-color); fill: none; margin-bottom: 0.8em;"
    />
    <div class="stat-label">Today's Watch Time</div>
    <div class="stat-value">
      <span
        class="tooltip-parent"
        on:mouseenter={() => setShowTodayTooltip(true)}
        on:mouseleave={() => setShowTodayTooltip(false)}
        tabindex="0"
        on:focus={() => setShowTodayTooltip(true)}
        on:blur={() => setShowTodayTooltip(false)}
      >
        {formatWatchTime(todayWatchTime)}
        {#if showTodayTooltip}
          <span class="custom-tooltip">{formatFullTime(todayWatchTime)}</span>
        {/if}
      </span>
    </div>
  </div>

  <div class="stat-box stat-practiced">
    <Award
      size={48}
      class="stat-icon practiced-icon"
      style="stroke: var(--icon-color); fill: none; margin-bottom: 0.8em;"
    />
    <div class="stat-label">Days You Practiced</div>
    <div class="stat-value">
      {daysPracticed}
    </div>
  </div>
</div>



<style>
  .stats-boxes-row {
    display: flex;
    gap: 1.3em;
    margin: 2.3em 2em;
    flex-wrap: wrap;
    align-items: stretch;
    justify-content: center;
  }

  .stat-box {
    border-radius: 15px;
    padding: 2.5em 2em;
    min-width: 250px;
    flex: 1 1 250px;
    height: 250px;
    background: #f7f8fc;
    border: 1.2px solid #ededed;
    box-shadow: 0 1px 7px #ededed55;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 0;
    position: relative;
    transition: box-shadow 0.12s;
    cursor: default;
  }

  /* Define icon colors via CSS variables */
  .stat-time {
    --icon-color: #e93c2f;
    background: linear-gradient(120deg, #ffeaea 70%, #fff6f0 100%);
  }
  .stat-today {
    --icon-color: #31b361;
    background: linear-gradient(120deg, #eaffe9 70%, #f5fff5 100%);
  }
  .stat-practiced {
    --icon-color: #f4a000;
    background: linear-gradient(120deg, #fff6e4 70%, #fef9f1 100%);
  }

  .stat-label {
    font-size: 1em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.13em;
    margin-bottom: 0.72em;
    user-select: none;
    color: #8282ac;
  }
  .stat-time .stat-label     { color: #e93c2f; }
  .stat-today .stat-label    { color: #31b361; }
  .stat-practiced .stat-label { color: #f4a000; }

  .stat-value {
    font-size: 2.5em;
    color: #181d27;
    font-weight: 900;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    gap: 0.18em;
    line-height: 1.11;
    user-select: text;
  }

  .tooltip-parent {
    position: relative;
    cursor: pointer;
    outline: none;
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
    font-size: 1.01rem;
    font-weight: 500;
    padding: 0.53em 1.1em;
    border-radius: 12px;
    white-space: nowrap;
    z-index: 10;
    pointer-events: none;
    opacity: 1;
    animation: fadeIn 0.17s;
  }

  @media (max-width: 1050px) {
    .stats-boxes-row {
      gap: 0.7em;
    }
    .stat-box {
      padding: 1.8em 1em;
      min-width: 200px;
      flex-basis: 200px;
      height: 200px;
      font-size: 0.95em;
    }
    .stat-value {
      font-size: 2em;
    }
    .stat-label {
      font-size: 1em;
    }
  }

  @media (max-width: 700px) {
    .stats-boxes-row {
      flex-direction: column;
      gap: 0.82em;
      margin: 1.2em 0 1.1em 0;
    }
    .stat-box {
      width: 100%;
      min-width: unset;
      border-radius: 11px;
      padding: 1em 0.7em 1em 0.7em;
      font-size: 0.98em;
      height: auto;
    }
    .stat-value {
      font-size: 1.8em;
    }
    .stat-label {
      font-size: 0.95em;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(8px);}
    to   { opacity: 1; transform: translateX(-50%) translateY(0);}
  }
</style>
