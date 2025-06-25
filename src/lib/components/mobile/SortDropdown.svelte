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
      <ul class="sort-list">
        {#each sortChoices as opt}
          <li>
            <button
              class="sort-option {opt.value === selectedSort ? 'selected' : ''}"
              on:click={() => handleSort(opt.value)}
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
    position: fixed;
    inset: 0;
    background: #161c23cc;
    z-index: 2000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .sort-modal {
    background: #fff;
    border-radius: 0;
    padding: 0 0 1.4em 0;
    min-width: 100vw;
    max-width: 100vw;
    box-shadow: 0 -2px 24px #2225;
    animation: slideUp 0.22s cubic-bezier(.16,1,.3,1);
    font-family: inherit;
  }
  @keyframes slideUp { from { transform: translateY(100%);} to { transform: none;} }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.05em;
    font-weight: 800;
    background: #f7f8fa;
    border-radius: 0;
    min-height: 48px;
    position: relative;
    margin-bottom: 0.12em;
    letter-spacing: 0.01em;
    color: #181818;
  }
  .modal-header .close-btn {
    position: absolute;
    right: 1.2em;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.4em;
    background: none;
    border: none;
    color: #2e9be6;
    cursor: pointer;
    border-radius: 0;
  }
  .sort-list {
    padding: 0;
    margin: 0;
    list-style: none;
    background: #fff;
    border-radius: 0;
    font-size: 1em;
    color: #161c23;
    font-weight: 700;
    letter-spacing: 0.01em;
  }
  .sort-list li {
    border-bottom: 1px solid #f1f1f3;
    /* No padding here; handled by button */
  }
  .sort-list li:last-child { border-bottom: none; }
  .sort-option {
    width: 100%;
    text-align: left;
    padding: 0.88em 1.1em;
    border: none;
    background: #fff;
    color: #181818;
    font-size: 1.01em;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.13s, color 0.13s;
    outline: none;
    border-radius: 0;
    letter-spacing: 0.01em;
  }
  .sort-option.selected,
  .sort-option:focus,
  .sort-option:hover {
    background: #f4f7fa;
    color: #2e9be6;
  }
</style>
