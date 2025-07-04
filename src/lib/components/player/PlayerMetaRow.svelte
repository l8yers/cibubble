<script>
  import VideoMenuDropdown from '$lib/components/ui/VideoMenuDropdown.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import { goto } from '$app/navigation';

  export let video;
  export let utils;
  export let user = null;

  export let isChannelSaved = false;
  export let savingChannel = false;
  export let saveChannelToMyChannels = () => {};
  export let removeChannelFromMyChannels = () => {};

  export let isWatchLater = false;
  export let savingWatchLater = false;
  export let saveToWatchLater = undefined;
  export let removeFromWatchLater = undefined;

  const dispatch = createEventDispatcher();
  let isMobile = false;

  onMount(() => {
    const check = () => (isMobile = window.innerWidth <= 800);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  });

  // ---- TAGS ----
  $: videoTags = Array.isArray(video?.tags)
    ? video.tags
    : (typeof video?.tags === 'string'
        ? video.tags.split(',').map(t => t.trim()).filter(Boolean)
        : []);

  // Tag color matching your modal
  const TAG_COLORS = [
    '#254B8B', '#953553', '#296D3F', '#5A2386', '#3B3333', '#DB4B2A', '#008080',
    '#3D3946', '#8E562E', '#B80028', '#205072', '#34495E', '#1E2D3B', '#232526',
    '#36454F', '#432818'
  ];
  function tagColor(tag) {
    let sum = 0;
    for (let i = 0; i < tag.length; i++) sum += tag.charCodeAt(i);
    return TAG_COLORS[sum % TAG_COLORS.length];
  }

  function goToTag(tag) {
    goto(`/?tags=${encodeURIComponent(tag)}`);
  }
</script>

<div class="player-meta-row">
  <div class="meta-title-row">
    <div class="player-title">{video.title}</div>
    {#if user && video?.channel_id}
      <VideoMenuDropdown
        {video}
        {user}
        {isChannelSaved}
        {savingChannel}
        {saveChannelToMyChannels}
        {removeChannelFromMyChannels}
        {isWatchLater}
        {savingWatchLater}
        {saveToWatchLater}
        {removeFromWatchLater}
      />
    {/if}
  </div>

  <div class="meta-channel-row">
    {#if video?.channel?.name}
      <div class="player-channel">{video.channel.name}</div>
    {/if}
    {#if video.length}
      <span class="player-duration">{utils.formatLength(video.length)}</span>
    {/if}
  </div>

  <div class="player-meta-badges">
    <span
      class="player-diff-badge"
      style="background: {utils.difficultyColor(video.level)};"
    >
      {utils.difficultyLabel(video.level)}
    </span>

    {#each videoTags as tag}
      <span
        class="player-tag"
        tabindex="0"
        style="background: {tagColor(tag)}; color: #fff; cursor: pointer;"
        title={"View more videos tagged " + tag}
        role="button"
        on:click={() => goToTag(tag)}
        on:keydown={(e) => { if (e.key === "Enter" || e.key === " ") goToTag(tag); }}
      >
        {tag}
      </span>
    {/each}

    <button
      class="player-tags-badge"
      type="button"
      aria-label="View tags"
      on:click={() => dispatch('openTags')}
    >
      ADD TAGS
    </button>
  </div>
</div>

<style>
.player-meta-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.43em;
  margin-bottom: 0.95em;
  width: 100%;
  margin-top: 1.1em;
}

.meta-title-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 1.1em;
}

.player-title {
  font-size: 1.38rem;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1.21;
  overflow-wrap: anywhere;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-meta-badges {
  display: flex;
  align-items: center;
  gap: 0.7em;
  margin-top: 0.18em;
  margin-bottom: 0;
}

.player-tag {
  display: inline-flex;
  align-items: center;
  background: #f0f0fc;
  color: #334;
  border-radius: 6px;
  font-size: 0.89em;
  font-weight: 600;
  padding: 0 0.65em;
  margin: 0 0.12em;
  height: 23px;
  line-height: 23px;
  letter-spacing: 0.01em;
  box-shadow: 0 1px 4px #0001;
  text-shadow: 0 1px 2px #fff1;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  outline: none;
  border: none;
}
.player-tag:hover,
.player-tag:focus {
  filter: brightness(1.17);
  outline: 2px solid #fff6;
}

.meta-channel-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 0.10em;
  margin-bottom: 0.22em;
}

.player-channel {
  font-size: 1.06rem;
  font-weight: 500;
  color: #435576;
  letter-spacing: 0.01em;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-duration {
  font-size: 0.99em;
  color: #adadad;
  margin-left: 1em;
  white-space: nowrap;
}

.player-diff-badge,
.player-tags-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 23px;
  font-size: 0.87em;
  font-weight: 700;
  padding: 0 0.65em;
  border-radius: 7px;
  color: #fff;
  letter-spacing: 0.01em;
  box-shadow: 0 1px 6px #0001;
  white-space: nowrap;
  text-shadow: 0 1px 3px #0002;
  transition: box-shadow 0.13s;
  border: none;
  cursor: pointer;
  text-transform: uppercase;
}

.player-diff-badge {
  background: var(--diff-color, #bbb);
}
.player-tags-badge {
  background: #e6e6ee;
  color: #2a2a38;
  margin-left: 0.12em;
  transition: background 0.14s;
}
.player-tags-badge:hover,
.player-tags-badge:focus {
  background: #ccccee;
  outline: none;
  color: #1a1a1a;
}

@media (max-width: 800px) {
  .player-meta-row {
    gap: 0.33em;
    width: 100%;
    margin-bottom: 0.72em;
    padding: 0.6em 0.08em;
    margin-top: 0.7em;
  }
  .meta-title-row {
    gap: 0.08em;
    width: 100%;
  }
  .player-title {
    font-size: 1.07rem;
    line-height: 1.18;
    margin-bottom: 0.12em;
  }
  .meta-channel-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin: 0.06em 0 0.17em 0;
  }
  .player-channel {
    font-size: 0.97rem;
    max-width: 70vw;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .player-duration {
    font-size: 0.96em;
    margin-left: 0.7em;
    white-space: nowrap;
  }
  .player-meta-badges {
    gap: 0.44em;
    margin-top: 0.06em;
  }
  .player-diff-badge,
  .player-tags-badge {
    font-size: 0.80em;
    height: 20px;
    padding: 0 0.5em;
    border-radius: 6px;
  }
  .player-tag {
    font-size: 0.77em;
    height: 20px;
    padding: 0 0.49em;
    border-radius: 6px;
  }
}
</style>
