<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  // Video import
  let url = '';
  let importing = false;
  let importResult = null;
  let importError = '';
  let saveMessage = '';
  let saving = false;
  let playlistSelections = [];
  let playlistLevel = '';
  let selectedPlaylist = null;

  const levels = [
    { value: '', label: 'Not Yet Rated' },
    { value: 'superbeginner', label: 'Super Beginner' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  async function importVideos() {
    importing = true;
    importError = '';
    saveMessage = '';
    importResult = null;
    playlistSelections = [];
    playlistLevel = '';
    selectedPlaylist = null;

    try {
      const res = await fetch('/api/add-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const json = await res.json();
      if (json.error) {
        importError = json.error;
        importing = false;
        return;
      }
      // Reject single videos
      if (json.type === 'video') {
        importError = "Single video uploads are disabled. Please add playlists or channels only.";
        importing = false;
        return;
      }
      importResult = json;
      if (importResult.type === 'channel') {
        playlistSelections = importResult.playlists.map(pl => ({
          ...pl, level: ''
        }));
      }
      if (importResult.type === 'playlist') {
        playlistLevel = '';
        selectedPlaylist = importResult.playlist;
      }
    } catch (e) {
      importError = e.message || "Unknown error.";
    }
    importing = false;
  }

  // Channel: Import each playlist with set level
  async function importSelectedPlaylists() {
    saving = true;
    saveMessage = '';
    let imported = 0, failed = 0;
    for (const pl of playlistSelections.filter(p => p.level)) {
      const res = await fetch('/api/add-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId: pl.id })
      });
      const data = await res.json();
      if (!data.playlist?.videos?.length) { failed++; continue; }
      // Upsert channel, playlist, then all videos
      await supabase.from('channels').upsert([{
        id: pl.channel_id,
        name: pl.channel_name,
        thumbnail: pl.channel_thumbnail || '',
        description: ''
      }]);
      await supabase.from('playlists').upsert([{
        id: pl.id,
        channel_id: pl.channel_id,
        title: pl.title,
        thumbnail: pl.thumbnail,
        description: ''
      }]);
      const { error } = await supabase.from('videos').upsert(data.playlist.videos.map(v => ({
        id: v.id,
        title: v.title,
        channel_id: pl.channel_id,
        playlist_id: pl.id,
        channel_name: pl.channel_name,
        thumbnail: v.thumbnail,
        length: v.length ?? null,
        level: pl.level,
        created: new Date().toISOString()
      })));
      if (!error) imported++;
      else failed++;
    }
    if (imported) saveMessage = `Imported ${imported} playlist${imported>1?'s':''}.`;
    if (failed) saveMessage += ` Failed: ${failed}`;
    saving = false;
    fetchVideos();
  }

  // Playlist: Save all videos at selected level
  async function importPlaylist() {
    if (!playlistLevel) { saveMessage = "Select a level first."; return; }
    saving = true; saveMessage = '';
    const pl = selectedPlaylist;
    await supabase.from('channels').upsert([{
      id: pl.channel_id,
      name: pl.channel_name,
      thumbnail: pl.channel_thumbnail || '',
      description: ''
    }]);
    await supabase.from('playlists').upsert([{
      id: pl.id,
      channel_id: pl.channel_id,
      title: pl.title,
      thumbnail: pl.thumbnail,
      description: ''
    }]);
    const { error } = await supabase.from('videos').upsert(pl.videos.map(v => ({
      id: v.id,
      title: v.title,
      channel_id: pl.channel_id,
      playlist_id: pl.id,
      channel_name: pl.channel_name,
      thumbnail: v.thumbnail,
      length: v.length ?? null,
      level: playlistLevel,
      created: new Date().toISOString()
    })));
    saveMessage = error ? error.message : "Playlist imported!";
    saving = false;
    fetchVideos();
  }

  // Admin tools
  let videos = [];
  let loading = false;
  let adminMsg = '';

  async function fetchVideos() {
    loading = true;
    adminMsg = '';
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created', { ascending: false })
      .limit(30);
    if (error) adminMsg = error.message;
    else videos = data || [];
    loading = false;
  }

  async function clearDatabase() {
    if (!confirm("Delete ALL videos, playlists, and channels? This can't be undone!")) return;
    adminMsg = "Clearing database…";
    let { error } = await supabase.from('videos').delete().neq('id', '');
    if (error) { adminMsg = "Failed to delete videos: " + error.message; return; }
    error = (await supabase.from('playlists').delete().neq('id', '')).error;
    if (error) { adminMsg = "Failed to delete playlists: " + error.message; return; }
    error = (await supabase.from('channels').delete().neq('id', '')).error;
    if (error) { adminMsg = "Failed to delete channels: " + error.message; return; }
    adminMsg = "Database cleared!";
    fetchVideos();
  }

  async function deleteVideo(id) {
    if (!confirm("Delete this video?")) return;
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) { adminMsg = "Failed to delete: " + error.message; }
    else {
      adminMsg = "Video deleted.";
      fetchVideos();
    }
  }

  function editVideo(id) {
    alert("Edit feature coming soon! (Or implement inline editing here.)");
  }

  onMount(fetchVideos);
</script>

<style>
/* Copy previous admin styles here, and styles from add-video page as needed */
.admin-main {
  max-width: 990px;
  margin: 2.5rem auto 0 auto;
  background: #fff;
  border-radius: 13px;
  border: 1px solid #eee;
  box-shadow: 0 2px 18px #f3f3f3;
  padding: 2.2rem 2vw 2.5rem 2vw;
}
h2 {
  font-size: 1.38rem;
  font-weight: 700;
  margin-bottom: 1.6em;
  color: #e93c2f;
}
button {
  padding: 0.6em 1.5em;
  font-size: 1.04rem;
  background: #e93c2f;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 1.2em;
  transition: background 0.16s;
}
button:hover { background: #b8271b; }
input[type="text"] {
  width: 420px;
  padding: 0.7em 1em;
  font-size: 1.08rem;
  border: 1px solid #ececec;
  border-radius: 9px;
  background: #fafafa;
  color: #181818;
  margin-right: 1em;
}
.form-row {
  margin-bottom: 1.1em;
  display: flex;
  align-items: center;
  gap: 1.1em;
}
.admin-msg, .error, .success {
  color: #2e9be6;
  margin: 0.6em 0 1.1em 0;
  min-height: 1.5em;
}
.error { color: #c00; background: #fee; border: 1px solid #fcc; padding: 0.5em 1em;}
.success { color: #26890d; background: #eefeea; border: 1px solid #b4e3be; padding: 0.5em 1em;}
table {
  border-collapse: collapse;
  width: 100%;
  font-size: 1.01em;
  background: #fafcff;
  margin-top: 1.1em;
}
th, td {
  border: 1px solid #f3f3f3;
  padding: 0.7em 0.9em;
  text-align: left;
}
th {
  background: #f4f7fa;
  color: #333;
}
tr:nth-child(even) td {
  background: #f8fafd;
}
.admin-actions button {
  font-size: 0.97em;
  background: #f9c846;
  color: #222;
  border-radius: 7px;
  margin: 0 0.5em 0 0;
  padding: 0.27em 0.85em;
  font-weight: 600;
}
.admin-actions button.delete-btn {
  background: #fff;
  color: #c22;
  border: 1.2px solid #f2c0c0;
}
.admin-actions button.delete-btn:hover {
  background: #ffecec;
  color: #fff;
  border: 1.2px solid #e93c2f;
}
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.2em;
  margin: 2em 0 1.5em 0;
}
.pl-card {
  background: #f7f7fa;
  border-radius: 10px;
  box-shadow: 0 1px 7px #eee;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.1em 1em 1.2em 1em;
  border: 1.3px solid #f1f1f1;
}
.pl-thumb {
  width: 120px;
  height: 67px;
  object-fit: cover;
  border-radius: 7px;
  margin-bottom: 0.7em;
  box-shadow: 0 2px 8px #ddd;
}
.pl-title {
  font-size: 1.07em;
  font-weight: 600;
  margin-bottom: 0.28em;
  text-align: center;
  line-height: 1.2;
  min-height: 2.2em;
  max-height: 2.4em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.pl-meta {
  font-size: 0.95em;
  color: #888;
  margin-bottom: 0.37em;
  text-align: center;
}
.pl-controls {
  margin-top: 0.6em;
  width: 100%;
}
select {
  font-size: 1.01em;
  padding: 0.24em 0.8em;
  border-radius: 6px;
  border: 1px solid #e3e3e3;
  background: #fff;
  width: 100%;
}
</style>

<div class="admin-main">
  <h2>Admin Tools</h2>
  <button on:click={clearDatabase}>Clear Database</button>
  <div class="admin-msg">{adminMsg}</div>
  
  <!-- Video Import Section -->
  <div style="margin-bottom:2em; margin-top:2em;">
    <div class="form-row">
      <input
        type="text"
        placeholder="Paste YouTube playlist or channel link (videos not accepted)"
        bind:value={url}
        on:keydown={(e) => e.key === 'Enter' && importVideos()}
        autocomplete="off"
        autofocus
      />
      <button on:click={importVideos} disabled={importing || !url}>Import</button>
    </div>
    {#if importError}
      <div class="error">{importError}</div>
    {/if}
    {#if importResult?.type === 'playlist'}
      <div style="margin-top:1.5em;">
        <div class="import-row">
          <img class="pl-thumb"
            src={importResult.playlist.thumbnail}
            alt={importResult.playlist.title} />
          <div>
            <div class="pl-title">{importResult.playlist.title}</div>
            <div class="pl-meta">{importResult.playlist.videos.length} videos</div>
          </div>
        </div>
        <div style="margin-top:0.7em;">
          <select bind:value={playlistLevel}>
            <option value="">Select Level</option>
            {#each levels as lvl}
              <option value={lvl.value}>{lvl.label}</option>
            {/each}
          </select>
          <button on:click={importPlaylist} disabled={saving || !playlistLevel}>
            {saving ? "Saving..." : "Save Playlist"}
          </button>
        </div>
        {#if saveMessage}
          <div class={saveMessage.includes("imported") ? 'success' : 'error'}>{saveMessage}</div>
        {/if}
      </div>
    {/if}

    {#if importResult?.type === 'channel'}
      <div style="margin:1.5em 0 1em 0;font-weight:600;">Assign a level to each playlist you want to import:</div>
      <div class="playlist-grid">
        {#each playlistSelections as pl, i}
          <div class="pl-card">
            <img class="pl-thumb" src={pl.thumbnail} alt={pl.title} />
            <div class="pl-title">{pl.title}</div>
            <div class="pl-meta">{pl.videoCount} videos</div>
            <div class="pl-controls">
              <select bind:value={pl.level}>
                <option value="">Set Level (skip to ignore)</option>
                {#each levels as lvl}
                  <option value={lvl.value}>{lvl.label}</option>
                {/each}
              </select>
            </div>
          </div>
        {/each}
      </div>
      <button style="margin-top:1.2em;"
        on:click={importSelectedPlaylists}
        disabled={saving || !playlistSelections.some(pl=>pl.level)}
      >
        {saving ? "Saving..." : "Import Playlists"}
      </button>
      {#if saveMessage}
        <div class={saveMessage.includes("Imported") ? 'success' : 'error'}>{saveMessage}</div>
      {/if}
    {/if}
  </div>
  
  <h3>Recent Videos</h3>
  {#if loading}
    <p>Loading…</p>
  {:else if videos.length === 0}
    <p>No videos in the database.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Channel</th>
          <th>Level</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each videos as v}
          <tr>
            <td>{v.title}</td>
            <td>{v.channel_name}</td>
            <td>{v.level || "Not Rated"}</td>
            <td style="font-size:0.97em;">{v.created?.slice(0, 10)}</td>
            <td class="admin-actions">
              <button on:click={() => editVideo(v.id)}>Edit</button>
              <button class="delete-btn" on:click={() => deleteVideo(v.id)}>Delete</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
