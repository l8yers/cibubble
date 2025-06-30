<script>
  import { onMount } from 'svelte';
  import { COUNTRY_OPTIONS, TAG_OPTIONS } from '$lib/constants';

  let url = '';
  let channel = null;
  let level = '';
  let country = '';
  let tagInput = '';
  let tags = [];

  let loading = false;
  let error = '';
  let success = false;

  async function fetchChannel() {
    error = '';
    success = false;
    loading = true;
    try {
      const res = await fetch('/api/fetch-youtube-details', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      channel = data.channel;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function submitChannel() {
    error = '';
    success = false;
    loading = true;
    try {
      const res = await fetch('/api/insert-channel', {
        method: 'POST',
        body: JSON.stringify({
          id: channel.id,
          name: channel.title,
          thumbnail: channel.thumbnail,
          level,
          country: country || null,
          tags: tags.length ? tags.join(',') : null
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Insert failed');
      success = true;
      channel = null;
      url = '';
      level = '';
      country = '';
      tags = [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function toggleTag(tag) {
    if (tags.includes(tag)) {
      tags = tags.filter(t => t !== tag);
    } else {
      tags = [...tags, tag];
    }
  }

  function addCustomTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      tags = [...tags, t];
    }
    tagInput = '';
  }
</script>

<style>
  .admin-container {
    max-width: 600px;
    margin: 5rem auto;
    padding: 2rem;
    background: #1e1e1e;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0,0,0,0.4);
  }

  label {
    font-weight: bold;
    margin-top: 1rem;
    display: block;
  }

  input, select, button {
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.3rem;
    margin-bottom: 1rem;
    font-size: 1rem;
  }

  .tags-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .tag {
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    cursor: pointer;
    background: #333;
    color: white;
  }

  .tag.selected {
    background: #ff3e00;
    color: white;
  }

  .channel-preview {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
  }

  .channel-preview img {
    border-radius: 4px;
  }

  .error { color: red; }
  .success { color: green; }
</style>

<div class="admin-container">
  <h2>Add YouTube Channel</h2>

  {#if error}<p class="error">{error}</p>{/if}
  {#if success}<p class="success">✅ Channel added!</p>{/if}

  {#if !channel}
    <label>YouTube URL or @handle</label>
    <input bind:value={url} placeholder="https://youtube.com/@..." />
    <button on:click={fetchChannel} disabled={loading}>
      {loading ? 'Loading...' : 'Fetch Channel'}
    </button>
  {/if}

  {#if channel}
    <div class="channel-preview">
      <img src={channel.thumbnail} alt="thumbnail" width="80" height="80" />
      <div><strong>{channel.title}</strong><br /><code>{channel.id}</code></div>
    </div>

    <label>Level *</label>
    <div>
      <label><input type="radio" bind:group={level} value="easy" /> Easy</label><br />
      <label><input type="radio" bind:group={level} value="intermediate" /> Intermediate</label><br />
      <label><input type="radio" bind:group={level} value="advanced" /> Advanced</label>
    </div>

    <label>Country</label>
    <select bind:value={country}>
      <option value="">-- None --</option>
      {#each COUNTRY_OPTIONS as opt}
        <option value={opt}>{opt}</option>
      {/each}
    </select>

    <label>Tags</label>
    <input bind:value={tagInput} placeholder="Type and press Enter" on:keydown={(e) => e.key === 'Enter' && addCustomTag()} />
    <div class="tags-grid">
      {#each TAG_OPTIONS as tag}
        <div
          class:tag
          class:selected={tags.includes(tag)}
          on:click={() => toggleTag(tag)}
        >
          {tag}
        </div>
      {/each}
      {#each tags.filter(t => !TAG_OPTIONS.includes(t)) as custom}
        <div
          class:tag
          class:selected
          on:click={() => toggleTag(custom)}
        >
          {custom}
        </div>
      {/each}
    </div>

    <button on:click={submitChannel} disabled={!level || loading}>
      {loading ? 'Saving...' : 'Submit Channel'}
    </button>
  {/if}
</div>
