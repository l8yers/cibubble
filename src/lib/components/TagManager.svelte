<script>
	import { onMount } from 'svelte';
	import { getAllTags, addTagToChannel } from '$lib/api/tags.js';

	export let channelId; // Pass the channel ID as a prop
	export let currentTags = []; // Optional: array of tags already linked to this channel
	export let onTagAdded = null; // Optional: callback to refresh parent

	let allTags = [];
	let tagInput = '';
	let suggestions = [];

	onMount(async () => {
		allTags = await getAllTags();
	});

	$: suggestions = tagInput.length
		? allTags.filter(
				(t) =>
					t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
					!currentTags.some((ct) => ct === t.name)
			)
		: [];

	async function handleAddTag() {
		let tagName = tagInput.trim();
		if (!tagName) return;
		await addTagToChannel(channelId, tagName);
		tagInput = '';
		allTags = await getAllTags();
		if (onTagAdded) onTagAdded(); // Parent can refresh channel tags if desired
	}
</script>

<div class="tag-manager">
	<input
		type="text"
		placeholder="Add tag…"
		bind:value={tagInput}
		on:keydown={(e) => e.key === 'Enter' && handleAddTag()}
		list="tag-suggestions"
		autocomplete="off"
	/>
	<button on:click={handleAddTag}>Add</button>
	{#if suggestions.length > 0}
		<ul class="suggestions">
			{#each suggestions as tag}
				<li
					on:click={() => {
						tagInput = tag.name;
						handleAddTag();
					}}
				>
					{tag.name}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.tag-manager {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
		max-width: 240px;
	}
	input[type='text'] {
		font-size: 1em;
		padding: 0.35em 0.7em;
		border-radius: 6px;
		border: 1.2px solid #ececec;
		background: #fafaff;
	}
	button {
		margin-top: 0.3em;
		font-size: 0.97em;
		border-radius: 6px;
		background: #f5f8fc;
		border: 1px solid #eee;
		cursor: pointer;
		padding: 0.25em 1.1em;
	}
	ul.suggestions {
		margin: 0.2em 0 0 0;
		padding: 0.2em 0.2em 0.2em 0.6em;
		background: #fff;
		border: 1px solid #ececec;
		border-radius: 6px;
		max-height: 120px;
		overflow-y: auto;
		box-shadow: 0 2px 12px #eee;
		list-style: none;
	}
	ul.suggestions li {
		cursor: pointer;
		padding: 0.18em 0;
	}
	ul.suggestions li:hover {
		color: #e93c2f;
		font-weight: bold;
	}
</style>
