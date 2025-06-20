<script>
  export let dark = false;
  export let toggleDark;
</script>

<style>
.theme-toggle-btn {
  --track: #ededed;
  --track-dark: #232436;
  --thumb: #fff;
  --thumb-dark: #191b21;
  --border: #ececec;
  --border-dark: #34364d;

  width: 48px;
  height: 28px;
  border-radius: 14px;
  background: var(--track);
  border: 1.5px solid var(--border);
  position: relative;
  cursor: pointer;
  outline: none;
  transition: background 0.2s, border 0.2s;
  display: flex;
  align-items: center;
  padding: 0;
}

.theme-toggle-btn.dark {
  background: var(--track-dark);
  border-color: var(--border-dark);
}

.theme-toggle-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--thumb);
  position: absolute;
  left: 2.5px;
  top: 2.5px;
  transition: left 0.22s cubic-bezier(.57,1.84,.51,.78), background 0.18s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px #0002;
}

.theme-toggle-btn.dark .theme-toggle-thumb {
  left: 23px;
  background: var(--thumb-dark);
}

.theme-toggle-icon {
  width: 16px;
  height: 16px;
}

.theme-toggle-btn:focus-visible {
  outline: 2.5px solid #e93c2f;
  outline-offset: 2px;
}
</style>

<button
  class="theme-toggle-btn {dark ? 'dark' : ''}"
  type="button"
  aria-label="Toggle dark mode"
  aria-pressed={dark}
  on:click={toggleDark}
>
  <span class="theme-toggle-thumb">
    {#if dark}
      <span class="theme-toggle-icon">
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path d="M15.73 13.31A7 7 0 0 1 6.29 2.23c-.18-.03-.33.16-.22.31A7 7 0 1 0 15.74 13.53c.08-.16-.05-.35-.21-.22z" fill="#ffad3b"/>
        </svg>
      </span>
    {:else}
      <span class="theme-toggle-icon">
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="5" fill="#FFD600"/>
          <g stroke="#FFD600" stroke-width="1.5">
            <line x1="9" y1="1.5" x2="9" y2="3"/>
            <line x1="9" y1="15" x2="9" y2="16.5"/>
            <line x1="3.44" y1="3.44" x2="4.5" y2="4.5"/>
            <line x1="13.5" y1="13.5" x2="14.56" y2="14.56"/>
            <line x1="1.5" y1="9" x2="3" y2="9"/>
            <line x1="15" y1="9" x2="16.5" y2="9"/>
            <line x1="3.44" y1="14.56" x2="4.5" y2="13.5"/>
            <line x1="13.5" y1="4.5" x2="14.56" y2="3.44"/>
          </g>
        </svg>
      </span>
    {/if}
  </span>
</button>
