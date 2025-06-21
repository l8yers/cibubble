<script>
  export let csvInput;
  export let handleCsvFile;
  export let uploadCsv;
  export let csvFile;
  export let bulkUploading;
</script>

<div class="import-bar" style="margin-top:1.2em;">
  <span class="import-videos-title">BULK UPLOAD CSV</span>
  <input
    type="file"
    accept=".csv"
    bind:this={csvInput}
    on:change={handleCsvFile}
    aria-label="Select CSV file"
    class="import-input"
    style="min-width:unset;max-width:220px"
  />
  <button class="main-btn import-btn" on:click={uploadCsv} disabled={!csvFile || bulkUploading} aria-label="Bulk Upload">
    {bulkUploading ? 'Uploading…' : 'Upload CSV'}
  </button>
</div>
