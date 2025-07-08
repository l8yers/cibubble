<script>
  import { supabase } from '$lib/supabaseClient';
  import { user, userLoading, authChecked } from '$lib/stores/user.js';
  import { onMount } from 'svelte';
  import { COUNTRY_OPTIONS, TAG_OPTIONS } from '$lib/constants';
  import Papa from 'papaparse';

  // Profile/auth state
  let profileRow = null;
  let error = null;
  let checked = false;
  $: currentUser = $user;

  // Admin data
  let allChannels = [];
  let refreshing = false;
  let settingCountry = {};
  let settingLevel = {};
  let deleting = {};
  let search = '';
  let currentPage = 1;
  const channelsPerPage = 12;
  let totalPages = 1;
  let filteredChannels = [];
  let message = '';

  // Bulk upload
  let csvFile = null;
  let bulkUploading = false;
  let bulkResults = [];
  let csvInput;
  $: failedChannels = bulkResults.filter(r => !r.ok).map(r => r.url);

  // Add channel
  let url = '';
  let loading = false;
  let success = false;
  let channelPreview = null;
  let level = '';
  let country = '';
  let selectedTags = [];
  let singleError = '';

  // Profile check
  async function checkProfileDirect() {
    error = null;
    profileRow = null;
    checked = false;
    if (!currentUser?.id) {
      error = "No user ID found.";
      checked = true;
      return;
    }
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    profileRow = data;
    error = err;
    checked = true;
    // If admin, auto-load admin data
    if (profileRow && profileRow.is_admin === true) {
      await refresh();
    }
  }

  // Admin table functions
  async function refresh() {
    refreshing = true;
    try {
      let { data, error } = await supabase.from('channels').select('*');
      if (error) {
        message = "Channels error: " + (error.message ?? error);
        allChannels = [];
        return;
      }
      allChannels = data || [];
      currentPage = 1;
    } catch (e) {
      message = "Refresh error: " + e.message;
      allChannels = [];
    } finally {
      refreshing = false;
    }
  }
  $: {
    let s = (search || '').trim().toLowerCase();
    let filtered = !s
      ? allChannels
      : allChannels.filter(chan =>
        (chan.name || '').toLowerCase().includes(s)
        || (chan.country || '').toLowerCase().includes(s)
      );
    totalPages = Math.max(1, Math.ceil(filtered.length / channelsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    filteredChannels = filtered.slice((currentPage - 1) * channelsPerPage, currentPage * channelsPerPage);
  }
  function onSearchInput(e) {
    search = e.target.value;
    currentPage = 1;
  }
  function goToPage(p) {
    if (p < 1 || p > totalPages) return;
    currentPage = p;
  }
  async function deleteChannel(id) {
    const doDelete = typeof window !== 'undefined'
      ? confirm('Delete this channel and ALL its videos/playlists?')
      : false;
    if (!doDelete) return;
    deleting = { ...deleting, [id]: true };
    await supabase.from('videos').delete().eq('channel_id', id);
    await supabase.from('playlists').delete().eq('channel_id', id);
    await supabase.from('channels').delete().eq('id', id);
    await refresh();
    deleting = { ...deleting, [id]: false };
  }

  // Bulk upload
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

  // Add channel section
  async function fetchChannelDetails() {
    loading = true;
    singleError = '';
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
        singleError = data.error || 'Failed to fetch channel.';
        return;
      }
      channelPreview = data.channel;
    } catch (err) {
      singleError = err.message || 'Fetch error';
    } finally {
      loading = false;
    }
  }
  async function submitChannel() {
    singleError = '';
    success = false;
    if (!level || !channelPreview?.id) {
      singleError = 'Level and channel data required.';
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
        singleError = data.error || 'Insert failed';
        return;
      }
      success = true;
      url = '';
      channelPreview = null;
      level = '';
      country = '';
      selectedTags = [];
      await refresh();
    } catch (err) {
      singleError = err.message || 'Insert error';
    }
  }

  // On mount: check profile (will load admin panel if admin)
  onMount(() => {
    if (currentUser?.id) checkProfileDirect();
  });
</script>

<h2>Admin Profile Test Page</h2>
<div>
  <strong>Auth:</strong><br>
  authChecked: {$authChecked ? 'true' : 'false'}<br>
  userLoading: {$userLoading ? 'true' : 'false'}<br>
  user: <pre style="display:inline;">{JSON.stringify($user, null, 2)}</pre>
