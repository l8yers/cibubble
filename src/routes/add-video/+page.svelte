<!-- src/routes/add-video/+page.svelte -->
<script>
  import { supabase } from '$lib/supabaseClient';

  let url = '';
  let importing = false;
  let result = null;
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

  // Main import logic: call API and display either playlist or channel/playlist list
  async function importVideos() {
    importing = true;
    importError = '';
    saveMessage = '';
    result = null;
    playlistSelections = [];
    playlistLevel = '';
    selectedPlaylist = null;

    try {
      const res = await fetch('/api/add-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        importError = "Invalid JSON response from server. Full response: " + text;
        importing = false;
        return;
      }
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
      result = json;
      if (result.type === 'channel') {
        playlistSelections = result.playlists.map(pl => ({
          ...pl, level: ''
        }));
      }
      if (result.type === 'playlist') {
        playlistLevel = '';
        selectedPlaylist = result.playlist;
      }
    } catch (e) {
      importError = e.message || "Unknown error.";
    }
    importing = false;
  }

  // Import each playlist from a channel with selected level
  async function importSelectedPlaylists() {
    saving = true;
    saveMessage = '';
    let imported = 0, failed = 0;
    for (const pl of playlistSelections.filter(p => p.level)) {
      // For real use: call your backend for each playlist, or build a batch API endpoint
      const res = await fetch('/api/add-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId: pl.id })
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        failed++;
        continue;
      }
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
        length: null,
        level: pl.level,
        created: new Date().toISOString()
      })));
      if (!error) imported++;
      else failed++;
    }
    if (imported) saveMessage = `Imported ${imported} playlist${imported>1?'s':''}.`;
    if (failed) saveMessage += ` Failed: ${failed}`;
    saving = false;
  }

  // Import all videos in a single playlist at a given level
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
      length: null,
      level: playlistLevel,
      created: new Date().toISOString()
    })));
    saveMessage = error ? error.message : "Playlist imported!";
    saving = false;
  }
</script>

<style>
.add-main {
  max-width: 880px;
  margin: 2.3rem auto 0 auto;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #ececec;
  box-shadow: 0 2px 16px #ececec;
  padding: 2.3rem 2vw 2.7rem 2vw;
}
.form-row {
  margin-bottom: 1.4em;
  display: flex;
  align-items: center;
  gap: 1.2em;
}
input[type="text"] {
  width: 400px;
  padding: 0.73em 1em;
  font-size: 1.09rem;
  border: 1px solid #ececec;
  border-radius: 9px;
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
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.3em;
  margin: 2em 0 1.5em 0;
}
.pl-card {
  background: #f7f7fa;
  border-radius: 12px;
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
.error {
  color: #b4001d;
  font-weight: bold;
  margin-bottom: 1em;
}
.success {
  color: #168200;
  font-weight: bold;
  margin-top: 1.2em;
}
</style>

<div class="add-main">
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

  {#if result?.type === 'playlist'}
    <div style="margin-top:1.5em;">
      <div class="import-row" style="display:flex;align-items:center;gap:1.2em;">
        <img class="pl-thumb"
          src={result.playlist.thumbnail}
          alt={result.playlist.title} />
        <div>
          <div class="pl-title">{result.playlist.title}</div>
          <div class="pl-meta">{result.playlist.videos.length} videos</div>
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
        {#if saveMessage}
          <div class={saveMessage.includes("imported") ? 'success' : 'error'}>{saveMessage}</div>
        {/if}
      </div>
    </div>
  {/if}

  {#if result?.type === 'channel'}
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
