<script>
  export let data;

  function parseISODuration(duration) {
    if (!duration) return '';
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const h = parseInt(match[1] || "0", 10);
    const m = parseInt(match[2] || "0", 10);
    const s = parseInt(match[3] || "0", 10);
    if (h) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
</script>

<div class="player-page">
  <div class="player-section">
    <div class="video-embed-wrap">
      <iframe
        src={`https://www.youtube.com/embed/${data.video.id}?autoplay=1`}
        width="100%"
        height="480"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        title={data.video.title}
        class="player-iframe"
      ></iframe>
    </div>
    <h2 class="video-title">{data.video.title}</h2>
    <div class="video-meta">
      {#if data.video.duration}
        <span class="meta-badge">Length: {parseISODuration(data.video.duration)}</span>
      {/if}
      {#if data.video.rating}
        <span class="meta-badge" style="background: #fcf4e3; color: #a38118; margin-left:0.6em;">
          Level: {data.video.rating}
        </span>
      {/if}
      {#if data.video.channelTitle}
        <span class="meta-badge" style="background:#f0f0f6; color:#233;">Channel: {data.video.channelTitle}</span>
      {/if}
    </div>
  </div>
</div>

<style>
  .player-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2.5rem 1.5vw 2rem 1.5vw;
    min-height: 100vh;
    background: #f6f8fa;
  }
  .player-section {
    width: 100%;
    max-width: 950px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 36px #0001, 0 1.5px 5px #0001;
    padding: 2rem 2.5vw 1.6rem 2.5vw;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .video-embed-wrap {
    width: 100%;
    aspect-ratio: 16/9;
    background: #111;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 18px #0001;
    min-width: 0;
  }
  .player-iframe {
    width: 100%;
    height: 100%;
    min-height: 320px;
    border: none;
    border-radius: 12px;
    background: #000;
    display: block;
  }
  .video-title {
    font-size: 1.35em;
    font-weight: 700;
    margin-bottom: 0.6em;
    margin-top: 0;
    color: #222;
    line-height: 1.2;
    word-break: break-word;
    text-shadow: 0 1px 0 #fafafa;
  }
  .video-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6em;
    margin-bottom: 0.4em;
    font-size: 1.01em;
  }
  .meta-badge {
    background: #e7f3fc;
    color: #206494;
    border-radius: 6px;
    padding: 0.21em 0.85em;
    margin-right: 0.1em;
    font-size: 0.97em;
    font-weight: 600;
    letter-spacing: 0.01em;
    box-shadow: 0 1px 2px #0001;
    user-select: none;
  }
  @media (max-width: 800px) {
    .player-section { padding: 1rem 0.5vw 1rem 0.5vw; }
    .player-page { padding: 1rem 0vw; }
    .video-title { font-size: 1.1em; }
    .player-iframe { min-height: 200px; }
  }
</style>
