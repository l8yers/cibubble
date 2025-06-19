<!-- src/lib/components/ErrorMessage.svelte -->
<script>
  export let message = '';
</script>

{#if message}
  <div class="error-message" role="alert">
    <span class="icon">⚠️</span>
    <span>{message}</span>
  </div>
{/if}

<style>
.error-message {
  color: #c0392b;
  background: #ffeaea;
  border: 1.4px solid #fca5a5;
  border-radius: 10px;
  padding: 1.1em 1.4em;
  margin: 2em 0 0.9em 0;
  display: flex;
  align-items: center;
  gap: 1em;
  font-size: 1.12em;
  font-weight: 500;
  box-shadow: 0 2px 8px #fca5a530;
}
.icon {
  font-size: 1.5em;
  margin-right: 0.5em;
}
</style>
