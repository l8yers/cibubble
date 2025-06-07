<script>
  let youtubeUrl = '';
  let status = '';
  let addedCount = 0;

  async function addVideo() {
    if (!youtubeUrl.trim()) {
      status = 'Paste a valid YouTube link!';
      return;
    }
    status = 'Adding…';
    addedCount = 0;

    const res = await fetch('/api/add-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: youtubeUrl.trim() })
    });
    const data = await res.json();
    if (res.ok) {
      status = data.added === 1
        ? 'Video added!'
        : data.added > 1
          ? `Added ${data.added} videos!`
          : 'No new videos were added.';
      addedCount = data.added;
    } else {
      status = data?.error || 'Failed to add video(s).';
    }
  }
</script>

<style>
.add-video-container {
  max-width: 540px;
  margin: 2rem auto;
  background: #19191e;
  padding: 2.2rem 1.3rem 1.5rem 1.3rem;
  border-radius: 18px;
  box-shadow: 0 3px 18px #0005;
}
.form-title {
  color: #fff;
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 1.2rem;
  text-align: center;
  letter-spacing: 1px;
}
input[type="text"] {
  width: 100%;
  padding: 0.7em 1em;
  font-size: 1.1rem;
  border: 1px solid #444;
  border-radius: 8px;
  background: #212128;
  color: #eee;
  margin-bottom: 1.1em;
}
button {
  display: block;
  width: 100%;
  padding: 0.65em 0;
  font-size: 1.15rem;
  font-weight: 600;
  background: #2d8cff;
  color: #fff;
  border: none;
  border-radius: 8px;
  margin-top: 0.4em;
  cursor: pointer;
  transition: background 0.2s;
}
button:hover { background: #206de2; }
.status {
  margin-top: 1.4em;
  text-align: center;
  color: #aee28f;
  font-size: 1.09rem;
  min-height: 1.7em;
}
</style>

<div class="add-video-container">
  <div class="form-title">Add YouTube Video, Playlist, or Channel</div>
  <input
    type="text"
    bind:value={youtubeUrl}
    placeholder="Paste a YouTube video, playlist, or channel link"
    on:keydown={(e) => e.key === 'Enter' && addVideo()}
    autofocus
  />
  <button on:click={addVideo}>Add</button>
  <div class="status">{status}</div>
</div>
