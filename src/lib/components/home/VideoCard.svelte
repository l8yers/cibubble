<script>
  import { MoreVertical, Clock, Copy, Share2 } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { watchLaterIds, addToWatchLater, removeFromWatchLater } from '$lib/stores/videos.js';
  import { get } from 'svelte/store';

  export let video;
  export let getBestThumbnail;
  export let difficultyColor;
  export let difficultyLabel;
  export let formatLength;
  export let filterByChannel;
  export let query = "";

  let showMenu = false;
  let menuRef;

  function makeChannelUrl(channelId) {
    const params = new URLSearchParams(query);
    params.set('channel', channelId);
    return `/?${params.toString()}`;
  }

  function handleMenuAction(action) {
    showMenu = false;
    if (action === 'watchlater') {
      if (get(watchLaterIds).has(video.id)) {
        removeFromWatchLater(video.id);
      } else {
        addToWatchLater(video.id);
      }
    } else if (action === 'copylink') {
      navigator.clipboard.writeText(`${window.location.origin}/video/${video.id}`);
    } else if (action === 'share') {
      // Try Web Share API first
      if (navigator.share) {
        navigator.share({
          title: video.title,
          url: `${window.location.origin}/video/${video.id}`
        });
      } else {
        navigator.clipboard.writeText(`${window.location.origin}/video/${video.id}`);
      }
    }
  }

  function handleClickOutside(event) {
    if (showMenu && menuRef && !menuRef.contains(event.target)) {
      showMenu = false;
    }
  }

  // Close menu on outside click
  import { onMount, onDestroy } from 'svelte';
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
  });
  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  $: isInWatchLater = get(watchLaterIds).has(video.id);
</script>

<div class="card">
  <a href={`/video/${video.id}`}>
    <span class="thumb-wrapper">
      <img
        class="thumb"
        src={getBestThumbnail(video)}
        alt={video.title}
        loading="lazy"
        on:error={(e) => e.target.src = '/images/no_thumb_nail.png'}
      />
      {#if video.length}
        <span class="length-inline">{formatLength(video.length)}</span>
      {/if}
    </span>
  </a>
  <div class="card-body">
    <div class="card-title-row">
      <span class="card-title">{video.title}</span>
      <div class="menu-container">
        <button
          class="more-btn"
          aria-label="Show more actions"
          on:click|stopPropagation={() => showMenu = !showMenu}
        >
          <MoreVertical size={21} />
        </button>
        {#if showMenu}
          <div class="more-menu" bind:this={menuRef}>
            <button on:click={() => handleMenuAction('watchlater')}>
              <Clock size={16} style="margin-right:7px;vertical-align:-2px;" />
              {isInWatchLater ? 'Remove from Watch Later' : 'Add to Watch Later'}
            </button>
            <button on:click={() => handleMenuAction('copylink')}>
              <Copy size={16} style="margin-right:7px;vertical-align:-2px;" />
              Copy Link
            </button>
            <button on:click={() => handleMenuAction('share')}>
              <Share2 size={16} style="margin-right:7px;vertical-align:-2px;" />
              Share
            </button>
          </div>
        {/if}
      </div>
    </div>
    <div class="card-meta">
      <span class="badge" style="background:{difficultyColor(video.level)};">
        {difficultyLabel(video.level)}
      </span>

      {#if video.channel_id && (video.channel?.name || video.channel_name)}
        <a
          class="meta-link channel-name"
          style="color:#2e9be6;cursor:pointer;"
          title={video.channel?.name ?? video.channel_name}
          href={makeChannelUrl(video.channel_id)}
          on:click|preventDefault={() => goto(makeChannelUrl(video.channel_id))}
        >
          {video.channel?.name ?? video.channel_name}
        </a>
      {/if}
    </div>
  </div>
</div>

<style>
.card {
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px #e8e8e8;
  display: flex;
  flex-direction: column;
  border: 1px solid #ededed;
  position: relative;
}

.thumb-wrapper {
  position: relative;
  display: block;
}

.thumb {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  background: #eee;
  min-height: 112px;
  display: block;
  position: relative;
  z-index: 1;
}

/* Duration label inside thumbnail, bottom right, always on top */
.length-inline {
  position: absolute;
  right: 0.55em;
  bottom: 0.55em;
  color: #fff;
  background: #222c;
  font-size: 0.97em;
  padding: 0.14em 0.66em;
  border-radius: 6px;
  font-weight: 500;
  opacity: 0.96;
  box-shadow: 0 1px 4px #0002;
  z-index: 9;
  pointer-events: none;
  max-width: 85%;
  text-align: right;
  white-space: nowrap;
}

.card-body {
  padding: 1rem 1rem 0.7rem 1rem;
  color: #222;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.card-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6em;
  margin-bottom: 0.2em;
  position: relative;
}
.card-title {
  font-size: 1.08rem;
  font-weight: 600;
  min-height: 2.7em;
  max-height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
  line-height: 1.32;
}

.menu-container {
  position: relative;
  align-self: flex-start;
  z-index: 14;
}
.more-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.23em;
  border-radius: 50%;
  transition: background 0.14s;
  margin-left: 0.2em;
}
.more-btn:hover, .more-btn:focus {
  background: #f1f1f5;
}
.more-menu {
  position: absolute;
  top: 2em;
  right: 0;
  background: #fff;
  border-radius: 9px;
  box-shadow: 0 4px 16px #0001;
  min-width: 175px;
  font-size: 0.99em;
  padding: 0.3em 0.1em;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 0.1em;
  border: 1px solid #ececec;
}
.more-menu button {
  background: none;
  border: none;
  text-align: left;
  padding: 0.95em 1em 0.85em 0.9em;
  color: #202134;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.13s, color 0.13s;
  display: flex;
  align-items: center;
}
.more-menu button:hover, .more-menu button:focus {
  background: #f5f5fd;
  color: #e93c2f;
}

.card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5em;
  margin-top: 0.6em;
  font-size: 1em;
}
.badge {
  display: inline-block;
  font-size: 0.89em;
  font-weight: 600;
  padding: 0.18em 0.7em;
  border-radius: 4px;
  margin-right: 0.5em;
  color: #fff;
  background: #bbb;
  letter-spacing: 0.01em;
  border: 1.5px solid transparent;
  text-shadow: 0 1px 4px #0001;
  white-space: nowrap;
}
/* Remove any max-width and truncation from channel name */
.meta-link,
.channel-name {
  color: #2e9be6;
  font-size: 0.97em;
  text-decoration: none;
  background: #f6f6f6;
  border-radius: 3px;
  padding: 0.12em 0.55em;
  margin-right: 0.18em;
  font-weight: 500;
  transition: background 0.13s, color 0.13s;
  display: inline-block;
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
  max-width: none;
}
.meta-link:hover {
  background: #e4e4e4;
  color: #e93c2f;
}

@media (max-width: 720px) {
  .card-title {
    font-size: 0.95em;
    font-weight: 600;
    line-height: 1.23;
    min-height: 2.1em;
    max-height: 2.3em;
  }
  .card-meta {
    font-size: 0.8em;
  }
  .badge {
    font-size: 0.88em;
    padding: 0.11em 0.45em;
  }
  .meta-link,
  .channel-name {
    font-size: 0.93em;
    max-width: none;
    padding: 0.05em 0.28em;
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }
}
</style>
