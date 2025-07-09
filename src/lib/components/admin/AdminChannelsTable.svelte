<script>
  import { supabase } from '$lib/supabaseClient';
  import { COUNTRY_OPTIONS } from '$lib/constants';
  import { stripAccent } from '$lib/utils/adminutils.js';
  import { getTagsForChannel } from '$lib/api/tags.js';
  import { onMount, createEventDispatcher } from 'svelte';

  export let allChannels = [];
  export let refreshing = false;
  export let message = '';
  export let refresh = () => {};

  // Internal State
  let settingCountry = {};
  let settingLevel = {};
  let deleting = {};
  let search = '';
  let currentPage = 1;
  const channelsPerPage = 12;
  let totalPages = 1;
  let filteredChannels = [];

  // Playlists
  let openPlaylistsChannelId = null;
  let playlists = [];
  let playlistsLoading = false;
  let playlistLevelSaving = {};
  let playlistMessage = '';

  // Filter, paging, and derived state
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
    playlistMessage = `✅ All videos for this channel set to "${newLevel}"`;
    await refresh();
    settingLevel = { ...settingLevel, [channelId]: false };
  }

  async function setChannelCountry(channelId, country) {
    settingCountry = { ...settingCountry, [channelId]: true };
    await supabase.from('channels').update({ country }).eq('id', channelId);
    await supabase.from('videos').update({ country }).eq('channel_id', channelId);
    playlistMessage = '✅ Country updated';
    await refresh();
    settingCountry = { ...settingCountry, [channelId]: false };
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
</script>

<div>
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
