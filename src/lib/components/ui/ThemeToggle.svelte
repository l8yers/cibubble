<script>
  import { Sun, Moon } from 'lucide-svelte';
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: #878faa;
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
    <span class="theme-toggle-icon">
      {#if dark}
        <!-- In dark mode, show SUN (indicates you can switch to light) -->
        <Sun size={16} stroke-width={2} />
      {:else}
        <!-- In light mode, show MOON (indicates you can switch to dark) -->
        <Moon size={16} stroke-width={2} />
      {/if}
    </span>
  </span>
</button>
