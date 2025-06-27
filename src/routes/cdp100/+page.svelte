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
  let userId = null;

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

  onMount(() => {
    const u = get(user);
    userId = u?.id || null;
  });

  function addTag() {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) tags = [...tags, val];
    tagInput = '';
  }
  function removeTag(t) {
    tags = tags.filter(x => x !== t);
  }

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

  async function submit() {
    error = '';
    success = '';
    loading = true;

    if (!userId) {
      error = "You must be logged in as admin.";
      loading = false;
      return;
    }

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
          added_by: userId
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


=== DEBUG PANEL ALWAYS AT TOP ===
<div style="background:#ffeccc;padding:1em 2em;margin:2em auto 1.2em auto;max-width:700px;font-size:0.95em;border-radius:13px;border:1px solid #ddd;">
  <b>DEBUG PANEL</b><br>
  userStore: {JSON.stringify(userStore)}<br>
  userId: {userId}<br>
  adminFlag: {String(adminFlag)}<br>
  fetchErr: {fetchErr}<br>
  isReady: {String(isReady)}<br>
  <b>ALWAYS-ON DEBUG</b><br>
  <small>I should always be visible if Svelte is working.<br>
  If you see this, the file is loading and Svelte is mounting.</small>
</div>

<!-- === ACCESS CONTROL === -->
{#if !isReady}
  <div style="margin:4em auto;text-align:center;">Checking admin access…</div>
{:else if fetchErr}
  <div style="margin:4em auto;text-align:center;color:#e93c2f;">
    ⚠️ Error loading admin info: {fetchErr}
  </div>
{:else if !adminFlag}
  <div style="margin:4em auto;text-align:center;">
    Not authorized. <a href="/">Back to home</a>
  </div>
{:else}
  <!-- === FULL ADMIN PANEL BELOW === -->
  <div class="admin-main">
    <div class="admin-panel">
      <h2>Admin Tools</h2>
      <div class="tabs">
        <button class:tab-active={currentTab === 'upload'} on:click={() => currentTab = 'upload'}>Upload Tools</button>
        <button class:tab-active={currentTab === 'channels'} on:click={() => currentTab = 'channels'}>Channel Tools</button>
      </div>

      {#if currentTab === 'upload'}
        <section>
          <h3>Single Channel Add</h3>
          <input type="text" bind:value={singleChannelUrl} placeholder="Paste YouTube channel link here…" style="width:100%;max-width:480px;">
          <button on:click={fetchSingleChannel} disabled={singleChannelLoading}>Fetch Channel</button>
          {#if singleChannelError}
            <div style="color:#e93c2f;margin-top:0.7em;">{singleChannelError}</div>
          {/if}
          {#if fetchedChannel}
            <div style="margin:1em 0 0.4em 0;">
              <b>{fetchedChannel.title}</b><br>
              <img src={fetchedChannel.thumbnail} alt="Channel thumbnail" style="height:40px;margin-top:6px;">
            </div>
            <div style="margin:0.5em 0;">
              <label>Tags:</label>
              {#each tags as t}
                <span style="background:#eee;padding:0.25em 0.6em;border-radius:12px;margin-right:0.5em;">
                  {t}
                  <span style="color:#c11;cursor:pointer;margin-left:0.4em;" on:click={() => removeTag(t)}>×</span>
                </span>
              {/each}
              <input type="text" placeholder="Add tag" bind:value={tagInput} on:keydown={(e) => e.key==='Enter' && (addTag(),e.preventDefault())} style="margin-top:0.6em;">
              <button type="button" on:click={addTag} style="margin-left:0.4em;">Add Tag</button>
            </div>
            <div style="margin:0.7em 0;">
              <label>
                Level:
                <select bind:value={channelLevel}>
                  {#each levels as l}
                    <option value={l.value}>{l.label}</option>
                  {/each}
                </select>
              </label>
              <label style="margin-left:1.5em;">
                Country:
                <select bind:value={channelCountry}>
                  <option value="">Set Country</option>
                  {#each countryOptions as c}
                    <option value={c}>{c}</option>
                  {/each}
                </select>
              </label>
            </div>
            <button on:click={submitChannel} disabled={addChannelLoading}>Add Channel</button>
            {#if addChannelError}<div style="color:#e93c2f;margin-top:0.6em;">{addChannelError}</div>{/if}
            {#if addChannelSuccess}<div style="color:#25841c;margin-top:0.6em;">{addChannelSuccess}</div>{/if}
          {/if}
        </section>
 {#if adminFlag}
  <section>
    <AdminAddChannel />
  </section>
{/if}



        <hr style="margin:2em 0;">
        <section>
          <h3>Bulk Upload CSV</h3>
          <input type="file" bind:this={csvInput} on:change={handleCsvFile} accept=".csv" />
          <button on:click={uploadCsv} disabled={bulkUploading || !csvFile}>Upload CSV</button>
          {#if bulkUploading}<span style="margin-left:1em;">Uploading…</span>{/if}
          {#if message}<div style="margin-top:0.7em;color:#2562e9;">{message}</div>{/if}
          {#if uploadFailures.length}
            <button on:click={downloadFailuresCsv} style="margin-top:1em;">Download Failures CSV</button>
            <div style="margin-top:1em;color:#c11;">
              Failed uploads: {uploadFailures.length}
              <ul>
                {#each uploadFailures as f}
                  <li>Row {f.rownum}: {f.error}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </section>
      {:else if currentTab === 'channels'}
        <AdminSearchBar bind:value={search} on:input={onSearchInput} />
        <AdminChannelTable
          {filteredChannels}
          {currentPage}
          {totalPages}
          {refreshing}
          on:setChannelLevel={setChannelLevel}
          on:setChannelCountry={setChannelCountry}
          on:togglePlaylistsFor={togglePlaylistsFor}
          on:setPlaylistLevel={setPlaylistLevel}
          on:deleteChannel={deleteChannel}
          on:goToPage={goToPage}
        />
      {/if}

      <hr style="margin:3em 0 2em 0;">
      <div>
        <button on:click={importChannel} disabled={importing}>Import Channel (test)</button>
        <button on:click={clearDatabase} disabled={clearing} style="margin-left:1.5em;">Clear Database</button>
      </div>
      {#if message}<div style="margin-top:1em;color:#e93c2f;">{message}</div>{/if}
    </div>
  </div>
{/if}

<style>
  .admin-main {
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    background: var(--bg, #f4f6fa);
    padding: 3.5em 1.5em 2em 1.5em;
    box-sizing: border-box;
  }
  .admin-panel {
    background: var(--card, #fff);
    border-radius: 18px;
    box-shadow: 0 6px 30px 0 #0001, 0 1.5px 7px #e3e8ee35;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 2.2em 2.5em 2em 2.5em;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 380px;
  }
  .tabs {
    display: flex;
    gap: 1.5em;
    margin-bottom: 2em;
    border-bottom: 2px solid #e3e8ee;
    background: #f7fafd;
    border-radius: 9px 9px 0 0;
    padding: 0.6em 0.3em 0 0.3em;
    width: 100%;
    justify-content: center;
  }
  .tabs button {
    background: none;
    border: none;
    outline: none;
    font-size: 1.16em;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #244fa2;
    padding: 0.55em 1.35em 0.4em 1.35em;
    border-radius: 9px 9px 0 0;
    cursor: pointer;
    transition: background 0.16s, color 0.13s;
    margin-bottom: -2px;
    border-bottom: 2px solid transparent;
  }
  .tabs button.tab-active {
    background: #fff;
    color: #e93c2f;
    border-bottom: 2px solid #e93c2f;
    box-shadow: 0 2px 6px #e3e8ee20;
    font-weight: 900;
  }
</style>
