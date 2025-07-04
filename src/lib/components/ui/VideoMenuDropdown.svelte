<script>
  import { get } from 'svelte/store';
  import { user } from '$lib/stores/user.js';
  import { userChannels } from '$lib/stores/userChannels.js';
  import {
    watchLaterIds,
    addToWatchLater,
    removeFromWatchLater as removeFromWatchLaterStore, // RENAMED IMPORT
  } from '$lib/stores/videos.js';

  export let video;

  export let isChannelSaved = undefined;
  export let savingChannel = undefined;
  export let saveChannelToMyChannels = undefined;
  export let removeChannelFromMyChannels = undefined;

  export let isWatchLater = undefined;
  export let savingWatchLater = undefined;
  export let saveToWatchLater = undefined;
  export let removeFromWatchLater = undefined; // PROP ONLY

  let menuOpen = false;

  let _isChannelSaved = false;
  let _savingChannel = false;
  let _isWatchLater = false;
  let _savingWatchLater = false;

  function onClickOutside(node, callback) {
    const handleClick = (event) => {
      if (!node.contains(event.target)) {
        callback();
      }
    };
    document.addEventListener('mousedown', handleClick, true);
    return {
      destroy() {
        document.removeEventListener('mousedown', handleClick, true);
      }
    };
  }

  // --- Channel Save/Remove Logic (with fallback) ---
  async function saveChannel() {
    if (!_savingChannel && $user && video?.channel_id) {
      _savingChannel = true;
      const { error } = await fetch('/api/saved-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: video.channel_id })
      }).then(r => r.json());
      if (!error) _isChannelSaved = true;
      _savingChannel = false;
    }
  }
  async function removeChannel() {
    if (!_savingChannel && $user && video?.channel_id) {
      _savingChannel = true;
      await fetch(`/api/saved-channels/${video.channel_id}`, { method: 'DELETE' });
      _isChannelSaved = false;
      _savingChannel = false;
    }
  }

  // --- Watch Later Logic (with fallback) ---
  async function addWatchLater() {
    if (!_savingWatchLater && $user && video?.id) {
      _savingWatchLater = true;
      await addToWatchLater(video.id);
      _savingWatchLater = false;
    }
  }
  async function removeWatchLaterFunc() {
    if (!_savingWatchLater && $user && video?.id) {
      _savingWatchLater = true;
      await removeFromWatchLaterStore(video.id); // USE STORE IMPORT HERE!
      _savingWatchLater = false;
    }
  }

  // --- Click handlers (call parent handler with video, or fallback) ---
  async function handleRemoveChannel() {
    if (removeChannelFromMyChannels) await removeChannelFromMyChannels(video);
    else await removeChannel();
    closeMenu();
  }
  async function handleSaveChannel() {
    if (saveChannelToMyChannels) await saveChannelToMyChannels(video);
    else await saveChannel();
    closeMenu();
  }
  async function handleRemoveWatchLater() {
    if (removeFromWatchLater) await removeFromWatchLater(video);
    else await removeWatchLaterFunc();
    closeMenu();
  }
  async function handleAddWatchLater() {
    if (saveToWatchLater) await saveToWatchLater(video);
    else await addWatchLater();
    closeMenu();
  }

  // --- Reactive local state fallback ---
  $: if (isChannelSaved === undefined) {
    const channels = get(userChannels);
    _isChannelSaved = !!channels.find(
      ch => ch.id === (video.channel?.id ?? video.channel_id)
    );
  } else {
    _isChannelSaved = isChannelSaved;
  }
  $: if (isWatchLater === undefined) {
    _isWatchLater = get(watchLaterIds).has(video.id);
  } else {
    _isWatchLater = isWatchLater;
  }

  function toggleMenu(e) {
    e.stopPropagation();
    menuOpen = !menuOpen;
  }
  function closeMenu() {
    menuOpen = false;
  }
</script>

