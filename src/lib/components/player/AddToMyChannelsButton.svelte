<script>
  export let isChannelSaved = false;
  export let savingChannel = false;
  export let saveChannelToMyChannels;
</script>

<button
  class="fav-row-btn"
  on:click={saveChannelToMyChannels}
  disabled={savingChannel || isChannelSaved}
  aria-label="Add to My Channels"
  title={isChannelSaved ? "Already in My Channels" : "Add to My Channels"}
>
  {#if isChannelSaved}
    ★ In My Channels
  {:else}
    + Add to My Channels
  {/if}
</button>

<style>
.fav-row-btn {
  display: inline-flex;
  align-items: center;
  font-size: 0.88em;
  font-weight: 600;
  color: #3380d1;
  background: #f6fbff;
  border: 1.3px solid #e1eaf4;
  border-radius: 7px;
  padding: 0.28em 0.92em 0.28em 0.85em;
  margin-left: 1em;
  cursor: pointer;
  box-shadow: 0 1px 3px #e1eaf41c;
  outline: none;
  transition: background 0.14s, color 0.14s, border-color 0.11s;
  min-width: 0;
  height: 1.9em;
  user-select: none;
  white-space: nowrap;
}
.fav-row-btn:disabled {
  color: #bbb;
  border-color: #eee;
  background: #fafafa;
  cursor: not-allowed;
}
.fav-row-btn:hover:not(:disabled) {
  background: #e9f3fd;
  border-color: #b6d4ef;
  color: #235a92;
}
</style>
