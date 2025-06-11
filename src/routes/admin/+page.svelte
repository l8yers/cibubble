<script>
  import { supabase } from '$lib/supabaseClient';

  // -- Country & Tag master lists --
  const countryOptions = [
    "Argentina","Canary Islands","Chile","Colombia","Costa Rica","Cuba",
    "Dominican Republic","Ecuador","El Salvador","Equatorial Guinea",
    "France","Guatemala","Italy","Latin America","Mexico","Panama",
    "Paraguay","Peru","Puerto Rico","Spain","United States","Uruguay","Venezuela"
  ];

  // This should match the SortBar, update as you add tags.
  let tagOptions = [
    "For Learners","Kids Show","Dubbed Show","Videogames","News","History","Science",
    "Travel","Lifestyle","Personal Development","Cooking","Music","Comedy",
    "Native Show","Education","Sports","Current Events"
  ];

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
    superbeginner: 0, beginner: 0, intermediate: 0, advanced: 0, notyet: 0
  };
  const levels = [
    { value: '', label: 'Set Level' },
    { value: 'superbeginner', label: 'Super Beginner' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'notyet', label: 'Not Yet Rated' }
  ];

  // -- ADMIN ACTIONS --

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
    if (showPlaylistsFor) togglePlaylistsFor(showPlaylistsFor);
  }

  // Update country for a channel
  async function setChannelCountry(channelId, country) {
    await supabase.from('channels').update({ country }).eq('id', channelId);
    message = '✅ Country updated';
    await refresh();
  }

  // Update tags for a channel (stored as comma-separated list)
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

  // --- REFRESH DATA ---
  async function refresh() {
    refreshing = true;
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
    // (Optionally update running time stats, left out for brevity)
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
@media (max-width: 700px) {.admin-main { padding: 1.3em 0.3em;} .admin-table th, .admin-table td { font-size: 0.97em; padding: 0.6em;}}
</style>

<div class="admin-main">
  <h2 style="margin-bottom:1.6em;">CIBUBBLE Admin Tools</h2>
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
        <th style="width:280px;">Level / Actions</th>
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
          <!-- Tags multi-select + add -->
          <td>
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
      {/each}
      {#if channels.length === 0}
        <tr>
          <td colspan="4" style="text-align:center;color:#999;">No channels found.</td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>
