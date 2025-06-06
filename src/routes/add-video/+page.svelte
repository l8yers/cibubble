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
    if (!parsed || !parsed.type || !parsed.id) {
      message = "Invalid or unsupported YouTube link!";
      return;
    }
    loading = true;
    const obj = { type: parsed.type, id: parsed.id };
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
      });
      const result = await res.json();
      if (!res.ok) {
        message = result.error || 'Error adding video!';
      } else if (result.added === 0) {
        message = "No new videos were added (may be duplicate or invalid link).";
      } else {
        // Show what was added
        if (parsed.type === 'playlist' || parsed.type === 'channel') {
          message = `Added ${result.added} videos from this ${parsed.type}!`;
        } else {
          message = `Added video!`;
        }
        link = '';
      }
    } catch (err) {
      message = "Error: " + err.message;
    }
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
<form on:submit={handleSubmit} style="margin-bottom:1.5em;">
  <input
    type="text"
    bind:value={link}
    placeholder="Paste a YouTube video, playlist, or channel link"
    style="padding:0.5rem; width:340px;"
    autofocus
    required
  />
  <button type="submit" style="margin-left:1rem; padding:0.5rem 1.2rem;" disabled={loading}>
    {loading ? 'Adding...' : 'Add'}
  </button>
</form>
<button
  on:click={clearDatabase}
  style="margin-bottom: 2rem; background: #f44; color: #fff; border: none; border-radius: 4px; padding: 0.7em 1.2em; font-weight: bold; cursor: pointer;"
>
  Clear Database (Temporary)
</button>
{#if clearMsg}
  <div style="margin-top: 1em; font-weight: bold; color: #c00;">{clearMsg}</div>
{/if}

{#if message}
  <p style="margin-top:1.5em; font-weight: 500;">{message}</p>
{/if}
