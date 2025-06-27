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

{#if !accepted}
  <div class="cookie-banner">
    <span>
      CIBUBBLE uses local storage for login and site preferences. By using the site, you agree to this.
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
  background: #222;
  color: #fff;
  padding: 1.1em 2em;
  z-index: 99999;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1em;
  box-shadow: 0 -2px 12px #0006;
  border-top: 3px solid #e93c2f;
}
.cookie-banner button {
  background: #e93c2f;
  color: #fff;
  border: none;
  padding: 0.5em 1.5em;
  border-radius: 9px;
  font-size: 1.1em;
  font-weight: 700;
  cursor: pointer;
  margin-left: 1.7em;
}
.cookie-banner a {
  color: #e93c2f;
  text-decoration: underline;
  margin-left: 0.7em;
  font-size: 1em;
}
@media (max-width: 600px) {
  .cookie-banner {
    flex-direction: column;
    align-items: stretch;
    font-size: 0.98em;
    padding: 0.7em 0.7em;
  }
  .cookie-banner button {
    margin-left: 0;
    margin-top: 1em;
  }
}
</style>
