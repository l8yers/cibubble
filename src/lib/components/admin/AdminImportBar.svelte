<script>
  export let url;
  export let setUrl;
  export let importing;
  export let importChannel;
  export let refreshing;
  export let refresh;
  export let clearing;
  export let clearDatabase;
  export let csvInput;
  export let handleCsvFile;
  export let uploadCsv;
  export let csvFile;
  export let bulkUploading;
</script>

<div class="import-bar">
  <span class="import-videos-title">ADD VIDEOS</span>
  <input type="text" placeholder="Paste YouTube channel link or @handle…" bind:value={url}
    aria-label="YouTube Channel Link" class="import-input"
    on:keydown={(e) => { if (e.key === 'Enter' && url && !importing) importChannel(); }} />
  <button class="main-btn import-btn" on:click={importChannel} disabled={!url || importing} aria-label="Import Channel">
    {importing ? 'Importing…' : 'Import Channel'}
  </button>
  <button class="main-btn import-btn" on:click={refresh} disabled={refreshing} aria-label="Refresh">
    {refreshing ? 'Refreshing…' : '↻ Refresh'}
  </button>
  <button class="danger-btn import-btn" on:click={clearDatabase} disabled={clearing} aria-label="Clear Database">
    {clearing ? 'Clearing…' : 'Clear Database'}
  </button>
</div>

<div class="import-bar" style="margin-top:1.2em;">
  <span class="import-videos-title">BULK UPLOAD CSV</span>
  <input type="file" accept=".csv" bind:this={csvInput} on:change={handleCsvFile}
    aria-label="Select CSV file" class="import-input" style="min-width:unset;max-width:220px" />
  <button class="main-btn import-btn" on:click={uploadCsv} disabled={!csvFile || bulkUploading} aria-label="Bulk Upload">
    {bulkUploading ? 'Uploading…' : 'Upload CSV'}
  </button>
</div>
