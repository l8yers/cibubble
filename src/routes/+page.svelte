<script>
  export let data;
  let videos = data.videos;

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

<h1>All Videos</h1>
<div class="video-grid-container">
  <div class="video-grid">
    {#each videos as video}
      <div class="video-card">
        <a href={"/video/" + video.id} class="video-link">
          <div class="thumb-wrap">
            <img
              src={"https://img.youtube.com/vi/" + video.id + "/hqdefault.jpg"}
              alt={video.title}
              class="thumb"
            />
            {#if video.duration}
              <span class="duration-badge">{parseISODuration(video.duration)}</span>
            {/if}
          </div>
          <p class="video-title">{video.title}</p>
        </a>
      </div>
    {/each}
  </div>
</div>

<style>
  .video-grid-container {
    padding: 0 3vw;
    width: 100%;
    box-sizing: border-box;
    min-height: 100vh;
    background: #fafbfc;
  }

  .video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2.2rem 1.5rem;
    width: 100%;
    margin: 0 auto;
    max-width: 1800px;
  }

  .video-card {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 0.6rem;
    background: #fff;
    box-shadow: 0 1px 3px #0001;
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: box-shadow 0.2s;
  }

  .video-card:hover {
    box-shadow: 0 6px 24px #0002;
  }

  .video-link {
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    height: 100%;
    cursor: pointer;
  }

  .thumb-wrap {
    position: relative;
    width: 100%;
    padding-top: 56.25%; /* 16:9 ratio */
    overflow: hidden;
    border-radius: 6px;
    background: #111;
    margin-bottom: 0.6em;
  }

  .thumb {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    border-radius: 6px;
    display: block;
  }

  .duration-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(30,30,30,0.82);
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.95em;
    font-family: monospace;
    pointer-events: none;
  }

  .video-title {
    margin: 0.5em 0 0.1em;
    font-weight: 600;
    font-size: 1.08em;
    line-height: 1.18;
    flex: 0 0 auto;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    width: 100%;
  }
</style>
