<script>
  import VideoWatchTracker from '$lib/components/VideoWatchTracker.svelte';
  export let video;
  export let user;
  export let suggestions;
  export let autoplayValue;
  export let handlePlayNextVideo;
</script>

<div class="player-video-box">
  <iframe
    id="yt-player"
    width="100%"
    height="100%"
    src={`https://www.youtube.com/embed/${video.id}?enablejsapi=1&autoplay=1`}
    title={video.title}
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
  {#if user}
    {#key video.id}
      <VideoWatchTracker
        videoId={video.id}
        videoDuration={video.length}
        userId={user.id}
        {suggestions}
        autoplay={autoplayValue}
        on:playNextVideo={handlePlayNextVideo}
      />
    {/key}
  {/if}
</div>

<style>
.player-video-box {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 2px 16px #ececec60;
  border: 1.7px solid #ededed;
  overflow: hidden;
  margin-bottom: 0.8rem;
  position: relative;
}
</style>
