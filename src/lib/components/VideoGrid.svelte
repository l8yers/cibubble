<script>
  import VideoCard from '$lib/components/VideoCard.svelte';
  export let videos = [];
  export let getBestThumbnail;
  export let difficultyColor;
  export let difficultyLabel;
  export let formatLength;
  export let filterByChannel;
  export let filterByPlaylist;
</script>

<div class="grid">
  {#each videos as video}
    <VideoCard
      {video}
      {getBestThumbnail}
      {difficultyColor}
      {difficultyLabel}
      {formatLength}
      {filterByChannel}
      {filterByPlaylist}
    />
  {/each}
</div>

<style>
.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.3rem;
  margin: 2rem 0;
}
@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 800px) {
  .grid {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
