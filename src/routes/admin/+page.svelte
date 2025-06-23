<script>
  import { supabase } from '$lib/supabaseClient.js';
  import { onMount, onDestroy } from 'svelte';
  import { getTagsForChannel } from '$lib/api/tags.js';
  import AdminCsvUploadBar from '$lib/components/admin/AdminCsvUploadBar.svelte';
  import AdminSearchBar from '$lib/components/admin/AdminSearchBar.svelte';
  import AdminChannelTable from '$lib/components/admin/AdminChannelTable.svelte';
  import { stripAccent, normalizeTags, parseCsv } from '$lib/utils/adminutils.js';

  // === SINGLE CHANNEL FETCH STATE ===
  let singleChannelUrl = '';
  let singleChannelLoading = false;
  let singleChannelError = '';
  let fetchedChannel = null;

  // New: Channel add form state
  let tagInput = '';
  let tags = [];
  let channelLevel = '';
  let channelCountry = '';
  let addChannelLoading = false;
  let addChannelError = '';
  let addChannelSuccess = '';

  // Fetch minimal channel details (name + thumbnail)
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

  // Tag input logic
  function addTag() {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) tags = [...tags, val];
    tagInput = '';
  }
  function removeTag(t) {
    tags = tags.filter(x => x !== t);
  }

  // Add channel to DB
  async function submitChannel() {
    addChannelError = '';
    addChannelSuccess = '';
    if (!fetchedChannel) return;
    if (!channelLevel) {
      addChannelError = "Select a difficulty level.";
      return;
    }
    if (!channelCountry) {
      addChannelError = "Select a country.";
      return;
    }
    addChannelLoading = true;
    try {
      // Replace with your actual endpoint for adding a channel
      const res = await fetch('/api/add-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: fetchedChannel.id || fetchedChannel.channelId,
          url: singleChannelUrl,
          title: fetchedChannel.title,
          thumbnail: fetchedChannel.thumbnail,
          tags,
          level: channelLevel,
          country: channelCountry,
        })
      });
      const json = await res.json();
      if (json.error) {
        addChannelError = json.error;
      } else {
        addChannelSuccess = `✅ Channel "${fetchedChannel.title}" added.`;
        // Reset states
        fetchedChannel = null;
        singleChannelUrl = '';
        tags = [];
        tagInput = '';
        channelLevel = '';
        channelCountry = '';
        await refresh();
      }
    } catch (e) {
      addChannelError = 'Add failed: ' + e.message;
    } finally {
      addChannelLoading = false;
    }
  }

  // Everything else unchanged (admin tools)
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
    // ...unchanged...
    // (omitted for brevity)
  }

  async function refresh() {
    // ...unchanged...
  }

  async function setChannelLevel(channelId, level) {
    // ...unchanged...
  }

  async function setChannelCountry(channelId, country) {
    // ...unchanged...
  }

  async function togglePlaylistsFor(channelId) {
    // ...unchanged...
  }

  async function setPlaylistLevel(playlistId, level) {
    // ...unchanged...
  }

  async function deleteChannel(id) {
    // ...unchanged...
  }

  async function importChannel() {
    // ...unchanged...
  }

  async function clearDatabase() {
    // ...unchanged...
  }

  function handleBeforeUnload(event) {
    if (bulkUploading) {
      event.preventDefault();
      event.returnValue = 'Uploads are still in progress!';
      return event.returnValue;
    }
  }

  onMount(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    refresh();
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  });
</script>

