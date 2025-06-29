<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient.js';
  import { getTagsForChannel } from '$lib/api/tags.js';
  import AdminCsvUploadBar from '$lib/components/admin/AdminCsvUploadBar.svelte';
  import AdminSearchBar from '$lib/components/admin/AdminSearchBar.svelte';
  import AdminChannelTable from '$lib/components/admin/AdminChannelTable.svelte';
  import { stripAccent, normalizeTags, parseCsv } from '$lib/utils/adminUtils.js';

  // === ADMIN ACCESS CONTROL ===
  let isReady = false;
  let fetchErr = '';
  let adminFlag = false;
  let userId = '';
  let userStore = null;

  // --- SINGLE CHANNEL FETCH STATE ---
  let singleChannelUrl = '';
  let singleChannelLoading = false;
  let singleChannelError = '';
  let fetchedChannel = null;

  // Single add form state
  let tagInput = '';
  let tags = [];
  let channelLevel = '';
  let channelCountry = '';
  let addChannelLoading = false;
  let addChannelError = '';
  let addChannelSuccess = '';

  // --- Admin tools (bulk upload, channels, playlists, etc) ---
  const countryOptions = [
    'Argentina','Canary Islands','Chile','Colombia','Costa Rica','Cuba','Dominican Republic','Ecuador','El Salvador','Equatorial Guinea','France','Guatemala','Italy','Latin America','Mexico','Panama','Paraguay','Peru','Puerto Rico','Spain','United States','Uruguay','Venezuela'
  ];
  const levels = [
    { value: '', label: 'Set Level' },
    { value: 'easy', label: 'Easy' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'notyet', label: 'Not Yet Rated' }
  ];
  let currentTab = "upload";
  let url = '';
  let message = '';
  let importing = false;
  let clearing = false;
  let deleting = {};
  let allChannels = [];
  let refreshing = false;
  let showPlaylistsFor = null;
  let playlists = [];
  let playlistsLoading = false;
  let settingCountry = {};
  let settingLevel = {};
  let settingPlaylistLevel = {};
  let search = '';
  let currentPage = 1;
  const channelsPerPage = 12;
  let totalPages = 1;
  let filteredChannels = [];
  let csvInput;
  let csvFile = null;
  let bulkUploading = false;
  let uploadFailures = [];
  let uploadSuccesses = [];

  // --- ADMIN ACCESS CHECK ---
  onMount(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const { session } = sessionData;

    if (!session?.user) {
      isReady = true;
      adminFlag = false;
      userId = '';
      return;
    }

    userStore = session.user;
    userId = session.user.id;

    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      fetchErr = error.message || 'Profile fetch failed';
      isReady = true;
      adminFlag = false;
      return;
    }

    adminFlag = !!data?.is_admin;
    isReady = true;
  });

  // --- CHANNEL ADD/FETCH LOGIC ---
  async function fetchSingleChannel() {
    singleChannelLoading = true;
    singleChannelError = '';
    fetchedChannel = null;
    addChannelError = '';
    addChannelSuccess = '';
    tags = [];
    tagInput = '';
    channelLevel = '';
    channelCountry = '';
    try {
      const res = await fetch('/api/fetch-youtube-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: singleChannelUrl })
      });
      const json = await res.json();
      if (json.error) {
        singleChannelError = json.error;
        return;
      }
      fetchedChannel = json.channel || null;
    } catch (e) {
      singleChannelError = 'Fetch failed: ' + e.message;
    } finally {
      singleChannelLoading = false;
    }
  }
  function addTag() {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) tags = [...tags, val];
    tagInput = '';
  }
  function removeTag(t) {
    tags = tags.filter(x => x !== t);
  }
  async function submitChannel() {
    addChannelError = '';
    addChannelSuccess = '';
    try {
      if (!fetchedChannel) throw new Error('No channel details loaded');
      if (!channelLevel) throw new Error('Select a difficulty level.');
      if (!channelCountry) throw new Error('Select a country.');
      addChannelLoading = true;
      const res = await fetch('/api/add-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: singleChannelUrl,
          tags,
          level: channelLevel,
          country: channelCountry,
          added_by: userId || null
        })
      });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        addChannelError = '❌ API did not return valid JSON. See console.';
        console.error('submitChannel: Invalid JSON:', text);
        return;
      }
      if (json.error) {
        addChannelError = `❌ ${json.error}`;
        console.warn('submitChannel: API error', json.error);
      } else {
        addChannelSuccess = `✅ Channel "${fetchedChannel.title}" added (${json.videos_added} videos, ${json.playlists_count} playlists).`;
        // Reset UI
        fetchedChannel = null;
        singleChannelUrl = '';
        tags = [];
        tagInput = '';
        channelLevel = '';
        channelCountry = '';
        await refresh();
      }
    } catch (e) {
      addChannelError = '❌ Add failed: ' + (e?.message ?? e);
      console.error('submitChannel: JS error', e);
    } finally {
      addChannelLoading = false;
      if (!addChannelError && !addChannelSuccess) {
        addChannelError = '❌ No response or error received. Check network and backend logs.';
      }
    }
    console.log("submitChannel userId (at submit time):", userId);
  }

  // --- Bulk Upload, Table, Refresh, etc ---
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
  function handleCsvFile(e) {
    csvFile = e.target.files[0];
  }
  function downloadFailuresCsv() {
    if (!uploadFailures.length) return;
    const rows = uploadFailures.map(f => ({
      ...f.row,
      error: f.error,
      rownum: f.rownum
    }));
    let csv = "rownum,error,url,tags,country,level\n";
    csv += rows.map(r =>
      [r.rownum, `"${(r.error||'').replace(/"/g,'""')}"`, r.url, r.tags, r.country, r.level].join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "upload_failures.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function uploadCsv() {
    if (!csvFile) return;
    bulkUploading = true;
    uploadFailures = [];
    uploadSuccesses = [];
    message = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      let csvRows = [];
      try {
        csvRows = parseCsv(text);
      } catch (err) {
        message = `❌ CSV format error: ${err.message}`;
        bulkUploading = false;
        return;
      }

      let added = 0;
      for (let [i, row] of csvRows.entries()) {
        if (!row.url || !row.url.startsWith('http')) {
          uploadFailures.push({ row, error: "Missing or invalid YouTube link", rownum: i + 2 });
          continue;
        }
        try {
          const res = await fetch('/api/add-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: row.url,
              tags: row.tags,
              country: row.country,
              level: row.level,
              added_by: userId || null
            })
          });
          const json = await res.json();
          if (json.error) {
            uploadFailures.push({ row, error: json.error, rownum: i + 2 });
          } else {
            added++;
            uploadSuccesses.push({ row, status: 'OK', rownum: i + 2 });
          }
        } catch (err) {
          uploadFailures.push({ row, error: err.message, rownum: i + 2 });
        }
      }

      message = `✅ Uploaded ${added}/${csvRows.length} rows.`;
      if (uploadFailures.length) message += ` ❌ ${uploadFailures.length} failed (see details below)`;
      await refresh();
      bulkUploading = false;
      csvFile = null;
      if (csvInput) csvInput.value = '';
    };
    reader.readAsText(csvFile);
  }

  // --- REFRESH (*** FIXED CHANNEL FETCH ***) ---
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
          try { _tags = await getTagsForChannel(chan.id); } catch (e) { _tags = []; }
          return {
            ...chan,
            _country: chan.country || '',
            _tags,
            _newLevel: '',
            _mainLevel: chan.level || '' // uses level from channel
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

  // --- CHANNEL TABLE ACTIONS ---
  async function setChannelLevel(channelId, level) {
    if (!level) return;
    settingLevel = { ...settingLevel, [channelId]: true };
    await supabase.from('channels').update({ level }).eq('id', channelId);
    message = `✅ Channel set to "${levels.find((l) => l.value === level)?.label}"`;
    await refresh();
    settingLevel = { ...settingLevel, [channelId]: false };
  }
  async function setChannelCountry(channelId, country) {
    settingCountry = { ...settingCountry, [channelId]: true };
    await supabase.from('channels').update({ country }).eq('id', channelId);
    message = '✅ Country updated';
    await refresh();
    settingCountry = { ...settingCountry, [channelId]: false };
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
  // (Playlist logic can be plugged in below)
  // --- Playlists omitted for brevity ---
  // (You can restore the playlist toggle/set/delete logic from earlier as needed)
</script>

<!-- === DEBUG PANEL ALWAYS AT TOP === -->
<div style="background:#ffeccc;padding:1em 2em;margin:2em auto 1.2em auto;max-width:700px;font-size:0.95em;border-radius:13px;border:1px solid #ddd;">
  <b>DEBUG PANEL</b><br>
  userId: {userId}<br>
  adminFlag: {String(adminFlag)}<br>
  fetchErr: {fetchErr}<br>
  isReady: {String(isReady)}<br>
  <b>ALWAYS-ON DEBUG</b><br>
  <small>I should always be visible if Svelte is working.</small>
</div>

<!-- === ACCESS CONTROL === -->
{#if !isReady}
  <div style="margin:4em auto;text-align:center;">Checking admin access…</div>
{:else if fetchErr}
  <div style="margin:4em auto;text-align:center;color:#e93c2f;">
    ⚠️ Error loading admin info: {fetchErr}
  </div>
{:else if !adminFlag}
  <div style="margin:4em auto;text-align:center;">
    Not authorized. <a href="/">Back to home</a>
  </div>
{:else}
  <!-- === FULL ADMIN PANEL BELOW === -->
  <div class="admin-main">
    <div class="admin-panel">
      <h2>Admin Tools</h2>
      <div class="tabs">
        <button class:tab-active={currentTab === 'upload'} on:click={() => currentTab = 'upload'}>Upload Tools</button>
        <button class:tab-active={currentTab === 'channels'} on:click={() => currentTab = 'channels'}>Channel Tools</button>
      </div>

      {#if currentTab === 'upload'}
        <section>
          <h3>Single Channel Add</h3>
          <input type="text" bind:value={singleChannelUrl} placeholder="Paste YouTube channel link here…" style="width:100%;max-width:480px;">
          <button on:click={fetchSingleChannel} disabled={singleChannelLoading}>Fetch Channel</button>

          {#if singleChannelError}
            <div style="color:#e93c2f;margin-top:0.7em;">{singleChannelError}</div>
          {/if}

          {#if fetchedChannel}
            <div style="margin:1em 0 0.4em 0;">
              <b>{fetchedChannel.title}</b><br>
              <img src={fetchedChannel.thumbnail} alt="Channel thumbnail" style="height:40px;margin-top:6px;">
            </div>

            <div style="margin:0.5em 0;">
              <label>Tags:</label>
              {#each tags as t}
                <span style="background:#eee;padding:0.25em 0.6em;border-radius:12px;margin-right:0.5em;">
                  {t}
                  <span style="color:#c11;cursor:pointer;margin-left:0.4em;" on:click={() => removeTag(t)}>×</span>
                </span>
              {/each}
              <input
                type="text"
                placeholder="Add tag"
                bind:value={tagInput}
                on:keydown={(e) => e.key==='Enter' && (addTag(),e.preventDefault())}
                style="margin-top:0.6em;">
              <button type="button" on:click={addTag} style="margin-left:0.4em;">Add Tag</button>
            </div>

            <div style="margin:0.7em 0;">
              <label>
                Level:
                <select bind:value={channelLevel}>
                  {#each levels as l}
                    <option value={l.value}>{l.label}</option>
                  {/each}
                </select>
              </label>
              <label style="margin-left:1.5em;">
                Country:
                <select bind:value={channelCountry}>
                  <option value="">Set Country</option>
                  {#each countryOptions as c}
                    <option value={c}>{c}</option>
                  {/each}
                </select>
              </label>
            </div>

            <button on:click={submitChannel} disabled={addChannelLoading}>Add Channel</button>

            {#if addChannelError}
              <div style="color:#e93c2f;margin-top:0.6em;">{addChannelError}</div>
            {/if}

            {#if addChannelSuccess}
              <div style="color:#25841c;margin-top:0.6em;">{addChannelSuccess}</div>
            {/if}
          {/if}
        </section>
        <hr style="margin:2em 0;">
        <section>
          <h3>Bulk Upload CSV</h3>
          <input type="file" bind:this={csvInput} on:change={handleCsvFile} accept=".csv" />
          <button on:click={uploadCsv} disabled={bulkUploading || !csvFile}>Upload CSV</button>
          {#if bulkUploading}<span style="margin-left:1em;">Uploading…</span>{/if}
          {#if message}<div style="margin-top:0.7em;color:#2562e9;">{message}</div>{/if}
          {#if uploadFailures.length}
            <button on:click={downloadFailuresCsv} style="margin-top:1em;">Download Failures CSV</button>
            <div style="margin-top:1em;color:#c11;">
              Failed uploads: {uploadFailures.length}
              <ul>
                {#each uploadFailures as f}
                  <li>Row {f.rownum}: {f.error}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </section>
      {:else if currentTab === 'channels'}
        <AdminSearchBar bind:value={search} on:input={onSearchInput} />
        <AdminChannelTable
          {filteredChannels}
          {currentPage}
          {totalPages}
          {refreshing}
          {countryOptions}
          {levels}
          {settingCountry}
          {settingLevel}
          {deleting}
          on:setChannelLevel={setChannelLevel}
          on:setChannelCountry={setChannelCountry}
          on:deleteChannel={deleteChannel}
          on:goToPage={goToPage}
        />
      {/if}

      <hr style="margin:3em 0 2em 0;">
      <div>
        <button on:click={refresh} disabled={refreshing}>Manual Refresh</button>
      </div>
      {#if message}<div style="margin-top:1em;color:#e93c2f;">{message}</div>{/if}
    </div>
  </div>
{/if}

<style>
  .admin-main {
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    background: var(--bg, #f4f6fa);
    padding: 3.5em 1.5em 2em 1.5em;
    box-sizing: border-box;
  }
  .admin-panel {
    background: var(--card, #fff);
    border-radius: 18px;
    box-shadow: 0 6px 30px 0 #0001, 0 1.5px 7px #e3e8ee35;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 2.2em 2.5em 2em 2.5em;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 380px;
  }
  .tabs {
    display: flex;
    gap: 1.5em;
    margin-bottom: 2em;
    border-bottom: 2px solid #e3e8ee;
    background: #f7fafd;
    border-radius: 9px 9px 0 0;
    padding: 0.6em 0.3em 0 0.3em;
    width: 100%;
    justify-content: center;
  }
  .tabs button {
    background: none;
    border: none;
    outline: none;
    font-size: 1.16em;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #244fa2;
    padding: 0.55em 1.35em 0.4em 1.35em;
    border-radius: 9px 9px 0 0;
    cursor: pointer;
    transition: background 0.16s, color 0.13s;
    margin-bottom: -2px;
    border-bottom: 2px solid transparent;
  }
  .tabs button.tab-active {
    background: #fff;
    color: #e93c2f;
    border-bottom: 2px solid #e93c2f;
    box-shadow: 0 2px 6px #e3e8ee20;
    font-weight: 900;
  }
</style>
