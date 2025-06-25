<script>
	import { goto } from '$app/navigation';

export let tagColors = [
	'#B91C1C', // deep red
	'#7C3AED', // purple
	'#1D4ED8', // blue
	'#15803D', // dark green
	'#EA580C', // dark orange
	'#A21CAF', // fuchsia
	'#27272A', // blackish
	'#334155', // slate blue
	'#374151', // zinc/graphite
	'#CA8A04', // gold, still fairly dark
	'#3730A3', // indigo
	'#BE185D', // deep magenta
	'#065F46', // deep emerald
	'#5B21B6', // violet
	'#D97706', // dark amber
	'#A16207', // dark yellow-ochre
];

	export let tagArray = [];
	export let user = null;
	export let onAddClick = () => {};

	function getTagColor(idx) {
		return tagColors[idx % tagColors.length];
	}
	const labelColor = '#27272A'; // slate black for "Channel tags" label

	function goToTag(tag) {
		const tagParam = encodeURIComponent(tag);
		goto(`/?tags=${tagParam}`);
	}
</script>

<div class="ChannelTagsBlock">
	<span
		class="player-tag-badge tag-label"
		style="background: {labelColor}; color: #fff;"
	>
		Channel tags
	</span>
	{#each tagArray as tag, i}
		<span
			class="player-tag-badge tag"
			style="background: {getTagColor(i)}; color: #fff;"
			on:click={() => goToTag(tag)}
			title="Show all videos with this tag"
			tabindex="0"
			role="button"
		>
			{tag}
		</span>
	{/each}
	{#if user}
		<button
			class="player-tag-badge tag-add"
			title="Add tag"
			type="button"
			on:click={onAddClick}
			style="background: #374151; color: #fff; font-weight: 800;"
		>
			+ Add Tag
		</button>
	{/if}
</div>

<style>
.ChannelTagsBlock {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	margin-bottom: 0.7em;
	gap: 0.14em;
}

/* NO BORDER, dark solid pill shape, white text, crisp shadow for pop */
.player-tag-badge,
.tag-label,
.tag,
.tag-add {
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
	background: #27272A;
	letter-spacing: 0.01em;
	box-shadow: 0 1px 6px #0002;
	white-space: nowrap;
	margin-right: 0.65em;
	text-shadow: 0 1px 3px #0007;
	transition: box-shadow 0.13s, background 0.13s, color 0.13s;
	cursor: pointer;
	user-select: none;
	border: none;
}

.tag-label {
	cursor: default;
	pointer-events: none;
	margin-right: 0.8em;
	font-weight: 900;
}

.tag {
	cursor: pointer;
}
.tag:focus {
	outline: 2px solid #fff7;
	outline-offset: 1px;
}
.tag:hover {
	box-shadow: 0 2px 10px #0004;
	filter: brightness(1.1);
}

.tag-add {
	background: #374151 !important;
	color: #fff !important;
	font-weight: 800;
}
.tag-add:hover,
.tag-add:focus {
	background: #1e293b !important;
	color: #fff !important;
}

@media (max-width: 800px) {
	.player-tag-badge,
	.tag-label,
	.tag,
	.tag-add {
		height: 26px;
		font-size: 0.91em;
		padding: 0 0.75em;
		margin-right: 0.45em;
	}
	.ChannelTagsBlock {
		margin-bottom: 0.29em;
	}
}
</style>
