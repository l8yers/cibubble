<script>
  import { goto } from '$app/navigation';

  export let video;
  export let getBestThumbnail;
  export let difficultyColor;
  export let difficultyLabel;
  export let formatLength;
  export let filterByChannel;
  export let query = "";

  function makeChannelUrl(channelId) {
    const params = new URLSearchParams(query);
    params.set('channel', channelId);
    return `/?${params.toString()}`;
  }
</script>

<div class="history-card">
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
  <div class="history-card-body">
    <div class="card-title-row">
      <span class="history-card-title">{video.title}</span>
    </div>
    <div class="history-card-meta">
      <span class="history-badge" style="background:{difficultyColor(video.level)};">
        {difficultyLabel(video.level)}
      </span>
      {#if video.channel_id && (video.channel?.name || video.channel_name)}
        <a
          class="history-channel-name"
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
.history-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px #efefef;
  display: flex;
  flex-direction: column;
  border: 1px solid #ececec;
  width: 275px;
  min-width: 260px;
  max-width: 330px;
  margin: 0;
  transition: box-shadow 0.13s;
}
.history-card:hover {
  box-shadow: 0 4px 18px #e2e2ff66;
  border-color: #d7e2fc;
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
  min-height: 100px;
  display: block;
  position: relative;
  z-index: 1;
}
.length-inline {
  position: absolute;
  right: 0.39em;
  bottom: 0.39em;
  color: #fff;
  background: #222c;
  font-size: 0.93em;
  padding: 0.11em 0.48em;
  border-radius: 4px;
  font-weight: 500;
  opacity: 0.98;
  box-shadow: 0 1px 4px #0002;
  z-index: 9;
  pointer-events: none;
  max-width: 85%;
  text-align: right;
  white-space: nowrap;
}
.history-card-body {
  padding: 0.8em 0.95em 0.5em 0.95em;
  color: #232323;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.card-title-row {
  display: flex;
  align-items: center;
  gap: 0.4em;
  margin-bottom: 0.1em;
}
.history-card-title {
  font-size: 1.01em;
  font-weight: 600;
  min-height: 2.3em;
  max-height: 2.4em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
  line-height: 1.23;
}
.history-card-meta {
  display: flex;
  align-items: center;
  gap: 0.28em;
  margin-top: 0.42em;
  font-size: 0.94em;
}
.history-badge {
  display: inline-block;
  font-size: 0.92em;
  font-weight: 600;
  padding: 0.13em 0.4em;
  border-radius: 3px;
  color: #fff;
  background: #bbb;
  border: 1px solid #eee;
  text-shadow: 0 1px 4px #0001;
  white-space: nowrap;
  margin-right: 0.09em;
}
.history-channel-name {
  color: #2e9be6;
  font-size: 0.96em;
  text-decoration: none;
  background: #f6f6f6;
  border-radius: 2px;
  padding: 0.07em 0.32em;
  font-weight: 500;
  transition: background 0.13s, color 0.13s;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 108px;
  vertical-align: middle;
  margin-left: 0;
}
.history-channel-name:hover {
  background: #e4e4e4;
  color: #e93c2f;
}

@media (max-width: 720px) {
  .history-card {
    width: 93vw;
    min-width: 90vw;
    max-width: 98vw;
  }
  .history-card-title {
    font-size: 0.95em;
    min-height: 1.6em;
    max-height: 2.1em;
  }
  .history-card-meta {
    font-size: 0.84em;
  }
  .history-badge {
    font-size: 0.88em;
    padding: 0.09em 0.18em;
  }
  .history-channel-name {
    font-size: 0.91em;
    max-width: 60vw;
    padding: 0.04em 0.15em;
  }
}
</style>
