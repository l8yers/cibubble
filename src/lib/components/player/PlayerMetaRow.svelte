<script>
	import { onMount } from 'svelte';
	import AddToMyChannelsButton from '$lib/components/player/AddToMyChannelsButton.svelte';

	export let video;
	export let utils;
	export let user = null;
	export let isChannelSaved = false;
	export let savingChannel = false;
	export let saveChannelToMyChannels = () => {};

	let isMobile = false;
	onMount(() => {
		const check = () => (isMobile = window.innerWidth <= 800);
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	});
</script>

<div class="player-meta-row">
	<!-- Title and add button -->
	<div class="meta-title-row">
		<div class="player-title">{video.title}</div>
		{#if user && video?.channel_id && !isMobile}
			<div class="add-to-channels-wrapper">
				<AddToMyChannelsButton {isChannelSaved} {savingChannel} {saveChannelToMyChannels} />
			</div>
		{/if}
	</div>
	
	<!-- Channel name left, duration right -->
	<div class="meta-channel-row">
		{#if video?.channel?.name}
			<div class="player-channel">{video.channel.name}</div>
		{/if}
		{#if video.length}
			<span class="player-duration">{utils.formatLength(video.length)}</span>
		{/if}
	</div>

	<!-- Difficulty badge (and button on mobile) -->
	<div class="player-meta-badges">
		<span
			class="player-diff-badge"
			style="background: {utils.difficultyColor(video.level)};"
		>
			{utils.difficultyLabel(video.level)}
		</span>
		{#if user && video?.channel_id && isMobile}
			<div class="add-to-channels-wrapper mobile">
				<AddToMyChannelsButton {isChannelSaved} {savingChannel} {saveChannelToMyChannels} />
			</div>
		{/if}
	</div>
</div>

<style>
/* New, more balanced spacing */
.player-meta-row {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.43em;          /* Slightly tighter overall vertical gap */
	margin-bottom: 0.95em; /* Less space below */
	width: 100%;
}

.player-meta-badges {
	display: flex;
	align-items: center;
	gap: 0.9em;
	margin-top: 0.22em;   /* Was 0.08em, increase for a little more space above */
	margin-bottom: 0;     /* Remove extra bottom space here if any */
}
.meta-title-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	width: 100%;
	gap: 1.1em;
}
.player-title {
	font-size: 1.38rem;
	font-weight: 800;
	color: #1a1a1a;
	line-height: 1.21;
	overflow-wrap: anywhere;
	min-width: 0;
	flex: 1 1 auto;
}
.add-to-channels-wrapper {
	display: flex;
	align-items: center;
	flex-shrink: 0;
}
.meta-channel-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	margin-top: 0.10em;
	margin-bottom: 0.10em;
}
.player-channel {
	font-size: 1.06rem;
	font-weight: 500;
	color: #435576;
	letter-spacing: 0.01em;
	max-width: 300px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.player-duration {
	font-size: 0.99em;
	color: #adadad;
	margin-left: 1em;
	white-space: nowrap;
}
.player-diff-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 38px;
	height: 30px;
	font-size: 0.99em;
	font-weight: 700;
	padding: 0 1em;
	border-radius: 8px;
	color: #fff;
	background: var(--diff-color, #bbb);
	letter-spacing: 0.01em;
	box-shadow: 0 1px 6px #0001;
	white-space: nowrap;
	text-shadow: 0 1px 3px #0002;
	transition: box-shadow 0.13s;
}
.add-to-channels-wrapper.mobile {
	margin-left: 0.44em;
	margin-top: 0;
}
@media (max-width: 800px) {
	.player-meta-row {
		display: flex;
		flex-direction: column;
		gap: 0.33em;
		width: 100%;
		margin-bottom: 0.72em;
		padding: 0.6em 0.08em;
	}

	.meta-title-row {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.08em;
		width: 100%;
	}

	.player-title {
		font-size: 1.07rem;
		line-height: 1.18;
		margin-bottom: 0.12em;
	}

	.add-to-channels-wrapper {
		width: 100%;
		margin-left: 0;
		margin-top: 0.11em;
		display: flex;
		justify-content: flex-start;
	}

	.add-to-channels-wrapper.mobile {
		width: auto;
		margin-left: 0.42em;
		margin-top: 0;
		justify-content: flex-start;
	}

	.meta-channel-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		margin: 0.06em 0;
	}

	.player-channel {
		font-size: 0.97rem;
		max-width: 70vw;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.player-duration {
		font-size: 0.96em;
		margin-left: 0.7em;
		white-space: nowrap;
	}

	.player-meta-badges {
		display: flex;
		align-items: center;
		gap: 0.44em;
		margin-top: 0.07em;
	}

	.player-diff-badge {
		font-size: 0.90em;
		height: 26px;
		padding: 0 0.75em;
		border-radius: 7px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
}

</style>
