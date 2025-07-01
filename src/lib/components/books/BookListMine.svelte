<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user'; // Adjust if you store user elsewhere

  let books = [];
  let loading = true;
  let error = '';
  let userId;

  $: userId = $user?.id; // If you have a Svelte store for the user

  async function loadBooks() {
    if (!userId) {
      books = [];
      loading = false;
      error = 'You must be logged in to view your books.';
      return;
    }
    loading = true;
    error = '';
    const { data, error: err } = await supabase
      .from('books')
      .select('id, title, author, cover_url')
      .eq('added_by', userId);

    if (err) {
      error = err.message;
      books = [];
    } else {
      books = data ?? [];
    }
    loading = false;
  }

  // Load when userId changes (wait until user is loaded)
  $: if (userId) loadBooks();

  onMount(() => {
    if (userId) loadBooks();
  });
</script>

{#if loading}
  <div class="text-center text-gray-400 py-8">Loading your books...</div>
{:else if error}
  <div class="text-center text-red-500 py-8">{error}</div>
{:else if books.length === 0}
  <div class="text-center text-gray-400 py-8">No books found. Add one using the tab above!</div>
{:else}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each books as book}
      <div class="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-md">
        {#if book.cover_url}
          <img src={book.cover_url} alt={book.title} class="w-full h-48 object-cover mb-2 rounded" />
        {/if}
        <h2 class="text-lg font-bold">{book.title}</h2>
        <p class="text-sm text-gray-500">{book.author}</p>
      </div>
    {/each}
  </div>
{/if}
