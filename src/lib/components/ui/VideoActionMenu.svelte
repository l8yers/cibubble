<script>
  import { get } from 'svelte/store';
  import { user } from '$lib/stores/user.js';
  import { userChannels } from '$lib/stores/userChannels.js';
  import {
    watchLaterIds,
    addToWatchLater,
    removeFromWatchLater,
    loadWatchLaterVideos
  } from '$lib/stores/videos.js';

  export let video;

  // Optional props: use these if passed in (player page)
  export let isChannelSaved = undefined;
  export let savingChannel = undefined;
  export let saveChannelToMyChannels = undefined;
  export let removeChannelFromMyChannels = undefined;

  export let isWatchLater = undefined;
  export let savingWatchLater = undefined;
  export let saveToWatchLater = undefined;


  let menuOpen = false;

  // State for self-management
  let _isChannelSaved = false;
  let _savingChannel = false;
  let _isWatchLater = false;
  let _savingWatchLater = false;

  // Svelte action
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

  // Self-managed channel save logic
  async function saveChannel() {
    if (!_savingChannel && $user && video?.channel_id) {
      _savingChannel = true;
      const { data, error } = await fetch('/api/saved-channels', {
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

  // Self-managed watch later logic
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
      await removeFromWatchLater(video.id);
      _savingWatchLater = false;
    }
  }

  // Compute state reactively if not provided
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
    <div class="dropdown-menu" use:onClickOutside={closeMenu}>
      {#if _isChannelSaved}
        <button class="dropdown-item" on:click={removeChannelFromMyChannels ? removeChannelFromMyChannels : removeChannel} disabled={savingChannel ?? _savingChannel}>
          <svg width="16" height="16" viewBox="0 0 24 24" style="margin-right:0.6em;vertical-align:-3px">
            <circle cx="12" cy="12" r="10" fill="none" stroke="#222" stroke-width="2"/>
            <path d="M8 12h8" stroke="#222" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {(savingChannel ?? _savingChannel) ? 'Removing...' : 'Remove from My Channels'}
        </button>
      {:else}
        <button class="dropdown-item" on:click={saveChannelToMyChannels ? saveChannelToMyChannels : saveChannel} disabled={savingChannel ?? _savingChannel}>
          <svg width="16" height="16" viewBox="0 0 24 24" style="margin-right:0.6em;vertical-align:-3px">
            <circle cx="12" cy="12" r="10" fill="none" stroke="#222" stroke-width="2"/>
            <path d="M8 12h8M12 8v8" stroke="#222" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {(savingChannel ?? _savingChannel) ? 'Saving...' : 'Add to My Channels'}
        </button>
      {/if}
      {#if _isWatchLater}
        <button class="dropdown-item" on:click={removeFromWatchLater ? removeFromWatchLater : removeWatchLaterFunc} disabled={savingWatchLater ?? _savingWatchLater}>
          <svg width="16" height="16" viewBox="0 0 24 24" style="margin-right:0.6em;vertical-align:-3px">
            <circle cx="12" cy="12" r="10" fill="none" stroke="#222" stroke-width="2"/>
            <path d="M12 8v4l3 2" stroke="#222" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {(savingWatchLater ?? _savingWatchLater) ? 'Removing...' : 'Remove from Watch Later'}
        </button>
      {:else}
        <button class="dropdown-item" on:click={saveToWatchLater ? saveToWatchLater : addWatchLater} disabled={savingWatchLater ?? _savingWatchLater}>
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
.dots-menu {
  margin-left: auto;
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  position: relative;
  margin-top: 0.03em;
  z-index: 20;
}
.dropdown-menu {
  position: absolute;
  bottom: 28px;
  right: 0;
  min-width: 170px;
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
.dropdown-item {
  background: none;
  border: none;
  color: #222;
  text-align: left;
  padding: 0.52em 1em 0.44em 0.9em;
  font-size: 0.99em;
  font-weight: 500;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5em;
  transition: background 0.16s;
}
.dropdown-item:active {
  background: #ececec;
}
.dropdown-item:focus {
  outline: none;
}
</style>
