<script>
  import { goto } from '$app/navigation';

  // onClickOutside Svelte action
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
  export let query = "";

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
  function addToChannels() {
    alert('Added to My Channels!');
    menuOpen = false;
  }
  function addToWatchLater() {
    alert('Added to Watch Later!');
    menuOpen = false;
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
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="display:block;" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="4" r="1.45" fill="#222" />
          <circle cx="10" cy="10" r="1.45" fill="#222" />
          <circle cx="10" cy="16" r="1.45" fill="#222" />
        </svg>
        {#if menuOpen}
          <div class="dropdown-menu" use:onClickOutside={closeMenu}>
            <button class="dropdown-item" on:click={addToChannels}>
              <svg width="16" height="16" viewBox="0 0 24 24" style="margin-right:0.6em;vertical-align:-3px"><circle cx="12" cy="12" r="10" fill="none" stroke="#222" stroke-width="2"/><path d="M8 12h8M12 8v8" stroke="#222" stroke-width="2" stroke-linecap="round"/></svg>
              Add to My Channels
            </button>
            <button class="dropdown-item" on:click={addToWatchLater}>
              <svg width="16" height="16" viewBox="0 0 24 24" style="margin-right:0.6em;vertical-align:-3px"><circle cx="12" cy="12" r="10" fill="none" stroke="#222" stroke-width="2"/><path d="M12 8v4l3 2" stroke="#222" stroke-width="2" stroke-linecap="round"/></svg>
              Add to Watch Later
            </button>
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
  align-items: flex-start;
  gap: 0.6em;
  margin-bottom: 0.2em;
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
  bottom: 28px;    /* Drop up! */
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
