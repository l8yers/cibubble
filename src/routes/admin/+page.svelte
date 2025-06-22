<script>
  import { get } from 'svelte/store';
  import { user } from '$lib/stores/user.js'; // Not required, but used for added_by if you want
  import { stripAccent, normalizeTags, parseCsv } from '$lib/utils/adminutils.js';

  import AdminImportBar from '$lib/components/admin/AdminImportBar.svelte';
  import AdminCsvUploadBar from '$lib/components/admin/AdminCsvUploadBar.svelte';
  import AdminSearchBar from '$lib/components/admin/AdminSearchBar.svelte';
  import AdminChannelTable from '$lib/components/admin/AdminChannelTable.svelte';

  // --- Panel State ---
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

  let currentTab = "upload"; // or "channels"
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

  // FILTERED CHANNELS LOGIC (keep for channels tab, if you want)
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

  // --- ROBUST CSV BULK UPLOAD LOGIC ---
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
          const u = get(user);
          const res = await fetch('/api/add-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: row.url,
              tags: row.tags,
              country: row.country,
              level: row.level,
              added_by: u?.id || null // or just null if not logged in!
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
      bulkUploading = false;
      csvFile = null;
      if (csvInput) csvInput.value = '';
    };
    reader.readAsText(csvFile);
  }
</script>

<!-- Just the upload tools, clean, with error reporting -->
<div class="admin-main">
  <div class="admin-panel">
    <h2>Admin Tools (No Checks)</h2>
    <div class="tabs">
      <button class:tab-active={currentTab === 'upload'} on:click={() => currentTab = 'upload'}>Upload Tools</button>
      <button class:tab-active={currentTab === 'channels'} on:click={() => currentTab = 'channels'}>Channel Tools</button>
    </div>
    {#if currentTab === 'upload'}
      <div class="tab-panel">
        <AdminImportBar
          {url}
          setUrl={v => url = v}
          {importing}
          importChannel={() => {}}
          {refreshing}
          refresh={() => {}}
          {clearing}
          clearDatabase={() => {}}
          {csvInput}
          {handleCsvFile}
          {uploadCsv}
          {csvFile}
          {bulkUploading}
        />
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
                <li>Row {f.rownum}: {f.error} — {JSON.stringify(f.row)}</li>
              {/each}
            </ul>
            <button class="main-btn small" on:click={downloadFailuresCsv}>Download Failures as CSV</button>
          </div>
        {/if}
      </div>
    {/if}
    {#if currentTab === 'channels'}
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
          setChannelCountry={() => {}}
          setChannelLevel={() => {}}
          togglePlaylistsFor={() => {}}
          setPlaylistLevel={() => {}}
          deleteChannel={() => {}}
          refresh={() => {}}
        />
      </div>
    {/if}
  </div>
</div>

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
</style>
