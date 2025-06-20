<script>
  export let tagArray = [];
  export let tagColors = [];
  export let tagTextColors = [];
  export let onAddClick;
  export let user = null;
</script>

<div class="channel-tags-block">
  <div class="tags-row">
    <strong>Channel Tags:</strong>
    {#if tagArray.length}
      {#each tagArray as tag, i (tag)}
        <a
          class="tag-chip"
          href={`/?tags=${encodeURIComponent(tag)}`}
          style="background:{tagColors[i % tagColors.length]};color:{tagTextColors[i % tagTextColors.length]};"
        >{tag}</a>
      {/each}
    {:else}
      <span class="no-tags">No tags yet.</span>
    {/if}
    {#if user}
      <button class="add-tag-btn" on:click={onAddClick} title="Add tag">+</button>
    {/if}
  </div>
</div>

<style>
.channel-tags-block {
  margin: 1.1em 0 0.8em 0;
}
.tags-row {
  display: flex;
  align-items: center;
  gap: 0.6em;
  flex-wrap: wrap;
  font-size: 1.05rem;
}
.tag-chip {
  display: inline-block;
  border-radius: 1.2em;
  padding: 0.19em 1em 0.19em 1em;
  font-size: 1em;
  font-weight: 600;
  margin-right: 0.19em;
  margin-bottom: 0.13em;
  transition: box-shadow 0.15s, background 0.12s;
  box-shadow: 0 1px 6px #0002;
  letter-spacing: 0.01em;
  text-decoration: none;
}
.tag-chip:hover {
  filter: brightness(1.1);
  box-shadow: 0 2px 12px #bebebe30;
  background: #f2f9ff;
}
.add-tag-btn {
  background: #20b288;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 1.8em;
  height: 1.8em;
  font-size: 1.19em;
  font-weight: bold;
  margin-left: 0.4em;
  cursor: pointer;
  transition: background 0.13s, box-shadow 0.13s;
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px #0002;
}
.add-tag-btn:hover, .add-tag-btn:focus {
  background: #1e8b6b;
}
.no-tags {
  color: #aab1be;
  font-style: italic;
  margin-right: 0.6em;
}
</style>
