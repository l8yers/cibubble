<script>
  import BubbleSpinner from '$lib/components/ui/BubbleSpinner.svelte';
  import { writable } from 'svelte/store';

  // Show/hide the loader for testing
  const loading = writable(false);

  function showLoader() {
    loading.set(true);
    setTimeout(() => loading.set(false), 1800);
  }
</script>

<div style="min-height:60vh; display:flex; flex-direction:column; align-items:center; justify-content:center;">
  <button on:click={showLoader} style="margin-bottom:2em;padding:1em 2em;font-size:1.2em;">Show Loader</button>
  <p>Click the button above to show the real loader.</p>
</div>

{#if $loading}
  <div class="bubble-spinner-overlay">
    <BubbleSpinner />
  </div>
{/if}

<style>
/* Overlay matches your app.css config */
.bubble-spinner-overlay {
  position: fixed;
  z-index: 9999;
  inset: 0;
  background: rgba(255,255,255,0.78);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  pointer-events: all;
  padding-top: 230px;
  overflow: visible;
}
.bubble-spinner-overlay .bubble-spinner {
  margin-top: 0;
  max-width: 110px;
  max-height: 110px;
}
</style>
