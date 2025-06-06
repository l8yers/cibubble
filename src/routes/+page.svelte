<script>
  export let data;
  let videos = data.videos ?? [];

  function parseISODuration(duration) {
    if (!duration) return '';
    // Parses ISO 8601 (PT1H2M3S) to h:mm:ss or m:ss
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';
    const h = parseInt(match[1] || '0', 10);
    const m = parseInt(match[2] || '0', 10);
    const s = parseInt(match[3] || '0', 10);
    if (h) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function badgeColor(rating) {
    switch ((rating ?? '').toLowerCase()) {
      case "beginner": return "background:#b9f5b9;color:#156318;border:1.2px solid #48d548;";
      case "intermediate": return "background:#ffe495;color:#a68215;border:1.2px solid #ffd400;";
      case "advanced": return "background:#fad2e2;color:#9b2e54;border:1.2px solid #e74a89;";
      case "native": return "background:#bde2ff;color:#15487a;border:1.2px solid #41a7e6;";
      default: return "background:#e7e7e7;color:#888;border:1.2px solid #ccc;";
    }
  }
</script>

<h1 style="margin-bottom:1.2em">All Videos</h1>
<div class="video-grid-container">
  <div class="video-grid">
    {#each videos as video (video.id)}
      {#if video && video.title}
        <div class="video-card">
          <a href={"/video/" + video.id} class="video-link">
            <div class="thumb-wrap">
              <img
                src={video.thumbnail ?? ("https://img.youtube.com/vi/" + video.id + "/hqdefault.jpg")}
                alt={video.title}
                class="thumb"
              />
              {#if video.duration}
                <span class="duration-badge">{parseISODuration(video.duration)}</span>
              {/if}
            </div>
            <div class="video-info">
              <p class="video-title">{video.title}</p>
              <div class="meta-row">
                <span class="difficulty-badge" style={badgeColor(video.rating)}>
                  {video.rating || "not rated yet"}
                </span>
                <span class="channel-title">{video.channelTitle ?? ""}</span>
              </div>
            </div>
          </a>
        </div>
      {/if}
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
    margin-bottom: 0.5em;
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
  .video-info {
    margin-top: 0.2em;
  }
  .video-title {
    margin: 0 0 0.18em 0;
    font-weight: 600;
    font-size: 1.07em;
    line-height: 1.21;
    flex: 1 1 auto;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    width: 100%;
    color: #111;
  }
  .meta-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.6em;
    margin-top: 0.1em;
  }
  .difficulty-badge {
    font-size: 0.91em;
    font-weight: 600;
    border-radius: 6px;
    padding: 0.1em 0.75em 0.12em 0.75em;
    display: inline-block;
    text-transform: capitalize;
    white-space: nowrap;
    letter-spacing: 0.01em;
    min-width: 72px;
    text-align: center;
    box-shadow: 0 1px 2px #0001;
    user-select: none;
  }
  .channel-title {
    color: #456;
    font-size: 0.92em;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
    opacity: 0.92;
  }
</style>
