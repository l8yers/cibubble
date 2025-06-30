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
    background: var(--background, #ffffff);
    color: var(--text-color, #000000);
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  }

  :global(body.dark) .admin-container {
    --background: #1e1e1e;
    --text-color: #f0f0f0;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
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
    background: #fff;
    color: #000;
  }

  :global(body.dark) input,
  :global(body.dark) select,
  :global(body.dark) button {
    background: #333;
    color: #fff;
    border: 1px solid #666;
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
    background: #ddd;
    color: #000;
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
