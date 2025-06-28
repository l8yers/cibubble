<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient.js';
  import { getTagsForChannel } from '$lib/api/tags.js';

  let loading = true;
  let error = '';
  let channels = [];
  let search = '';
  let filtered = [];

  async function fetchChannels() {
    loading = true;
    error = '';
    channels = [];
    try {
      let { data, error: fetchErr } = await supabase
        .from('channels')
        .select('*');
        // .order('created_at', { ascending: false }); // removed

      if (fetchErr) throw fetchErr;

      channels = await Promise.all(
        (data || []).map(async (chan) => ({
          ...chan,
          _tags: await getTagsForChannel(chan.id).catch(() => []),
        }))
      );
    } catch (err) {
      error = err.message || 'Failed to fetch channels';
      channels = [];
    } finally {
      loading = false;
      filter();
    }
  }

  function filter() {
    const s = search.trim().toLowerCase();
    filtered = !s
      ? channels
      : channels.filter(chan =>
          (chan.name || '').toLowerCase().includes(s) ||
          (chan.country || '').toLowerCase().includes(s) ||
          (chan._tags || []).some(t => (t.name || '').toLowerCase().includes(s))
        );
  }

  onMount(fetchChannels);
</script>

<div style="background:#fffaee;padding:1em 2em;margin:2em auto 1.2em auto;max-width:700px;font-size:0.97em;border-radius:13px;border:1px solid #ddd;">
  <b>CHANNELS FETCH DEBUG</b><br>
  loading: {String(loading)}<br>
  error: {error}<br>
  channels: {channels.length}<br>
  filtered: {filtered.length}<br>
  <small>This is a minimal admin test panel. If you see rows below, your Supabase fetch works.</small>
</div>

{#if loading}
  <div style="margin:2em 0;">Loading channels…</div>
{:else if error}
  <div style="color:#e93c2f;margin:2em 0;">❌ {error}</div>
{:else}
  <div>
    <input
      type="text"
      placeholder="Search channels…"
      bind:value={search}
      on:input={filter}
      style="margin:0 0 1em 0;padding:0.3em 1.1em;width:260px;border-radius:8px;border:1px solid #ccc;"
    />
    <table border="1" style="margin-top:1em;width:100%;max-width:900px;">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Country</th>
          <th>Level</th>
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as chan}
          <tr>
            <td>{chan.id}</td>
            <td>{chan.name}</td>
            <td>{chan.country}</td>
            <td>{chan.level || '--'}</td>
            <td>{chan._tags && chan._tags.length
              ? chan._tags.map(t => t.name).join(', ')
              : '--'}</td>
          </tr>
        {/each}
        {#if !filtered.length}
          <tr>
            <td colspan="5" style="color:#aaa;">No channels found.</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
{/if}