</div>
<hr>

<button on:click={checkProfileDirect} disabled={!currentUser?.id}>
  {profileRow ? "Refresh Profile Row" : "Load Profile Row"}
</button>

{#if checked}
  <h3>Direct Query Result:</h3>
  {#if error}
    <div style="color:red"><strong>Error:</strong> {JSON.stringify(error, null, 2)}</div>
  {:else if profileRow}
    <pre>{JSON.stringify(profileRow, null, 2)}</pre>
    <p>
      <strong>is_admin:</strong>
      {profileRow.is_admin === true ? '✅ TRUE' : profileRow.is_admin === false ? '❌ FALSE' : String(profileRow.is_admin)}
    </p>
    {#if profileRow.is_admin === true}
      <!-- ADMIN PANEL BELOW THIS LINE -->
      <div style="color:green;font-weight:bold;font-size:1.4em; margin-top:1em;">
        ADMIN PANEL (You are admin)
      </div>

      <!-- Bulk Upload CSV -->
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

      <!-- Add YouTube Channel -->
      <h3>Add YouTube Channel</h3>
      <div>
        <label>YouTube Channel URL or @handle:</label>
        <input bind:value={url} placeholder="@somehandle or full URL" />
        <button on:click={fetchChannelDetails} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch'}
        </button>
      </div>
      {#if singleError}
        <p style="color: red;">{singleError}</p>
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

      <!-- Channels Table -->
      <hr />
      <h3>Channel Tools</h3>
      <div>
        <input
          type="text"
          placeholder="Search channels…"
          bind:value={search}
          on:input={onSearchInput}
          style="width:300px;margin-bottom:1em;"
        />
        <span style="margin-left:1em;">{filteredChannels.length} shown / {allChannels.length} total</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Country</th>
            <th>Level</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredChannels as chan}
            <tr>
              <td>{chan.name}</td>
              <td>{chan.country}</td>
              <td>{chan.level}</td>
              <td>
                <button
                  on:click={() => deleteChannel(chan.id)}
                  disabled={deleting[chan.id]}
                  style="color:red;"
                >Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <div style="margin-top:1.5em;">
        {#each Array(totalPages) as _, i}
          <button on:click={() => goToPage(i + 1)} disabled={currentPage === i + 1}>
            {i + 1}
          </button>
        {/each}
      </div>
      {#if message}
        <div style="margin:1em;color:#244fa2;">{message}</div>
      {/if}
      <!-- END ADMIN PANEL -->
    {:else}
      <div style="color:#b22222;font-weight:bold;font-size:1.1em; margin-top:1em;">
        Not allowed (admin only).
      </div>
    {/if}
  {:else}
    <div>No profile row found for this user.</div>
  {/if}
{/if}

<style>
  .import-bar {
    display: flex;
    align-items: center;
    gap: 1em;
    margin-bottom: 1em;
    padding-bottom: 1em;
    border-bottom: 1.5px solid #eee;
  }
  .import-videos-title {
    font-weight: 700;
    font-size: 1.11em;
    margin-right: 1em;
  }
  .main-btn {
    background: #e93c2f;
    color: #fff;
    border-radius: 8px;
    padding: 0.7em 1.2em;
    border: none;
    font-size: 1em;
    cursor: pointer;
  }
  .main-btn.import-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .bulk-results ul, .bulk-failed ul {
    margin: 0.5em 0 0 0.5em;
    padding: 0;
    list-style: disc;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1em;
    background: #fafbfc;
    border-radius: 10px;
    box-shadow: 0 1.5px 8px #e0e0e040;
  }
  th, td {
    padding: 0.7em 0.5em;
    border-bottom: 1px solid #f0f0f0;
    text-align: left;
  }
  th {
    background: #f7fafd;
    color: #244fa2;
    font-weight: bold;
  }
  tr:last-child td {
    border-bottom: none;
  }
  select, input[type="text"] {
    padding: 0.34em 0.6em;
    border-radius: 7px;
    border: 1px solid #ddd;
    font-size: 1em;
    background: #fafafa;
    color: #222;
    min-width: 80px;
    margin-right: 0.3em;
  }
  button[disabled] {
    opacity: 0.65;
    cursor: not-allowed;
  }
</style>
