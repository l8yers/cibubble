<script>
  import { onMount } from 'svelte';
  let accepted = false;
  onMount(() => {
    if (typeof window !== 'undefined') {
      accepted = window.localStorage.getItem('cookieConsent') === 'yes';
    }
  });
  function acceptCookies() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cookieConsent', 'yes');
      accepted = true;
    }
  }
</script>
<slot />
{#if !accepted}
  <div class="cookie-banner">
    <span>
      This is a test cookie banner.
      <a href="/privacy" target="_blank" rel="noopener">Learn more</a>.
    </span>
    <button on:click={acceptCookies}>OK</button>
  </div>
{/if}
