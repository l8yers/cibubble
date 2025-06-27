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

<style>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #222 !important;
  color: #fff;
  padding: 1.5em 2em;
  z-index: 99999 !important;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.2em;
  box-shadow: 0 -2px 12px #0006;
  border-top: 3px solid #e93c2f;
}
.cookie-banner button {
  background: #e93c2f;
  color: #fff;
  border: none;
  padding: 0.7em 2em;
  border-radius: 9px;
  font-size: 1.1em;
  font-weight: 700;
  cursor: pointer;
  margin-left: 2em;
}
.cookie-banner a {
  color: #e93c2f;
  text-decoration: underline;
  margin-left: 0.7em;
  font-size: 1em;
}
</style>
