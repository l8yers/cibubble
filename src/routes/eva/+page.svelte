<script>
  import AdminGuard from '$lib/components/admin/AdminGuard.svelte';
  import AdminAddChannel from '$lib/components/admin/AdminAddChannel.svelte';
  import AdminBulkUpload from '$lib/components/admin/AdminBulkUpload.svelte';
  import AdminChannelsTable from '$lib/components/admin/AdminChannelsTable.svelte';
  import { COUNTRY_OPTIONS, TAG_OPTIONS } from '$lib/constants';
  import { onMount } from 'svelte';
  import { getTagsForChannel } from '$lib/api/tags.js';
  import { supabase } from '$lib/supabaseClient';

  let allChannels = [];
  let message = '';
  let refreshing = false;

  async function refresh() {
    refreshing = true;
    try {
      let { data, error } = await supabase.from('channels').select('*');
      if (error) {
        message = "Channels error: " + (error.message ?? error);
        allChannels = [];
        return;
      }
      allChannels = await Promise.all(
        (data || []).map(async (chan) => {
          let _tags = [];
          try {
            _tags = await getTagsForChannel(chan.id);
          } catch (e) { _tags = []; }
          return {
            ...chan,
            _country: chan.country || '',
            _tags,
            _newLevel: chan.level || '',
          };
        })
      );
    } catch (e) {
      message = "Refresh error: " + e.message;
      allChannels = [];
    } finally {
      refreshing = false;
    }
  }
  onMount(refresh);
</script>

<AdminGuard>
  <div class="container">
    <AdminBulkUpload on:refresh={refresh} />
    <AdminAddChannel COUNTRY_OPTIONS={COUNTRY_OPTIONS} TAG_OPTIONS={TAG_OPTIONS} on:added={refresh} />
    <AdminChannelsTable {allChannels} {refreshing} {message} {refresh} />
  </div>
</AdminGuard>

<style>
  .container {
    max-width: 1100px;
    margin: 2.5em auto;
    padding: 1.5em 2em;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 6px 30px 0 #0001, 0 1.5px 7px #e3e8ee35;
  }
  .import-bar {
    display: flex;
    align-items: center;
    gap: 1em;
    margin-bottom: 1em;
    padding-bottom: 1em;
    border-bottom: 1.5px solid #eee;
  }
  .import-videos-title {
    font-weight: 700;
    font-size: 1.11em;
    margin-right: 1em;
  }
  .main-btn {
    background: #e93c2f;
    color: #fff;
    border-radius: 8px;
    padding: 0.7em 1.2em;
    border: none;
    font-size: 1em;
    cursor: pointer;
  }
  .main-btn.import-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .bulk-results ul, .bulk-failed ul {
    margin: 0.5em 0 0 0.5em;
    padding: 0;
    list-style: disc;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1em;
    background: #fafbfc;
    border-radius: 10px;
    box-shadow: 0 1.5px 8px #e0e0e040;
  }
  th, td {
    padding: 0.7em 0.5em;
    border-bottom: 1px solid #f0f0f0;
    text-align: left;
  }
  th {
    background: #f7fafd;
    color: #244fa2;
    font-weight: bold;
  }
  tr:last-child td {
    border-bottom: none;
  }
  select, input[type="text"] {
    padding: 0.34em 0.6em;
    border-radius: 7px;
    border: 1px solid #ddd;
    font-size: 1em;
    background: #fafafa;
    color: #222;
    min-width: 80px;
    margin-right: 0.3em;
  }
  button[disabled] {
    opacity: 0.65;
    cursor: not-allowed;
  }
</style>
