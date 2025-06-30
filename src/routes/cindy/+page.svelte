<script>
  import { COUNTRY_OPTIONS, TAG_OPTIONS } from '$lib/constants';
  import { onMount } from 'svelte';

  let url = '';
  let loading = false;
  let error = '';
  let success = false;

  let channelPreview = null;

  // Confirm form inputs
  let level = '';
  let country = '';
  let selectedTags = [];

  async function fetchChannelDetails() {
    loading = true;
    error = '';
    success = false;
    channelPreview = null;

    try {
      const res = await fetch('/api/fetch-youtube-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (!res.ok) {
        error = data.error || 'Failed to fetch channel.';
        return;
      }

      channelPreview = data.channel;
    } catch (err) {
      error = err.message || 'Fetch error';
    } finally {
      loading = false;
    }
  }

  async function submitChannel() {
    error = '';
    success = false;

    if (!level || !channelPreview?.id) {
      error = 'Level and channel data required.';
      return;
    }

    try {
      const payload = {
        id: channelPreview.id,
        name: channelPreview.title,
        thumbnail: channelPreview.thumbnail,
        level,
        country,
        tags: selectedTags.join(', ')
      };

      const res = await fetch('/api/insert-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        error = data.error || 'Insert failed';
        return;
      }

      success = true;
      url = '';
      channelPreview = null;
      level = '';
      country = '';
      selectedTags = [];
    } catch (err) {
      error = err.message || 'Insert error';
    }
  }
</script>

<h1>Add YouTube Channel</h1>

<div>
  <label>YouTube Channel URL or @handle:</label>
  <input bind:value={url} placeholder="@somehandle or full URL" />
  <button on:click={fetchChannelDetails} disabled={loading}>
    {loading ? 'Loading...' : 'Fetch'}
  </button>
</div>

{#if error}
  <p style="color: red;">{error}</p>
{/if}

{#if success}
  <p style="color: green;">Channel inserted!</p>
{/if}

{#if channelPreview}
  <hr />
  <h2>Confirm Channel Info</h2>
  <p><strong>{channelPreview.title}</strong></p>
  <img src={channelPreview.thumbnail} alt="Thumbnail" width="120" height="120" />

  <form on:submit|preventDefault={submitChannel}>
    <div>
      <label>Level (required):</label>
      <div>
        {#each ['easy', 'intermediate', 'advanced'] as lvl}
          <label>
            <input
              type="radio"
              bind:group={level}
              value={lvl}
              required
            />
            {lvl}
          </label>
        {/each}
      </div>
    </div>

    <div>
      <label>Country:</label>
      <select bind:value={country}>
        <option value="">-- Select a country --</option>
        {#each COUNTRY_OPTIONS as c}
          <option value={c}>{c}</option>
        {/each}
      </select>
    </div>

    <div>
      <label>Tags:</label>
      <select multiple bind:value={selectedTags}>
        {#each TAG_OPTIONS as tag}
          <option value={tag}>{tag}</option>
        {/each}
      </select>
    </div>

    <button type="submit">Submit Channel</button>
  </form>
{/if}
