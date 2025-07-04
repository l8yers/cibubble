<script>
	import VideoCard from '$lib/components/home/VideoCard.svelte';
	export let videos = [];
	export let getBestThumbnail;
	export let difficultyColor;
	export let difficultyLabel;
	export let formatLength;
	export let filterByChannel;
	export let filterByPlaylist;
	export let query = '';

	export let isChannelSaved;
	export let isWatchLater;
	export let onAddToChannels;
	export let onRemoveFromChannels;
	export let onAddToWatchLater;
	export let onRemoveFromWatchLater;
</script>

<div class="video-grid">
	{#each videos as video}
		<VideoCard
			{video}
			{getBestThumbnail}
			{difficultyColor}
			{difficultyLabel}
			{formatLength}
			{filterByChannel}
			{filterByPlaylist}
			{query}
			isChannelSaved={isChannelSaved ? isChannelSaved(video) : false}
			isWatchLater={isWatchLater ? isWatchLater(video) : false}
			{onAddToChannels}
			{onRemoveFromChannels}
			{onAddToWatchLater}
			{onRemoveFromWatchLater}
		/>
	{/each}
</div>

<style>
	.video-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.5rem;
		margin: 1.1rem auto 5.5rem auto;
		max-width: 1700px;
		padding: 0 2rem;
		box-sizing: border-box;
	}
	@media (max-width: 1200px) {
		.video-grid {
			grid-template-columns: repeat(3, 1fr);
			max-width: 1100px;
		}
	}
	@media (max-width: 900px) {
		.video-grid {
			grid-template-columns: repeat(2, 1fr);
			max-width: 700px;
		}
	}
	@media (max-width: 600px) {
		.video-grid {
			grid-template-columns: 1fr;
			max-width: 420px;
			padding: 0 0.2rem;
			gap: 1.1rem; /* CHANGE THIS VALUE to control the vertical spacing between cards on mobile */
		}
	}
</style>
