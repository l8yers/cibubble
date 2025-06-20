<script>
  export let open = false;
  export let sortChoices = [];
  export let selectedSort = '';
  export let onSelect = () => {};
  export let onClose = () => {};
</script>

{#if open}
  <div class="modal-bg" on:click={onClose}>
    <div class="sort-modal" on:click|stopPropagation>
      <div class="modal-header">
        <span>Sort Videos</span>
        <button class="close-btn" on:click={onClose}>×</button>
      </div>
      <ul>
        {#each sortChoices as opt}
          <li>
            <button
              class:selected={opt.value === selectedSort}
              on:click={() => onSelect(opt.value)}
            >
              {opt.label}
            </button>
          </li>
        {/each}
      </ul>
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
    padding: 1.4em 1.3em;
    max-width: 95vw;
    min-width: 280px;
    box-shadow: 0 2px 20px #aaa5;
  }
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 1.1em; font-weight: 700;
    margin-bottom: 1em;
  }
  .close-btn {
    background: none; border: none; font-size: 1.7em; color: #888;
    cursor: pointer; border-radius: 50%; padding: 0 0.2em;
    transition: background 0.13s;
  }
  .close-btn:hover { background: #eee; }
  ul { padding: 0; margin: 0; list-style: none; }
  li { margin-bottom: 0.5em; }
  button.selected, button.selected:focus {
    background: #e5f2fd; color: #2e9be6; font-weight: 700;
  }
  button {
    width: 100%; border: none; border-radius: 8px; padding: 0.55em 0.6em;
    background: #f9f9f9; font-size: 1.04em; cursor: pointer;
    transition: background 0.13s;
  }
  button:hover { background: #f1f5fb; }
</style>
