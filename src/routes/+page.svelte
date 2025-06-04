<script>
  let videos = [];

  async function loadVideos() {
    const res = await fetch('/api/videos');
    videos = await res.json();
  }
  loadVideos();
</script>

<h1>All Videos</h1>
<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:1rem;">
  {#each videos as video}
    <div style="border:1px solid #ccc; border-radius:8px; padding:1rem;">
      <a href={"https://youtube.com/watch?v=" + video.id} target="_blank">
        <img
          src={"https://img.youtube.com/vi/" + video.id + "/hqdefault.jpg"}
          alt={video.title || video.id}
          style="width:100%; border-radius:4px;"
        />
        <p style="margin:0.5rem 0 0;">{video.title || video.id}</p>
        {#if video.playlist}
          <small>From playlist: {video.playlist}</small>
        {/if}
      </a>
    </div>
  {/each}
</div>
