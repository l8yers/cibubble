<script>
  import { supabase } from '$lib/supabaseClient';

  let url = '';
  let message = '';
  let importing = false;
  let clearing = false;
  let deleting = {};
  let channels = [];
  let refreshing = false;
  let showPlaylistsFor = null;
  let playlists = [];
  let playlistsLoading = false;

  let runningTimeByLevel = {
    superbeginner: 0,
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    notyet: 0
  };

  const levels = [
    { value: '', label: 'Set Level' },
    { value: 'superbeginner', label: 'Super Beginner' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'notyet', label: 'Not Yet Rated' }
  ];

  async function importChannel() {
    message = '';
    importing = true;
    try {
      const res = await fetch('/api/add-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
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

  async function refresh() {
    refreshing = true;
    let { data, error } = await supabase.from('channels').select('*');
    if (error) message = error.message;
    else channels = await Promise.all(
      (data || []).map(async (chan) => {
        const { count: playlists_count } = await supabase
          .from('playlists')
          .select('id', { count: 'exact', head: true })
          .eq('channel_id', chan.id);

        const { data: videoLens, count: videos_count } = await supabase
          .from('videos')
          .select('length', { count: 'exact' })
          .eq('channel_id', chan.id);

        // Calculate average length for this channel (in seconds)
        const lens = (videoLens || []).map(v => v.length || 0);
        const totalLength = lens.reduce((a, l) => a + l, 0);
        const avg_length = lens.length ? totalLength / lens.length : 0;

        return { ...chan, playlists_count, videos_count, avg_length };
      })
    );

    // Now also get running time per level
    const { data: allVideos } = await supabase
      .from('videos')
      .select('level, length');

    runningTimeByLevel = {
      superbeginner: 0,
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      notyet: 0
    };
    (allVideos || []).forEach(v => {
      if (!v || typeof v.length !== 'number') return;
      const lvl = v.level || 'notyet';
      if (runningTimeByLevel[lvl] !== undefined) {
        runningTimeByLevel[lvl] += v.length;
      } else {
        runningTimeByLevel.notyet += v.length;
      }
    });

    refreshing = false;
  }

  async function clearDatabase() {
    if (!confirm('Are you sure? This will delete ALL videos, playlists, and channels!')) return;
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
    if (!confirm('Delete this channel and ALL its videos/playlists?')) return;
    deleting[id] = true;
    await supabase.from('videos').delete().eq('channel_id', id);
    await supabase.from('playlists').delete().eq('channel_id', id);
    await supabase.from('channels').delete().eq('id', id);
    await refresh();
    deleting[id] = false;
  }

  async function setChannelLevel(channelId, level) {
    if (!level) return;
    await supabase.from('videos').update({ level }).eq('channel_id', channelId);
    message = `✅ All videos for this channel set to "${levels.find(l => l.value === level)?.label}"`;
    await refresh();
  }

  // Playlists per channel
  async function togglePlaylistsFor(channelId) {
    if (showPlaylistsFor === channelId) {
      showPlaylistsFor = null;
      playlists = [];
      return;
    }
    showPlaylistsFor = channelId;
    playlistsLoading = true;
    let { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('channel_id', channelId);
    if (!error) {
      // Add video count and _newLevel for each playlist
      playlists = await Promise.all(
        (data || []).map(async (pl) => {
          const { count: videos_count } = await supabase
            .from('videos')
            .select('id', { count: 'exact', head: true })
            .eq('playlist_id', pl.id);
          return { ...pl, videos_count, _newLevel: '' };
        })
      );
    } else {
      playlists = [];
    }
    playlistsLoading = false;
  }

  async function setPlaylistLevel(playlistId, level) {
    if (!level) return;
    await supabase.from('videos').update({ level }).eq('playlist_id', playlistId);
    message = `✅ All videos for this playlist set to "${levels.find(l => l.value === level)?.label}"`;
    // Refresh just the playlist row
    if (showPlaylistsFor) togglePlaylistsFor(showPlaylistsFor);
  }

  refresh();
</script>

<style>
.admin-main {
  max-width: 1000px;
  margin: 3.5rem auto 0 auto;
  background: #fff;
  border-radius: 11px;
  border: 1px solid #ececec;
  box-shadow: 0 2px 18px #ececec;
  padding: 2.4rem 2vw 2.7rem 2vw;
  font-family: Inter, Arial, sans-serif;
}
.row { display: flex; gap: 1em; margin-bottom: 1.4em; align-items: center; }
input[type="text"] {
  width: 370px;
  padding: 0.73em 1em;
  font-size: 1.09rem;
  border: 1px solid #ececec;
  border-radius: 7px;
  background: #fafafa;
  color: #181818;
}
button {
  padding: 0.66em 1.6em;
  font-size: 1.04rem;
  background: #e93c2f;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-right: 1em;
  transition: background 0.18s;
}
button[disabled] { background: #e3e3e3; color: #aaa; cursor: default; }
button:hover:not([disabled]) { background: #b8271b; }
.admin-table {
  width: 100%;
  margin: 2.2em 0 0 0;
  border-collapse: collapse;
  background: #fff;
  font-size: 1.04em;
}
.admin-table th, .admin-table td {
  padding: 0.85em 0.8em;
  border-bottom: 1px solid #f2f2f2;
  text-align: left;
}
.admin-table th { color: #e93c2f; font-weight: 700;}
.admin-table td {
  vertical-align: middle;
}
.channel-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 1.1em;
  border: 1.5px solid #eee;
}
.playlist-row {
  background: #fafbfc;
}
@media (max-width: 700px) {
  .admin-main { padding: 1.3em 0.3em;}
  .admin-table th, .admin-table td { font-size: 0.97em; padding: 0.6em;}
}
</style>

<div class="admin-main">
  <h2 style="margin-bottom:1.7em;">CIBUBBLE Admin Tools</h2>

  <div class="row">
    <input type="text" placeholder="Paste YouTube channel link or @handle…" bind:value={url} />
    <button on:click={importChannel} disabled={!url || importing}>{importing ? 'Importing…' : 'Import Channel'}</button>
    <button on:click={refresh} disabled={refreshing}>↻ Refresh</button>
    <button style="margin-left:auto;" on:click={clearDatabase} disabled={clearing}>Clear Database</button>
  </div>
  {#if message}
    <div style="margin:1em 0 1.2em 0; color:{message.startsWith('✅') ? '#27ae60' : '#c0392b'}; font-weight:500;">{message}</div>
  {/if}

  {#if channels.length > 0}
    <div style="display:flex; gap:2.5em; margin: 0 0 1.2em 0; font-size:1.08em; font-weight:600; color:#1a3e6e;">
      <div>Channels: {channels.length}</div>
      <div>
        Playlists: {channels.reduce((a, c) => a + (c.playlists_count || 0), 0)}
      </div>
      <div>
        Videos: {channels.reduce((a, c) => a + (c.videos_count || 0), 0)}
      </div>
      <div>
        Total Running Time: {
          Math.round(
            channels.reduce(
              (sum, c) => sum + (c.videos_count || 0) * (c.avg_length || 0),
              0
            ) / 360
          ) / 10
        } hours
      </div>
    </div>
    <div style="margin:1.4em 0 0.7em 0; font-size:1.04em; color:#226;">
      <div>Super Beginner: {Math.round(runningTimeByLevel.superbeginner/360)/10} hours</div>
      <div>Beginner: {Math.round(runningTimeByLevel.beginner/360)/10} hours</div>
      <div>Intermediate: {Math.round(runningTimeByLevel.intermediate/360)/10} hours</div>
      <div>Advanced: {Math.round(runningTimeByLevel.advanced/360)/10} hours</div>
      <div>Not Yet Rated: {Math.round(runningTimeByLevel.notyet/360)/10} hours</div>
    </div>
  {/if}

  <table class="admin-table">
    <thead>
      <tr>
        <th>Channel</th>
        <th>Playlists</th>
        <th>Videos</th>
        <th style="width:260px;"></th>
      </tr>
    </thead>
    <tbody>
      {#each channels as chan}
        <tr>
          <td>
            <img class="channel-thumb" src={chan.thumbnail} alt={chan.name} />
            <span style="font-weight:600;">{chan.name}</span>
          </td>
          <td>
            <a style="color:#2e9be6;cursor:pointer;font-weight:600;text-decoration:underline;"
              on:click={() => togglePlaylistsFor(chan.id)}>
              {chan.playlists_count}
              {showPlaylistsFor === chan.id ? '▲' : '▼'}
            </a>
          </td>
          <td>{chan.videos_count}</td>
          <td>
            <select bind:value={chan._newLevel}>
              {#each levels as lvl}
                <option value={lvl.value}>{lvl.label}</option>
              {/each}
            </select>
            <button on:click={() => setChannelLevel(chan.id, chan._newLevel)} disabled={!chan._newLevel}>Set Level</button>
            <button style="background:#bbb;" on:click={() => deleteChannel(chan.id)} disabled={!!deleting[chan.id]}>Delete</button>
          </td>
        </tr>
        {#if showPlaylistsFor === chan.id}
          <tr class="playlist-row">
            <td colspan="4" style="padding-left:3em;">
              {#if playlistsLoading}
                Loading playlists…
              {:else if playlists.length === 0}
                No playlists.
              {:else}
                <table style="width:90%;margin:0.8em 0;font-size:0.99em;">
                  <thead>
                    <tr>
                      <th>Playlist</th>
                      <th>Videos</th>
                      <th>Set Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each playlists as pl}
                      <tr>
                        <td>{pl.title}</td>
                        <td>{pl.videos_count}</td>
                        <td>
                          <select bind:value={pl._newLevel}>
                            {#each levels as lvl}
                              <option value={lvl.value}>{lvl.label}</option>
                            {/each}
                          </select>
                          <button on:click={() => setPlaylistLevel(pl.id, pl._newLevel)} disabled={!pl._newLevel}>Set Level</button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              {/if}
            </td>
          </tr>
        {/if}
      {/each}
      {#if channels.length === 0}
        <tr>
          <td colspan="4" style="text-align:center;color:#999;">No channels found.</td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>
