<script>
  import { supabase } from '$lib/supabaseClient';
  import { user } from '$lib/stores/user.js';
  import { get } from 'svelte/store';
  import { onMount, onDestroy } from 'svelte';
  import { getTagsForChannel } from '$lib/api/tags.js';

  // ADMIN COMPONENTS
  import AdminImportBar from '$lib/components/admin/AdminImportBar.svelte';
  import AdminCsvUploadBar from '$lib/components/admin/AdminCsvUploadBar.svelte';
  import AdminSearchBar from '$lib/components/admin/AdminSearchBar.svelte';
  import AdminChannelTable from '$lib/components/admin/AdminChannelTable.svelte';

  // UTILS
  import { stripAccent, normalizeTags, parseCsv } from '$lib/utils/adminutils.js';

  // ----- CONSTANTS -----
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

  // ----- TABS -----
  let currentTab = "upload"; // or "channels"

  // ----- STATE -----
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

  // Pagination & search
  let search = '';
  let currentPage = 1;
  const channelsPerPage = 12;
  let totalPages = 1;
  let filteredChannels = [];

  // CSV BULK UPLOAD STATE
  let csvInput;
  let csvFile = null;
  let bulkUploading = false;
  let uploadFailures = [];

  // ----- REACTIVE FILTERING -----
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

  async function uploadCsv() {
    if (!csvFile) return;
    bulkUploading = true;
    uploadFailures = [];
    message = '';
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const csvRows = parseCsv(text);
      let added = 0;
      for (let row of csvRows) {
        const url = row.youtube || row.link || row['youtube link'] || row['YouTube Link'] || row['url'];
        const tags = normalizeTags(row.tags || '');
        const country = row.country || '';
        const level = row.level || '';
        if (!url) {
          uploadFailures.push({ row, error: "Missing YouTube link" });
          continue;
        }
        try {
          const u = get(user);
          const res = await fetch('/api/add-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url,
              tags,
              country,
              level,
              added_by: u?.id || null
            })
          });
          const json = await res.json();
          if (json.error) uploadFailures.push({ row, error: json.error });
          else added++;
        } catch (err) {
          uploadFailures.push({ row, error: err.message });
        }
      }
      message = `✅ Uploaded ${added}/${csvRows.length} rows.`;
      if (uploadFailures.length) message += ` ${uploadFailures.length} failed (see details below)`;
      await refresh();
      bulkUploading = false;
      csvFile = null;
      if (csvInput) csvInput.value = '';
    };
    reader.readAsText(csvFile);
  }

  // ---- Only attach these listeners in browser! ----
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

  async function importChannel() {
    message = '';
    importing = true;
    try {
      const u = get(user);
      const res = await fetch('/api/add-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, added_by: u?.id || null })
      });
      const json = await res.json();
      if (json.error) message = `❌ ${json.error}`;
      else message = `✅ Imported channel "${json.channel?.name}". ${json.playlists_count} playlists, ${json.videos_added} videos.`;
      await refresh();
    } catch (e) {
      message = '❌ Import failed.';
    }
    importing = false;
  }

  async function clearDatabase() {
    const confirmStr = typeof window !== 'undefined'
      ? prompt('Are you sure? Type DELETE to confirm clearing ALL data.')
      : null;
    if (confirmStr !== 'DELETE') return;
    clearing = true;
    message = '';
    await supabase.from('videos').delete().neq('id', '');
    await supabase.from('playlists').delete().neq('id', '');
    await supabase.from('channels').delete().neq('id', '');
    await refresh();
    message = '✅ Database cleared.';
    clearing = false;
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

  async function setChannelLevel(channelId, level) {
    if (!level) return;
    settingLevel = { ...settingLevel, [channelId]: true };
    await supabase.from('videos').update({ level }).eq('channel_id', channelId);
    message = `✅ All videos for this channel set to "${levels.find((l) => l.value === level)?.label}"`;
    await refresh();
    settingLevel = { ...settingLevel, [channelId]: false };
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
      playlists = await Promise.all(
        (data || []).map(async (pl) => {
          const { data: vids } = await supabase.from('videos').select('level').eq('playlist_id', pl.id);
          let currentLevel = '';
          if (vids && vids.length > 0) {
            const levelsArr = vids.map((v) => v.level || '');
            const uniqueLevels = Array.from(new Set(levelsArr));
            currentLevel = uniqueLevels.length === 1 ? (uniqueLevels[0] || '') : 'mixed';
          }
          const { count: videos_count } = await supabase.from('videos').select('id', { count: 'exact', head: true }).eq('playlist_id', pl.id);
          return { ...pl, videos_count, _newLevel: '', currentLevel };
        })
      );
    } else {
      playlists = [];
    }
    playlistsLoading = false;
  }

  async function setPlaylistLevel(playlistId, level) {
    if (!level) return;
    settingPlaylistLevel = { ...settingPlaylistLevel, [playlistId]: true };
    await supabase.from('videos').update({ level }).eq('playlist_id', playlistId);
    message = `✅ All videos for this playlist set to "${levels.find((l) => l.value === level)?.label}"`;
    playlists = playlists.map((pl) =>
      pl.id === playlistId ? { ...pl, currentLevel: level, _newLevel: '' } : pl
    );
    settingPlaylistLevel = { ...settingPlaylistLevel, [playlistId]: false };
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
          const { data: vids } = await supabase.from('videos').select('level').eq('channel_id', chan.id);
          let _mainLevel = '';
          if (vids && vids.length > 0) {
            const levelsArr = vids.map((v) => v.level || '');
            const uniqueLevels = Array.from(new Set(levelsArr));
            _mainLevel = uniqueLevels.length === 1 ? (uniqueLevels[0] || '') : 'mixed';
          }
          let _tags = [];
          try {
            _tags = await getTagsForChannel(chan.id);
          } catch (e) { _tags = []; }
          return {
            ...chan,
            _country: chan.country || '',
            _tags,
            _newLevel: '',
            _mainLevel
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
</script>

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
        <AdminImportBar
          {url}
          setUrl={v => url = v}
          {importing}
          {importChannel}
          {refreshing}
          {refresh}
          {clearing}
          {clearDatabase}
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
                <li>{f.error} — {JSON.stringify(f.row)}</li>
              {/each}
            </ul>
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
    max-width: 740px;
    width: 100%;
    margin: 0 auto;
    padding: 2.2em 2.5em 2em 2.5em;
    display: flex;
    flex-direction: column;
    align-items: center;
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
  }
</style>
