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
.add-video-wrapper {
  max-width: 500px;
  margin: 3rem auto 0 auto;
  padding: 2.3rem 2rem 2rem 2rem;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #ececec;
  box-shadow: 0 2px 12px #ececec;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.form-title {
  color: #181818;
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 1.2rem;
  letter-spacing: 0.5px;
  text-align: center;
}
input[type="text"] {
  width: 100%;
  padding: 0.9em 1em;
  font-size: 1.08rem;
  border: 1px solid #ececec;
  border-radius: 8px;
  background: #fafafa;
  color: #181818;
  margin-bottom: 1.1em;
  outline: none;
  box-sizing: border-box;
  transition: border 0.18s;
}
input[type="text"]:focus {
  border-color: #e93c2f;
  background: #fff;
}
button {
  width: 100%;
  padding: 0.7em 0;
  font-size: 1.13rem;
  font-weight: 600;
  background: #e93c2f;
  color: #fff;
  border: none;
  border-radius: 8px;
  margin-top: 0.2em;
  cursor: pointer;
  transition: background 0.2s;
}
button:hover { background: #b8271b; }
.status {
  margin-top: 1.4em;
  text-align: center;
  color: #26890d;
  font-size: 1.04rem;
  min-height: 1.5em;
}
@media (max-width: 650px) {
  .add-video-wrapper {
    padding: 1.2rem 0.6rem 1.1rem 0.6rem;
    max-width: 98vw;
  }
}
</style>

<div class="add-video-wrapper">
  <div class="form-title">Add a YouTube Video, Playlist, or Channel</div>
  <input
    type="text"
    bind:value={youtubeUrl}
    placeholder="Paste a YouTube video, playlist, or channel link"
    on:keydown={(e) => e.key === 'Enter' && addVideo()}
    autofocus
    autocomplete="off"
  />
  <button on:click={addVideo}>Add Video</button>
  <div class="status">{status}</div>
</div>