<span class="dots-menu" title="Menu" on:click={toggleMenu}>
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="display:block;" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="4" r="1.45" fill="#222" />
    <circle cx="10" cy="10" r="1.45" fill="#222" />
    <circle cx="10" cy="16" r="1.45" fill="#222" />
  </svg>
  {#if menuOpen}
    <div class="card-dropdown-menu" use:onClickOutside={closeMenu}>
      {#if _isChannelSaved}
        <button class="card-dropdown-link" on:click={handleRemoveChannel} disabled={savingChannel ?? _savingChannel}>
          <svg width="16" height="16" viewBox="0 0 24 24" style="margin-right:0.6em;vertical-align:-3px">
            <circle cx="12" cy="12" r="10" fill="none" stroke="#222" stroke-width="2"/>
            <path d="M8 12h8" stroke="#222" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {(savingChannel ?? _savingChannel) ? 'Removing...' : 'Remove from My Channels'}
        </button>
      {:else}
        <button class="card-dropdown-link" on:click={handleSaveChannel} disabled={savingChannel ?? _savingChannel}>
          <svg width="16" height="16" viewBox="0 0 24 24" style="margin-right:0.6em;vertical-align:-3px">
            <circle cx="12" cy="12" r="10" fill="none" stroke="#222" stroke-width="2"/>
            <path d="M8 12h8M12 8v8" stroke="#222" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {(savingChannel ?? _savingChannel) ? 'Saving...' : 'Add to My Channels'}
        </button>
      {/if}
      {#if _isWatchLater}
        <button class="card-dropdown-link" on:click={handleRemoveWatchLater} disabled={savingWatchLater ?? _savingWatchLater}>
          <svg width="16" height="16" viewBox="0 0 24 24" style="margin-right:0.6em;vertical-align:-3px">
            <circle cx="12" cy="12" r="10" fill="none" stroke="#222" stroke-width="2"/>
            <path d="M12 8v4l3 2" stroke="#222" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {(savingWatchLater ?? _savingWatchLater) ? 'Removing...' : 'Remove from Watch Later'}
        </button>
      {:else}
        <button class="card-dropdown-link" on:click={handleAddWatchLater} disabled={savingWatchLater ?? _savingWatchLater}>
          <svg width="16" height="16" viewBox="0 0 24 24" style="margin-right:0.6em;vertical-align:-3px">
            <circle cx="12" cy="12" r="10" fill="none" stroke="#222" stroke-width="2"/>
            <path d="M12 8v4l3 2" stroke="#222" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {(savingWatchLater ?? _savingWatchLater) ? 'Saving...' : 'Add to Watch Later'}
        </button>
      {/if}
    </div>
  {/if}
</span>

<style>
/* --- Matches card dropdown style exactly --- */
.dots-menu {
  margin-left: auto;
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  position: relative;
  margin-top: 0.03em;
  z-index: 20;
}
.card-dropdown-menu {
  position: absolute;
  bottom: 28px;
  right: 0;
  min-width: 232px;
  background: #fff;
  box-shadow: 0 8px 32px #0001, 0 1.5px 6px #0002;
  border-radius: 8px;
  padding: 0.18em 0;
  z-index: 200;
  border: 1px solid #ededed;
  display: flex;
  flex-direction: column;
  gap: 0.1em;
}
.card-dropdown-link {
  background: none;
  border: none;
  color: #222;
  text-align: left;
  padding: 0.48em 1.25em 0.48em 1em;
  font-size: 0.95em;
  font-weight: 500;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.47em;
  transition: background 0.16s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-dropdown-link:active {
  background: #ececec;
}
.card-dropdown-link:focus {
  outline: none;
}
.card-dropdown-link svg {
  min-width: 16px;
  min-height: 16px;
  flex-shrink: 0;
}

/* Even smaller on mobile */
@media (max-width: 600px) {
  .card-dropdown-menu {
    min-width: 150px;
  }
  .card-dropdown-link {
    font-size: 0.88em;
    padding: 0.38em 0.6em 0.38em 0.5em;
    gap: 0.24em;
  }
  .card-dropdown-link svg {
    width: 12px;
    height: 12px;
    margin-right: 0.32em;
  }
}
</style>
