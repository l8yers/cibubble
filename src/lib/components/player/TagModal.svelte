<script>
  export let show = false;
  export let confirmStep = false;
  export let newTag = '';
  export let tagAdding = false;
  export let tagAddError = '';
  export let allTags = [];
  export let tagColors = [];
  export let tagTextColors = [];
  export let tagCloudLoading = false;

  export let onClose;
  export let onTryAdd;
  export let onHandleAdd;
  export let onEdit;
  export let onSelectCloudTag;
  export let setNewTag;

  function handleInput(e) {
    setNewTag(e.target.value);
  }
</script>

{#if show}
  <div class="modal-bg" on:click={onClose}></div>
  <div class="modal-content" on:click|stopPropagation>
    <div class="modal-title">
      {!confirmStep ? 'Add or Select a Tag' : 'Confirm Tag Addition'}
    </div>
    {#if !confirmStep}
      <input
        class="tag-input"
        type="text"
        placeholder="Enter or select a tag…"
        value={newTag}
        maxlength="32"
        autofocus
        on:input={handleInput}
        on:keydown={(e) => e.key === 'Enter' && onTryAdd()}
        disabled={tagAdding}
      />
      <button class="save-btn" on:click={onTryAdd} disabled={tagAdding}>Add</button>
      <button class="cancel-btn" on:click={onClose} disabled={tagAdding}>Cancel</button>
      {#if tagAddError}
        <div class="tag-error">{tagAddError}</div>
      {/if}
      <div class="tag-cloud-label">Popular Tags:</div>
      <div class="tag-cloud">
        {#if tagCloudLoading}
          <span class="cloud-loading">Loading…</span>
        {:else if allTags.length}
          {#each allTags as tag, i}
            <span
              class="cloud-chip"
              style="background:{tagColors[i % tagColors.length]};color:{tagTextColors[i % tagTextColors.length]};"
              on:click={() => onSelectCloudTag(tag)}
            >{tag}</span>
          {/each}
        {:else}
          <span class="cloud-empty">No tags yet.</span>
        {/if}
      </div>
    {:else}
      <div class="confirm-text">
        Are you sure you want to add the tag: <span class="confirm-tag">{newTag.trim().toLowerCase()}</span>?
      </div>
      <button class="save-btn" on:click={onHandleAdd} disabled={tagAdding}>Confirm</button>
      <button class="cancel-btn" on:click={onEdit} disabled={tagAdding}>Edit</button>
    {/if}
  </div>
{/if}

<style>
.modal-bg {
  position: fixed;
  z-index: 1001;
  left: 0; top: 0; width: 100vw; height: 100vh;
  background: #2d304a80;
}
.modal-content {
  position: fixed;
  z-index: 1002;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  min-width: 340px;
  max-width: 98vw;
  background: #fcfcfd;
  border-radius: 13px;
  box-shadow: 0 4px 50px #2c326a40;
  padding: 2.1em 2em 1.2em 2em;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid #dbeaff;
}
.modal-title {
  font-size: 1.16em;
  font-weight: 700;
  margin-bottom: 1.3em;
  color: #334;
  letter-spacing: 0.03em;
}
.tag-input {
  width: 98%;
  font-size: 1em;
  padding: 0.45em 0.9em;
  border-radius: 8px;
  border: 1.5px solid #d3e0ef;
  background: #f7fafd;
  margin-bottom: 0.5em;
  margin-top: 0.1em;
  transition: border 0.15s;
}
.tag-input:focus {
  border-color: #7ebeff;
  outline: none;
}
.save-btn, .cancel-btn {
  margin-top: 0.9em;
  margin-right: 0.6em;
  font-size: 1em;
  border-radius: 7px;
  background: #f5f8fc;
  border: 1.3px solid #e3e7ef;
  cursor: pointer;
  padding: 0.37em 1.25em;
  transition: background 0.14s, border 0.14s;
}
.save-btn:disabled, .cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.save-btn:hover {
  background: #e8f2ff;
  border-color: #aad4ff;
}
.cancel-btn:hover {
  background: #ffe3e3;
  border-color: #ffcccc;
}
.tag-error {
  color: #c42525;
  margin-top: 0.5em;
  font-size: 0.97em;
}
.tag-cloud-label {
  margin-top: 0.7em;
  color: #888;
  font-size: 1em;
  font-weight: 500;
  margin-bottom: 0.2em;
}
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45em;
  margin-top: 0.15em;
  margin-bottom: 0.2em;
  min-height: 2.1em;
}
.cloud-chip {
  display: inline-block;
  padding: 0.19em 1em;
  border-radius: 1.2em;
  font-size: 1em;
  font-weight: 500;
  box-shadow: 0 1px 5px #ebebeb60;
  cursor: pointer;
  margin-bottom: 0.15em;
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.13s, background 0.14s;
}
.cloud-chip:hover {
  filter: brightness(1.17);
  box-shadow: 0 2px 10px #b5e0fa60;
  background: #f2f9ff;
  border-color: #aac6ff;
}
.cloud-loading, .cloud-empty {
  font-size: 0.99em;
  color: #a3a6af;
}
.confirm-text {
  font-size: 1.1em;
  margin-bottom: 1.3em;
  color: #333;
}
.confirm-tag {
  color: #3074b5;
  font-weight: 600;
  letter-spacing: 0.03em;
  font-size: 1.1em;
}
</style>
