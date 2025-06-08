<script>
  import { supabase } from '$lib/supabaseClient';

  let url = '';
  let importing = false;
  let result = null;
  let importError = '';
  let saveMessage = '';
  let saving = false;
  let clearing = false;

  let playlistSelections = [];
  let playlistVideos = [];
  let playlistLevel = '';
  let singleVideoLevel = '';
  let selectedPlaylist = null;

  const levels = [
    { value: '',            label: 'Not Yet Rated' },
    { value: 'superbeginner', label: 'Super Beginner' },
    { value: 'beginner',    label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced',    label: 'Advanced' }
  ];

  async function importVideos() {
    importing = true;
    importError = '';
    saveMessage = '';
    result = null;
    playlistSelections = [];
    playlistVideos = [];
    playlistLevel = '';
    selectedPlaylist = null;
    singleVideoLevel = '';

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
      result = json;
      if (result.type === 'channel') {
        playlistSelections = result.playlists.map(pl => ({
          ...pl,
          level: ''
        }));
      }
      if (result.type === 'playlist') {
        playlistLevel = '';
        playlistVideos = result.playlist.videos;
        selectedPlaylist = result.playlist;
      }
      if (result.type === 'video') {
        singleVideoLevel = '';
      }
    } catch (e) {
      importError = e.message || "Unknown error.";
    }
    importing = false;
  }

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
      const { error } = await supabase.from('videos').upsert(data.playlist.videos.map(v => ({
        id: v.id,
        title: v.title,
        channel_id: v.channel_id,
        channel_name: v.channel_name,
        length: null,
        level: pl.level,
        added_by: null,
        created: new Date().toISOString()
      })));
      if (!error) imported++;
      else failed++;
    }
    if (imported) saveMessage = `Imported ${imported} playlist${imported>1?'s':''}.`;
    if (failed) saveMessage += ` Failed: ${failed}`;
    saving = false;
  }

  async function importPlaylist() {
    if (!playlistLevel) { saveMessage = "Select a level first."; return; }
    saving = true; saveMessage = '';
    const { error } = await supabase.from('videos').upsert(playlistVideos.map(v => ({
      id: v.id,
      title: v.title,
      channel_id: v.channel_id,
      channel_name: v.channel_name,
      length: null,
      level: playlistLevel,
      added_by: null,
      created: new Date().toISOString()
    })));
    saveMessage = error ? error.message : "Playlist imported!";
    saving = false;
  }

  async function importSingleVideo() {
    if (!singleVideoLevel) { saveMessage = "Select a level first."; return; }
    saving = true; saveMessage = '';
    const v = result.video;
    const { error } = await supabase.from('videos').upsert([{
      id: v.id,
      title: v.title,
      channel_id: v.channel_id,
      channel_name: v.channel_name,
      length: null,
      level: singleVideoLevel,
      added_by: null,
      created: new Date().toISOString()
    }]);
    saveMessage = error ? error.message : "Video imported!";
    saving = false;
  }

  async function clearDatabase() {
    if (!confirm("Are you sure? This will permanently delete ALL videos!")) return;
    clearing = true;
    saveMessage = '';
    try {
      const { error } = await supabase.from('videos').delete().neq('id', '');
      if (error) {
        saveMessage = "Error deleting videos: " + error.message;
      } else {
        saveMessage = "All videos deleted!";
        result = null;
        url = '';
        playlistSelections = [];
        playlistVideos = [];
        selectedPlaylist = null;
      }
    } catch (e) {
      saveMessage = "Error: " + (e.message || e);
    }
    clearing = false;
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
.clear-btn {
  background:#fff;
  color:#e93c2f;
  border:2px solid #e93c2f;
  margin-bottom:1.3em;
  margin-right:1.2em;
}
.clear-btn[disabled] { color:#ddd; border-color: #ddd; }
.error, .success { margin: 1em 0 0.7em 0; min-height: 1.2em;}
.error { color: #e93c2f; }
.success { color: #16870f; }

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
input[type="checkbox"] {
  margin-right: 0.3em;
}
.playlist-videos-preview {
  margin: 1.3em 0;
  background: #fafbfc;
  border-radius: 10px;
  padding: 1.2em;
  border: 1px solid #eee;
  box-shadow: 0 2px 6px #eee;
}
.import-thumb {
  width: 70px;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 6px;
  background: #eee;
  margin-right: 0.8em;
  flex-shrink: 0;
}
.import-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.6em;
}
.import-title {
  font-size: 1.01rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 340px;
}
</style>

<div class="add-main">
  <button
    class="clear-btn"
    on:click={clearDatabase}
    disabled={clearing || importing || saving}
  >
    {clearing ? "Clearing..." : "Clear All Videos"}
  </button>

  <div class="form-row">
    <input
      type="text"
      placeholder="Paste YouTube video, playlist, or channel link"
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

  {#if result?.type === 'video'}
    <div style="margin-top:1.5em;">
      <div class="import-row">
        <img class="import-thumb"
          src={result.video.thumbnail}
          alt={result.video.title} />
        <div>
          <div class="import-title">{result.video.title}</div>
          <div class="pl-meta">{result.video.channel_name}</div>
        </div>
      </div>
      <div style="margin-top:0.7em;">
        <select bind:value={singleVideoLevel}>
          <option value="">Select Level</option>
          {#each levels as lvl}
            <option value={lvl.value}>{lvl.label}</option>
          {/each}
        </select>
        <button on:click={importSingleVideo} disabled={saving || !singleVideoLevel}>
          {saving ? "Saving..." : "Save Video"}
        </button>
      </div>
      {#if saveMessage}
        <div class={saveMessage.includes("imported") ? 'success' : 'error'}>{saveMessage}</div>
      {/if}
    </div>
  {/if}

  {#if result?.type === 'playlist'}
    <div style="margin-top:1.5em;">
      <div class="import-row">
        <img class="import-thumb"
          src={result.playlist.thumbnail}
          alt={result.playlist.title} />
        <div>
          <div class="import-title">{result.playlist.title}</div>
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
      </div>
      <div class="playlist-videos-preview">
        {#each result.playlist.videos.slice(0, 5) as v}
          <div class="import-row">
            <img class="import-thumb"
              src={v.thumbnail}
              alt={v.title} />
            <div class="import-title">{v.title}</div>
          </div>
        {/each}
        {#if result.playlist.videos.length > 5}
          <div style="color:#888; margin-top:0.5em;">+{result.playlist.videos.length - 5} more…</div>
        {/if}
      </div>
      {#if saveMessage}
        <div class={saveMessage.includes("imported") ? 'success' : 'error'}>{saveMessage}</div>
      {/if}
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
      <div class={saveMessage.includes("Imported") || saveMessage.includes("deleted") ? 'success' : 'error'}>{saveMessage}</div>
    {/if}
  {/if}
</div>
