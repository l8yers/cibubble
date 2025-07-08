<script>
  import { supabase } from '$lib/supabaseClient';
  import { COUNTRY_OPTIONS, TAG_OPTIONS } from '$lib/constants';
  import Papa from 'papaparse';
  import { onMount } from 'svelte';
  import { stripAccent } from '$lib/utils/adminutils.js';
  import { getTagsForChannel } from '$lib/api/tags.js';
  import { user, userLoading, authChecked } from '$lib/stores/user.js';

  // Admin check logic (test page style)
  let profileRow = null;
  let error = null;
  let checked = false;
  $: currentUser = $user;

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
  }
  onMount(() => {
    if (currentUser?.id) checkProfileDirect();
    refresh();
  });

  // --- Channel Add State ---
  let url = '';
  let loading = false;
  let submitError = '';
  let success = false;
  let channelPreview = null;
  let level = '';
  let country = '';
  let selectedTags = [];

  async function fetchChannelDetails() {
    loading = true;
    submitError = '';
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
        submitError = data.error || 'Failed to fetch channel.';
        return;
      }
      channelPreview = data.channel;
    } catch (err) {
      submitError = err.message || 'Fetch error';
    } finally {
      loading = false;
    }
  }

  async function submitChannel() {
    submitError = '';
    success = false;
    if (!level || !channelPreview?.id) {
      submitError = 'Level and channel data required.';
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
        submitError = data.error || 'Insert failed';
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
      submitError = err.message || 'Insert error';
    }
  }

  // --- Bulk Upload State ---
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
      await refresh();
    } catch (err) {
      bulkUploading = false;
      bulkResults = [{ url: '', error: err.message || 'Bulk upload failed' }];
    }
  }

  // --- Sync Logic ---
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

  // --- Channel Table / Playlists State ---
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

  // --- Playlist UI State ---
  let openPlaylistsChannelId = null;
  let playlists = [];
  let playlistsLoading = false;
  let playlistLevelSaving = {};
  let playlistMessage = '';

  $: {
    let s = stripAccent(search.trim().toLowerCase());
    let filtered = !s
      ? allChannels
      : allChannels.filter(chan =>
        stripAccent(chan.name || '').toLowerCase().includes(s)
        || stripAccent(chan.country || '').toLowerCase().includes(s)
        || (chan._tags || []).some(t => stripAccent(t.name || '').toLowerCase().includes(s))
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

  async function setChannelLevel(channelId, newLevel) {
    if (!newLevel) return;
    settingLevel = { ...settingLevel, [channelId]: true };
    await supabase.from('videos').update({ level: newLevel }).eq('channel_id', channelId);
    message = `✅ All videos for this channel set to "${newLevel}"`;
    await refresh();
    settingLevel = { ...settingLevel, [channelId]: false };
  }

  async function setChannelCountry(channelId, country) {
    settingCountry = { ...settingCountry, [channelId]: true };
    await supabase.from('channels').update({ country }).eq('id', channelId);
    await supabase.from('videos').update({ country }).eq('channel_id', channelId);
    message = '✅ Country updated';
    await refresh();
    settingCountry = { ...settingCountry, [channelId]: false };
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
          let _tags = [];
          try {
            _tags = await getTagsForChannel(chan.id);
          } catch (e) { _tags = []; }
          return {
            ...chan,
            _country: chan.country || '',
            _tags,
            _newLevel: chan.level || '',
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

  async function openPlaylistsForChannel(channelId) {
    openPlaylistsChannelId = channelId;
    playlistsLoading = true;
    playlists = [];
    playlistMessage = '';
    let { data, error } = await supabase.from('playlists').select('*').eq('channel_id', channelId);
    if (error) {
      playlistMessage = "Error loading playlists: " + (error.message ?? error);
      playlists = [];
    } else {
      // For each playlist, fetch all videos' levels to determine single or mixed
      playlists = await Promise.all((data || []).map(async (pl) => {
        const { data: videos } = await supabase
          .from('videos')
          .select('level')
          .eq('playlist_id', pl.id);
        let level = '';
        if (videos && videos.length > 0) {
          const uniqueLevels = Array.from(new Set(videos.map(v => v.level)));
          level = uniqueLevels.length === 1 ? uniqueLevels[0] : '';
        }
        return { ...pl, _level: level };
      }));
    }
    playlistsLoading = false;
  }

  async function savePlaylistLevel(playlistId, newLevel) {
    if (!newLevel) return;
    playlistLevelSaving = { ...playlistLevelSaving, [playlistId]: true };
    playlistMessage = '';
    const { error } = await supabase.from('videos').update({ level: newLevel }).eq('playlist_id', playlistId);
    if (!error) {
      playlistMessage = `✅ All videos for playlist ${playlistId} set to "${newLevel}"`;
      // Re-fetch playlists to reflect new level
      if (openPlaylistsChannelId) openPlaylistsForChannel(openPlaylistsChannelId);
    } else {
      playlistMessage = `❌ Error updating videos: ${error.message}`;
    }
    playlistLevelSaving = { ...playlistLevelSaving, [playlistId]: false };
  }
</script>

<h2>Admin Panel</h2>

{#if checked}
  <p>
    <strong>is_admin:</strong>
    {profileRow?.is_admin === true ? '✅ TRUE' : profileRow?.is_admin === false ? '❌ FALSE' : String(profileRow?.is_admin)}
  </p>
  {#if profileRow?.is_admin === true}
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
      {#if submitError}
        <p style="color: red;">{submitError}</p>
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

      <!-- === CHANNEL TOOLS SECTION (edit/search/delete) === -->
      <hr />
      <h2>Channel Tools</h2>
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
            <th>Tags</th>
            <th>Level</th>
            <th>Actions</th>
            <th>Playlists</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredChannels as chan}
            <tr>
              <td>{chan.name}</td>
              <td>
                <select
                  bind:value={chan._country}
                  on:change={e => setChannelCountry(chan.id, e.target.value)}
                  disabled={settingCountry[chan.id]}
                >
                  <option value="">No Country</option>
                  {#each COUNTRY_OPTIONS as country}
                    <option value={country}>{country}</option>
                  {/each}
                </select>
              </td>
              <td>
                {(chan._tags || []).map(t => t.name).join(', ')}
              </td>
              <td>
                <select
                  bind:value={chan._newLevel}
                  on:change={e => setChannelLevel(chan.id, e.target.value)}
                  disabled={settingLevel[chan.id]}
                >
                  <option value="">Set Level</option>
                  <option value="easy">Easy</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="notyet">Not Yet Rated</option>
                </select>
              </td>
              <td>
                <button
                  on:click={() => deleteChannel(chan.id)}
                  disabled={deleting[chan.id]}
                  style="color:red;"
                >Delete</button>
              </td>
              <td>
                <button on:click={() => openPlaylistsForChannel(chan.id)}>
                  Playlists
                </button>
              </td>
            </tr>
            {#if openPlaylistsChannelId === chan.id}
              <tr>
                <td colspan="6" style="background:#faf9ff;">
                  <div style="padding:1em 0;">
                    {#if playlistsLoading}
                      <div>Loading playlists…</div>
                    {:else if playlists.length === 0}
                      <div>No playlists found for this channel.</div>
                    {:else}
                      <table style="width:100%;margin-top:0.7em;">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>ID</th>
                            <th>Set Videos Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each playlists as pl}
                            <tr>
                              <td>{pl.title}</td>
                              <td style="font-size:0.9em;color:#999;">{pl.id}</td>
                              <td>
                                <select
                                  bind:value={pl._level}
                                  on:change={e => savePlaylistLevel(pl.id, e.target.value)}
                                  disabled={playlistLevelSaving[pl.id]}
                                >
                                  <option value="">Set Level</option>
                                  <option value="easy">Easy</option>
                                  <option value="intermediate">Intermediate</option>
                                  <option value="advanced">Advanced</option>
                                  <option value="notyet">Not Yet Rated</option>
                                </select>
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    {/if}
                    {#if playlistMessage}
                      <div style="margin-top:0.5em;color:#244fa2;">{playlistMessage}</div>
                    {/if}
                  </div>
                </td>
              </tr>
            {/if}
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
    </div>
  {:else}
    <div style="color:#b22222;font-weight:bold;font-size:1.1em; margin-top:1em;">
      Not allowed (admin only).
    </div>
  {/if}
{:else}
  <div>Loading...</div>
{/if}

<style>
  .container {
    max-width: 1100px;
    margin: 2.5em auto;
    padding: 1.5em 2em;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 6px 30px 0 #0001, 0 1.5px 7px #e3e8ee35;
  }
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
  .sync-section {
    margin: 2em 0 2.5em 0;
    padding: 1em 0;
    border-top: 1px solid #e4e4e4;
    border-bottom: 1px solid #e4e4e4;
    display: flex;
    flex-direction: column;
    gap: 0.7em;
  }
</style>
