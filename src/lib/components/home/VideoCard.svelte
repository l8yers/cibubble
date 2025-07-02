<script>
  import { goto } from '$app/navigation';
  import { MoreVertical, PlusCircle, XCircle, Clock, X } from 'lucide-svelte';

  // Svelte action: call callback when clicking outside node
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

  export let video;
  export let getBestThumbnail;
  export let difficultyColor;
  export let difficultyLabel;
  export let formatLength;
  export let filterByChannel;
  export let filterByPlaylist;
  export let query = "";

  // State for toggle logic and action handlers
  export let isChannelSaved = false;
  export let isWatchLater = false;
  export let onAddToChannels;
  export let onRemoveFromChannels;
  export let onAddToWatchLater;
  export let onRemoveFromWatchLater;
  export let savingChannel = false;
  export let savingWatchLater = false;

  let menuOpen = false;

  function makeChannelUrl(channelId) {
    const params = new URLSearchParams(query);
    params.set('channel', channelId);
    return `/?${params.toString()}`;
  }

  function toggleMenu(e) {
    e.stopPropagation();
    menuOpen = !menuOpen;
  }

  function closeMenu() {
    menuOpen = false;
  }

  async function handleChannelClick() {
    if (isChannelSaved) {
      if (onRemoveFromChannels) await onRemoveFromChannels(video);
    } else {
      if (onAddToChannels) await onAddToChannels(video);
    }
    closeMenu();
  }
  async function handleWatchLaterClick() {
    if (isWatchLater) {
      if (onRemoveFromWatchLater) await onRemoveFromWatchLater(video);
    } else {
      if (onAddToWatchLater) await onAddToWatchLater(video);
    }
    closeMenu();
  }
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
      <span class="dots-menu" title="Menu" on:click={toggleMenu}>
        <MoreVertical size={20} />
        {#if menuOpen}
          <div class="dropdown-menu" use:onClickOutside={closeMenu}>
            <!-- Toggle My Channels -->
            {#if isChannelSaved}
              <button
                class="dropdown-link"
                type="button"
                on:click={handleChannelClick}
                disabled={savingChannel}
              >
                <XCircle class="dropdown-icon in" />
                Remove from My Channels
              </button>
            {:else}
              <button
                class="dropdown-link"
                type="button"
                on:click={handleChannelClick}
                disabled={savingChannel}
              >
                <PlusCircle class="dropdown-icon" />
                Add to My Channels
              </button>
            {/if}

            <!-- Toggle Watch Later -->
            {#if isWatchLater}
              <button
                class="dropdown-link"
                type="button"
                on:click={handleWatchLaterClick}
                disabled={savingWatchLater}
              >
                <X class="dropdown-icon in" />
                Remove from Watch Later
              </button>
            {:else}
              <button
                class="dropdown-link"
                type="button"
                on:click={handleWatchLaterClick}
                disabled={savingWatchLater}
              >
                <Clock class="dropdown-icon" />
                Add to Watch Later
              </button>
            {/if}
          </div>
        {/if}
      </span>
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
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.2em;
  gap: 0.6em;
}

.card-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;        /* Clamp to two lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 1.08rem;
  font-weight: 600;
  line-height: 1.32;
}

.dots-menu {
  flex: 0 0 auto;
  margin-left: 0.6em;
  margin-right: 0;
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  z-index: 20;
}

.dropdown-menu {
  position: absolute;
  bottom: 28px;
  right: 0;
  min-width: 210px;
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
.dropdown-link {
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
.dropdown-link:active {
  background: #ececec;
}
.dropdown-link:focus {
  outline: none;
}
.dropdown-icon {
  width: 1.2em;
  height: 1.2em;
  margin-right: 0.6em;
  vertical-align: -3px;
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

/* ---- Channel name & meta-link: bulletproof dark grey ---- */
a.channel-name,
a.meta-link {
  color: #444 !important;
  font-size: 0.98em;
  font-weight: 500;
  background: none;
  border-radius: 0;
  padding: 0;
  margin-right: 0.18em;
  text-decoration: none;
  transition: color 0.14s;
  display: inline;
}
a.channel-name:hover,
a.meta-link:hover,
a.channel-name:focus,
a.meta-link:focus {
  color: #222 !important;
  background: none;
  text-decoration: none;
}
a.channel-name:visited,
a.meta-link:visited {
  color: #444 !important;
}

@media (max-width: 720px) {
  .card-title {
    font-size: 0.95em;
    font-weight: 600;
    line-height: 1.23;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card-meta {
    font-size: 0.8em;
  }
  .badge {
    font-size: 0.88em;
    padding: 0.11em 0.45em;
  }
  a.channel-name,
  a.meta-link {
    font-size: 0.93em;
    padding: 0;
  }
}

</style>
