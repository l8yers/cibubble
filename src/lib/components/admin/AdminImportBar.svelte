<script>
  export let url;
  export let setUrl;
  export let importing;
  export let importChannel;
  export let refreshing;
  export let refresh;
  export let clearing;
  export let clearDatabase;
</script>

<div class="import-bar">
  <span class="import-videos-title">ADD VIDEOS</span>
  <input
    type="text"
    placeholder="Paste YouTube channel link or @handle…"
    bind:value={url}
    aria-label="YouTube Channel Link"
    class="import-input"
    on:keydown={(e) => { if (e.key === 'Enter' && url && !importing) importChannel(); }} />
  <button class="main-btn import-btn" on:click={importChannel} disabled={!url || importing} aria-label="Import Channel">
    {importing ? 'Importing…' : 'Import Channel'}
  </button>
  <button class="main-btn import-btn" on:click={refresh} disabled={refreshing} aria-label="Refresh">
    {refreshing ? 'Refreshing…' : '↻ Refresh'}
  </button>
</div>
