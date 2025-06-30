<script>
  import { COUNTRY_OPTIONS, TAG_OPTIONS } from '$lib/constants';
  import Papa from 'papaparse';

  // === Single Channel Add State ===
  let url = '';
  let loading = false;
  let error = '';
  let success = false;
  let channelPreview = null;
  let level = '';
  let country = '';
  let selectedTags = [];

  // === Bulk Upload State ===
  let csvFile = null;
  let bulkUploading = false;
  let bulkResults = [];
  let csvInput;
  $: failedChannels = bulkResults.filter(r => !r.ok).map(r => r.url);

  function handleCsvFile(e) {
    csvFile = e.target.files[0];
  }

  async function uploadCsv() {
    if (!csvFile) return;
    bulkUploading = true;
    bulkResults = [];
    try {
      const text = await csvFile.text();
      const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
      const rows = data.map(row => ({
        url: (row.url || '').trim(),
        tags: (row.tags || '').trim(),
        country: (row.country || '').trim(),
        level: (row.level || '').trim()
      }));
      const res = await fetch('/api/bulk-upload-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows })
      });
      const out = await res.json();
      bulkUploading = false;
      bulkResults = out.results || [];
    } catch (err) {
      bulkUploading = false;
      bulkResults = [{ url: '', error: err.message || 'Bulk upload failed' }];
    }
  }

  // === Video Sync Logic ===
  let syncing = false;
  let syncResult = null;

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

  async function syncVideos() {
    syncing = true;
    syncResult = null;
    try {
      const res = await fetch('/api/sync-videos', { method: 'POST' });
      const data = await res.json();
      syncResult = data;
    } catch (err) {
      syncResult = { error: err.message || 'Unknown sync error' };
    } finally {
      syncing = false;
    }
  }
</script>

<div class="container">

  <!-- === Bulk Upload CSV Bar === -->
  <div class="import-bar">
    <span class="import-videos-title">BULK UPLOAD CSV</span>
    <input
      type="file"
      accept=".csv"
      bind:this={csvInput}
      on:change={handleCsvFile}
      aria-label="Select CSV file"
      class="import-input"
      style="min-width:unset;max-width:220px"
    />
    <button class="main-btn import-btn" on:click={uploadCsv} disabled={!csvFile || bulkUploading} aria-label="Bulk Upload">
      {bulkUploading ? 'Uploading…' : 'Upload CSV'}
    </button>
  </div>

  <!-- Bulk Upload Results -->
  {#if bulkResults.length}
    <div class="bulk-results">
      <h3>Bulk Upload Results</h3>
      <ul>
        {#each bulkResults as r}
          <li>
            {r.url}
            {#if r.ok}
              — <span style="color: green;">✅ Success</span>
            {:else}
              — <span style="color: red;">❌ {r.error}</span>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <!-- Failed Channels Section -->
  {#if failedChannels.length}
    <div class="bulk-failed">
      <h3>❌ Failed to Add Channels</h3>
      <ul>
        {#each failedChannels as url}
          <li>{url}</li>
        {/each}
      </ul>
      <div style="margin-top: 0.7em;">
        <em>Check the CSV or error messages above for details.</em>
      </div>
    </div>
  {/if}

  <!-- === Single Channel Add Section === -->
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
          <option value="">None</option>
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

  <!-- === VIDEO SYNC SECTION === -->
  <div class="sync-section">
    <button on:click={syncVideos} disabled={syncing}>
      {syncing ? 'Syncing...' : 'Sync Videos for All Channels'}
    </button>
    {#if syncResult}
      <pre>{JSON.stringify(syncResult, null, 2)}</pre>
    {/if}
  </div>
</div>

<style>
  .container {
    max-width: 550px;
    margin: 4rem auto;
    padding: 2rem 2.5rem;
    border-radius: 10px;
    background: #fafafa;
    border: 1px solid #eee;
    box-shadow: 0 4px 18px rgba(0,0,0,0.07);
    display: flex;
    flex-direction: column;
    gap: 2.5em;
    align-items: center;
  }
  .import-bar {
    display: flex;
    align-items: center;
    gap: 0.5em;
    background: #f8f8f8;
    padding: 1em;
    border-radius: 7px;
    box-shadow: 0 2px 8px #0001;
    width: 100%;
    max-width: 500px;
    margin-bottom: 0.5em;
  }
  .import-videos-title {
    font-weight: bold;
    margin-right: 0.8em;
  }
  .import-input {
    padding: 0.5em;
    font-size: 1em;
  }
  .main-btn.import-btn {
    font-size: 1em;
    padding: 0.5em 1em;
    margin-left: 0.5em;
  }
  .bulk-results {
    max-width: 700px;
    margin-top: 1em;
    font-family: monospace;
    font-size: 1em;
  }
  .bulk-results li { margin-bottom: 0.2em; }
  .bulk-failed {
    color: #900;
    margin-top: 1.5em;
    padding: 1em;
    background: #fee;
    border-radius: 7px;
    max-width: 600px;
    font-family: monospace;
    font-size: 1em;
  }
  h1 {
    text-align: center;
    margin-bottom: 2rem;
    margin-top: 1em;
  }
  label {
    font-weight: bold;
    margin-top: 1rem;
    display: block;
  }
  input, select, button {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    margin-bottom: 1rem;
    box-sizing: border-box;
  }
  button {
    cursor: pointer;
    font-weight: bold;
    background: #0074d9;
    color: white;
    border: none;
    border-radius: 5px;
    transition: background 0.2s;
  }
  button:disabled {
    background: #aaa;
    cursor: not-allowed;
  }
  form {
    margin-top: 1.5rem;
  }
  hr {
    margin: 2rem 0 1.2rem 0;
    border: none;
    border-top: 1px solid #eee;
  }
  .sync-section {
    margin-top: 2.5rem;
    padding-top: 1.2rem;
    border-top: 1px solid #eaeaea;
    text-align: center;
    width: 100%;
  }
  .sync-section button {
    margin-bottom: 1rem;
  }
  .sync-section pre {
    text-align: left;
    max-height: 400px;
    overflow: auto;
    font-size: 0.95em;
    background: #f6f6f6;
    padding: 1rem;
    border-radius: 7px;
    border: 1px solid #ececec;
  }
</style>
