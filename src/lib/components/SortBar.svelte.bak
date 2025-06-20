<script>
  import { createEventDispatcher } from 'svelte';
  export let levels = [];
  export let sortChoices = [];
  export let tagOptions = [];
  export let selectedLevels = [];
  export let sortBy = '';
  export let selectedTags = [];

  const dispatch = createEventDispatcher();

  function toggleLevel(lvl) {
    const arr = selectedLevels.includes(lvl) ? selectedLevels.filter(l => l !== lvl) : [...selectedLevels, lvl];
    dispatch('change', { selectedLevels: arr, sortBy, selectedTags });
  }
  function setSort(val) {
    dispatch('change', { selectedLevels, sortBy: val, selectedTags });
  }
  function toggleTag(tag) {
    const arr = selectedTags.includes(tag) ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag];
    dispatch('change', { selectedLevels, sortBy, selectedTags: arr });
  }
</script>

<div style="margin-bottom:1em;">
  <div>
    <strong>Level:</strong>
    {#each levels as lvl}
      <label>
        <input type="checkbox" checked={selectedLevels.includes(lvl.value)} on:change={() => toggleLevel(lvl.value)} />
        {lvl.label}
      </label>
    {/each}
  </div>
  <div>
    <strong>Sort:</strong>
    {#each sortChoices as opt}
      <label>
        <input type="radio" name="sort" checked={sortBy === opt.value} on:change={() => setSort(opt.value)} />
        {opt.label}
      </label>
    {/each}
  </div>
  <div>
    <strong>Tags:</strong>
    {#each tagOptions as tag}
      <label>
        <input type="checkbox" checked={selectedTags.includes(tag)} on:change={() => toggleTag(tag)} />
        {tag}
      </label>
    {/each}
  </div>
</div>
