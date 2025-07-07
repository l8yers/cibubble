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

  // === Channel Details for Add ===
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

  // ==== CHANNEL TOOLS (Legacy) ====
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabaseClient.js';
  import { getTagsForChannel } from '$lib/api/tags.js';

  const levels = [
    { value: '', label: 'Set Level' },
    { value: 'easy', label: 'Easy' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'notyet', label: 'Not Yet Rated' }
  ];

  // Pagination/search/filter state
  let currentTab = 'tools';
  let search = '';
  let currentPage = 1;
  const channelsPerPage = 12;
  let totalPages = 1;
  let allChannels = [];
  let filteredChannels = [];

  // Channel edit state
  let refreshing = false;
  let showPlaylistsFor = null;
  let playlists = [];
  let playlistsLoading = false;
  let settingCountry = {};
  let settingLevel = {};
  let settingPlaylistLevel = {};
  let deleting = {};
  let message = '';

  // Main channel fetch & filter logic
  $: {
    let s = (search || '').trim().toLowerCase();
    let filtered = !s
      ? allChannels
      : allChannels.filter(chan =>
        (chan.name || '').toLowerCase().includes(s)
        || (chan.country || '').toLowerCase().includes(s)
        || (chan._tags || []).some(t => (t.name || '').toLowerCase().includes(s))
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

  async function refresh() {
    refreshing = true;
    try {
      let { data, error } = await supabase.from('channels').select('*');
      if (error) {
        message = "Channels error: " + (error.message ?? error);
        allChannels = [];
        return;
      }
      allChannels = await Promise.all(
        (data || []).map(async (chan) => {
          // legacy logic, tags are handled async
          let _tags = [];
          try {
            _tags = await getTagsForChannel(chan.id);
          } catch (e) { _tags = []; }
          return {
            ...chan,
            _country: chan.country || '',
            _tags
          };
        })
      );
      currentPage = 1;
    } catch (e) {
      message = "Refresh error: " + e.message;
      allChannels = [];
    } finally {
      refreshing = false;
    }
  }

  // Channel editing actions
  async function setChannelCountry(channelId, country) {
    settingCountry = { ...settingCountry, [channelId]: true };
    await supabase.from('channels').update({ country }).eq('id', channelId);
    await supabase.from('videos').update({ country }).eq('channel_id', channelId);
    message = '✅ Country updated';
    await refresh();
    settingCountry = { ...settingCountry, [channelId]: false };
  }

  async function setChannelLevel(channelId, level) {
    if (!level) return;
    settingLevel = { ...settingLevel, [channelId]: true };
    await supabase.from('videos').update({ level }).eq('channel_id', channelId);
    message = `✅ All videos for this channel set to "${levels.find((l) => l.value === level)?.label}"`;
    await refresh();
    settingLevel = { ...settingLevel, [channelId]: false };
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

  async function togglePlaylistsFor(channelId) {
    if (showPlaylistsFor === channelId) {
      showPlaylistsFor = null;
      playlists = [];
      return;
    }
    showPlaylistsFor = channelId;
    playlistsLoading = true;
    let { data, error } = await supabase.from('playlists').select('*').eq('channel_id', channelId);
    if (!error) {
      playlists = data || [];
    } else {
      playlists = [];
    }
    playlistsLoading = false;
  }

  onMount(refresh);
</script>

<div class="container" style="max-width: 800px;">
  <!-- === Channel Add + Bulk Upload === -->
  <div style="background: #f5f6fa; border-radius: 14px; margin: 2em 0 2em 0; padding: 2em 2em 1.2em 2em; box-shadow: 0 1.5px 10px #e3e3e3;">
    <h2 style="margin-top:0;">Add YouTube Channel</h2>
    <div style="margin-bottom: 1em;">
      <label>YouTube Channel URL or @handle:</label>
      <input bind:value={url} placeholder="@somehandle or full URL" style="width:340px; margin-right:0.5em;" />
      <button on:click={fetchChannelDetails} disabled={loading}>{loading ? 'Loading...' : 'Fetch'}</button>
    </div>
    {#if error}
      <p style="color: red;">{error}</p>
    {/if}
    {#if success}
      <p style="color: green;">Channel inserted!</p>
    {/if}
    {#if channelPreview}
      <div style="border:1px solid #e3e3e3; border-radius:10px; padding:1.1em; margin-bottom:1.2em;">
        <h3>Confirm Channel Info</h3>
        <p><strong>{channelPreview.title}</strong></p>
        <img src={channelPreview.thumbnail} alt="Thumbnail" width="120" height="120" />
        <form on:submit|preventDefault={submitChannel} style="margin-top:1.1em;">
          <div>
            <label>Level (required):</label>
            <div>
              {#each ['easy', 'intermediate', 'advanced'] as lvl}
                <label>
                  <input type="radio" bind:group={level} value={lvl} required />
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
          <button type="submit" style="margin-top:0.7em;">Submit Channel</button>
        </form>
      </div>
    {/if}
    <hr style="margin:1.5em 0;" />
    <div class="import-bar" style="margin-bottom: 1.5em;">
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
    <div class="sync-section" style="margin-top:2em;">
      <button on:click={syncVideos} disabled={syncing}>
        {syncing ? 'Syncing...' : 'Sync Videos for All Channels'}
      </button>
      {#if syncResult}
        <pre>{JSON.stringify(syncResult, null, 2)}</pre>
      {/if}
    </div>
  </div>

  <!-- === Channel Tools (legacy edit panel) === -->
  <div style="background: #fff; border-radius: 14px; box-shadow: 0 2px 12px #e3e8ee; padding: 2em 2.2em 1.2em 2.2em; margin-bottom: 2em;">
    <h2>Channel Tools</h2>
    <div style="display: flex; align-items: center; gap:1.2em;">
      <input type="text" placeholder="Search channel, country, or tag…" bind:value={search} on:input={onSearchInput} style="width:320px;" />
      <button on:click={refresh} disabled={refreshing}>Refresh</button>
      <span style="color:#888;font-size:1em; margin-left:2em;">Page {currentPage} of {totalPages}</span>
      <button on:click={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>Prev</button>
      <button on:click={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}>Next</button>
    </div>
    {#if message}
      <div style="margin: 1em 0; color: #e93c2f;">{message}</div>
    {/if}
    <table style="width:100%;margin-top:1.3em;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px #eee;">
      <thead style="background:#f5f6fa;">
        <tr>
          <th style="padding:0.6em 0.7em;">Name</th>
          <th>Country</th>
          <th>Tags</th>
          <th>Level</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredChannels as chan}
          <tr>
            <td style="padding:0.55em 0.6em;">{chan.name}</td>
            <td>
              <select bind:value={chan._country} on:change={() => setChannelCountry(chan.id, chan._country)} disabled={settingCountry[chan.id]}>
                <option value="">No Country</option>
                {#each COUNTRY_OPTIONS as country}
                  <option value={country}>{country}</option>
                {/each}
              </select>
            </td>
            <td>
              {#each chan._tags as tag, i}
                <span style="display:inline-block;padding:2px 8px;border-radius:5px;background:#eaeaea;margin-right:3px;font-size:0.96em;">{tag.name}</span>
              {/each}
            </td>
            <td>
              <select bind:value={chan.level} on:change={() => setChannelLevel(chan.id, chan.level)} disabled={settingLevel[chan.id]}>
                {#each levels as lvl}
                  <option value={lvl.value}>{lvl.label}</option>
                {/each}
              </select>
            </td>
            <td>
              <button on:click={() => deleteChannel(chan.id)} style="color:#e93c2f;font-weight:bold;" disabled={deleting[chan.id]}>Delete</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if filteredChannels.length === 0}
      <div style="color:#888;margin:2em auto 1em auto;text-align:center;">No channels found.</div>
    {/if}
  </div>
</div>

<style>
  .container {
    margin: 0 auto;
    padding: 1.5em 0 3em 0;
    max-width: 920px;
  }
  .import-bar {
    display: flex;
    align-items: center;
    gap: 1em;
    margin-bottom: 0.5em;
  }
  .main-btn.import-btn {
    background: #e93c2f;
    color: #fff;
    font-weight: bold;
    padding: 0.6em 1.2em;
    border-radius: 7px;
    border: none;
    margin-left: 0.2em;
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
</style>