{#if false}
  <div style="margin: 4em auto; text-align: center;">Checking admin access…</div>
{:else}
  <div class="admin-main">
    <div class="admin-panel">
      <h2>Admin Tools</h2>
      <div class="tabs">
        <button
          class:tab-active={currentTab === 'upload'}
          on:click={() => currentTab = 'upload'}
        >Upload Tools</button>
        <button
          class:tab-active={currentTab === 'channels'}
          on:click={() => currentTab = 'channels'}
        >Channel Tools</button>
      </div>

      {#if currentTab === 'upload'}
        <div class="tab-panel">

          <!-- === Single Channel Fetch UI === -->
          <div class="single-channel-upload">
            <div class="single-channel-box">
              <label>Paste YouTube Channel Link:</label>
              <input
                type="text"
                bind:value={singleChannelUrl}
                class="main-input"
                placeholder="https://youtube.com/channel/..."
                style="width:380px;max-width:90%">
              <button
                class="main-btn"
                disabled={singleChannelLoading || !singleChannelUrl}
                on:click={fetchSingleChannel}
                style="margin-top:0.5em;">
                {singleChannelLoading ? 'Loading...' : 'Fetch Details'}
              </button>
              {#if singleChannelError}
                <div class="admin-message error">{singleChannelError}</div>
              {/if}

              {#if fetchedChannel}
                <div class="channel-details" style="margin-top:1.2em;">
                  <b>Channel:</b> {fetchedChannel.title} <br>
                  <img src={fetchedChannel.thumbnail} alt="Channel" width="90" style="border-radius:50%;margin:0.5em 0;">
                  
                  <!-- === New: Add tags, level, country === -->
                  <div style="margin-top:1em;">
                    <label>Tags (comma or enter to add):</label>
                    <div class="tag-input-wrap">
                      <input
                        type="text"
                        bind:value={tagInput}
                        on:keydown={(e) => { if(e.key==='Enter' || e.key===','){ e.preventDefault(); addTag(); } }}
                        placeholder="Add tag and press Enter"
                        class="main-input"
                        style="width: 220px;display:inline-block;"
                      >
                      <button type="button" on:click={addTag} class="main-btn small" style="margin-left:0.5em;padding:0.38em 1.1em;">Add</button>
                    </div>
                    <div class="tags-wrap" style="margin: 0.7em 0;">
                      {#each tags as t}
                        <span class="tag-badge">{t} <span class="remove-tag" on:click={() => removeTag(t)}>×</span></span>
                      {/each}
                    </div>

                    <label style="margin-top:0.6em;display:block;">Level:</label>
                    <select class="main-input" bind:value={channelLevel} style="width:220px;">
                      {#each levels as l}
                        <option value={l.value} disabled={l.value==''}>{l.label}</option>
                      {/each}
                    </select>
                    
                    <label style="margin-top:0.6em;display:block;">Country:</label>
                    <select class="main-input" bind:value={channelCountry} style="width:220px;">
                      <option value="" disabled selected>Select country</option>
                      {#each countryOptions as c}
                        <option value={c}>{c}</option>
                      {/each}
                    </select>

                    <button
                      class="main-btn"
                      style="margin-top:1.1em;"
                      disabled={addChannelLoading || !channelLevel || !channelCountry}
                      on:click={submitChannel}
                    >
                      {addChannelLoading ? "Adding..." : "Add Channel"}
                    </button>
                    {#if addChannelError}
                      <div class="admin-message error">{addChannelError}</div>
                    {/if}
                    {#if addChannelSuccess}
                      <div class="admin-message">{addChannelSuccess}</div>
                    {/if}
                  </div>
                  <!-- === End New === -->
                </div>
              {/if}
            </div>
          </div>
          <!-- === End Single Channel Fetch UI === -->

          <AdminCsvUploadBar
            {csvInput}
            {handleCsvFile}
            {uploadCsv}
            {csvFile}
            {bulkUploading}
          />
          {#if message}
            <div class="admin-message">{message}</div>
          {/if}
          {#if uploadFailures.length}
            <div class="admin-message error">
              <b>Upload failures:</b>
              <ul>
                {#each uploadFailures as f}
                  <li>
                    Row {f.rownum}: {f.error} — {JSON.stringify(f.row)}
                  </li>
                {/each}
              </ul>
              <button class="main-btn small" on:click={downloadFailuresCsv}>Download Failures as CSV</button>
            </div>
          {/if}
        </div>
      {:else if currentTab === 'channels'}
        <div class="tab-panel">
          <AdminSearchBar
            {search}
            {onSearchInput}
            {totalPages}
            {currentPage}
            {goToPage}
          />
          <AdminChannelTable
            {filteredChannels}
            countryOptions={countryOptions}
            levels={levels}
            {showPlaylistsFor}
            {playlists}
            {playlistsLoading}
            {message}
            {settingCountry}
            {settingLevel}
            {settingPlaylistLevel}
            {deleting}
            {setChannelCountry}
            {setChannelLevel}
            {togglePlaylistsFor}
            {setPlaylistLevel}
            {deleteChannel}
            {refresh}
          />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
/* ...existing styles unchanged... */
.tag-input-wrap { display:flex; align-items:center; gap:0.3em; }
.tags-wrap { display:flex; flex-wrap:wrap; gap:0.5em; }
.tag-badge {
  background: #244fa2;
  color: #fff;
  border-radius: 13px;
  padding: 0.14em 0.9em 0.14em 0.7em;
  font-size: 1em;
  margin-right: 0.3em;
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
}
.remove-tag {
  cursor: pointer;
  color: #fff;
  margin-left: 0.5em;
  font-weight: bold;
}
.main-btn.small {
  font-size: 0.97em;
  padding: 0.35em 0.9em;
  border-radius: 6px;
}


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
  .admin-section {
    width: 100%;
    overflow-x: auto;
    margin-top: 0.8em;
  }
  .admin-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    min-width: 1000px;
  }
  .admin-panel h2 {
    font-size: 2.2em;
    margin-bottom: 1.1em;
    text-align: center;
    letter-spacing: 0.05em;
    color: #244fa2;
    font-weight: 900;
    text-shadow: 0 1px 1.5px #0001;
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
  .tab-panel {
    padding: 1.1em 0.2em 0.5em 0.2em;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .admin-message {
    background: #eff5ff;
    color: #213b63;
    border-radius: 7px;
    padding: 0.85em 1.1em;
    margin: 1.1em 0 0 0;
    font-size: 1.06em;
    max-width: 600px;
    text-align: center;
    box-shadow: 0 1.5px 8px #244fa21a;
  }
  .admin-message.error {
    background: #fff1f1;
    color: #e93c2f;
    border: 1px solid #e93c2f44;
  }
  /* === Single Channel Upload Styles === */
  .single-channel-upload {
    margin-bottom: 1.4em;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .single-channel-box {
    margin: 1em auto 0 auto;
    background: #fff8;
    border-radius: 13px;
    box-shadow: 0 2px 18px #0011;
    padding: 1.5em 1.2em 1.2em 1.2em;
    min-width: 320px;
    max-width: 500px;
    width: 100%;
  }
  .single-channel-box label {
    font-weight: 700;
    margin-bottom: 0.3em;
    display: block;
  }
  .channel-details {
    text-align: center;
    font-size: 1.08em;
  }
  .main-input {
    display: block;
    margin: 0.5em auto;
    padding: 0.6em;
    border-radius: 6px;
    border: 1px solid #e3e8ee;
    width: 90%;
    font-size: 1.05em;
    background: #fff;
  }
  .main-btn {
    background: #e93c2f;
    color: #fff;
    font-weight: 700;
    border: none;
    border-radius: 7px;
    padding: 0.6em 1.3em;
    font-size: 1.08em;
    cursor: pointer;
    margin-top: 0.1em;
    transition: background 0.17s, box-shadow 0.15s;
    box-shadow: 0 1px 5px #e93c2f23;
  }
  .main-btn:disabled {
    background: #ddd;
    color: #aaa;
    cursor: not-allowed;
  }
  @media (max-width: 900px) {
    .admin-panel {
      padding: 1.4em 0.4em 1.4em 0.4em;
    }
    .tabs {
      font-size: 0.97em;
      gap: 0.7em;
    }
    .tab-panel {
      padding: 0.5em 0.1em 0.4em 0.1em;
    }
    .single-channel-box {
      min-width: unset;
      max-width: 99vw;
      padding: 1em 0.5em 1em 0.5em;
    }
  }
</style>
