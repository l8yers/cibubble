<script>
  export let open = false;
  export let sortChoices = [];
  export let selectedSort = '';
  export let onSelect = () => {};
  export let onClose = () => {};

  function handleSort(val) {
    onSelect(val);
    onClose();
  }
</script>

{#if open}
  <div class="modal-bg" on:click={onClose}>
    <div class="sort-modal" on:click|stopPropagation>
      <div class="modal-header">
        <span>SORT BY</span>
        <button class="close-btn" on:click={onClose} aria-label="Close">×</button>
      </div>
      <div class="sort-list">
        {#each sortChoices as opt}
          <button
            class="sort-option {opt.value === selectedSort ? 'selected' : ''}"
            on:click={() => handleSort(opt.value)}
          >
            {opt.label}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-bg {
    position: fixed; inset: 0;
    background: #161c23cc;
    z-index: 1100;
    display: flex; align-items: center; justify-content: center;
  }
  .sort-modal {
    background: #fff;
    border-radius: 0;
    padding: 1.2em 1em 1.1em 1em;
    max-width: 95vw;
    min-width: 230px;
    box-shadow: 0 3px 22px #2e9be644;
    font-family: inherit;
  }
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 1.08em;
    font-weight: 800;
    letter-spacing: 0.01em;
    margin-bottom: 1.05em;
    text-transform: uppercase;
    color: #23253c;
    padding-bottom: 0.28em;
    border-bottom: 1px solid #e8e8f1;
  }
  .close-btn {
    background: none;
    border: none;
    font-size: 1.4em;
    color: #2e9be6;
    cursor: pointer;
    border-radius: 0;
    padding: 0 0.16em;
    line-height: 1;
    margin-left: 0.12em;
    transition: color 0.13s, background 0.13s;
  }
  .close-btn:hover { color: #e93c2f; background: none; }
  .sort-list {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    margin-top: 0.7em;
  }
  .sort-option {
    width: 100%;
    min-height: 44px;
    padding: 0.65em 0.7em;
    border: none;
    border-radius: 0;
    background: #f8faff;
    color: #181818;
    font-size: 1.05em;      /* Match menu bar size */
    font-weight: 700;
    text-align: left;
    cursor: pointer;
    transition: background 0.13s, color 0.13s;
    outline: none;
    letter-spacing: 0.01em;
  }
  .sort-option.selected,
  .sort-option:focus,
  .sort-option:hover {
    background: #e6f1fb;
    color: #2e9be6;
  }
</style>
