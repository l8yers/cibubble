<script>
  import { parseYouTubeLink } from '$lib/utils.js';
  let link = '';
  let message = '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!link.trim()) {
      message = "Please enter a YouTube link!";
      return;
    }
    const parsed = parseYouTubeLink(link);
    if (!parsed) {
      message = "Invalid YouTube link!";
      return;
    }
    // For now, just single videos
    if (parsed.type === 'video') {
      const videoObj = {
        type: 'video',
        id: parsed.id,
        url: link,
        added: new Date().toISOString()
      };
      // Save to backend
      await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoObj)
      });
      message = "Video added!";
    } else {
      message = "Only single videos supported for now (playlist/channel coming soon).";
    }
    link = '';
  }
</script>

<h1>Add a YouTube Video</h1>
<form on:submit={handleSubmit}>
  <input
    type="text"
    bind:value={link}
    placeholder="Paste a YouTube link..."
    style="padding:0.5rem; width:300px;"
    autofocus
  />
  <button type="submit" style="margin-left:1rem; padding:0.5rem;">Add</button>
</form>

{#if message}
  <p>{message}</p>
{/if}
