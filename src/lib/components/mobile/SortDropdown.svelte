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
    background: #222a 0.3;
    z-index: 1000;
    display: flex; align-items: center; justify-content: center;
  }
  .sort-modal {
    background: #fff;
    border-radius: 18px;
    padding: 1.5em 1.3em 1.3em 1.3em;
    max-width: 98vw;
    min-width: 290px;
    box-shadow: 0 2px 20px #aaa5;
  }
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 1.1em; font-weight: 700; letter-spacing: 0.01em;
    margin-bottom: 1em;
    text-transform: uppercase;
  }
  .close-btn {
    background: none; border: none; font-size: 1.7em; color: #888;
    cursor: pointer; border-radius: 50%; padding: 0 0.2em;
    transition: background 0.13s;
  }
  .close-btn:hover { background: #eee; }
  .sort-list {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  .sort-option {
    width: 100%;
    padding: 0.8em 0.6em;
    border: none;
    border-radius: 10px;
    background: #f8faff;
    color: #23396a;
    font-size: 1.12em;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    transition: background 0.13s, color 0.13s;
    outline: none;
  }
  .sort-option.selected,
  .sort-option:focus,
  .sort-option:hover {
    background: #e5f2fd;
    color: #0077ff;
  }
</style>
