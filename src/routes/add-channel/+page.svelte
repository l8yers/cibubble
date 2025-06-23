<script>
  import { user } from '$lib/stores/user.js'; // Or wherever you store your user
  let url = '';
  let level = '';
  let tagsString = '';
  let country = '';
  let message = '';
  let loading = false;

  async function addUserChannel() {
    message = '';
    if (!url || !level) {
      message = 'URL and Level are required';
      return;
    }
    loading = true;
    let tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);
    try {
      const res = await fetch('/api/add-user-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, level, tags, country })
      });
      const json = await res.json();
      if (json.error) {
        message = '❌ ' + json.error;
      } else {
        message = '✅ Channel submitted for approval!';
        url = level = tagsString = country = '';
      }
    } catch (e) {
      message = '❌ Network error: ' + e.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="user-add-channel-form">
  <h2>Add a YouTube Channel</h2>
  <input type="text" bind:value={url} placeholder="YouTube Channel URL" required />
  <select bind:value={level} required>
    <option value="">Select Level</option>
    <option value="easy">Easy</option>
    <option value="intermediate">Intermediate</option>
    <option value="advanced">Advanced</option>
  </select>
  <input type="text" bind:value={tagsString} placeholder="Tags (comma separated, optional)" />
  <input type="text" bind:value={country} placeholder="Country (optional)" />
  <button on:click={addUserChannel} disabled={loading}>
    {loading ? 'Submitting...' : 'Add Channel'}
  </button>
  {#if message}
    <div>{message}</div>
  {/if}
</div>

<style>
.user-add-channel-form {
  max-width: 440px; margin: 2em auto; padding: 2em; border-radius: 12px;
  box-shadow: 0 3px 16px #0002;
  background: #fff;
  display: flex; flex-direction: column; gap: 1em;
}
.user-add-channel-form input,
.user-add-channel-form select { font-size: 1.1em; padding: 0.7em; border-radius: 6px; border: 1px solid #ddd; }
.user-add-channel-form button { padding: 0.7em 1.7em; border-radius: 8px; background: #e93c2f; color: #fff; font-weight: bold; border: none; cursor: pointer; }
</style>
