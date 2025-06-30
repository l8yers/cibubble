<script>
  import { COUNTRY_OPTIONS, TAG_OPTIONS } from '$lib/constants';

  let url = '';
  let fetchedChannel = null;
  let selectedLevel = '';
  let selectedCountry = '';
  let selectedTags = [];
  let customTag = '';
  let loading = false;
  let error = '';

  async function fetchChannel() {
    error = '';
    fetchedChannel = null;
    loading = true;
    try {
      const res = await fetch('/api/fetch-youtube-details', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error fetching channel');
      fetchedChannel = data.channel;
    } catch (err) {
      error = err.message || 'Unknown error';
    } finally {
      loading = false;
    }
  }

  function toggleTag(tag) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
  }

  function addCustomTag() {
    const tag = customTag.trim();
    if (tag && !selectedTags.includes(tag)) {
      selectedTags = [...selectedTags, tag];
    }
    customTag = '';
  }

  async function submitChannel() {
    error = '';
    if (!fetchedChannel || !selectedLevel) {
      error = 'Channel and level are required.';
      return;
    }
    loading = true;
    try {
      const res = await fetch('/api/submit-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fetchedChannel.id,
          name: fetchedChannel.title,
          thumbnail: fetchedChannel.thumbnail,
          level: selectedLevel,
          country: selectedCountry || null,
          tags: selectedTags.join(',')
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error submitting channel');
      // Success! Reset everything
      url = '';
      fetchedChannel = null;
      selectedLevel = '';
      selectedCountry = '';
      selectedTags = [];
      customTag = '';
      alert('Channel added!');
    } catch (err) {
      error = err.message || 'Unknown error';
    } finally {
      loading = false;
    }
  }
</script>

<style>
  main {
    max-width: 500px;
    margin: 4rem auto;
    background: #fafafa;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 2rem 2.5rem;
    font-family: system-ui, sans-serif;
  }
  h2 {
    margin-top: 0;
    margin-bottom: 1.2rem;
    font-size: 1.6rem;
    text-align: center;
  }
  label {
    font-weight: bold;
    margin-top: 1.5rem;
    display: block;
  }
  input, select {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    margin-bottom: 1rem;
    box-sizing: border-box;
  }
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.7rem;
  }
  .tag-list button {
    padding: 0.35rem 1rem;
    border-radius: 15px;
    border: 1px solid #bbb;
    background: #eee;
    color: #222;
    cursor: pointer;
    font-size: 1rem;
  }
  .tag-list button.selected {
    background: #2784d9;
    color: #fff;
    border-color: #2784d9;
  }
  .channel-preview {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1.5rem 0;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 1rem;
  }
  .channel-preview img {
    border-radius: 4px;
    background: #eee;
  }
  .error { color: #e03e2d; margin: 0.5rem 0 0.5rem 0; }
  .radio-row label { display: inline-block; margin-right: 1.2rem; }
</style>

<main>
  <h2>Add YouTube Channel</h2>
  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if !fetchedChannel}
    <label>Channel URL or @handle</label>
    <input bind:value={url} placeholder="Paste YouTube channel URL or @handle" />
    <button on:click={fetchChannel} disabled={loading || !url.trim()}>
      {loading ? 'Loading...' : 'Fetch'}
    </button>
  {/if}

  {#if fetchedChannel}
    <div class="channel-preview">
      <img src={fetchedChannel.thumbnail} alt="Thumbnail" width="64" height="64" />
      <div>
        <div><strong>{fetchedChannel.title}</strong></div>
        <div style="font-size: 0.92rem; color: #666;">{fetchedChannel.id}</div>
      </div>
    </div>

    <label>Level <span style="color: #e03e2d">*</span></label>
    <div class="radio-row">
      <label><input type="radio" bind:group={selectedLevel} value="easy" /> Easy</label>
      <label><input type="radio" bind:group={selectedLevel} value="intermediate" /> Intermediate</label>
      <label><input type="radio" bind:group={selectedLevel} value="advanced" /> Advanced</label>
    </div>

    <label>Country</label>
    <select bind:value={selectedCountry}>
      <option value="">None</option>
      {#each COUNTRY_OPTIONS as c}
        <option value={typeof c === 'string' ? c : c.value}>{typeof c === 'string' ? c : (c.label || c.value)}</option>
      {/each}
    </select>

    <label>Tags</label>
    <div class="tag-list">
      {#each TAG_OPTIONS as tag}
        <button
          type="button"
          class:selected={selectedTags.includes(typeof tag === 'string' ? tag : tag.value)}
          on:click={() => toggleTag(typeof tag === 'string' ? tag : tag.value)}
        >
          {typeof tag === 'string' ? tag : (tag.label || tag.value)}
        </button>
      {/each}
    </div>
    <input
      placeholder="Type custom tag and press Enter"
      bind:value={customTag}
      on:keydown={(e) => e.key === 'Enter' && addCustomTag()}
    />

    <button on:click={submitChannel} disabled={!selectedLevel || loading}>
      {loading ? 'Saving...' : 'Submit Channel'}
    </button>
  {/if}
</main>
