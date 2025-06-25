<script>
  import HistoryVideoCard from '$lib/components/progress/HistoryVideoCard.svelte';
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
          <HistoryVideoCard
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
  gap: 0.1em;    /* Reduced gap */
  overflow-x: auto;
  padding-bottom: 0.5em;
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
  flex: 0 0 340px;
  min-width: 340px;
  max-width: 400px;
  scroll-snap-align: start;
  background: none;
}

/* Smaller badge & channel just for history card */



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
