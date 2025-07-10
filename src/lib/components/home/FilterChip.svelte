<script>
  import { 
    BarChart3, ArrowDownUp, Tag, Earth, User, Search, Clock
  } from 'lucide-svelte';

  export let type = 'info';     // 'level', 'sort', 'tag', etc.
  export let label = '';
  export let value = '';
  export let onClear = () => {};
  export let clearClass = '';

  // Choose icon based on filter type
  let iconComp;
  $: iconComp =
    type === 'level'   ? BarChart3
  : type === 'sort'    ? ArrowDownUp
  : type === 'tag'     ? Tag
  : type === 'country' ? Earth
  : type === 'channel' ? User
  : type === 'search'  ? Search
  : type === 'watchlater' ? Clock
  : null;

  // Capitalize helper
  function cap(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
</script>

<div class="chip {type}">
  {#if iconComp}
    <span class="chip-icon">
      <svelte:component this={iconComp} size={15} stroke="#73777f" />
    </span>
  {/if}
  <span class="chip-label">
    {#if type === 'tag'}
      {#if value && value !== label}
        <span class="main">{cap(label)}</span>
        <span class="colon">:</span>
        <span class="sub">{cap(value)}</span>
      {:else}
        <span class="main">{cap(label)}</span>
      {/if}
    {:else}
      {#if value && value !== label}
        <span class="main">{label}</span>
        <span class="colon">:</span>
        <span class="sub">{value}</span>
      {:else}
        <span class="main">{label}</span>
      {/if}
    {/if}
  </span>
  <button class="close-x {clearClass}" aria-label="Clear filter" on:click={onClear}>
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M6 6l8 8M14 6l-8 8" stroke="#60666b" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </button>
</div>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.36em;
    background: linear-gradient(135deg, #eceff2 70%, #e2e6ea 100%);
    color: #31353b;
    border-radius: 7px;
    padding: 0.17em 0.75em 0.17em 0.65em;
    font-size: 0.97em;
    font-weight: 500;
    box-shadow: 0 1.5px 4px 0 rgba(120,130,140,0.08);
    margin: 0.11em 0.15em;
    transition: background 0.15s, box-shadow 0.13s;
    user-select: none;
    cursor: pointer;
    min-height: 2em;
  }
  .chip:hover {
    background: linear-gradient(135deg, #e3e7eb 70%, #d2d8df 100%);
    box-shadow: 0 3px 8px 0 rgba(120,130,140,0.14);
  }
  .chip-label {
    display: flex;
    align-items: baseline;
    gap: 0.08em;
  }
  .chip-icon {
    display: flex;
    align-items: center;
    margin-right: 0.3em;
    margin-left: -0.2em;
  }
  .main {
    font-weight: 600;
    color: #40444a;
    font-size: 1em;
    letter-spacing: 0.01em;
  }
  .colon {
    font-size: 0.99em;
    color: #60666b;
    font-weight: 600;
    margin: 0 0.08em;
  }
  .sub {
    font-weight: 500;
    color: #60666b;
    font-size: 0.97em;
    letter-spacing: 0.01em;
  }
  .close-x {
    margin-left: 0.5em;
    background: none;
    border: none;
    color: #60666b;
    cursor: pointer;
    padding: 0.09em 0.18em 0.07em 0.18em;
    border-radius: 5px;
    display: flex;
    align-items: center;
    transition: background 0.13s;
  }
  .close-x:hover,
  .close-x:focus {
    background: #dde2e7;
  }
  .close-x svg {
    display: block;
  }

  /* ----- MOBILE COMPACT STYLES ----- */
  @media (max-width: 650px) {
    .chip {
      font-size: 0.87em;
      padding: 0.13em 0.43em 0.13em 0.33em;
      border-radius: 6px;
      margin: 0.07em 0.07em 0.07em 0.07em;
      gap: 0.13em;
      min-height: 1.6em;
    }
    .chip-icon {
      margin-right: 0.09em;
      margin-left: -0.08em;
    }
    .main {
      font-size: 0.97em;
    }
    .sub {
      font-size: 0.91em;
    }
    .close-x {
      margin-left: 0.21em;
      padding: 0.07em 0.09em 0.05em 0.09em;
    }
  }
</style>
