<script>
  import VideoCard from '$lib/components/home/VideoCard.svelte';
  export let watchedVideos = [];
  export let utils;
</script>

<div class="history-section">
  <div class="history-header">
    <span class="section-title" style="margin:0;">History</span>
    <a href="/history" class="view-all-link">View all</a>
  </div>
  {#if watchedVideos.length === 0}
    <div>No videos watched yet.</div>
  {:else}
    <div class="history-row">
      {#each watchedVideos.slice(0, 15) as v}
        <div class="history-card">
          <VideoCard
            video={v}
            getBestThumbnail={utils.getBestThumbnail}
            difficultyColor={utils.difficultyColor}
            difficultyLabel={utils.difficultyLabel}
            formatLength={utils.formatLength}
            filterByChannel={null}
            filterByPlaylist={null}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
.history-section {
  margin-top: 2.4em;
}
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2em;
}
.section-title {
  color: #181818;
  font-size: 1.25rem;
  font-weight: bold;
  letter-spacing: 0.3px;
}
.view-all-link {
  font-size: 1em;
  color: #2562e9;
  text-decoration: none;
  font-weight: 500;
}
.history-row {
  display: flex;
  gap: 1.5em;
  overflow-x: auto;
  padding-bottom: 0.7em;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.history-row::-webkit-scrollbar {
  height: 9px;
  background: #f6f6f6;
}
.history-row::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 6px;
}
.history-card {
  flex: 0 0 300x;
  min-width: 300px;
  max-width: 400px;
  scroll-snap-align: start;
}
@media (max-width: 650px) {
  .history-card {
    flex-basis: 92vw;
    min-width: 92vw;
    max-width: 98vw;
  }
  .history-row {
    gap: 1em;
  }
}
</style>
