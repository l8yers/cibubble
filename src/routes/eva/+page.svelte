<script>
  import AdminGuard from '$lib/components/admin/AdminGuard.svelte';
  import AdminAddChannel from '$lib/components/admin/AdminAddChannel.svelte';
  import AdminBulkUpload from '$lib/components/admin/AdminBulkUpload.svelte';
  import { supabase } from '$lib/supabaseClient';
  import { COUNTRY_OPTIONS, TAG_OPTIONS } from '$lib/constants';
  import { stripAccent } from '$lib/utils/adminutils.js';
  import { getTagsForChannel } from '$lib/api/tags.js';

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
      if (openPlaylistsChannelId) openPlaylistsForChannel(openPlaylistsChannelId);
    } else {
      playlistMessage = `❌ Error updating videos: ${error.message}`;
    }
    playlistLevelSaving = { ...playlistLevelSaving, [playlistId]: false };
  }

  import { onMount } from 'svelte';
  onMount(refresh);
</script>

<AdminGuard>
  <div class="container">

    <!-- Bulk Upload CSV (component) -->
    <AdminBulkUpload
      on:refresh={refresh}
    />

    <!-- Add Channel (component) -->
    <AdminAddChannel
      COUNTRY_OPTIONS={COUNTRY_OPTIONS}
      TAG_OPTIONS={TAG_OPTIONS}
      on:added={refresh}
    />

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
</AdminGuard>

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
</style>
