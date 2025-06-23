<script>
  import { onMount } from 'svelte';
  import { getAllTags, addTagToChannel } from '$lib/api/tags.js';

  export let channelId;
  export let currentTags = [];
  export let onTagAdded = null;

  let allTags = [];
  let tagInput = '';
  let suggestions = [];

  onMount(async () => {
    allTags = await getAllTags();
  });

  $: suggestions = tagInput.length
    ? allTags.filter(t =>
        t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
        !currentTags.some(ct => ct.name === t.name)
      )
    : [];

  async function handleAddTag() {
    let tagName = tagInput.trim();
    if (!tagName) return;
    await addTagToChannel(channelId, tagName);
    tagInput = '';
    allTags = await getAllTags();
    if (onTagAdded) onTagAdded();
  }
</script>

<div class="tag-manager-admin">
  <input
    type="text"
    placeholder="Add tag…"
    bind:value={tagInput}
    on:keydown={(e) => e.key === 'Enter' && handleAddTag()}
    list="tag-suggestions"
    autocomplete="off"
  />
  <button on:click={handleAddTag}>+</button>
  {#if suggestions.length > 0}
    <ul class="suggestions">
      {#each suggestions as tag}
        <li>
          <button
            type="button"
            class="suggestion-btn"
            on:click={() => { tagInput = tag.name; handleAddTag(); }}>
            {tag.name}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
.tag-manager-admin {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.2em;
  min-width: 95px;
  max-width: 150px;
  position: relative;
}
.tag-manager-admin input[type="text"] {
  font-size: 0.93em;
  padding: 0.13em 0.5em;
  border-radius: 5px;
  border: 1px solid #ececec;
  background: #fafaff;
  height: 1.35em;
  width: 70px;
}
.tag-manager-admin button {
  font-size: 1em;
  border-radius: 4px;
  background: #f5f8fc;
  border: 1px solid #eee;
  cursor: pointer;
  padding: 0.13em 0.55em;
  margin-left: 0.18em;
  height: 1.35em;
  min-width: 1.9em;
  display: flex;
  align-items: center;
  justify-content: center;
}
ul.suggestions {
  position: absolute;
  z-index: 2;
  margin: 0.09em 0 0 0;
  padding: 0.09em 0.09em 0.09em 0.33em;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 5px;
  max-height: 75px;
  overflow-y: auto;
  box-shadow: 0 1px 5px #e5e9f0;
  list-style: none;
  font-size: 0.93em;
  left: 0;
  min-width: 90px;
}
ul.suggestions li {
  padding: 0;
  margin: 0;
  list-style: none;
}
.suggestion-btn {
  background: none;
  border: none;
  width: 100%;
  padding: 0.10em 0;
  text-align: left;
  cursor: pointer;
  font-size: inherit;
  color: inherit;
  font-family: inherit;
}
.suggestion-btn:hover, .suggestion-btn:focus {
  color: #e93c2f;
  font-weight: bold;
  background: #f5f8fc;
  outline: none;
}
</style>
