 <!-- src/lib/components/admin/AdminBulkUpload.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  export let csvFile = null;
  export let bulkUploading = false;
  export let onCsvFile;
  export let onUploadCsv;
  export let csvInput;

  const dispatch = createEventDispatcher();

  function handleCsvFile(e) {
    if (onCsvFile) onCsvFile(e);
    dispatch('csvfile', e);
  }
  function handleUpload() {
    if (onUploadCsv) onUploadCsv();
    dispatch('upload');
  }
</script>

<div class="import-bar">
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
  <button
    class="main-btn import-btn"
    on:click={handleUpload}
    disabled={!csvFile || bulkUploading}
    aria-label="Bulk Upload"
  >
    {bulkUploading ? 'Uploading…' : 'Upload CSV'}
  </button>
</div>
