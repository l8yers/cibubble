<script>
  import { parseYouTubeLink } from '$lib/utils.js';
  let link = '';
  let message = '';
  let loading = false;

  async function handleSubmit(e) {
    e.preventDefault();
    message = '';
    if (!link.trim()) {
      message = "Please enter a YouTube link!";
      return;
    }
    const parsed = parseYouTubeLink(link);
    if (!parsed) {
      message = "Invalid YouTube link!";
      return;
    }
    loading = true;
    const obj = { ...parsed, url: link, added: new Date().toISOString() };
    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obj)
    });
    const result = await res.json();
    message = `Added ${result.added || 1} video(s)!`;
    link = '';
    loading = false;
  }
</script>

<h1>Add a YouTube Link</h1>
<form on:submit={handleSubmit}>
  <input
    type="text"
    bind:value={link}
    placeholder="Paste a YouTube link (video, playlist, or channel)"
    style="padding:0.5rem; width:300px;"
    autofocus
  />
  <button type="submit" style="margin-left:1rem; padding:0.5rem;" disabled={loading}>
    {loading ? 'Adding...' : 'Add'}
  </button>
</form>

{#if message}
  <p>{message}</p>
{/if}
