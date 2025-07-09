<script>
  export let type = 'info';     // e.g. 'info', 'warning', 'success'
  export let label = '';
  export let value = '';
  export let onClear = () => {};
  export let clearClass = '';
</script>

<div class="chip {type}">
  <span>
    {#if value && value !== label}
      <b>{label}:</b> {value}
    {:else}
      <b>{label}</b>
    {/if}
  </span>
  <button class="clear-btn {clearClass}" on:click={onClear}>✕ Clear</button>
</div>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.7em;
    background: #f6faff;
    color: #2652a2;
    border-radius: 8px;
    padding: 0.32em 0.9em 0.32em 0.9em;
    font-size: 1.04em;
    font-weight: 500;
    border: 1.3px solid #e3e9fa;
  }
  .chip.info    { background: #e9f6ff; color: #1b4c8a; }
  .chip.warning { background: #fef6ed; color: #e2791b; }
  .chip.success { background: #eafbea; color: #25722c; }
  .chip.error   { background: #ffeaea; color: #b13b1c; }

  .clear-btn {
    margin-left: 1.1em;
    background: none;
    border: none;
    color: #4068f3;
    font-size: 1em;
    cursor: pointer;
    padding: 0.2em 0.5em;
    border-radius: 6px;
    font-weight: 600;
    transition: background 0.15s;
  }
  .clear-btn:hover { background: #f4f7ff; }
  .clear-btn.clear-btn--blue { color: #2562e9; }
  .clear-btn.clear-btn--purple { color: #ad30c9; }
</style>
