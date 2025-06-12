<script>
  import { supabase } from '$lib/supabaseClient';

  // --- Master lists ---
  const countryOptions = [
    "Argentina","Canary Islands","Chile","Colombia","Costa Rica","Cuba",
    "Dominican Republic","Ecuador","El Salvador","Equatorial Guinea",
    "France","Guatemala","Italy","Latin America","Mexico","Panama",
    "Paraguay","Peru","Puerto Rico","Spain","United States","Uruguay","Venezuela"
  ];

  let tagOptions = [
    "For Learners","Kids Show","Dubbed Show","Videogames","News","History","Science",
    "Travel","Lifestyle","Personal Development","Cooking","Music","Comedy",
    "Native Show","Education","Sports","Current Events"
  ];

  const levels = [
    { value: '', label: 'Set Level' },
    { value: 'superbeginner', label: 'Super Beginner' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'notyet', label: 'Not Yet Rated' }
  ];

  // --- State ---
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
  let showTagsFor = null;   // NEW for tags collapsible
  let adminStats = {
    videos: 0,
    channels: 0,
    playlists: 0,
    runningTime: 0,
    byLevel: {
      superbeginner: 0,
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      notyet: 0
    },
    timeByLevel: {
      superbeginner: 0,
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      notyet: 0
    }
  };

  // --- Helpers ---
  function formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  }

  // --- Admin Actions ---
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
      playlists = await Promise.all(
        (data || []).map(async (pl) => {
          // Fetch levels of all videos in this playlist
          const { data: vids } = await supabase
            .from('videos')
            .select('level')
            .eq('playlist_id', pl.id);

          let currentLevel = '';
          if (vids && vids.length > 0) {
            const levelsArr = vids.map(v => v.level || '');
            const uniqueLevels = Array.from(new Set(levelsArr));
            if (uniqueLevels.length === 1) {
              currentLevel = uniqueLevels[0] || '';
            } else {
              currentLevel = 'mixed';
            }
          } else {
            currentLevel = '';
          }
          const { count: videos_count } = await supabase
            .from('videos')
            .select('id', { count: 'exact', head: true })
            .eq('playlist_id', pl.id);
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
    await supabase.from('videos').update({ level }).eq('playlist_id', playlistId);
    message = `✅ All videos for this playlist set to "${levels.find(l => l.value === level)?.label}"`;
    // Update only that playlist's currentLevel in the UI, clear its _newLevel
    playlists = playlists.map(pl =>
      pl.id === playlistId
        ? { ...pl, currentLevel: level, _newLevel: '' }
        : pl
    );
  }

  async function setChannelCountry(channelId, country) {
    await supabase.from('channels').update({ country }).eq('id', channelId);
    message = '✅ Country updated';
    await refresh();
  }

  // Tags collapsible logic
  function toggleTagsFor(channelId) {
    if (showTagsFor === channelId) {
      showTagsFor = null;
    } else {
      showTagsFor = channelId;
    }
  }

  async function setChannelTags(chan) {
    if (!chan._tagsSet) return;
    // Add new tags to tagOptions if needed (UI only, not master table here)
    for (const t of chan._tagsSet) {
      if (!tagOptions.includes(t)) tagOptions = [...tagOptions, t];
    }
    await supabase.from('channels').update({
      tags: Array.from(chan._tagsSet).join(', ')
    }).eq('id', chan.id);
    message = '✅ Tags updated';
    chan._tagsDirty = false;
    await refresh();
  }

  // --- REFRESH DATA & STATS ---
  async function refresh() {
    refreshing = true;
    // Channels for table
    let { data, error } = await supabase.from('channels').select('*');
    if (error) {
      message = error.message;
      refreshing = false;
      return;
    }
    channels = (data || []).map(chan => ({
      ...chan,
      _country: chan.country || "",
      _tagsSet: new Set((chan.tags || "").split(",").map(t => t.trim()).filter(Boolean)),
      _newTag: "",
      _tagsDirty: false,
      _newLevel: ""
    }));

    // --- Stats ---
    // Counts
    const { count: videosCount } = await supabase.from('videos').select('id', { count: 'exact', head: true });
    const { count: playlistsCount } = await supabase.from('playlists').select('id', { count: 'exact', head: true });
    const { count: channelsCount } = await supabase.from('channels').select('id', { count: 'exact', head: true });

    // Totals by level and time by level
    let byLevel = {
      superbeginner: 0,
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      notyet: 0
    };
    let timeByLevel = {
      superbeginner: 0,
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      notyet: 0
    };

    for (const lvl of Object.keys(byLevel)) {
      const eqLevel = lvl === 'notyet' ? '' : lvl;
      // Count
      const { count } = await supabase
        .from('videos')
        .select('id', { count: 'exact', head: true })
        .eq('level', eqLevel);
      byLevel[lvl] = count || 0;
      // Total time
      const { data: levelVids } = await supabase.from('videos').select('length').eq('level', eqLevel);
      if (levelVids) {
        timeByLevel[lvl] = levelVids.reduce((sum, v) => sum + (v.length || 0), 0);
      } else {
        timeByLevel[lvl] = 0;
      }
    }

    // Running time (all)
    const { data: vidsTime } = await supabase.from('videos').select('length');
    let runningTime = 0;
    if (vidsTime) {
      runningTime = vidsTime.reduce((sum, v) => sum + (v.length || 0), 0);
    }

    adminStats = {
      videos: videosCount || 0,
      playlists: playlistsCount || 0,
      channels: channelsCount || 0,
      runningTime,
      byLevel,
      timeByLevel
    };

    refreshing = false;
  }

  refresh();
</script>

<style>
.admin-main { max-width: 1100px; margin: 2.5rem auto 0 auto; background: #fff; border-radius: 13px; border: 1px solid #ececec; box-shadow: 0 2px 18px #ececec; padding: 2.7rem 2vw 2.5rem 2vw; font-family: Inter, Arial, sans-serif;}
.row { display: flex; gap: 1em; margin-bottom: 1.5em; align-items: center;}
input[type="text"], .tag-input { width: 370px; padding: 0.73em 1em; font-size: 1.09rem; border: 1px solid #ececec; border-radius: 7px; background: #fafafa; color: #181818;}
button { padding: 0.66em 1.6em; font-size: 1.04rem; background: #e93c2f; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 1em; transition: background 0.18s;}
button[disabled] { background: #e3e3e3; color: #aaa; cursor: default;}
button:hover:not([disabled]) { background: #b8271b;}
select, .tag-input { margin-top: 0.4em; }
.admin-table { width: 100%; margin: 2.2em 0 0 0; border-collapse: collapse; background: #fff; font-size: 1.04em;}
.admin-table th, .admin-table td { padding: 0.85em 0.8em; border-bottom: 1px solid #f2f2f2; text-align: left;}
.admin-table th { color: #e93c2f; font-weight: 700;}
.admin-table td { vertical-align: middle;}
.channel-thumb { width: 44px; height: 44px; object-fit: cover; border-radius: 8px; margin-right: 1.1em; border: 1.5px solid #eee;}
.chip { background:#f7f7fb;border-radius:6px;padding:2px 7px 2px 5px;display:inline-flex;align-items:center;cursor:pointer;margin-right:5px;font-size:0.98em;}
.chip input[type="checkbox"] { margin-right: 3px;}
/* Playlist & tag collapsible UI styles */
.playlist-table { width:100%; margin-top:1em; background:none; font-size:0.98em;}
.playlist-table th, .playlist-table td { padding: 0.55em 0.6em; border-bottom: 1px solid #f4f4fa; text-align:left;}
@media (max-width: 700px) {.admin-main { padding: 1.3em 0.3em;} .admin-table th, .admin-table td { font-size: 0.97em; padding: 0.6em;}}
</style>

<div class="admin-main">
  <h2 style="margin-bottom:1.6em;">CIBUBBLE Admin Tools</h2>

  <!-- --- Admin Totals Bar --- -->
  <div style="margin: 0 0 1.2em 0; padding: 0.8em 1.3em; background: #faf6f4; border-radius: 7px; display: flex; flex-wrap: wrap; gap: 2.2em; font-size:1.1em; color:#e93c2f;">
    <div><b>Videos:</b> {adminStats.videos}</div>
    <div><b>Channels:</b> {adminStats.channels}</div>
    <div><b>Playlists:</b> {adminStats.playlists}</div>
    <div><b>Total Time:</b> {formatTime(adminStats.runningTime)}</div>
    <div>
      <b>Super Beginner:</b> {adminStats.byLevel.superbeginner} &nbsp;|&nbsp;
      <b>Beginner:</b> {adminStats.byLevel.beginner} &nbsp;|&nbsp;
      <b>Intermediate:</b> {adminStats.byLevel.intermediate} &nbsp;|&nbsp;
      <b>Advanced:</b> {adminStats.byLevel.advanced} &nbsp;|&nbsp;
      <b>Not Yet:</b> {adminStats.byLevel.notyet}
    </div>
    <div style="width:100%;font-size:0.97em;color:#d14e17;margin-top:0.5em;">
      <b>Time by Level:</b>
      Super Beginner: {formatTime(adminStats.timeByLevel.superbeginner)} &nbsp;|&nbsp;
      Beginner: {formatTime(adminStats.timeByLevel.beginner)} &nbsp;|&nbsp;
      Intermediate: {formatTime(adminStats.timeByLevel.intermediate)} &nbsp;|&nbsp;
      Advanced: {formatTime(adminStats.timeByLevel.advanced)} &nbsp;|&nbsp;
      Not Yet: {formatTime(adminStats.timeByLevel.notyet)}
    </div>
  </div>

  <div class="row">
    <input type="text" placeholder="Paste YouTube channel link or @handle…" bind:value={url} />
    <button on:click={importChannel} disabled={!url || importing}>{importing ? 'Importing…' : 'Import Channel'}</button>
    <button on:click={refresh} disabled={refreshing}>↻ Refresh</button>
    <button style="margin-left:auto;" on:click={clearDatabase} disabled={clearing}>Clear Database</button>
  </div>
  {#if message}
    <div style="margin:1em 0 1.2em 0; color:{message.startsWith('✅') ? '#27ae60' : '#c0392b'}; font-weight:500;">{message}</div>
  {/if}

  <table class="admin-table">
    <thead>
      <tr>
        <th>Channel</th>
        <th>Country</th>
        <th>Tags</th>
        <th style="width:350px;">Level / Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each channels as chan}
        <tr>
          <td>
            <img class="channel-thumb" src={chan.thumbnail} alt={chan.name} />
            <span style="font-weight:600;">{chan.name}</span>
          </td>
          <!-- Country dropdown -->
          <td>
            <select bind:value={chan._country}>
              <option value="">No Country</option>
              {#each countryOptions as country}
                <option value={country}>{country}</option>
              {/each}
            </select>
            <button on:click={() => setChannelCountry(chan.id, chan._country)} disabled={chan.country === chan._country}>
              Save
            </button>
          </td>
          <!-- Tags summary only in main row -->
          <td>
            {#if chan.tags}
              <span>{chan.tags}</span>
            {:else}
              <span style="color:#aaa;">No tags</span>
            {/if}
          </td>
          <!-- Level / Actions -->
          <td>
            <select bind:value={chan._newLevel}>
              {#each levels as lvl}
                <option value={lvl.value}>{lvl.label}</option>
              {/each}
            </select>
            <button on:click={() => setChannelLevel(chan.id, chan._newLevel)} disabled={!chan._newLevel}>Set Level</button>
            <button style="background:#bbb;" on:click={() => deleteChannel(chan.id)} disabled={!!deleting[chan.id]}>Delete</button>
            <button
              style="background:#e3e3e3;color:#222;margin-left:1em"
              on:click={() => toggleTagsFor(chan.id)}
              aria-expanded={showTagsFor === chan.id}
            >
              {showTagsFor === chan.id ? "Hide Tags ▲" : "Set Tags ▼"}
            </button>
            <button
              style="background:#eee;color:#222;margin-left:1em"
              on:click={() => togglePlaylistsFor(chan.id)}
              aria-expanded={showPlaylistsFor === chan.id}
            >
              {showPlaylistsFor === chan.id ? "Hide Playlists ▲" : "Show Playlists ▼"}
            </button>
          </td>
        </tr>
        <!-- Collapsible TAGS row -->
        {#if showTagsFor === chan.id}
          <tr class="collapsible-row">
            <td colspan="4" style="background:#f6faff; padding:1.3em 2em;">
              <div style="display:flex;flex-wrap:wrap;gap:0.3em;">
                {#each tagOptions as tag}
                  <label class="chip">
                    <input
                      type="checkbox"
                      checked={chan._tagsSet.has(tag)}
                      on:change={() => {
                        if (chan._tagsSet.has(tag)) chan._tagsSet.delete(tag);
                        else chan._tagsSet.add(tag);
                        chan._tagsDirty = true;
                      }}
                    />
                    <span>{tag}</span>
                  </label>
                {/each}
                <input
                  type="text"
                  placeholder="Add tag"
                  style="margin-left:0.5em;width:90px;font-size:0.98em;"
                  bind:value={chan._newTag}
                  on:keydown={(e) => {
                    if (e.key === 'Enter' && chan._newTag?.trim()) {
                      chan._tagsSet.add(chan._newTag.trim());
                      if (!tagOptions.includes(chan._newTag.trim())) tagOptions = [...tagOptions, chan._newTag.trim()];
                      chan._newTag = "";
                      chan._tagsDirty = true;
                    }
                  }}
                />
                <button
                  style="margin-left:0.3em;font-size:0.93em;padding:0.4em 1.1em;"
                  on:click={() => setChannelTags(chan)}
                  disabled={!chan._tagsDirty}
                >Save</button>
              </div>
            </td>
          </tr>
        {/if}
        <!-- Collapsible PLAYLISTS row -->
        {#if showPlaylistsFor === chan.id}
          <tr class="collapsible-row">
            <td colspan="4" style="background:#f9f9fc; padding:1.3em 2em;">
              {#if playlistsLoading}
                <div>Loading playlists…</div>
              {:else if playlists.length === 0}
                <div>No playlists found for this channel.</div>
              {:else}
                <table class="playlist-table">
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
                            <option value="">
                              -- 
                              {pl.currentLevel === '' ? 'Not Set'
                                : pl.currentLevel === 'mixed' ? 'Mixed'
                                : levels.find(lvl => lvl.value === pl.currentLevel)?.label || pl.currentLevel
                              }
                              --
                            </option>
                            {#each levels as lvl}
                              <option value={lvl.value}>{lvl.label}</option>
                            {/each}
                          </select>
                          <button
                            style="margin-left:0.6em"
                            on:click={() => setPlaylistLevel(pl.id, pl._newLevel)}
                            disabled={!pl._newLevel}
                          >Set</button>
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
