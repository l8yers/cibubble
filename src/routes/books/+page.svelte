<script>
  import BookListAll from '$lib/components/books/BookListAll.svelte';
  import BookListMine from '$lib/components/books/BookListMine.svelte';
  import AddBookForm from '$lib/components/books/AddBookForm.svelte';
  import { invalidate } from '$app/navigation';

  export let data;
  let tab = 'all';

  const tabs = [
    { id: 'all', label: 'ALL BOOKS' },
    { id: 'mine', label: 'MY BOOKS' },
    { id: 'add', label: 'ADD BOOK' },
  ];

  function handleBookAdded() {
    invalidate('books');
  }
</script>

<div class="books-main">
  <h1 class="cibubble-title">BOOKS</h1>
  <div class="books-tabs">
    {#each tabs as t}
      <button
        class="books-tab-btn {tab === t.id ? 'active' : ''}"
        on:click={() => tab = t.id}
      >
        {t.label}
      </button>
    {/each}
  </div>

  <div class="books-tab-panel">
    {#if tab === 'all'}
      <BookListAll books={data.books} />
    {:else if tab === 'mine'}
      <BookListMine />
    {:else if tab === 'add'}
      <AddBookForm on:bookAdded={handleBookAdded} />
    {/if}
  </div>
</div>

<style>
.books-main {
  max-width: 1120px;
  margin: 32px auto 0 auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cibubble-title {
  font-size: 2.2rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #E53935; /* CIBUBBLE red */
  margin-bottom: 26px;
  text-align: center;
}

.books-tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 32px;
  justify-content: center;
}

.books-tab-btn {
  padding: 10px 30px;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  border-radius: 24px;
  background: #fff;
  color: #181818;
  box-shadow: 0 1px 4px 0 rgba(0,0,0,0.07);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, box-shadow 0.2s;
  outline: none;
}

.books-tab-btn.active {
  background: #E53935;
  color: #fff;
  box-shadow: 0 4px 16px 0 rgba(229,57,53,0.15);
}

.books-tab-btn:hover:not(.active) {
  background: #f6f6f6;
  color: #E53935;
}

.books-tab-panel {
  width: 100%;
  min-height: 200px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
</style>
