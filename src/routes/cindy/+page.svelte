<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  let url = '';
  let channelPreview = null;
  let error = '';
  let loading = false;

  let level = '';
  let country = '';
  let tags = '';

  async function fetchChannel() {
    error = '';
    loading = true;
    channelPreview = null;

    const res = await fetch('/api/fetch-youtube-details', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    if (res.ok) {
      channelPreview = data.channel;
    } else {
      error = data.error || 'Error fetching channel.';
    }
    loading = false;
  }

  async function submitChannel() {
    if (!level || !channelPreview?.id) {
      error = 'Level is required and channel must be loaded.';
      return;
    }

    const payload = {
      id: channelPreview.id,
      name: channelPreview.title,
      thumbnail: channelPreview.thumbnail,
      level,
      country,
      tags,
    };

    const res = await fetch('/api/insert-channel', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      alert('Channel added!');
      // Optionally reset form
      url = '';
      channelPreview = null;
      level = '';
      country = '';
      tags = '';
    } else {
      error = data.error || 'Error inserting channel.';
    }
  }
</script>

<h1>Add Channel</h1>

<input bind:value={url} placeholder="YouTube URL or @handle" class="input" />
<button on:click={fetchChannel} disabled={loading}>Fetch Channel</button>

{#if loading}
  <p>Loading...</p>
{/if}

{#if error}
  <p style="color:red">{error}</p>
{/if}

{#if channelPreview}
  <div class="preview">
    <img src={channelPreview.thumbnail} alt="Thumbnail" />
    <h2>{channelPreview.title}</h2>

    <label>
      Level (required)
      <input bind:value={level} placeholder="e.g. A2" />
    </label>

    <label>
      Country
      <input bind:value={country} placeholder="e.g. Spain" />
    </label>

    <label>
      Tags (comma-separated)
      <input bind:value={tags} placeholder="e.g. grammar,kids,story" />
    </label>

    <button on:click={submitChannel}>Submit Channel</button>
  </div>
{/if}

<style>
  .input {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    width: 100%;
  }

  .preview {
    border: 1px solid #ccc;
    padding: 1rem;
    margin-top: 1rem;
    border-radius: 0.5rem;
  }

  input {
    display: block;
    margin: 0.5rem 0 1rem;
    width: 100%;
    padding: 0.4rem;
  }
</style>
