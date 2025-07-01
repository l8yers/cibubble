<!-- BookListAll.svelte -->
<script>
  export let books = [];
</script>

<div class="books-grid">
  {#each books as book}
    <div class="book-card">
      <div class="book-card__cover">
        {#if book.cover_url}
          <img src={book.cover_url} alt={book.title} />
        {:else}
          <span class="book-card__placeholder">NO COVER</span>
        {/if}
      </div>
      <div class="book-card__body">
        <div class="book-card__title">{book.title}</div>
        <div class="book-card__author">{book.author}</div>
        {#if book.avgWordCount}
          <span class="book-card__badge book-card__badge--blue">
            {book.avgWordCount.toLocaleString()} WORDS
          </span>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 24px;
  margin-top: 1.5rem;
}

.book-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 1px 10px 0 rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #eee;
  transition: box-shadow 0.2s;
}

.book-card:hover {
  box-shadow: 0 6px 18px 0 rgba(0,0,0,0.10);
}

.book-card__cover {
  width: 100%;
  height: 210px;
  background: #f4f4f4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-card__cover img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.book-card__placeholder {
  color: #bbb;
  font-weight: bold;
  font-size: 1.1rem;
}

.book-card__body {
  padding: 18px 14px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.book-card__title {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 1.08rem;
  color: #181818;
  margin-bottom: 0.2rem;
  letter-spacing: 0.02em;
}

.book-card__author {
  font-size: 1rem;
  color: #555;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.book-card__badge {
  background: #e7f1ff;
  color: #1976d2;
  font-size: 0.93rem;
  padding: 3px 12px;
  border-radius: 16px;
  font-weight: 700;
  margin-top: 4px;
  display: inline-block;
  letter-spacing: 0.01em;
}

.book-card__badge--blue {
  background: #e7f1ff;
  color: #1976d2;
}
</style>
