<!-- src/lib/components/LoadingSpinner.svelte -->
<div class="spinner-container" aria-label="Loading">
  <div class="spinner"></div>
</div>

<style>
.spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 4em;
}
.spinner {
  width: 2.1em;
  height: 2.1em;
  border: 3.5px solid #e0e4fa;
  border-top: 3.5px solid #2562e9;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin: 0 auto;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
