<script>
  import { onMount, writable } from 'svelte/store';
  const isMobile = writable(false);
  let mounted = false;
  onMount(() => {
    mounted = true;
    function check() {
      isMobile.set(window.innerWidth <= 700);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  });
</script>

{#if mounted && !$isMobile}
  <div style="background:#ddf;padding:2em;">DESKTOP BAR BLOCK</div>
{:else if mounted && $isMobile}
  <div style="background:yellow;font-size:2em;">MOBILE BAR SHOULD SHOW</div>
{/if}
