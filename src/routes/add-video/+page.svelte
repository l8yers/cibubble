<script>
  import { parseYouTubeLink } from '$lib/utils.js';
  let link = '';
  let message = '';
  let loading = false;
  export let data;
  let videos = data.videos;


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


    let clearMsg = "";

  async function clearDatabase() {
    if (!confirm("Are you sure you want to clear all videos? This cannot be undone.")) return;
    const res = await fetch('/api/videos', { method: 'DELETE' });
    if (res.ok) {
      clearMsg = "Database cleared!";
    } else {
      clearMsg = "Error clearing database.";
    }
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
</form><button
  on:click={clearDatabase}
  style="margin-bottom: 2rem; background: #f44; color: #fff; border: none; border-radius: 4px; padding: 0.7em 1.2em; font-weight: bold; cursor: pointer;"
>
  Clear Database (Temporary)
</button>
{#if clearMsg}
  <div style="margin-top: 1em; font-weight: bold;">{clearMsg}</div>
{/if}

{#if message}
  <p>{message}</p>
{/if}

