<script>
  import { user } from '$lib/stores/user.js';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';

  let url = '';
  let tags = [];
  let tagInput = '';
  let level = '';
  let country = '';
  let loading = false;
  let error = '';
  let success = '';
  let fetchedChannel = null;

  const countryOptions = [
    'Argentina','Canary Islands','Chile','Colombia','Costa Rica','Cuba','Dominican Republic','Ecuador','El Salvador','Equatorial Guinea','France','Guatemala','Italy','Latin America','Mexico','Panama','Paraguay','Peru','Puerto Rico','Spain','United States','Uruguay','Venezuela'
  ];
  const levels = [
    { value: '', label: 'Set Level' },
    { value: 'easy', label: 'Easy' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'notyet', label: 'Not Yet Rated' }
  ];

  function addTag() {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) tags = [...tags, val];
    tagInput = '';
  }
  function removeTag(t) {
    tags = tags.filter(x => x !== t);
  }

  // --- Fetch channel details (optional, you can show a summary before adding) ---
  async function fetchChannelDetails() {
    loading = true;
    error = '';
    fetchedChannel = null;
    try {
      const res = await fetch('/api/fetch-youtube-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const json = await res.json();
      if (json.error) {
        error = json.error;
        return;
      }
      fetchedChannel = json.channel || null;
    } catch (e) {
      error = 'Fetch failed: ' + e.message;
    } finally {
      loading = false;
    }
  }

  // --- Submit to API ---
  async function submit() {
    error = '';
    success = '';
    loading = true;

    const adminUser = get(user);
    if (!adminUser) {
      error = "You must be logged in as admin.";
      loading = false;
      return;
    }

    // You can validate here as much as you like
    if (!url || !level || !country) {
      error = "Please fill in all required fields.";
      loading = false;
      return;
    }

    try {
      const res = await fetch('/api/add-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          tags,
          level,
          country,
          added_by: adminUser.id
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        error = data?.error || "Failed to add channel.";
        loading = false;
        return;
      }
      success = `✅ Channel "${data.channel?.name || 'Unknown'}" added (${data.videos_added} videos, ${data.playlists_count} playlists)`;
      url = '';
      tags = [];
      tagInput = '';
      level = '';
      country = '';
      fetchedChannel = null;
    } catch (e) {
      error = e.message || "API call failed";
    } finally {
      loading = false;
    }
  }
</script>

<div class="admin-add-channel">
  <label>Paste YouTube Channel Link:
    <input type="text" bind:value={url} placeholder="https://youtube.com/channel/..." style="width: 380px; max-width: 90%;">
  </label>

  <div class="tag-input-row">
    <label>Tags (comma or enter to add):</label>
    <input
      type="text"
      bind:value={tagInput}
      on:keydown={(e) => { if(e.key==='Enter' || e.key===','){ e.preventDefault(); addTag(); } }}
      placeholder="Add tag and press Enter"
      style="width: 200px;display:inline-block;">
    <button type="button" on:click={addTag} class="main-btn small" style="margin-left:0.5em;">Add</button>
    <div style="margin: 0.7em 0;">
      {#each tags as t}
        <span class="tag-badge">{t} <span class="remove-tag" on:click={() => removeTag(t)}>×</span></span>
      {/each}
    </div>
  </div>

  <label>Level:
    <select bind:value={level} style="width:220px;">
      {#each levels as l}
        <option value={l.value} disabled={l.value==''}>{l.label}</option>
      {/each}
    </select>
  </label>
  <label>Country:
    <select bind:value={country} style="width:220px;">
      <option value="" disabled selected>Select country</option>
      {#each countryOptions as c}
        <option value={c}>{c}</option>
      {/each}
    </select>
  </label>

  <div style="margin-top: 1.1em;">
    <button on:click={fetchChannelDetails} type="button" class="main-btn small" disabled={loading || !url}>Preview Channel Details</button>
    <button on:click={submit} type="button" class="main-btn" disabled={loading || !url || !level || !country}>Add Channel</button>
  </div>

  {#if loading}
    <div class="admin-message">Loading…</div>
  {/if}
  {#if error}
    <div class="admin-message error">{error}</div>
  {/if}
  {#if success}
    <div class="admin-message success">{success}</div>
  {/if}

  {#if fetchedChannel}
    <div class="channel-details" style="margin-top:1.2em;">
      <b>Channel:</b> {fetchedChannel.title} <br>
      <img src={fetchedChannel.thumbnail} alt="Channel" width="90" style="border-radius:50%;margin:0.5em 0;">
      <div style="margin-top:1em;">
        <b>Description:</b> {fetchedChannel.description}
      </div>
    </div>
  {/if}
</div>

<style>
  .admin-add-channel {
    margin: 2em 0 2em 0;
    background: #fff8;
    border-radius: 13px;
    box-shadow: 0 2px 18px #0011;
    padding: 1.5em 1.2em 1.2em 1.2em;
    min-width: 320px;
    max-width: 520px;
    width: 100%;
    margin-left: auto;
    margin-right: auto;
  }
  .main-btn {
    background: #e93c2f;
    color: #fff;
    font-weight: 700;
    border: none;
    border-radius: 7px;
    padding: 0.6em 1.3em;
    font-size: 1.08em;
    cursor: pointer;
    margin-top: 0.1em;
    transition: background 0.17s, box-shadow 0.15s;
    box-shadow: 0 1px 5px #e93c2f23;
  }
  .main-btn.small {
    font-size: 0.97em;
    padding: 0.35em 0.9em;
    border-radius: 6px;
  }
  .admin-message {
    margin: 1em 0 0 0;
    padding: 0.8em 1em;
    border-radius: 7px;
    background: #eff5ff;
    color: #244fa2;
    font-weight: 500;
    text-align: center;
  }
  .admin-message.error {
    background: #fff1f1;
    color: #e93c2f;
    border: 1px solid #e93c2f44;
  }
  .admin-message.success {
    background: #e0ffe0;
    color: #228c1d;
    border: 1px solid #228c1d44;
  }
  .tag-badge {
    background: #244fa2;
    color: #fff;
    border-radius: 13px;
    padding: 0.14em 0.9em 0.14em 0.7em;
    font-size: 1em;
    margin-right: 0.3em;
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
  }
  .remove-tag {
    cursor: pointer;
    color: #fff;
    margin-left: 0.5em;
    font-weight: bold;
  }
</style>
