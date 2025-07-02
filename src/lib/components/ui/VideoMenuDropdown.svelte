<script>
  import { CheckCircle, PlusCircle, Clock, X, XCircle } from 'lucide-svelte';
  import { onMount, createEventDispatcher } from 'svelte';

  export let video;
  export let user = null;

  export let isChannelSaved = false;
  export let savingChannel = false;
  export let saveChannelToMyChannels = () => {};
  export let removeChannelFromMyChannels = () => {};

  export let isWatchLater = false;
  export let savingWatchLater = false;
  export let saveToWatchLater = () => {};
  export let removeFromWatchLater = () => {};

  // Optionally allow custom placement styling from parent
  export let className = '';

  const dispatch = createEventDispatcher();
  let menuButtonRef;
  let showDropdown = false;

  function toggleDropdown(e) {
    e?.stopPropagation?.();
    showDropdown = !showDropdown;
  }
  function closeDropdown() {
    showDropdown = false;
  }
  function handleBlur() {
    setTimeout(() => {
      if (!menuButtonRef?.contains(document.activeElement)) {
        showDropdown = false;
      }
    }, 100);
  }

  onMount(() => {
    function handleDocumentClick(e) {
      if (showDropdown && !menuButtonRef?.contains(e.target)) {
        showDropdown = false;
      }
    }
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  });
</script>

{#if user && video?.channel_id}
  <div class="add-to-channels-wrapper {className}" style="position: relative;">
    <button
      class="more-btn"
      bind:this={menuButtonRef}
      aria-label="More options"
      on:click={toggleDropdown}
      tabindex="0"
      on:blur={handleBlur}
      type="button"
    >
      <span class="stacked-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </span>
    </button>
    {#if showDropdown}
      <div class="meta-dropdown-menu">
        <!-- My Channels -->
        {#if isChannelSaved}
          <button
            class="dropdown-link"
            type="button"
            on:click={() => { removeChannelFromMyChannels(); closeDropdown(); }}
            disabled={savingChannel}
          >
            <XCircle class="dropdown-icon in" />
            Remove from My Channels
          </button>
        {:else}
          <button
            class="dropdown-link"
            type="button"
            on:click={() => { saveChannelToMyChannels(); closeDropdown(); }}
            disabled={savingChannel}
          >
            <PlusCircle class="dropdown-icon" />
            Add to My Channels
          </button>
        {/if}

        <!-- Watch Later -->
        {#if isWatchLater}
          <button
            class="dropdown-link"
            type="button"
            on:click={() => { removeFromWatchLater(); closeDropdown(); }}
            disabled={savingWatchLater}
          >
            <X class="dropdown-icon in" />
            Remove from Watch Later
          </button>
        {:else}
          <button
            class="dropdown-link"
            type="button"
            on:click={() => { saveToWatchLater(); closeDropdown(); }}
            disabled={savingWatchLater}
          >
            <Clock class="dropdown-icon" />
            Add to Watch Later
          </button>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
.add-to-channels-wrapper {
  display: flex;
  align-items: flex-start;
  flex-shrink: 0;
  position: relative;
  height: 100%;
}
.more-btn {
  background: none;
  border: none;
  padding: 0.20em 0.45em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: none;
  position: relative;
  margin-top: -3px;
}
.more-btn:hover, .more-btn:focus {
  background: #f3f3f7;
}
.stacked-dots {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 16px; width: 14px; padding: 0;
}
.stacked-dots .dot {
  width: 4px; height: 4px; background: #181818; border-radius: 50%; margin: 1px 0; display: block;
}
.meta-dropdown-menu {
  position: absolute; top: 110%; right: 0; background: #fff;
  border-radius: 14px; box-shadow: 0 4px 16px #2a223310; min-width: 220px; padding: 0.23em 0;
  z-index: 100; display: flex; flex-direction: column;
}
.dropdown-link {
  display: flex; align-items: center; gap: 0.7em; width: 100%;
  padding: 0.67em 1.1em 0.67em 1em; font-size: 1.04em; color: #222943; background: none; border: none;
  cursor: pointer; transition: background 0.12s, color 0.12s; text-align: left; font-weight: 700;
  border-radius: 10px;
  white-space: nowrap;
}
.dropdown-link:disabled {
  color: #b0b0b0;
  cursor: default;
}
.dropdown-link:hover:not(:disabled),
.dropdown-link:focus:not(:disabled) {
  background: #f6f4fa;
  color: #e93c2f;
}
.dropdown-icon {
  width: 1.3em; height: 1.3em; color: #babdcf; margin-right: 0.5em; vertical-align: middle; transition: color 0.13s;
}
.dropdown-icon.in { color: #e93c2f; }
</style>
